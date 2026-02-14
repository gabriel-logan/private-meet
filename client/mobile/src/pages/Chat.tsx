import { useEffect, useRef } from "react";
import { Button, Text, TextInput, View } from "react-native";
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
import useInitE2ee from "../hooks/useInitE2ee";
import useMessages from "../hooks/useMessages";
import useOnlineUsers, { OnlineUser } from "../hooks/useOnlineUsers";
import useTypingUsers from "../hooks/useTypingUsers";
import { decryptWireToText, isEncryptedWireMessage } from "../lib/e2ee";
import { parseJwt } from "../lib/jwt";
import { getWSInstance } from "../lib/wsInstance";
import { useAuthStore } from "../stores/authStore";
import { RootNativeStackScreenProps } from "../types/Navigation";
import { normalizeRoomId } from "../utils/general";

export default function ChatPage() {
  const accessToken = useAuthStore(state => state.accessToken);

  const { params } = useRoute<RootNativeStackScreenProps<"Chat">["route"]>();

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

  // WebSocket message handling
  useEffect(() => {
    debugHandle(
      "ChatPage exec useEffect for WebSocket connection and message handling",
    );

    if (!accessToken) {
      navigation.navigate("Home");
      return;
    }

    if (!room) {
      navigation.navigate("Home");
      return;
    }

    let ws: WebSocket;

    try {
      ws = getWSInstance();
    } catch (error) {
      console.error("WebSocket not initialized.", error);
      navigation.navigate("Home");
      return;
    }

    if (ws.readyState !== WebSocket.OPEN) {
      navigation.navigate("Home");
      return;
    }

    const onMessage = async (event: any) => {
      let parsed: WSIncomingMessage;

      try {
        parsed = await parseIncomingWSMessage(event.data);
      } catch (error) {
        console.error("Error parsing incoming WS message:", error);
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
        //void handleSignal(parsed);
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

        decryptWireToText(wireText, key, {
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
    <View>
      <Text>Chat Page for Room: {roomId}</Text>
      <View>
        <Text>Messages:</Text>
        {messages.map(
          msg =>
            msg.kind === "text" && (
              <View key={msg.id}>
                <Text>
                  {msg.author} ({msg.timestamp}): {msg.text}
                </Text>
              </View>
            ),
        )}

        <View>
          <Text>Input message here...</Text>
          <TextInput value={message} onChangeText={setMessage} />
          <Button
            title="Send"
            onPress={() => {
              const ws = getWSInstance();

              if (ws.readyState !== WebSocket.OPEN) {
                return;
              }

              ws.send(makeWSMessage("chat.message", { room, message }));
              setMessage("");
            }}
          />
        </View>
      </View>

      <View>
        <Text>Typing: {typingLabel}</Text>
      </View>
    </View>
  );
}
