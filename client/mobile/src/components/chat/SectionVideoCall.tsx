import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import Feather from "@react-native-vector-icons/feather";

import type { ChatStyles } from "../../pages/ChatStyles";

interface SectionVideoCallProps {
  room: string;
  rawRoomId: string;
  onlineUsersCount: number;
  styles: ChatStyles;
}

export default function SectionVideoCall({
  rawRoomId,
  onlineUsersCount,
  styles,
}: Readonly<SectionVideoCallProps>) {
  const { t } = useTranslation();

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
