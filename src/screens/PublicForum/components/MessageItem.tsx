import React, { useState } from "react";
import { View, StyleSheet, Platform, Image } from "react-native";
import { useThemedStyles } from "../../../hooks/useTheme";
import { ThemeColors } from "../../../types/theme";
import Text from "../../../components/UI/Text";
import loadingError from "../../../assets/loading_error_gif.gif";
import { MessageItemProps } from "../types";

export const MessageItem: React.FC<MessageItemProps> = ({ item, userId }) => {
  const styles = useThemedStyles(createStyles);
  const isMyMessage = item.sender_id === userId;
  const [imageLoadingError, setImageLoadingError] = useState(false);

  const imageUrl = item.image_url;
  const isImageMessage = !!imageUrl;

  return (
    <View
      style={[
        styles.messageRow,
        isMyMessage ? styles.myMessageRow : styles.otherMessageRow,
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble,
          isImageMessage && styles.imageBubble,
        ]}
      >
        {!isMyMessage && (
          <Text style={styles.senderName}>{item.sender_name}</Text>
        )}
        {isImageMessage &&
          (!imageLoadingError ? (
            <Image
              source={{ uri: imageUrl, cache: "force-cache" }}
              style={styles.messageImage}
              resizeMode="cover"
              onError={() => setImageLoadingError(true)}
            />
          ) : (
            <Image
              source={loadingError}
              style={styles.messageImage}
              resizeMode="contain"
            />
          ))}
        {item.content ? (
          <Text
            style={isMyMessage ? styles.myMessageText : styles.otherMessageText}
          >
            {item.content}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    messageRow: {
      flexDirection: "row",
      marginBottom: 12,
    },
    myMessageRow: {
      justifyContent: "flex-end",
    },
    otherMessageRow: {
      justifyContent: "flex-start",
    },
    messageBubble: {
      maxWidth: "75%",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 20,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: 1,
          },
          shadowOpacity: 0.1,
          shadowRadius: 3,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    imageBubble: {
      padding: 4,
    },
    myMessageBubble: {
      backgroundColor: colors.primary,
      borderBottomRightRadius: 4,
    },
    otherMessageBubble: {
      backgroundColor: colors.surface,
      borderBottomLeftRadius: 4,
      borderWidth: 1,
      borderColor: colors.border + "30",
    },
    senderName: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.primary,
      marginBottom: 4,
      letterSpacing: 0.2,
    },
    myMessageText: {
      fontSize: 16,
      color: "#FFFFFF",
      lineHeight: 22,
    },
    otherMessageText: {
      fontSize: 16,
      color: colors.text,
      lineHeight: 22,
    },
    messageImage: {
      width: 200,
      height: 200,
      borderRadius: 16,
    },
  });

export default MessageItem;
