import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
  RefreshControl,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemedStyles } from "../hooks/useTheme";
import { ThemeColors } from "../types/theme";
import { useThemeStore } from "../state/themeStore";
import { useChatStore } from "../state/chat";
import { useWebSocket } from "../utils/websocket";
import { Message } from "../types/api";
import Animated, {
  useAnimatedStyle,
  withTiming,
  Easing,
  useSharedValue,
  interpolateColor,
  useAnimatedProps,
} from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";

type PublicForumNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "PublicForum"
>;
import AnimatedIconBackground from "../components/UI/ChatBackground";

const AnimatedIcon = Animated.createAnimatedComponent(Ionicons);

export const PublicForum: React.FC = () => {
  const styles = useThemedStyles(createStyles);
  const { colors } = useThemeStore();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const isButtonActive = useRef(false);
  const isAnimating = useRef(false);

  const navigation = useNavigation<PublicForumNavigationProp>();

  const progress = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(
        progress.value,
        [0, 1],
        [colors.surface, colors.background]
      ),
      borderColor: interpolateColor(
        progress.value,
        [0, 1],
        [colors.border + "20", colors.primary]
      ),
      borderWidth: progress.value * 1.5,
    };
  });

  const animatedIconProps = useAnimatedProps(() => {
    return {
      color: interpolateColor(
        progress.value,
        [0, 1],
        [colors.textSecondary, colors.text]
      ),
    };
  });

  const activeButton = () => {
    if (isAnimating.current || isButtonActive.current) return;
    isButtonActive.current = true;
    isAnimating.current = true;
    progress.value = withTiming(1, {
      duration: 300,
      easing: Easing.inOut(Easing.ease),
    });
    setTimeout(() => {
      isAnimating.current = false;
    }, 300);
  };

  const deactiveButton = () => {
    if (isAnimating.current || !isButtonActive.current) return;
    isButtonActive.current = false;
    isAnimating.current = true;
    progress.value = withTiming(0, {
      duration: 300,
      easing: Easing.inOut(Easing.ease),
    });
    setTimeout(() => {
      isAnimating.current = false;
    }, 300);
  };

  // Get state and actions from the chat store
  const {
    messages,
    addMessage,
    onScrollToTop,
    clearMessages,
    userId,
    userName,
  } = useChatStore();

  // WebSocket message handler
  const onMessageHandler = (msg: Message) => {
    addMessage(msg);
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const onConnectHandler = (isConnected: boolean) => {
    setIsConnected(isConnected);
  };

  // Initialize WebSocket connection
  const sendMessage = useWebSocket(onMessageHandler, onConnectHandler);

  // Load initial messages on mount
  useEffect(() => {
    const loadInitialMessages = async () => {
      setIsLoadingHistory(true);
      clearMessages();
      await onScrollToTop();
      setIsLoadingHistory(false);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    };
    loadInitialMessages();
  }, []);

  // Handler for sending a new message
  const handleSendMessage = () => {
    const trimmedMessage = newMessage.trim();
    if (trimmedMessage.length === 0 || !userId || !userName) {
      return;
    }
    const message: Message = {
      id: Date.now().toString(),
      sender_id: userId,
      sender_name: userName,
      content: trimmedMessage,
      timestamp: new Date().toISOString(),
    };

    sendMessage(message);
    addMessage(message);
    setNewMessage("");

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
      deactiveButton();
    }, 100);
  };

  // Handler for loading more messages
  const handleLoadMore = async () => {
    if (isLoadingHistory) return;
    setIsLoadingHistory(true);
    await onScrollToTop();
    setIsLoadingHistory(false);
  };

  const MessageItem = React.memo(({ item }: { item: Message }) => {
    const isMyMessage = item.sender_id === userId;

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
          ]}
        >
          {!isMyMessage && (
            <Text style={styles.senderName}>{item.sender_name}</Text>
          )}
          <Text
            style={isMyMessage ? styles.myMessageText : styles.otherMessageText}
          >
            {item.content}
          </Text>
        </View>
      </View>
    );
  });

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-back" size={28} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Public Forum</Text>
      <View style={styles.onlineIndicator}>
        <View
          style={[
            styles.onlineDot,
            { backgroundColor: isConnected ? colors.success : colors.error },
          ]}
        />
        <Text style={styles.onlineText}>
          {isConnected ? "Online" : "Offline"}
        </Text>
      </View>
    </View>
  );

  return (
    <AnimatedIconBackground>
      <View
        style={{
          paddingBottom: insets.bottom,
          flex: 1,
        }}
      >
        {renderHeader()}
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={({ item }) => <MessageItem item={item} />}
            keyExtractor={(item) => item.id.toString()}
            style={[styles.messageList]}
            contentContainerStyle={[
              styles.messageListContent,
              { paddingBottom: 24 },
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isLoadingHistory}
                onRefresh={handleLoadMore}
                tintColor={colors.primary}
                colors={[colors.primary]}
                progressBackgroundColor={colors.background}
              />
            }
          />

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                value={newMessage}
                onChangeText={(text) => {
                  setNewMessage(text);
                  if (text.trim().length > 0) {
                    activeButton();
                  } else {
                    deactiveButton();
                  }
                }}
                placeholder="Type a message..."
                placeholderTextColor={colors.textSecondary}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                onPress={handleSendMessage}
                activeOpacity={0.7}
                disabled={newMessage.trim().length === 0}
              >
                <Animated.View style={[styles.sendButton, animatedStyle]}>
                  <AnimatedIcon
                    name="send"
                    size={20}
                    animatedProps={animatedIconProps}
                  />
                </Animated.View>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </AnimatedIconBackground>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingBottom: 16,
      gap: 12,
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: -8,
    },
    headerTitle: {
      flex: 1,
      fontSize: 20,
      fontWeight: "600",
      color: "#fff",
    },
    onlineIndicator: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 16,
      gap: 6,
    },
    onlineDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    onlineText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.text,
    },
    messageList: {
      flex: 1,
      paddingHorizontal: 16,
    },
    messageListContent: {
      paddingTop: 16,
    },
    loaderContainer: {
      paddingVertical: 16,
      alignItems: "center",
    },
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
    inputContainer: {
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 10,
      marginBottom: 8,
    },
    textInput: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 24,
      paddingHorizontal: 18,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.text,
      maxHeight: 100,
      borderWidth: 1,
      borderColor: colors.border + "20",
    },
    sendButton: {
      width: 44,
      height: 44,
      borderStyle: "dashed",
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
    },
  });
