import { View, Text } from "react-native";
import React from "react";
import { useWebSocket } from "../utils/websocket";

export const PublicForum = () => {
  const onMessage = (msg: any) => {
    console.log("Received message:", msg);
  };

  const onConnect = () => {
    console.log("WebSocket connection established");
  };

  const sendMessage = useWebSocket(onMessage, onConnect);

  const handleSendMessage = () => {
  };

  return (
    <View>
      <Text>PublicForum</Text>
    </View>
  );
};
