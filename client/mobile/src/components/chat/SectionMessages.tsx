import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  errorCodes,
  isErrorWithCode,
  pick,
  types,
} from "@react-native-documents/picker";
import Feather from "@react-native-vector-icons/feather";

import { makeWSMessage } from "../../../../shared/protocol/ws";
import type { IncomingFileTransferProgress } from "../../../../shared/types";
import { getTimeLabel } from "../../../../shared/utils/general";
import { chatMaxImageBytes, maxMessageChars } from "../../constants";
import type { ChatMessage } from "../../hooks/useMessages";
import type { OnlineUser } from "../../hooks/useOnlineUsers";
import { encryptTextToWire } from "../../lib/e2ee";
import { getWSInstance } from "../../lib/wsInstance";
import type { ChatStyles } from "../../pages/ChatStyles";
import toast from "../../utils/toast";

type MessageItem = ChatMessage;

function toB64(bytes: Uint8Array): string {
  const chunkSize = 0x8000;

  let binary = "";

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

function arrayBufferToB64(input: ArrayBuffer): string {
  return toB64(new Uint8Array(input));
}

interface SectionMessagesProps {
  room: string;
  rawRoomId: string;
  messages: MessageItem[];
  message: string;
  setMessage: (value: string) => void;
  typingLabel: string;
  e2eeReady: boolean;
  styles: ChatStyles;
  e2eeKeyRef: React.RefObject<CryptoKey | null>;
  typingTimeoutRef: React.RefObject<number | null>;
  typingSentRef: React.RefObject<boolean>;
  onlineUsers: OnlineUser[];
  me: { sub?: string; username?: string };
  flatListRef: React.RefObject<FlatList<any> | null>;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  canSendImages: boolean;
  expectedPeersCount: number;
  sendImage: (file: File) => Promise<void>;
  incomingFileTransfers: IncomingFileTransferProgress[];
}

export default function SectionMessages({
  room,
  rawRoomId,
  messages,
  message,
  setMessage,
  typingLabel,
  e2eeReady,
  styles,
  e2eeKeyRef,
  typingTimeoutRef,
  typingSentRef,
  onlineUsers,
  me,
  flatListRef,
  setMessages,
  canSendImages,
  expectedPeersCount,
  sendImage,
  incomingFileTransfers,
}: Readonly<SectionMessagesProps>) {
  const { t } = useTranslation();

  const isUserNearBottomRef = useRef(true);

  useEffect(() => {
    if (!isUserNearBottomRef.current) {
      return;
    }

    const timeout = globalThis.setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 0);

    return () => {
      globalThis.clearTimeout(timeout);
    };
  }, [flatListRef, messages.length]);

  function handleMessageListScroll(
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom =
      contentSize.height - (contentOffset.y + layoutMeasurement.height);

    isUserNearBottomRef.current = distanceFromBottom <= 32;
  }

  async function handlePickAndSendImage() {
    if (onlineUsers.length <= 1) {
      toast.info(t("Errors.NoOneInTheRoomToSendFile"));
      return;
    }

    if (!(expectedPeersCount > 0 && canSendImages)) {
      toast.info(t("Errors.ImageSendingIsOnlyAllowedAfterWebRTCIsConnected"));
      return;
    }

    let pendingMessageId = "";

    try {
      const [selected] = await pick({
        type: [types.images],
        allowMultiSelection: false,
      });

      const mime = selected.type || "application/octet-stream";
      const name = selected.name || "image.jpg";
      const size = selected.size ?? 0;

      if (!mime.startsWith("image/")) {
        toast.error(t("Errors.OnlyImagesAreSupportedForNow"));
        return;
      }

      if (size > chatMaxImageBytes) {
        toast.error(
          t("Errors.ImageTooLarge", {
            maxImageSizeMB: chatMaxImageBytes / (1024 * 1024),
          }),
        );
        return;
      }

      const response = await fetch(selected.uri);
      const blob = await response.blob();
      const imageB64 = arrayBufferToB64(await blob.arrayBuffer());
      const localPreviewUrl = `data:${mime};base64,${imageB64}`;
      const file = new File([blob], name, { type: mime });

      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      pendingMessageId = id;

      setMessages(prev => [
        ...prev,
        {
          id,
          author: me.username || "You",
          timestamp: getTimeLabel(),
          isMe: true,
          kind: "image",
          url: localPreviewUrl,
          name,
          mime,
        },
      ]);

      await sendImage(file);
    } catch (error) {
      if (
        isErrorWithCode(error) &&
        error.code === errorCodes.OPERATION_CANCELED
      ) {
        return;
      }

      toast.error(t("Errors.FailedToSendImageOverWebRTC"));

      if (!pendingMessageId) {
        return;
      }

      setMessages(prev => prev.filter(m => m.id !== pendingMessageId));
    }
  }

  async function handleSendText() {
    if (onlineUsers.length <= 1) {
      toast.info(t("Errors.NoOneInTheRoomToReceiveMessage"));
      return;
    }

    const text = message.trim();

    if (!text) {
      toast.error(t("Errors.PleaseEnterAMessage"));
      return;
    }

    if (!room) {
      toast.error(t("Errors.MissingRoomID"));
      return;
    }

    if (!e2eeKeyRef.current) {
      toast.error(t("Errors.EnryptionNotReadyYet"));
      return;
    }

    try {
      const ws = getWSInstance();

      if (ws.readyState !== WebSocket.OPEN) {
        toast.error(t("Errors.NotConnectedYetTryAgainInASecond"));
        return;
      }

      // clear typing when sending
      if (typingTimeoutRef.current) {
        globalThis.clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      typingSentRef.current = false;

      ws.send(makeWSMessage("chat.typing", { room, typing: false }));

      const encryptedWire = await encryptTextToWire(text, e2eeKeyRef.current, {
        roomId: room,
        userId: me.sub,
        maxPlaintextChars: maxMessageChars,
      });

      ws.send(makeWSMessage("chat.message", { room, message: encryptedWire }));

      setMessage("");
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error sending message:", error);
      toast.error(t("Errors.FailedToSendEncryptedMessage"));
    }
  }

  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <Feather name="send" size={15} color="#d4d4d8" />
          <Text style={styles.sectionTitle}>{t("Chat.Chat")}</Text>
        </View>
        <Text style={styles.sectionHint} numberOfLines={1}>
          {t("Chat.RoomColon")}
          {rawRoomId || "-"}
        </Text>
      </View>

      <View style={styles.sectionBody}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          style={styles.messagesList}
          onScroll={handleMessageListScroll}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
          persistentScrollbar
          indicatorStyle="white"
          contentContainerStyle={
            messages.length === 0 ? styles.messagesListEmptyContent : undefined
          }
          renderItem={({ item, index }) => (
            <View
              style={[
                styles.messageBubble,
                item.isMe
                  ? styles.messageBubbleMine
                  : styles.messageBubbleOther,
                index !== messages.length - 1 && styles.messageBubbleGap,
              ]}
            >
              <View style={styles.messageMeta}>
                <Text style={styles.messageAuthor} numberOfLines={1}>
                  {item.author || t("Errors.UnknownError")}
                </Text>
                <Text style={styles.messageTimestamp}>{item.timestamp}</Text>
              </View>

              {item.kind === "text" ? (
                <Text style={styles.messageText}>{item.text || ""}</Text>
              ) : null}

              {item.kind === "image" ? (
                <>
                  <Image
                    source={{ uri: item.url }}
                    style={styles.messageImage}
                    resizeMode="cover"
                  />
                  <Text
                    style={[styles.messageTimestamp, styles.messageImageName]}
                  >
                    {item.name || t("Chat.InvalidName")}
                  </Text>
                </>
              ) : null}
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>{t("Chat.Chat")}</Text>
              <Text style={styles.emptyStateSubtitle}>
                {t("Chat.MsgsAreSentViaWsE2EEEncryption")}
              </Text>
            </View>
          }
        />

        <View style={styles.composerWrap}>
          <View style={styles.composerInfoRow}>
            <Text style={styles.composerInfoText}>
              {e2eeReady
                ? t("Chat.MsgsAreSentViaWsE2EEEncryption")
                : t("Chat.InitializingEncryption")}
            </Text>
          </View>

          <View style={styles.composerToolsRow}>
            <Pressable
              style={styles.toolIconButton}
              onPress={() => {
                handlePickAndSendImage().catch(() => undefined);
              }}
            >
              <Feather name="image" size={16} color="#e4e4e7" />
            </Pressable>

            <Pressable style={styles.toolIconButton}>
              <Feather name="smile" size={16} color="#e4e4e7" />
            </Pressable>

            <Text style={styles.attachHint}>{t("Chat.AttachImage")}</Text>
          </View>

          {incomingFileTransfers.length > 0 ? (
            <View style={styles.composerInfoRow}>
              {incomingFileTransfers.map(transfer => (
                <Text
                  key={`${transfer.peerID}:${transfer.id}`}
                  style={styles.composerInfoText}
                >
                  {transfer.name} {transfer.receivedBytes}/{transfer.size}
                </Text>
              ))}
            </View>
          ) : null}

          <TextInput
            value={message}
            onChangeText={text => {
              setMessage(text);

              if (!typingSentRef.current) {
                const ws = getWSInstance();

                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(makeWSMessage("chat.typing", { room, typing: true }));
                  typingSentRef.current = true;
                }
              }

              if (typingTimeoutRef.current) {
                globalThis.clearTimeout(typingTimeoutRef.current);
              }

              typingTimeoutRef.current = globalThis.setTimeout(() => {
                const ws = getWSInstance();

                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(
                    makeWSMessage("chat.typing", { room, typing: false }),
                  );
                  typingSentRef.current = false;
                }
              }, 1000);
            }}
            maxLength={maxMessageChars}
            multiline
            placeholder={t("Chat.WriteAMessage")}
            placeholderTextColor="#71717a"
            style={styles.composerInput}
          />

          <View style={styles.composerBottomRow}>
            <Text numberOfLines={1} style={styles.typingLabel}>
              {typingLabel || " "}
            </Text>

            <Text style={styles.charCounter}>
              {Array.from(message).length}/{maxMessageChars}
            </Text>

            <Pressable
              style={styles.sendButton}
              onPress={() => {
                handleSendText().catch(() => undefined);
              }}
            >
              <Feather name="send" size={15} color="#fff" />
              <Text style={styles.sendButtonText}>{t("Chat.Send")}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
