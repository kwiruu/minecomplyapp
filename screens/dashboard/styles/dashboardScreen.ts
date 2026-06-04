import { StyleSheet } from "react-native";
import { theme } from "../../../theme/theme";
import {
  scale,
  verticalScale,
  normalizeFont,
  isTablet,
  moderateScale,
} from "../../../utils/responsive";

export const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingBottom: verticalScale(theme.spacing.xl),
  },
  header: {
    paddingHorizontal: scale(theme.spacing.lg),
    paddingTop: verticalScale(theme.spacing.xl),
    paddingBottom: verticalScale(theme.spacing.xl),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: scale(theme.spacing.md),
  },
  backButton: {
  position: "absolute",
  marginTop: 50,
  top: 10,
  left: 15,
  zIndex: 10,
  backgroundColor: "rgba(255,255,255,0.9)",
  borderRadius: 20,
  padding: 6,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.15,
  shadowRadius: 2,
  elevation: 2,
},
  greetingBlock: {
    flex: 1,
    minWidth: 0,
    paddingRight: scale(theme.spacing.sm),
  },
  greeting: {
    fontFamily: theme.typography.bold,
    fontSize: normalizeFont(theme.typography.sizes.xxl),
    lineHeight: normalizeFont(theme.typography.sizes.xxl) + verticalScale(6),
    color: theme.colors.primaryDark,
    flexShrink: 1,
    includeFontPadding: false,
  },
  subGreeting: {
    fontFamily: theme.typography.regular,
    fontSize: normalizeFont(theme.typography.sizes.sm),
    color: theme.colors.textLight,
    marginBottom: verticalScale(4),
    includeFontPadding: false,
  },
  avatar: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    backgroundColor: theme.colors.primaryLight + "20",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    overflow: "hidden",
  },
  avatarText: {
    fontFamily: theme.typography.semibold,
    fontSize: normalizeFont(theme.typography.sizes.md),
    lineHeight: normalizeFont(theme.typography.sizes.md) + verticalScale(2),
    color: theme.colors.primaryDark,
    includeFontPadding: false,
    textAlign: "center",
    textAlignVertical: "center",
    width: "100%",
  },
  section: {
    paddingHorizontal: scale(theme.spacing.lg),
    marginBottom: verticalScale(theme.spacing.xl),
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(theme.spacing.md),
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
  },
  sectionTitle: {
    fontFamily: theme.typography.semibold,
    fontSize: normalizeFont(theme.typography.sizes.lg),
    color: theme.colors.title,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  viewAllButton: {
    justifyContent: "center",
    alignItems: "center",
  },
  viewAllText: {
    fontFamily: theme.typography.semibold,
    fontSize: normalizeFont(theme.typography.sizes.sm),
    color: theme.colors.primaryDark,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  actionsContainer: {
    marginTop: verticalScale(theme.spacing.md),
    flexDirection: "column", // always stacked vertically
    gap: scale(theme.spacing.md),
  },
  actionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: moderateScale(theme.radii.lg),
    ...theme.shadows.light,
    padding: scale(theme.spacing.lg),
    flexDirection: "row",
    alignItems: "center",
    // Removed tablet-based flexBasis, to keep stacked layout
  },
  actionIconCircle: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    backgroundColor: theme.colors.primaryLight + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  actionTextContainer: {
    flex: 1,
    marginHorizontal: scale(theme.spacing.md),
  },
  actionTitle: {
    fontFamily: theme.typography.semibold,
    fontSize: normalizeFont(theme.typography.sizes.md),
    color: theme.colors.title,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontFamily: theme.typography.regular,
    fontSize: normalizeFont(theme.typography.sizes.sm),
    color: theme.colors.textLight,
  },
  summaryContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: moderateScale(theme.radii.lg),
    ...theme.shadows.light,
    overflow: "hidden",
  },
  reportsContainer: {},
  reportCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: scale(theme.spacing.lg),
    backgroundColor: theme.colors.surface,
  },
  draftCard: {
    backgroundColor: "#FFFBEB", // Light amber background for drafts
  },
  reportContent: {
    flex: 1,
    marginRight: scale(theme.spacing.sm),
  },
  reportHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  reportTitle: {
    fontFamily: theme.typography.medium,
    fontSize: normalizeFont(theme.typography.sizes.sm),
    color: theme.colors.title,
    flex: 1,
    marginRight: scale(8),
  },
  reportTypeBadge: {
    backgroundColor: theme.colors.primaryLight + "30",
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(4),
  },
  reportTypeText: {
    fontFamily: theme.typography.medium,
    fontSize: normalizeFont(10),
    color: theme.colors.primaryDark,
  },
  draftBadge: {
    backgroundColor: "#FEF3C7",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  draftBadgeText: {
    color: "#D97706",
  },
  attendanceStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  attendanceCount: {
    fontFamily: theme.typography.semibold,
    fontSize: normalizeFont(theme.typography.sizes.sm),
    color: theme.colors.success,
  },
  attendanceRate: {
    fontFamily: theme.typography.regular,
    fontSize: normalizeFont(theme.typography.sizes.xs),
    color: theme.colors.textLight,
  },
  reportMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  reportMetaText: {
    fontFamily: theme.typography.regular,
    fontSize: normalizeFont(theme.typography.sizes.xs),
    color: theme.colors.textLight,
  },
  divider: {
    height: 1,
    backgroundColor: "#EAEAEA",
    marginHorizontal: scale(theme.spacing.lg),
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: scale(theme.spacing.xl),
  },
  emptyStateTitle: {
    fontFamily: theme.typography.semibold,
    fontSize: normalizeFont(theme.typography.sizes.lg),
    color: theme.colors.title,
    marginTop: verticalScale(theme.spacing.md),
  },
  emptyStateText: {
    fontFamily: theme.typography.regular,
    fontSize: normalizeFont(theme.typography.sizes.sm),
    color: theme.colors.textLight,
    marginTop: 4,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: verticalScale(60),
  },
  loadingText: {
    fontFamily: theme.typography.regular,
    fontSize: normalizeFont(theme.typography.sizes.sm),
    color: theme.colors.textLight,
    marginTop: verticalScale(theme.spacing.md),
  },

  // ---------------------------------
  // 👇 NEW RESPONSIVE MODAL STYLES
  // ---------------------------------
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: scale(theme.spacing.lg), // Ensures modal isn't flush with edges
  },
  modalContent: {
    width: "100%", // Take up 90% of screen, defined in backdrop padding
    maxWidth: moderateScale(400), // Max width on large devices
    backgroundColor: theme.colors.surface,
    borderRadius: moderateScale(theme.radii.lg),
    padding: scale(theme.spacing.lg),
    ...theme.shadows.medium,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(theme.spacing.lg),
  },
  modalTitle: {
    fontFamily: theme.typography.bold,
    fontSize: normalizeFont(theme.typography.sizes.lg),
    color: theme.colors.title,
  },
  modalCloseButton: {
    padding: moderateScale(4), // Hitbox
  },
  modalOptionsContainer: {
    gap: verticalScale(theme.spacing.sm),
  },
  modalButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: scale(theme.spacing.md),
    backgroundColor: theme.colors.background,
    borderRadius: moderateScale(theme.radii.md),
  },
  modalButtonIcon: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: theme.colors.primaryLight + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonText: {
    flex: 1,
    fontFamily: theme.typography.semibold,
    fontSize: normalizeFont(theme.typography.sizes.md),
    color: theme.colors.title,
    marginLeft: scale(theme.spacing.md),
  },
});
