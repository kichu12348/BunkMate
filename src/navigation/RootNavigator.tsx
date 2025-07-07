import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { TabNavigator } from "./TabNavigator";
import { SubjectDetailsScreen } from "../screens/SubjectDetails";
import { SurveyAttemptScreen } from "../screens/SurveyAttempt";

export type RootStackParamList = {
  MainTabs: undefined;
  SubjectDetails: {
    subjectId: string;
    subjectName: string;
    subjectCode: string;
  };
  SurveyAttempt: {
    surveyId: number;
    surveyName: string;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  return (
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
  );
};
