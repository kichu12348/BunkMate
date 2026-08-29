import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { TabNavigator } from "./TabNavigator";
import { lazyScreen } from "./lazyScreen";
import { SubscriptionModal } from "../components/SubscriptionModal";
import { kvHelper } from "../kv/kvStore";
import { useState, useEffect } from "react";
import { useAuthStore } from "../state/auth";
import NewUpdateAlertModal from "../components/Modals/NewUpdateAlert";

import {
  SubjectDetailsSkeleton,
  SurveyAttemptSkeleton,
  PublicForumSkeleton,
  DutyLeaveSkeleton,
  AssignmentsSkeleton,
  AssignmentsDetailsSkeleton,
  SwitchAccountsSkeleton,
  KtuGradeCardSkeleton,
} from "../components/Skeletons/ScreenSkeletons";

// Lazy loaded stack screens with custom skeletons
const SubjectDetailsScreen = lazyScreen(
  () => import("../screens/SubjectDetails"),
  "SubjectDetailsScreen",
  SubjectDetailsSkeleton,
);
const SurveyAttemptScreen = lazyScreen(
  () => import("../screens/Surveys/SurveyAttempt"),
  "SurveyAttemptScreen",
  SurveyAttemptSkeleton,
);
const PublicForum = lazyScreen(
  () => import("../screens/PublicForum"),
  "PublicForum",
  PublicForumSkeleton,
);
const DutyLeaveScreen = lazyScreen(
  () => import("../screens/DutyLeave"),
  "DutyLeaveScreen",
  DutyLeaveSkeleton,
);
const AssignmentsScreen = lazyScreen(
  () => import("../screens/Assignments"),
  "AssignmentsScreen",
  AssignmentsSkeleton,
);
const AssignmentsDetailsScreen = lazyScreen(
  () => import("../screens/Assignments/AssignmentsDetails"),
  "AssignmentsDetailsScreen",
  AssignmentsDetailsSkeleton,
);
const SwitchAccountsScreen = lazyScreen(
  () => import("../screens/SwitchAccounts"),
  "SwitchAccountsScreen",
  SwitchAccountsSkeleton,
);
const LoginNewAccount = lazyScreen(
  () => import("../screens/SwitchAccounts/LoginNewAccount"),
  "LoginNewAccount",
  SwitchAccountsSkeleton,
);
const KtuGradeCardScreen = lazyScreen(
  () => import("../screens/KtuGradeCard"),
  "KtuGradeCardScreen",
  KtuGradeCardSkeleton,
);

// 1/12/2025 11:59:59 PM ASIA/KOLKATA
//const EXPIRY_DATE = "2025-12-01T23:59:59";

export type RootStackParamList = {
  MainTabs: undefined;
  SubjectDetails: {
    subjectId: string;
    subjectName: string;
    subjectCode: string;
    canMiss: number;
    toAttend: number;
  };
  SurveyAttempt: {
    surveyId: number;
    surveyName: string;
  };
  PublicForum: undefined;
  DutyLeave: undefined;
  Assignments: {
    subjectId: string;
    subjectName: string;
    subjectCode: string;
  };
  AssignmentsDetails: {
    assignmentId: string;
    assignmentName: string;
    courseCode: string;
  };
  SwitchAccounts: undefined;
  LoginNewAccount: undefined;
  KtuGradeCard: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const hasShownSubscriptionModal = useAuthStore(
    (s) => s.hasShownSubscriptionModal,
  );

  useEffect(() => {
    if (!hasShownSubscriptionModal) {
      setShowSubscriptionModal(true);
    }
  }, []);

  const handleCloseSubscriptionModal = () => {
    setShowSubscriptionModal(false);
    kvHelper.setSubscriptionModalShown();
  };

  return (
    <>
      <Stack.Navigator
        id={undefined}
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen
          name="MainTabs"
          component={TabNavigator}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen name="SubjectDetails" component={SubjectDetailsScreen} />
        <Stack.Screen name="SurveyAttempt" component={SurveyAttemptScreen} />
        <Stack.Screen name="PublicForum" component={PublicForum} />
        <Stack.Screen name="DutyLeave" component={DutyLeaveScreen} />
        <Stack.Screen name="Assignments" component={AssignmentsScreen} />
        <Stack.Screen
          name="AssignmentsDetails"
          component={AssignmentsDetailsScreen}
        />
        <Stack.Screen name="SwitchAccounts" component={SwitchAccountsScreen} />
        <Stack.Screen name="LoginNewAccount" component={LoginNewAccount} />
        <Stack.Screen name="KtuGradeCard" component={KtuGradeCardScreen} />
      </Stack.Navigator>

      {/* Global Subscription Modal */}
      {/*<Abinsk
        isVisible={[
          "ABCD_12348_Sandra_Sunil",
          "ABCD_12348_Mahadevan_Reji",
          "ABCD_12348_JACKSON_TOM_JOSEPH",
          "ABCD_12348_Aiswarya_P_A"
        ].includes(kvHelper.getInsightsLogged())}
        expiryDate={EXPIRY_DATE}
      />*/}
      <SubscriptionModal
        visible={showSubscriptionModal}
        onClose={handleCloseSubscriptionModal}
      />

      {/* Global Update Modal */}
      <NewUpdateAlertModal visible={true} />
    </>
  );
};
