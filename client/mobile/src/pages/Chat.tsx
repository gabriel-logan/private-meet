import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
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
import SectionMessages from "../components/chat/SectionMessages";
import SectionOnlineUsers from "../components/chat/SectionOnlineUsers";
import SectionVideoCall from "../components/chat/SectionVideoCall";
import useInitE2ee from "../hooks/useInitE2ee";
import useMessages from "../hooks/useMessages";
import useOnlineUsers, { OnlineUser } from "../hooks/useOnlineUsers";
import useTypingUsers from "../hooks/useTypingUsers";
import useWebRTCMesh from "../hooks/useWebRTCMesh";
import { decryptWireToText, isEncryptedWireMessage } from "../lib/e2ee";
import { parseJwt } from "../lib/jwt";
import { getWSInstance } from "../lib/wsInstance";
import { useAuthStore } from "../stores/authStore";
import { RootNativeStackScreenProps } from "../types/Navigation";
import { normalizeRoomId } from "../utils/general";
import toast from "../utils/toast";
import styles from "./ChatStyles";

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

  const { roomId: rawRoomId } = params;

  const room = normalizeRoomId(rawRoomId);

  const me = parseJwt(accessToken);

  const navigation = useNavigation();

  const { e2eeKeyRef, e2eeReady } = useInitE2ee({ rawRoomId: rawRoomId });

  const { flatListRef, message, messages, setMessage, setMessages } =
    useMessages();

  const { onlineUsers, onlineUsersRef, setOnlineUsers } = useOnlineUsers();

  const { setTypingUsers, typingLabel, typingSentRef, typingTimeoutRef } =
    useTypingUsers();

  const handleIncomingImage = (payload: {
    peerID: string;
    url: string;
    mime: string;
    name: string;
    size: number;
  }) => {
    const author =
      onlineUsersRef.current.find(u => u.id === payload.peerID)?.name ||
      payload.peerID.slice(0, 8);

    setMessages(prev => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        author,
        timestamp: getTimeLabel(),
        isMe: false,
        kind: "image",
        url: payload.url,
        name: payload.name,
        mime: payload.mime,
      },
    ]);
  };

  const {
    localCameraStream,
    localScreenStream,
    remotePeers,
    micEnabled,
    setMicEnabled,
    cameraEnabled,
    startCamera,
    stopCamera,
    canSwitchCamera,
    switchCamera,
    screenShareEnabled,
    startScreenShare,
    stopScreenShare,
    speakerEnabled,
    setSpeakerEnabled,
    handleSignal,
    syncPeersFromRoomUsers,
    incomingFileTransfers,
    canSendImages,
    expectedPeersCount,
    connectedPeersCount,
    sendImage,
  } = useWebRTCMesh({
    room,
    myID: me.sub || "",
    onImageReceived: handleIncomingImage,
  });

  const syncPeersRef = useRef(syncPeersFromRoomUsers);

  useEffect(() => {
    debugHandle("ChatPage exec useEffect to update syncPeersRef");

    syncPeersRef.current = syncPeersFromRoomUsers;
  }, [syncPeersFromRoomUsers]);

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

        syncPeersRef.current(parsed.data.users).catch(() => undefined);

        return;
      }

      if (
        parsed.type === "webrtc.offer" ||
        parsed.type === "webrtc.answer" ||
        parsed.type === "webrtc.iceCandidate"
      ) {
        handleSignal(parsed).catch(() => undefined);
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
    handleSignal,
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
              <Text style={styles.pageSubTitle} numberOfLines={1}>
                {t("Chat.RoomColon")} {rawRoomId || "-"}
              </Text>
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
                rawRoomId={rawRoomId}
                messages={messages}
                message={message}
                setMessage={setMessage}
                typingLabel={typingLabel}
                e2eeReady={e2eeReady}
                styles={styles}
                e2eeKeyRef={e2eeKeyRef}
                me={me}
                onlineUsers={onlineUsers}
                typingSentRef={typingSentRef}
                typingTimeoutRef={typingTimeoutRef}
                flatListRef={flatListRef}
                setMessages={setMessages}
                canSendImages={canSendImages}
                expectedPeersCount={expectedPeersCount}
                sendImage={sendImage}
                incomingFileTransfers={incomingFileTransfers}
              />
            ) : null}

            {activeScreen === "users" ? (
              <SectionOnlineUsers
                onlineUsers={onlineUsers}
                rawRoomId={rawRoomId}
                styles={styles}
              />
            ) : null}

            {activeScreen === "stage" ? (
              <SectionVideoCall
                room={room}
                rawRoomId={rawRoomId}
                onlineUsersCount={onlineUsers.length}
                styles={styles}
                localCameraStream={localCameraStream}
                localScreenStream={localScreenStream}
                remotePeers={remotePeers}
                micEnabled={micEnabled}
                setMicEnabled={setMicEnabled}
                cameraEnabled={cameraEnabled}
                startCamera={startCamera}
                stopCamera={stopCamera}
                canSwitchCamera={canSwitchCamera}
                switchCamera={switchCamera}
                screenShareEnabled={screenShareEnabled}
                startScreenShare={startScreenShare}
                stopScreenShare={stopScreenShare}
                speakerEnabled={speakerEnabled}
                setSpeakerEnabled={setSpeakerEnabled}
                expectedPeersCount={expectedPeersCount}
                connectedPeersCount={connectedPeersCount}
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
