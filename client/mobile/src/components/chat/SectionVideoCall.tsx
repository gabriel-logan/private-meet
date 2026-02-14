import { useTranslation } from "react-i18next";
import { Text, TouchableOpacity, View } from "react-native";
import Feather from "@react-native-vector-icons/feather";
import { useNavigation } from "@react-navigation/native";

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

  const navigation = useNavigation();

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
          <TouchableOpacity style={styles.videoActionButton}>
            <Feather name="mic" size={14} color="#e4e4e7" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.videoActionButton}>
            <Feather name="video" size={14} color="#e4e4e7" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.videoActionButton}>
            <Feather name="monitor" size={14} color="#e4e4e7" />
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
            <TouchableOpacity style={styles.speakerToggleSideActive}>
              <Feather name="volume-2" size={14} color="#ffffff" />
            </TouchableOpacity>
            <View style={styles.speakerDivider} />
            <TouchableOpacity style={styles.speakerToggleSideMuted}>
              <Feather name="volume-x" size={14} color="#fca5a5" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.videoFooterHint}>
          {t("Chat.Users")} {onlineUsersCount} • {t("Chat.AudioStartsOn")}
        </Text>
      </View>
    </View>
  );
}
