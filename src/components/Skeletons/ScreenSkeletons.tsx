import React from "react";
import { View, StyleSheet, ScrollView, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../hooks/useTheme";
import {
  SkeletonShimmerProvider,
  SkeletonBox,
  SkeletonText,
  SkeletonCircle,
  SkeletonCard,
} from "./SkeletonBase";

const { width } = Dimensions.get("window");

// ==========================================
// 1. SETTINGS SCREEN SKELETON
// ==========================================
export const SettingsSkeleton: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, backgroundColor: colors.background },
      ]}
    >
      <SkeletonShimmerProvider>
        {/* Header */}
        <View style={styles.header}>
          <SkeletonText width={130} height={28} borderRadius={8} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Profile Card */}
          <View style={styles.section}>
            <SkeletonCard style={styles.profileCard}>
              <View style={styles.rowAlign}>
                <SkeletonCircle size={68} />
                <View style={styles.profileInfo}>
                  <SkeletonText width={140} height={20} borderRadius={6} />
                  <SkeletonBox
                    width={110}
                    height={24}
                    borderRadius={12}
                    style={{ marginTop: 8 }}
                  />
                </View>
              </View>
            </SkeletonCard>
          </View>

          {/* Academic Settings Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <SkeletonCircle size={20} />
              <SkeletonText width={140} height={14} borderRadius={4} />
            </View>
            <SkeletonCard>
              <View style={{ gap: 12 }}>
                <SkeletonBox width="100%" height={48} borderRadius={12} />
                <SkeletonBox width="100%" height={48} borderRadius={12} />
                <SkeletonBox width="100%" height={44} borderRadius={12} />
              </View>
            </SkeletonCard>
          </View>

          {/* Preferences Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <SkeletonCircle size={20} />
              <SkeletonText width={110} height={14} borderRadius={4} />
            </View>
            <SkeletonCard>
              <View style={styles.rowBetween}>
                <View style={styles.rowAlign}>
                  <SkeletonCircle size={24} />
                  <View style={{ marginLeft: 12, gap: 4 }}>
                    <SkeletonText width={90} height={16} borderRadius={4} />
                    <SkeletonText width={130} height={12} borderRadius={4} />
                  </View>
                </View>
                <SkeletonBox width={46} height={26} borderRadius={13} />
              </View>
            </SkeletonCard>
          </View>

          {/* About Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <SkeletonCircle size={20} />
              <SkeletonText width={120} height={14} borderRadius={4} />
            </View>
            <SkeletonCard>
              <View style={{ gap: 14 }}>
                <View style={styles.rowBetween}>
                  <View style={styles.rowAlign}>
                    <SkeletonCircle size={22} />
                    <View style={{ marginLeft: 12, gap: 4 }}>
                      <SkeletonText width={100} height={14} />
                      <SkeletonText width={150} height={11} />
                    </View>
                  </View>
                </View>
                <View style={styles.divider} />
                <View style={styles.rowBetween}>
                  <View style={styles.rowAlign}>
                    <SkeletonCircle size={22} />
                    <View style={{ marginLeft: 12, gap: 4 }}>
                      <SkeletonText width={70} height={14} />
                      <SkeletonText width={90} height={11} />
                    </View>
                  </View>
                </View>
              </View>
            </SkeletonCard>
          </View>
        </ScrollView>
      </SkeletonShimmerProvider>
    </View>
  );
};

// ==========================================
// 2. NOTIFICATIONS SCREEN SKELETON
// ==========================================
export const NotificationsSkeleton: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, backgroundColor: colors.background },
      ]}
    >
      <SkeletonShimmerProvider>
        {/* Header */}
        <View style={styles.headerRow}>
          <SkeletonText width={150} height={26} borderRadius={8} />
          <SkeletonBox width={90} height={28} borderRadius={14} />
        </View>

        {/* Notification List Items */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {[1, 2, 3, 4, 5].map((_, i) => (
            <SkeletonCard key={i} style={styles.notificationCard}>
              <View style={styles.rowBetween}>
                <View style={styles.rowAlign}>
                  <SkeletonCircle size={22} />
                  <SkeletonText
                    width={130}
                    height={15}
                    borderRadius={4}
                    style={{ marginLeft: 8 }}
                  />
                </View>
                <SkeletonText width={60} height={12} borderRadius={4} />
              </View>
              <View style={{ marginTop: 10, gap: 6 }}>
                <SkeletonText width="95%" height={13} borderRadius={4} />
                <SkeletonText width="70%" height={13} borderRadius={4} />
              </View>
            </SkeletonCard>
          ))}
        </ScrollView>
      </SkeletonShimmerProvider>
    </View>
  );
};

// ==========================================
// 3. SURVEYS SCREEN SKELETON
// ==========================================
export const SurveysSkeleton: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, backgroundColor: colors.background },
      ]}
    >
      <SkeletonShimmerProvider>
        {/* Header */}
        <View style={styles.header}>
          <SkeletonText width={120} height={24} borderRadius={8} />
          <SkeletonText
            width={70}
            height={13}
            borderRadius={4}
            style={{ marginTop: 4 }}
          />
        </View>

        {/* Filter Chips */}
        <View style={styles.chipsRow}>
          <SkeletonBox width={70} height={36} borderRadius={18} />
          <SkeletonBox width={85} height={36} borderRadius={18} />
          <SkeletonBox width={80} height={36} borderRadius={18} />
        </View>

        {/* Survey Cards */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {[1, 2, 3].map((_, i) => (
            <SkeletonCard key={i} style={styles.surveyCard}>
              <View style={styles.rowBetween}>
                <View style={styles.rowAlign}>
                  <SkeletonCircle size={28} />
                  <SkeletonText
                    width={160}
                    height={16}
                    borderRadius={4}
                    style={{ marginLeft: 8 }}
                  />
                </View>
                <SkeletonBox width={75} height={24} borderRadius={12} />
              </View>

              <View style={{ marginTop: 12, gap: 6 }}>
                <SkeletonText width="90%" height={13} borderRadius={4} />
                <SkeletonText width="65%" height={13} borderRadius={4} />
              </View>

              <View style={{ marginTop: 12, gap: 6 }}>
                <View style={styles.rowAlign}>
                  <SkeletonCircle size={14} />
                  <SkeletonText
                    width={170}
                    height={12}
                    style={{ marginLeft: 6 }}
                  />
                </View>
              </View>

              <View
                style={[
                  styles.rowBetween,
                  { marginTop: 14, paddingTop: 10, borderTopWidth: 0.5 },
                ]}
              >
                <SkeletonText width={90} height={12} />
                <SkeletonText width={60} height={12} />
              </View>
            </SkeletonCard>
          ))}
        </ScrollView>
      </SkeletonShimmerProvider>
    </View>
  );
};

// ==========================================
// 4. ABSENTEE REPORT SCREEN SKELETON
// ==========================================
export const AbsenteeReportSkeleton: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, backgroundColor: colors.background },
      ]}
    >
      <SkeletonShimmerProvider>
        {/* Header */}
        <View style={styles.header}>
          <SkeletonText width={170} height={24} borderRadius={8} />
        </View>

        {/* Duty Leave Button Banner */}
        <SkeletonCard style={styles.dutyLeaveBanner}>
          <View style={styles.rowBetween}>
            <View style={styles.rowAlign}>
              <SkeletonCircle size={32} />
              <View style={{ marginLeft: 12, gap: 4 }}>
                <SkeletonText width={100} height={15} />
                <SkeletonText width={150} height={12} />
              </View>
            </View>
            <SkeletonCircle size={18} />
          </View>
        </SkeletonCard>

        {/* Date Selector Box */}
        <View style={styles.dateSelectorContainer}>
          <SkeletonText width={120} height={13} style={{ marginBottom: 8 }} />
          <SkeletonBox width="100%" height={46} borderRadius={12} />
          <View
            style={[styles.chipsRow, { paddingHorizontal: 0, marginTop: 10 }]}
          >
            <SkeletonBox width={80} height={28} borderRadius={14} />
            <SkeletonBox width={80} height={28} borderRadius={14} />
          </View>
        </View>

        {/* Date Report Sections */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {[1, 2].map((_, i) => (
            <View key={i} style={styles.section}>
              <View style={styles.rowAlign}>
                <SkeletonCircle size={8} />
                <SkeletonText
                  width={180}
                  height={15}
                  style={{ marginLeft: 8, marginBottom: 8 }}
                />
              </View>
              <SkeletonCard>
                <View style={styles.rowBetween}>
                  <View style={{ gap: 4, flex: 1 }}>
                    <SkeletonText width="70%" height={16} />
                    <SkeletonText width="35%" height={12} />
                  </View>
                </View>
                <View style={styles.divider} />
                <View style={{ gap: 8 }}>
                  <SkeletonText width={110} height={12} />
                  <View style={styles.rowAlign}>
                    <SkeletonBox width={36} height={30} borderRadius={8} />
                    <SkeletonBox
                      width={36}
                      height={30}
                      borderRadius={8}
                      style={{ marginLeft: 8 }}
                    />
                  </View>
                </View>
              </SkeletonCard>
            </View>
          ))}
        </ScrollView>
      </SkeletonShimmerProvider>
    </View>
  );
};

// ==========================================
// 5. SUBJECT DETAILS SCREEN SKELETON
// ==========================================
export const SubjectDetailsSkeleton: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, backgroundColor: colors.background },
      ]}
    >
      <SkeletonShimmerProvider>
        {/* Header */}
        <View style={styles.navHeaderRow}>
          <SkeletonCircle size={28} />
          <View style={{ flex: 1, marginLeft: 12, gap: 4 }}>
            <SkeletonText width="75%" height={18} borderRadius={6} />
            <SkeletonText width="30%" height={13} borderRadius={4} />
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Section: Attendance Overview */}
          <View style={styles.section}>
            <SkeletonText
              width={160}
              height={17}
              style={{ marginHorizontal: 20, marginBottom: 12 }}
            />
            {/* 6 Stat Cards (2 columns x 3 rows) */}
            <View style={styles.statsGrid}>
              {[1, 2, 3, 4, 5, 6].map((_, i) => (
                <View key={i} style={styles.statGridItem}>
                  <SkeletonCard style={styles.statCard}>
                    <SkeletonCircle size={32} />
                    <SkeletonText
                      width={50}
                      height={20}
                      borderRadius={6}
                      style={{ marginTop: 8 }}
                    />
                    <SkeletonText
                      width={70}
                      height={12}
                      borderRadius={4}
                      style={{ marginTop: 4 }}
                    />
                  </SkeletonCard>
                </View>
              ))}
            </View>
          </View>

          {/* View Assignments Button */}
          <View style={[styles.section, { marginHorizontal: 20 }]}>
            <SkeletonBox width="100%" height={48} borderRadius={12} />
          </View>

          {/* Section: Attendance History Calendar */}
          <View style={styles.section}>
            <SkeletonText
              width={150}
              height={17}
              style={{ marginHorizontal: 20, marginBottom: 4 }}
            />
            <SkeletonText
              width={200}
              height={12}
              style={{ marginHorizontal: 20, marginBottom: 12 }}
            />
            <SkeletonCard style={{ padding: 12 }}>
              {/* Month Selector */}
              <View style={[styles.rowBetween, { marginBottom: 16 }]}>
                <SkeletonCircle size={24} />
                <SkeletonText width={120} height={16} />
                <SkeletonCircle size={24} />
              </View>

              {/* Day Labels Row (Sun - Sat) */}
              <View style={styles.rowBetween}>
                {[1, 2, 3, 4, 5, 6, 7].map((label, d) => (
                  <SkeletonText
                    key={d}
                    width={24}
                    height={12}
                    style={{ textAlign: "center" }}
                  />
                ))}
              </View>

              {/* 5 Calendar Rows */}
              <View style={{ gap: 8, marginTop: 12 }}>
                {[1, 2, 3, 4, 5].map((_, r) => (
                  <View key={r} style={styles.rowBetween}>
                    {[1, 2, 3, 4, 5, 6, 7].map((_, c) => (
                      <SkeletonBox
                        key={c}
                        width={(width - 90) / 7}
                        height={(width - 90) / 7}
                        borderRadius={6}
                      />
                    ))}
                  </View>
                ))}
              </View>
            </SkeletonCard>
          </View>
        </ScrollView>
      </SkeletonShimmerProvider>
    </View>
  );
};

// ==========================================
// 6. KTU GRADE CARD SCREEN SKELETON
// ==========================================
export const KtuGradeCardSkeleton: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, backgroundColor: colors.background },
      ]}
    >
      <SkeletonShimmerProvider>
        {/* Header */}
        <View style={styles.navHeaderRow}>
          <SkeletonCircle size={28} />
          <SkeletonText
            width={130}
            height={22}
            borderRadius={6}
            style={{ marginLeft: 12 }}
          />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Summary / CGPA Banner */}
          <SkeletonCard style={{ padding: 20 }}>
            <View style={styles.rowBetween}>
              <View style={{ gap: 6 }}>
                <SkeletonText width={120} height={18} />
                <SkeletonText width={90} height={13} />
                <SkeletonText width={140} height={12} />
              </View>
              <SkeletonCircle size={60} />
            </View>
          </SkeletonCard>

          {/* Semester Result Cards */}
          {[1, 2, 3].map((_, i) => (
            <SkeletonCard key={i} style={{ marginTop: 12 }}>
              <View style={styles.rowBetween}>
                <SkeletonText width={100} height={16} />
                <SkeletonBox width={65} height={24} borderRadius={8} />
              </View>
              <View style={styles.divider} />
              <View style={{ gap: 10 }}>
                {[1, 2, 3].map((_, idx) => (
                  <View key={idx} style={styles.rowBetween}>
                    <SkeletonText width="65%" height={13} />
                    <SkeletonBox width={30} height={16} borderRadius={4} />
                  </View>
                ))}
              </View>
            </SkeletonCard>
          ))}
        </ScrollView>
      </SkeletonShimmerProvider>
    </View>
  );
};

// ==========================================
// 7. SWITCH ACCOUNTS SCREEN SKELETON
// ==========================================
export const SwitchAccountsSkeleton: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, backgroundColor: colors.background },
      ]}
    >
      <SkeletonShimmerProvider>
        {/* Header */}
        <View style={styles.navHeaderRow}>
          <SkeletonCircle size={28} />
          <SkeletonText
            width={170}
            height={22}
            borderRadius={6}
            style={{ marginLeft: 12 }}
          />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Add Account Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <SkeletonCircle size={20} />
              <SkeletonText width={110} height={14} />
            </View>
            <SkeletonCard>
              <View style={styles.rowAlign}>
                <SkeletonBox width={44} height={44} borderRadius={12} />
                <View style={{ marginLeft: 12, gap: 4, flex: 1 }}>
                  <SkeletonText width={140} height={15} />
                  <SkeletonText width={180} height={12} />
                </View>
                <SkeletonCircle size={18} />
              </View>
            </SkeletonCard>
          </View>

          {/* Saved Accounts Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <SkeletonCircle size={20} />
              <SkeletonText width={130} height={14} />
            </View>

            {[1, 2, 3].map((_, i) => (
              <SkeletonCard key={i} style={styles.accountCard}>
                <View style={styles.rowAlign}>
                  <SkeletonCircle size={46} />
                  <View style={{ marginLeft: 12, gap: 4, flex: 1 }}>
                    <View style={styles.rowAlign}>
                      <SkeletonText width={110} height={15} />
                      {i === 0 && (
                        <SkeletonBox
                          width={45}
                          height={18}
                          borderRadius={6}
                          style={{ marginLeft: 8 }}
                        />
                      )}
                    </View>
                    <SkeletonText width={80} height={12} />
                    <SkeletonText width={130} height={11} />
                  </View>
                  <SkeletonCircle size={24} />
                </View>
              </SkeletonCard>
            ))}
          </View>
        </ScrollView>
      </SkeletonShimmerProvider>
    </View>
  );
};

// ==========================================
// 8. ASSIGNMENTS SCREEN SKELETON
// ==========================================
export const AssignmentsSkeleton: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, backgroundColor: colors.background },
      ]}
    >
      <SkeletonShimmerProvider>
        {/* Header */}
        <View style={styles.navHeaderRow}>
          <SkeletonCircle size={28} />
          <View style={{ flex: 1, marginLeft: 12, gap: 4 }}>
            <SkeletonText width={130} height={20} />
            <SkeletonText width={180} height={12} />
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
          <SkeletonBox width={100} height={26} borderRadius={12} />
        </View>

        {/* Assignment Cards */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {[1, 2, 3].map((_, i) => (
            <SkeletonCard key={i}>
              <View style={styles.rowBetween}>
                <SkeletonText width="65%" height={16} />
                <SkeletonBox width={60} height={22} borderRadius={8} />
              </View>
              <View style={{ marginTop: 10, gap: 6 }}>
                <SkeletonText width="90%" height={13} />
                <SkeletonText width="40%" height={12} />
              </View>
            </SkeletonCard>
          ))}
        </ScrollView>
      </SkeletonShimmerProvider>
    </View>
  );
};

// ==========================================
// 9. ASSIGNMENTS DETAILS SCREEN SKELETON
// ==========================================
export const AssignmentsDetailsSkeleton: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, backgroundColor: colors.background },
      ]}
    >
      <SkeletonShimmerProvider>
        {/* Header */}
        <View style={styles.navHeaderRow}>
          <SkeletonCircle size={28} />
          <SkeletonText
            width="60%"
            height={18}
            style={{ marginLeft: 12, flex: 1 }}
          />
          <SkeletonCircle size={32} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Performance Summary Card */}
          <SkeletonCard style={{ padding: 16, gap: 10 }}>
            <View style={styles.rowBetween}>
              <View style={styles.rowAlign}>
                <SkeletonCircle size={18} />
                <SkeletonText
                  width={90}
                  height={14}
                  style={{ marginLeft: 8 }}
                />
              </View>
              <SkeletonText width={40} height={14} />
            </View>
            <SkeletonBox width="100%" height={10} borderRadius={6} />
            <SkeletonText width={80} height={12} />
          </SkeletonCard>

          {/* QA Rows */}
          {[1, 2, 3, 4].map((_, i) => (
            <SkeletonCard key={i} style={{ padding: 14 }}>
              <View style={styles.rowBetween}>
                <SkeletonText width={40} height={15} />
                <SkeletonBox width={50} height={20} borderRadius={8} />
              </View>
              <View style={{ marginTop: 8, gap: 4 }}>
                <SkeletonText width="95%" height={13} />
                <SkeletonText width="70%" height={13} />
              </View>
            </SkeletonCard>
          ))}
        </ScrollView>
      </SkeletonShimmerProvider>
    </View>
  );
};

// ==========================================
// 10. DUTY LEAVE SCREEN SKELETON
// ==========================================
export const DutyLeaveSkeleton: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, backgroundColor: colors.background },
      ]}
    >
      <SkeletonShimmerProvider>
        {/* Header */}
        <View style={styles.navHeaderRow}>
          <SkeletonCircle size={28} />
          <SkeletonText
            width={120}
            height={20}
            style={{ marginLeft: 12, flex: 1 }}
          />
          <SkeletonBox width={36} height={36} borderRadius={18} />
        </View>

        {/* Expected Impact Card */}
        <SkeletonCard style={{ padding: 14 }}>
          <View style={styles.rowAlign}>
            <SkeletonCircle size={16} />
            <SkeletonText width={110} height={14} style={{ marginLeft: 8 }} />
          </View>
          <View
            style={[styles.chipsRow, { paddingHorizontal: 0, marginTop: 10 }]}
          >
            <SkeletonBox width={120} height={36} borderRadius={10} />
            <SkeletonBox width={120} height={36} borderRadius={10} />
          </View>
        </SkeletonCard>

        {/* Duty Leave Cards */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {[1, 2, 3].map((_, i) => (
            <SkeletonCard key={i} style={{ padding: 16 }}>
              <View style={styles.rowAlign}>
                <SkeletonBox width={46} height={46} borderRadius={10} />
                <View style={{ marginLeft: 12, gap: 4, flex: 1 }}>
                  <SkeletonText width="80%" height={15} />
                  <SkeletonText width="50%" height={12} />
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.rowBetween}>
                <SkeletonBox width={80} height={24} borderRadius={8} />
                <View style={styles.rowAlign}>
                  <SkeletonBox width={50} height={24} borderRadius={8} />
                  <SkeletonBox
                    width={50}
                    height={24}
                    borderRadius={8}
                    style={{ marginLeft: 8 }}
                  />
                </View>
              </View>
            </SkeletonCard>
          ))}
        </ScrollView>
      </SkeletonShimmerProvider>
    </View>
  );
};

// ==========================================
// 11. PUBLIC FORUM SCREEN SKELETON
// ==========================================
export const PublicForumSkeleton: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, backgroundColor: colors.background },
      ]}
    >
      <SkeletonShimmerProvider>
        {/* Header */}
        <View style={styles.navHeaderRow}>
          <SkeletonCircle size={28} />
          <SkeletonText
            width={120}
            height={20}
            style={{ marginLeft: 12, flex: 1 }}
          />
          <SkeletonBox width={65} height={24} borderRadius={12} />
        </View>

        {/* Chat Stream Bubbles */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Other message (left) */}
          <View style={[styles.chatBubbleLeft, { alignSelf: "flex-start" }]}>
            <SkeletonText width={70} height={11} style={{ marginBottom: 4 }} />
            <SkeletonText width={180} height={14} />
          </View>

          {/* My message (right) */}
          <View style={[styles.chatBubbleRight, { alignSelf: "flex-end" }]}>
            <SkeletonText width={140} height={14} />
          </View>

          {/* Other image message */}
          <View style={[styles.chatBubbleLeft, { alignSelf: "flex-start" }]}>
            <SkeletonText width={60} height={11} style={{ marginBottom: 4 }} />
            <SkeletonBox width={160} height={120} borderRadius={12} />
          </View>

          {/* My message (right) */}
          <View style={[styles.chatBubbleRight, { alignSelf: "flex-end" }]}>
            <SkeletonText width={200} height={14} />
            <SkeletonText width={100} height={14} style={{ marginTop: 4 }} />
          </View>
        </ScrollView>

        {/* Bottom input placeholder */}
        <View
          style={[styles.chatInputRow, { paddingBottom: insets.bottom + 8 }]}
        >
          <SkeletonBox width="85%" height={44} borderRadius={22} />
          <SkeletonCircle size={44} />
        </View>
      </SkeletonShimmerProvider>
    </View>
  );
};

// ==========================================
// 12. SURVEY ATTEMPT SCREEN SKELETON
// ==========================================
export const SurveyAttemptSkeleton: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, backgroundColor: colors.background },
      ]}
    >
      <SkeletonShimmerProvider>
        {/* Header */}
        <View style={styles.navHeaderRow}>
          <SkeletonCircle size={28} />
          <View style={{ flex: 1, marginLeft: 12, gap: 4 }}>
            <SkeletonText width={160} height={18} />
            <SkeletonText width={100} height={12} />
          </View>
        </View>

        {/* Progress bar */}
        <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
          <SkeletonBox width="100%" height={4} borderRadius={2} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Survey Info Card */}
          <SkeletonCard style={{ padding: 16 }}>
            <SkeletonText width="80%" height={20} />
            <SkeletonText width="95%" height={13} style={{ marginTop: 8 }} />
            <View style={[styles.rowAlign, { marginTop: 12, gap: 16 }]}>
              <SkeletonBox width={80} height={16} borderRadius={4} />
              <SkeletonBox width={90} height={16} borderRadius={4} />
            </View>
          </SkeletonCard>

          {/* Question 1 Card */}
          <SkeletonCard style={{ padding: 18, marginTop: 12 }}>
            <View style={styles.rowAlign}>
              <SkeletonBox width={30} height={20} borderRadius={6} />
              <SkeletonText width="75%" height={16} style={{ marginLeft: 8 }} />
            </View>

            {/* Radio Choice Options */}
            <View style={{ marginTop: 14, gap: 10 }}>
              {[1, 2, 3, 4].map((_, c) => (
                <View key={c} style={styles.rowAlign}>
                  <SkeletonCircle size={20} />
                  <SkeletonText
                    width="60%"
                    height={14}
                    style={{ marginLeft: 10 }}
                  />
                </View>
              ))}
            </View>
          </SkeletonCard>
        </ScrollView>
      </SkeletonShimmerProvider>
    </View>
  );
};

// ==========================================
// SHARED SKELETON STYLES
// ==========================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  navHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  rowAlign: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "transparent",
    marginVertical: 10,
  },
  chipsRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  profileCard: {
    padding: 20,
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  bannerContainer: {
    marginBottom: 8,
  },
  notificationCard: {
    padding: 16,
  },
  surveyCard: {
    padding: 16,
  },
  dutyLeaveBanner: {
    padding: 16,
  },
  dateSelectorContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 10,
  },
  statGridItem: {
    width: "50%",
    padding: 6,
  },
  statCard: {
    marginHorizontal: 0,
    marginVertical: 0,
    alignItems: "center",
    padding: 14,
  },
  accountCard: {
    padding: 14,
  },
  chatBubbleLeft: {
    maxWidth: "75%",
    padding: 14,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    marginLeft: 16,
    marginBottom: 12,
  },
  chatBubbleRight: {
    maxWidth: "75%",
    padding: 14,
    borderRadius: 18,
    borderBottomRightRadius: 4,
    marginRight: 16,
    marginBottom: 12,
  },
  chatInputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: "rgba(128,128,128,0.2)",
  },
});
