import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { TabNavigator } from "./TabNavigator";
import { SubjectDetailsScreen } from "../screens/SubjectDetails";
import { SurveyAttemptScreen } from "../screens/SurveyAttempt";
import { SubscriptionModal } from "../components/SubscriptionModal";
import { kvHelper } from "../kv/kvStore";
import { useState, useEffect } from "react";
import { useSettingsStore } from "../state/settings";
import { useAuthStore } from "../state/auth";

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
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const hasShownSubscriptionModal = useAuthStore(
    (s) => s.hasShownSubscriptionModal
  );

  useEffect(() => {
    // Show the subscription modal only once
    const hasBeenShown = hasShownSubscriptionModal;
    if (!hasBeenShown) {
      // Delay showing the modal by 2 seconds for better UX
      // const timer = setTimeout(() => {
      //   setShowSubscriptionModal(true);
      // }, 2000);
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
        <Stack.Screen
          name="SubjectDetails"
          component={SubjectDetailsScreen}
          options={{
            headerShown: false,
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="SurveyAttempt"
          component={SurveyAttemptScreen}
          options={{
            headerShown: false,
            animation: "slide_from_right",
          }}
        />
      </Stack.Navigator>

      {/* Global Subscription Modal */}
      <SubscriptionModal
        visible={showSubscriptionModal}
        onClose={handleCloseSubscriptionModal}
      />
    </>
  );
};
