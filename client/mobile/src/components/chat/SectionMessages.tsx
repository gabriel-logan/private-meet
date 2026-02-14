import { Pressable, Text, TextInput, View } from "react-native";
import Feather from "@react-native-vector-icons/feather";
import { t } from "i18next";

import { maxMessageChars } from "../../constants";
import type { ChatStyles } from "../../pages/ChatStyles";

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
}

export default function SectionMessages({
  rawRoomId,
  messages,
  message,
  setMessage,
  typingLabel,
  e2eeReady,
  styles,
}: Readonly<SectionMessagesProps>) {
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
            onChangeText={setMessage}
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

            <Pressable style={styles.sendButton}>
              <Feather name="send" size={15} color="#fff" />
              <Text style={styles.sendButtonText}>{t("Chat.Send")}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
