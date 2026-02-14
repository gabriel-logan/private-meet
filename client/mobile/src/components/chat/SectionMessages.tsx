import { useTranslation } from "react-i18next";
import { Pressable, Text, TextInput, View } from "react-native";
import Feather from "@react-native-vector-icons/feather";

import { makeWSMessage } from "../../../../shared/protocol/ws";
import { maxMessageChars } from "../../constants";
import type { OnlineUser } from "../../hooks/useOnlineUsers";
import { encryptTextToWire } from "../../lib/e2ee";
import { getWSInstance } from "../../lib/wsInstance";
import type { ChatStyles } from "../../pages/ChatStyles";
import toast from "../../utils/toast";

type MessageItem = {
  id: string;
  author: string;
  text?: string;
  timestamp: string;
  isMe: boolean;
};

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
}: Readonly<SectionMessagesProps>) {
  const { t } = useTranslation();

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
      // setEmojiOpen(false);
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
        <View style={styles.messagesList}>
          {messages.length > 0 ? (
            messages.map(item => (
              <View
                key={item.id}
                style={[
                  styles.messageBubble,
                  item.isMe
                    ? styles.messageBubbleMine
                    : styles.messageBubbleOther,
                ]}
              >
                <View style={styles.messageMeta}>
                  <Text style={styles.messageAuthor} numberOfLines={1}>
                    {item.author || t("Errors.UnknownError")}
                  </Text>
                  <Text style={styles.messageTimestamp}>{item.timestamp}</Text>
                </View>

                <Text style={styles.messageText}>{item.text || ""}</Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>{t("Chat.Chat")}</Text>
              <Text style={styles.emptyStateSubtitle}>
                {t("Chat.MsgsAreSentViaWsE2EEEncryption")}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.composerWrap}>
          <View style={styles.composerInfoRow}>
            <Text style={styles.composerInfoText}>
              {e2eeReady
                ? t("Chat.MsgsAreSentViaWsE2EEEncryption")
                : t("Chat.InitializingEncryption")}
            </Text>
          </View>

          <View style={styles.composerToolsRow}>
            <Pressable style={styles.toolIconButton}>
              <Feather name="image" size={16} color="#e4e4e7" />
            </Pressable>

            <Pressable style={styles.toolIconButton}>
              <Feather name="smile" size={16} color="#e4e4e7" />
            </Pressable>

            <Text style={styles.attachHint}>{t("Chat.AttachImage")}</Text>
          </View>

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

            <Pressable style={styles.sendButton} onPress={handleSendText}>
              <Feather name="send" size={15} color="#fff" />
              <Text style={styles.sendButtonText}>{t("Chat.Send")}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
