import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { TabNavigator } from "./TabNavigator";
import { SubjectDetailsScreen } from "../screens/SubjectDetails";
import { SurveyAttemptScreen } from "../screens/Surveys/SurveyAttempt";
import { PublicForum } from "../screens/PublicForum";
import { SubscriptionModal } from "../components/SubscriptionModal";
import { AssignmentsScreen } from "../screens/Assignments";
import { AssignmentsDetailsScreen } from "../screens/Assignments/AssignmentsDetails";
import { kvHelper } from "../kv/kvStore";
import { useState, useEffect } from "react";
import { useAuthStore } from "../state/auth";
import Abinsk from "../components/Abinsk";

// 1/12/2025 11:59:59 PM ASIA/KOLKATA
const EXPIRY_DATE = "2025-12-01T23:59:59";

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
  Assignments: {
    subjectId: string;
    subjectName: string;
    subjectCode: string;
  };
  AssignmentsDetails: {
    assignmentId: string;
    assignmentName: string;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const hasShownSubscriptionModal = useAuthStore(
    (s) => s.hasShownSubscriptionModal
  );

  useEffect(() => {
    const hasBeenShown = hasShownSubscriptionModal;
    if (!hasBeenShown) {
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
        <Stack.Screen name="Assignments" component={AssignmentsScreen} />
        <Stack.Screen
          name="AssignmentsDetails"
          component={AssignmentsDetailsScreen}
        />
      </Stack.Navigator>

      {/* Global Subscription Modal */}
      <Abinsk
        isVisible={[
          "ABCD_12348_Sandra_Sunil",
          "ABCD_12348_Mahadevan_Reji",
          "ABCD_12348_JACKSON_TOM_JOSEPH",
          "ABCD_12348_Aiswarya_P_A"
        ].includes(kvHelper.getInsightsLogged())}
        expiryDate={EXPIRY_DATE}
      />
      <SubscriptionModal
        visible={showSubscriptionModal}
        onClose={handleCloseSubscriptionModal}
      />
    </>
  );
};
