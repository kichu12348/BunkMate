import { Image, ImageBackground } from "react-native";
import React from "react";
import chatBackground from "../../assets/bonk_bg_n_3.webp";
import { useThemeStore } from "../../state/themeStore";

const ChatBackground = ({ children }) => {
  const colors = useThemeStore((state) => state.colors);
  return (
    <ImageBackground
      source={chatBackground}
      style={{
        width: "100%",
        height: "100%",
        position: "absolute",
        backgroundColor: colors.background,
      }}
      resizeMode="cover"
    >
      {children}
    </ImageBackground>
  );
};

export default ChatBackground;
