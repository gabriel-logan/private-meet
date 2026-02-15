import { useTranslation } from "react-i18next";
import { Text, TouchableOpacity, View } from "react-native";
import { type MediaStream, RTCView } from "react-native-webrtc";
import Feather from "@react-native-vector-icons/feather";
import { useNavigation } from "@react-navigation/native";

import type { RemotePeerMedia } from "../../hooks/useWebRTCMesh";
import type { ChatStyles } from "../../pages/ChatStyles";

interface SectionVideoCallProps {
  room: string;
  rawRoomId: string;
  onlineUsersCount: number;
  styles: ChatStyles;
  localCameraStream: MediaStream;
  localScreenStream: MediaStream;
  remotePeers: RemotePeerMedia[];
  micEnabled: boolean;
  setMicEnabled: (enabled: boolean) => Promise<void>;
  cameraEnabled: boolean;
  startCamera: (deviceId?: string) => Promise<void>;
  stopCamera: () => Promise<void>;
  canSwitchCamera: boolean;
  switchCamera: () => Promise<void>;
  screenShareEnabled: boolean;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => Promise<void>;
  speakerEnabled: boolean;
  setSpeakerEnabled: (enabled: boolean) => void;
  expectedPeersCount: number;
  connectedPeersCount: number;
}

export default function SectionVideoCall({
  rawRoomId,
  onlineUsersCount,
  styles,
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
  expectedPeersCount,
  connectedPeersCount,
}: Readonly<SectionVideoCallProps>) {
  const { t } = useTranslation();

  const navigation = useNavigation();

  const hasVideo = (stream: MediaStream | null | undefined): boolean =>
    Boolean(stream && stream.getVideoTracks().length > 0);

  const tiles = (() => {
    const all: Array<{ key: string; stream: MediaStream; mirror: boolean }> =
      [];

    if (hasVideo(localCameraStream)) {
      all.push({
        key: "local:camera",
        stream: localCameraStream,
        mirror: true,
      });
    }

    if (hasVideo(localScreenStream)) {
      all.push({
        key: "local:screen",
        stream: localScreenStream,
        mirror: false,
      });
    }

    for (const p of remotePeers) {
      if (!hasVideo(p.stream)) {
        continue;
      }

      all.push({
        key: `remote:${p.peerID}:${p.kind}`,
        stream: p.stream,
        mirror: false,
      });
    }

    return all;
  })();

  const toggleCamera = async () => {
    if (cameraEnabled) {
      await stopCamera();
      return;
    }

    await startCamera();
  };

  const toggleScreenShare = async () => {
    if (screenShareEnabled) {
      await stopScreenShare();
      return;
    }

    await startScreenShare();
  };

  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <Feather name="video" size={15} color="#d4d4d8" />
          <Text style={styles.sectionTitle}>{t("Chat.Stage")}</Text>
        </View>
        <Text style={styles.sectionHint} numberOfLines={1}>
          {t("Chat.RoomColon")} {rawRoomId || "-"}
        </Text>
      </View>

      <View style={styles.sectionBody}>
        <View style={styles.videoStage}>
          {tiles.length === 0 ? (
            <>
              <View style={styles.videoIconWrap}>
                <Feather name="video" size={24} color="#a5b4fc" />
              </View>
              <Text style={styles.videoStageTitle}>{t("Chat.NoVideoYet")}</Text>
              <Text style={styles.videoStageSubtitle}>
                {t("Chat.TurnOnCameraOrShareScreen")}
              </Text>
            </>
          ) : (
            <View style={styles.videoTilesWrap}>
              {tiles.map(tile => (
                <RTCView
                  key={tile.key}
                  streamURL={tile.stream.toURL()}
                  mirror={tile.mirror}
                  objectFit="cover"
                  style={styles.videoRtcTile}
                />
              ))}
            </View>
          )}
        </View>

        <View style={styles.videoActions}>
          <TouchableOpacity
            style={styles.videoActionButton}
            onPress={() => {
              setMicEnabled(!micEnabled).catch(() => undefined);
            }}
          >
            <Feather
              name={micEnabled ? "mic" : "mic-off"}
              size={14}
              color="#e4e4e7"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.videoActionButton}
            onPress={() => {
              toggleCamera().catch(() => undefined);
            }}
          >
            <Feather
              name={cameraEnabled ? "video" : "video-off"}
              size={14}
              color="#e4e4e7"
            />
          </TouchableOpacity>
          {canSwitchCamera && cameraEnabled ? (
            <TouchableOpacity
              style={styles.videoActionButton}
              onPress={() => {
                switchCamera().catch(() => undefined);
              }}
            >
              <Feather name="refresh-cw" size={14} color="#e4e4e7" />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={styles.videoActionButton}
            onPress={() => {
              toggleScreenShare().catch(() => undefined);
            }}
          >
            <Feather
              name={screenShareEnabled ? "monitor" : "moon"}
              size={14}
              color="#e4e4e7"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.videoActionButtonDanger}
            onPress={() => {
              navigation.goBack();
            }}
          >
            <Feather name="log-out" size={14} color="#fca5a5" />
          </TouchableOpacity>
        </View>

        <View style={styles.speakerRow}>
          <Text style={styles.speakerLabel}>{t("Chat.AudioStartsOn")}</Text>

          <View style={styles.speakerToggleMock}>
            <TouchableOpacity
              style={styles.speakerToggleSideActive}
              onPress={() => {
                setSpeakerEnabled(true);
              }}
            >
              <Feather
                name="volume-2"
                size={14}
                color={speakerEnabled ? "#ffffff" : "#a1a1aa"}
              />
            </TouchableOpacity>
            <View style={styles.speakerDivider} />
            <TouchableOpacity
              style={styles.speakerToggleSideMuted}
              onPress={() => {
                setSpeakerEnabled(false);
              }}
            >
              <Feather
                name="volume-x"
                size={14}
                color={speakerEnabled ? "#fca5a5" : "#ffffff"}
              />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.videoFooterHint}>
          {t("Chat.Users")} {onlineUsersCount} • WebRTC {connectedPeersCount}/
          {expectedPeersCount}
        </Text>
      </View>
    </View>
  );
}
