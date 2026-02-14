import { StyleSheet } from "react-native";

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
    width: "80%",
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
    width: "50%",
    textAlign: "right",
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
  },

  messagesListEmptyContent: {
    flexGrow: 1,
  },

  messageBubble: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    width: "auto",
    minWidth: "42%",
    maxWidth: "90%",
  },

  messageBubbleGap: {
    marginBottom: 10,
  },

  messageBubbleMine: {
    borderColor: "#2d3f8f",
    backgroundColor: "#1e2f68",
    alignSelf: "flex-end",
  },

  messageBubbleOther: {
    borderColor: "#2f2f36",
    backgroundColor: "#1a1a1f",
    alignSelf: "flex-start",
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

export type ChatStyles = typeof styles;

export default styles;
