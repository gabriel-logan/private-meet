import { Text, View } from "react-native";
import Feather from "@react-native-vector-icons/feather";
import { t } from "i18next";

import { OnlineUser } from "../../hooks/useOnlineUsers";
import type { ChatStyles } from "../../pages/ChatStyles";

interface SectionOnlineUsersProps {
  onlineUsers: OnlineUser[];
  rawRoomId: string;
  styles: ChatStyles;
}

export default function SectionOnlineUsers({
  onlineUsers,
  rawRoomId,
  styles,
}: Readonly<SectionOnlineUsersProps>) {
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
        <Text style={styles.sectionCaption} numberOfLines={1}>
          {t("Chat.RoomColon")}
          {rawRoomId || "-"}
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
