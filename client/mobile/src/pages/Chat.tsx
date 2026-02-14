import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import Feather from "@react-native-vector-icons/feather";
import { useNavigation, useRoute } from "@react-navigation/native";
import { t } from "i18next";

import {
  makeWSMessage,
  parseIncomingWSMessage,
  WSIncomingMessage,
} from "../../../shared/protocol/ws";
import {
  debugHandle,
  getTimeLabel,
  isString,
} from "../../../shared/utils/general";
import { maxMessageChars } from "../constants";
import useInitE2ee from "../hooks/useInitE2ee";
import useMessages from "../hooks/useMessages";
import useOnlineUsers, { OnlineUser } from "../hooks/useOnlineUsers";
import useTypingUsers from "../hooks/useTypingUsers";
import {
  decryptWireToText,
  encryptTextToWire,
  isEncryptedWireMessage,
} from "../lib/e2ee";
import { parseJwt } from "../lib/jwt";
import { getWSInstance } from "../lib/wsInstance";
import { useAuthStore } from "../stores/authStore";
import { RootNativeStackScreenProps } from "../types/Navigation";
import { normalizeRoomId } from "../utils/general";
import toast from "../utils/toast";

type ChatPageProps = RootNativeStackScreenProps<"Chat">;
type ActiveScreen = "users" | "stage" | "chat";

export default function ChatPage() {
  const { width: viewportWidth } = useWindowDimensions();

  const insets = useSafeAreaInsets();

  const isSmallDevice = viewportWidth < 360;
  const isLargeDevice = viewportWidth >= 520;
  const contentMaxWidth = isLargeDevice ? 540 : 480;
  const tabBarBottomPadding = Math.max(insets.bottom, 12);
  const tabBarHeight = 64 + tabBarBottomPadding;

  const accessToken = useAuthStore(state => state.accessToken);

  const { params } = useRoute<ChatPageProps["route"]>();

  const { roomId } = params;

  const room = normalizeRoomId(roomId);

  const me = parseJwt(accessToken);

  const navigation = useNavigation();

  const { e2eeKeyRef, e2eeReady } = useInitE2ee({ rawRoomId: roomId });

  const { flatListRef, message, messages, setMessage, setMessages } =
    useMessages();

  const { onlineUsers, onlineUsersRef, setOnlineUsers } = useOnlineUsers();

  const { setTypingUsers, typingLabel, typingSentRef, typingTimeoutRef } =
    useTypingUsers();

  const [activeScreen, setActiveScreen] = useState<ActiveScreen>("chat");

  // WebSocket message handling
  useEffect(() => {
    debugHandle(
      "ChatPage exec useEffect for WebSocket connection and message handling",
    );

    if (!accessToken) {
      toast.error(t("Errors.PleaseCreateAUserFirst"));
      navigation.navigate("Home");
      return;
    }

    if (!room) {
      toast.error(t("Errors.InvalidRoom"));
      navigation.navigate("Home");
      return;
    }

    let ws: WebSocket;

    try {
      ws = getWSInstance();
    } catch (error) {
      console.error("WebSocket not initialized.", error);
      toast.error(t("Errors.WsInstanceIsNotInitialized"));
      navigation.navigate("Home");
      return;
    }

    if (ws.readyState !== WebSocket.OPEN) {
      toast.error(t("Errors.ConnectingDotDotDotTryAgainInAMoment"));
      navigation.navigate("Home");
      return;
    }

    const onMessage = async (event: MessageEvent) => {
      let parsed: WSIncomingMessage;

      try {
        parsed = await parseIncomingWSMessage(event.data);
      } catch (error) {
        console.error("Error parsing incoming WS message:", error);
        toast.error(t("Errors.ErrorProcessingServerMessage"));
        return;
      }

      if (parsed.type === "room.users" && parsed.room === room) {
        const mapped = parsed.data.users
          .map(u => {
            const id = u.userID;
            const username = u.username;

            const isMe = Boolean(me.sub && id === me.sub);

            return {
              id,
              name: isMe ? me.username || username || "You" : username,
              status: "online",
            } satisfies OnlineUser;
          })
          .filter(u => isString(u.id) && isString(u.name));

        const unique = new Map<string, OnlineUser>();

        for (const u of mapped) {
          unique.set(u.id, u);
        }

        const users = Array.from(unique.values());

        users.sort((a, b) => {
          const aIsMe = Boolean(me.sub && a.id === me.sub);
          const bIsMe = Boolean(me.sub && b.id === me.sub);

          if (aIsMe && !bIsMe) {
            return -1;
          }

          if (!aIsMe && bIsMe) {
            return 1;
          }

          return a.name.localeCompare(b.name);
        });

        setOnlineUsers(users);

        // void syncPeersRef.current(parsed.data.users);

        return;
      }

      if (
        parsed.type === "webrtc.offer" ||
        parsed.type === "webrtc.answer" ||
        parsed.type === "webrtc.iceCandidate"
      ) {
        // void handleSignal(parsed);
        return;
      }

      if (parsed.type === "chat.typing" && parsed.room === room) {
        const from = typeof parsed.from === "string" ? parsed.from : "";

        if (!from) {
          return;
        }

        if (me.sub && from === me.sub) {
          return;
        }

        setTypingUsers(prev => {
          const next = { ...prev };

          if (!parsed.data.typing) {
            delete next[from];

            return next;
          }

          const knownName = onlineUsersRef.current.find(
            u => u.id === from,
          )?.name;

          next[from] = knownName || from.slice(0, 8);

          return next;
        });

        return;
      }

      if (parsed.type === "chat.message" && parsed.room === room) {
        const wireText = parsed.data.message;

        if (!wireText) {
          return;
        }

        const from = typeof parsed.from === "string" ? parsed.from : "";

        const isMe = Boolean(me.sub && from && from === me.sub);

        let author = "Unknown";
        if (isMe) {
          author = me.username || "You";
        } else if (from) {
          author =
            onlineUsersRef.current.find(u => u.id === from)?.name ||
            from.slice(0, 8);
        }

        if (from) {
          setTypingUsers(prev => {
            if (!(from in prev)) {
              return prev;
            }

            const next = { ...prev };

            delete next[from];

            return next;
          });
        }

        const append = (text: string) => {
          setMessages(prev => [
            ...prev,
            {
              id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
              author,
              kind: "text",
              text,
              timestamp: getTimeLabel(),
              isMe,
            },
          ]);
        };

        const key = e2eeKeyRef.current;

        if (!key) {
          append(
            isEncryptedWireMessage(wireText)
              ? t("Errors.E2EENotConfiguredWhenSendMSG")
              : wireText,
          );

          return;
        }

        if (!isEncryptedWireMessage(wireText)) {
          append(wireText);

          return;
        }

        await decryptWireToText(wireText, key, {
          roomId: room,
          userId: from || undefined,
        })
          .then(plain => {
            append(plain ?? t("Errors.E2EECanNotDecryptMessage"));
          })
          .catch(() => {
            append(t("Errors.E2EECanNotDecryptMessage"));
          });

        return undefined;
      }
    };

    ws.addEventListener("message", onMessage);

    // Join only after listener is attached so we don't miss the initial room.users.
    ws.send(makeWSMessage("chat.join", { room }));

    return () => {
      try {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(makeWSMessage("chat.typing", { room, typing: false }));
          ws.send(makeWSMessage("chat.leave", { room }));
        }
      } catch (error) {
        console.error("Error leaving room:", error);
      }

      ws.removeEventListener("message", onMessage);
    };
  }, [
    accessToken,
    e2eeKeyRef,
    me.sub,
    me.username,
    navigation,
    onlineUsersRef,
    room,
    setMessages,
    setOnlineUsers,
    setTypingUsers,
  ]);

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "left", "right", "bottom"]}
    >
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <View style={[styles.contentWrap, { maxWidth: contentMaxWidth }]}>
          <View
            style={[styles.pageHeader, isSmallDevice && styles.pageHeaderSmall]}
          >
            <View>
              <Text
                style={[
                  styles.pageTitle,
                  isSmallDevice && styles.pageTitleSmall,
                ]}
              >
                {t("Chat.MeetingRoom")}
              </Text>
              <Text style={styles.pageSubTitle}>{room || "-"}</Text>
            </View>

            <View style={styles.headerPills}>
              <View style={styles.headerPill}>
                <View style={styles.headerPillDot} />
                <Text style={styles.headerPillText}>{t("Chat.Connected")}</Text>
              </View>

              <View style={styles.headerPill}>
                <Feather name="users" size={12} color="#d4d4d8" />
                <Text style={styles.headerPillText}>{onlineUsers.length}</Text>
              </View>
            </View>
          </View>

          <View
            style={[
              styles.sectionViewport,
              {
                paddingBottom: tabBarHeight + 10,
              },
              isSmallDevice && styles.sectionViewportSmall,
            ]}
          >
            {activeScreen === "chat" ? (
              <SectionMessages
                room={room}
                messages={messages}
                message={message}
                setMessage={setMessage}
                typingLabel={typingLabel}
                e2eeReady={e2eeReady}
              />
            ) : null}

            {activeScreen === "users" ? (
              <SectionOnlineUsers onlineUsers={onlineUsers} room={room} />
            ) : null}

            {activeScreen === "stage" ? (
              <SectionVideoCall
                room={room}
                onlineUsersCount={onlineUsers.length}
              />
            ) : null}
          </View>

          <View
            style={[
              styles.bottomTabs,
              {
                height: tabBarHeight,
                paddingBottom: tabBarBottomPadding,
              },
              isSmallDevice && styles.bottomTabsSmall,
            ]}
          >
            <Pressable
              onPress={() => setActiveScreen("users")}
              style={[
                styles.bottomTabButton,
                activeScreen === "users" && styles.bottomTabButtonActive,
                isSmallDevice && styles.bottomTabButtonSmall,
              ]}
            >
              <Feather
                name="users"
                size={15}
                color={activeScreen === "users" ? "#ffffff" : "#d4d4d8"}
              />
              <Text
                style={[
                  styles.bottomTabText,
                  activeScreen === "users" && styles.bottomTabTextActive,
                  isSmallDevice && styles.bottomTabTextSmall,
                ]}
              >
                {t("Chat.Users")}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveScreen("stage")}
              style={[
                styles.bottomTabButton,
                activeScreen === "stage" && styles.bottomTabButtonActive,
                isSmallDevice && styles.bottomTabButtonSmall,
              ]}
            >
              <Feather
                name="video"
                size={15}
                color={activeScreen === "stage" ? "#ffffff" : "#d4d4d8"}
              />
              <Text
                style={[
                  styles.bottomTabText,
                  activeScreen === "stage" && styles.bottomTabTextActive,
                  isSmallDevice && styles.bottomTabTextSmall,
                ]}
              >
                {t("Chat.Stage")}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveScreen("chat")}
              style={[
                styles.bottomTabButton,
                activeScreen === "chat" && styles.bottomTabButtonActive,
                isSmallDevice && styles.bottomTabButtonSmall,
              ]}
            >
              <Feather
                name="send"
                size={15}
                color={activeScreen === "chat" ? "#ffffff" : "#d4d4d8"}
              />
              <Text
                style={[
                  styles.bottomTabText,
                  activeScreen === "chat" && styles.bottomTabTextActive,
                  isSmallDevice && styles.bottomTabTextSmall,
                ]}
              >
                {t("Chat.Chat")}
              </Text>
            </Pressable>
          </View>

          <View style={styles.devKeepRefsHidden}>
            <Text>
              {String(Boolean(flatListRef))}
              {String(Boolean(typingSentRef.current))}
              {String(Boolean(typingTimeoutRef.current))}
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SectionOnlineUsers(
  props: Readonly<{ onlineUsers: OnlineUser[]; room: string }>,
) {
  const { onlineUsers, room } = props;

  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <Feather name="users" size={15} color="#d4d4d8" />
          <Text style={styles.sectionTitle}>{t("Chat.Users")}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{onlineUsers.length}</Text>
        </View>
      </View>

      <View style={styles.sectionBody}>
        <Text style={styles.sectionCaption}>
          {t("Chat.RoomColon")}
          {room || "-"}
        </Text>

        {onlineUsers.length > 0 ? (
          onlineUsers.map(user => (
            <View key={user.id} style={styles.userRow}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>
                  {(user.name || "?").slice(0, 1).toUpperCase()}
                </Text>
              </View>

              <View style={styles.userMeta}>
                <Text style={styles.userName} numberOfLines={1}>
                  {user.name}
                </Text>
                <Text style={styles.userStatus}>{t("Chat.Online")}</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>
              {t("Chat.ConnectingDotDotDot")}
            </Text>
            <Text style={styles.emptyStateSubtitle}>
              {t("Chat.Users")} {t("Chat.Connected")}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

function SectionVideoCall(
  props: Readonly<{ room: string; onlineUsersCount: number }>,
) {
  const { room, onlineUsersCount } = props;

  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <Feather name="video" size={15} color="#d4d4d8" />
          <Text style={styles.sectionTitle}>{t("Chat.Stage")}</Text>
        </View>
        <Text style={styles.sectionHint}>
          {t("Chat.RoomColon")} {room || "-"}
        </Text>
      </View>

      <View style={styles.sectionBody}>
        <View style={styles.videoStage}>
          <View style={styles.videoIconWrap}>
            <Feather name="video" size={24} color="#a5b4fc" />
          </View>
          <Text style={styles.videoStageTitle}>{t("Chat.NoVideoYet")}</Text>
          <Text style={styles.videoStageSubtitle}>
            {t("Chat.TurnOnCameraOrShareScreen")}
          </Text>
        </View>

        <View style={styles.videoActions}>
          <View style={styles.videoActionButton}>
            <Feather name="mic" size={14} color="#e4e4e7" />
          </View>
          <View style={styles.videoActionButton}>
            <Feather name="video" size={14} color="#e4e4e7" />
          </View>
          <View style={styles.videoActionButton}>
            <Feather name="monitor" size={14} color="#e4e4e7" />
          </View>
          <View style={styles.videoActionButtonDanger}>
            <Feather name="log-out" size={14} color="#fca5a5" />
          </View>
        </View>

        <View style={styles.speakerRow}>
          <Text style={styles.speakerLabel}>{t("Chat.AudioStartsOn")}</Text>

          <View style={styles.speakerToggleMock}>
            <View style={styles.speakerToggleSideActive}>
              <Feather name="volume-2" size={14} color="#ffffff" />
            </View>
            <View style={styles.speakerDivider} />
            <View style={styles.speakerToggleSideMuted}>
              <Feather name="volume-x" size={14} color="#fca5a5" />
            </View>
          </View>
        </View>

        <Text style={styles.videoFooterHint}>
          {t("Chat.Users")} {onlineUsersCount} • {t("Chat.AudioStartsOn")}
        </Text>
      </View>
    </View>
  );
}

function SectionMessages(
  props: Readonly<{
    room: string;
    messages: {
      id: string;
      author: string;
      text?: string;
      timestamp: string;
      isMe: boolean;
    }[];
    message: string;
    setMessage: (value: string) => void;
    typingLabel: string;
    e2eeReady: boolean;
  }>,
) {
  const { room, messages, message, setMessage, typingLabel, e2eeReady } = props;

  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <Feather name="send" size={15} color="#d4d4d8" />
          <Text style={styles.sectionTitle}>{t("Chat.Chat")}</Text>
        </View>
        <Text style={styles.sectionHint}>
          {t("Chat.RoomColon")}
          {room || "-"}
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#09090b",
  },
  screen: {
    flex: 1,
  },
  contentWrap: {
    flex: 1,
    width: "100%",
    alignSelf: "center",
    position: "relative",
  },

  pageHeader: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  pageHeaderSmall: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },

  pageTitle: {
    color: "#fafafa",
    fontSize: 21,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  pageTitleSmall: {
    fontSize: 19,
  },

  pageSubTitle: {
    color: "#a1a1aa",
    fontSize: 12,
    marginTop: 2,
  },

  headerPills: {
    flexDirection: "row",
    gap: 6,
  },

  headerPill: {
    height: 28,
    borderWidth: 1,
    borderColor: "#3f3f46",
    borderRadius: 999,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    backgroundColor: "#111113",
  },

  headerPillDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#22c55e",
  },

  headerPillText: {
    color: "#d4d4d8",
    fontSize: 11,
    fontWeight: "600",
  },

  sectionViewport: {
    flex: 1,
    paddingHorizontal: 14,
  },

  sectionViewportSmall: {
    paddingHorizontal: 12,
  },

  hiddenSection: {
    display: "none",
  },

  sectionCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#27272a",
    backgroundColor: "#111218",
    borderRadius: 18,
    overflow: "hidden",
  },

  sectionHeader: {
    height: 56,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#27272a",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#111113",
  },

  sectionTitle: {
    color: "#fafafa",
    fontSize: 15,
    fontWeight: "700",
  },

  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  sectionCaption: {
    color: "#71717a",
    fontSize: 12,
    marginBottom: 8,
  },

  sectionHint: {
    color: "#a1a1aa",
    fontSize: 12,
  },

  badge: {
    minWidth: 26,
    height: 22,
    borderRadius: 999,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#09090b",
    borderWidth: 1,
    borderColor: "#3f3f46",
  },

  badgeText: {
    color: "#d4d4d8",
    fontSize: 12,
    fontWeight: "600",
  },

  sectionBody: {
    flex: 1,
    padding: 14,
    gap: 12,
  },

  userRow: {
    minHeight: 62,
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 12,
    backgroundColor: "#111113",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    marginBottom: 8,
  },

  userAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#3f3f46",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#09090b",
  },

  userAvatarText: {
    color: "#fafafa",
    fontWeight: "700",
  },

  userMeta: {
    marginLeft: 10,
    flex: 1,
  },

  userName: {
    color: "#f4f4f5",
    fontSize: 14,
    fontWeight: "600",
  },

  userStatus: {
    color: "#71717a",
    fontSize: 12,
    marginTop: 2,
  },

  videoStage: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(0,0,0,0.2)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  videoIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#3f3f46",
    backgroundColor: "#09090b",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  videoStageTitle: {
    color: "#f4f4f5",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },

  videoStageSubtitle: {
    color: "#a1a1aa",
    fontSize: 12,
    marginTop: 6,
    textAlign: "center",
  },

  videoActions: {
    minHeight: 64,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(24,24,27,0.7)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
    paddingHorizontal: 8,
  },

  videoActionButton: {
    height: 40,
    minWidth: 72,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#3f3f46",
    backgroundColor: "#09090b",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },

  videoActionButtonDanger: {
    height: 40,
    minWidth: 56,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#3f3f46",
    backgroundColor: "#2c1218",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },

  speakerRow: {
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(24,24,27,0.45)",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  speakerLabel: {
    color: "#a1a1aa",
    fontSize: 12,
  },

  speakerToggleMock: {
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#3f3f46",
    backgroundColor: "#111113",
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },

  speakerDivider: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: "#3f3f46",
  },

  speakerToggleSideActive: {
    width: 36,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3730a3",
  },

  speakerToggleSideMuted: {
    width: 36,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2c1218",
  },

  videoFooterHint: {
    color: "#71717a",
    fontSize: 12,
    textAlign: "center",
  },

  messagesList: {
    flex: 1,
    gap: 10,
  },

  messageBubble: {
    borderRadius: 12,
    backgroundColor: "#172554",
    paddingHorizontal: 10,
    maxWidth: "92%",
  },

  messageBubbleMine: {
    borderColor: "#3f3f46",
    backgroundColor: "#0f172a",
    maxWidth: "92%",
    width: "92%",
  },

  messageBubbleOther: {
    borderColor: "#27272a",
    backgroundColor: "#111113",
    alignSelf: "flex-start",
    width: "92%",
  },

  messageMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
    gap: 8,
  },

  messageAuthor: {
    color: "#d4d4d8",
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },

  messageTimestamp: {
    color: "#71717a",
    fontSize: 11,
  },

  messageText: {
    color: "#f4f4f5",
    fontSize: 14,
    lineHeight: 20,
  },

  composerWrap: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#27272a",
    backgroundColor: "rgba(24,24,27,0.7)",
    padding: 10,
    gap: 8,
  },

  composerInfoRow: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#3f3f46",
    backgroundColor: "rgba(9,9,11,0.55)",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  composerInfoText: {
    color: "#d4d4d8",
    fontSize: 11,
  },

  composerToolsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  toolIconButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#3f3f46",
    backgroundColor: "#111113",
    alignItems: "center",
    justifyContent: "center",
  },

  attachHint: {
    color: "#a1a1aa",
    fontSize: 12,
  },

  composerInput: {
    minHeight: 76,
    maxHeight: 140,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#3f3f46",
    backgroundColor: "#09090b",
    color: "#f4f4f5",
    paddingHorizontal: 10,
    paddingVertical: 8,
    textAlignVertical: "top",
    fontSize: 14,
  },

  composerBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  typingLabel: {
    color: "#a1a1aa",
    fontSize: 12,
    flex: 1,
  },

  charCounter: {
    color: "#71717a",
    fontSize: 11,
  },

  sendButton: {
    height: 38,
    minWidth: 96,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#4338ca",
    backgroundColor: "#3730a3",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    flexDirection: "row",
    gap: 6,
  },

  sendButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },

  emptyState: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 12,
    backgroundColor: "#0d0d10",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },

  emptyStateTitle: {
    color: "#f4f4f5",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },

  emptyStateSubtitle: {
    color: "#a1a1aa",
    marginTop: 6,
    fontSize: 12,
    textAlign: "center",
  },

  bottomTabs: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 0,
    paddingHorizontal: 8,
    paddingTop: 8,
    borderRadius: 16,
    borderTopWidth: 1,
    borderTopColor: "#27272a",
    backgroundColor: "#0f1016",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  bottomTabsSmall: {
    left: 12,
    right: 12,
    paddingHorizontal: 6,
  },

  bottomTabButton: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#3f3f46",
    backgroundColor: "#111113",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },

  bottomTabButtonSmall: {
    height: 40,
    gap: 5,
  },

  bottomTabButtonActive: {
    borderColor: "#4338ca",
    backgroundColor: "#312e81",
  },

  bottomTabText: {
    color: "#d4d4d8",
    fontSize: 13,
    fontWeight: "600",
  },

  bottomTabTextSmall: {
    fontSize: 12,
  },

  bottomTabTextActive: {
    color: "#ffffff",
    fontWeight: "700",
  },

  devKeepRefsHidden: {
    position: "absolute",
    width: 0,
    height: 0,
    opacity: 0,
  },
});
