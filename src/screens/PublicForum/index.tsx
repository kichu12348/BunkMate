import React, { useState, useEffect, useRef } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
  RefreshControl,
  KeyboardAvoidingView,
  Image,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemedStyles } from "../../hooks/useTheme";
import { ThemeColors } from "../../types/theme";
import { useThemeStore } from "../../state/themeStore";
import { useChatStore } from "../../state/chat";
import { useWebSocket } from "../../utils/websocket";
import { GifData, Message } from "../../types/api";
import Animated, {
  useAnimatedStyle,
  withTiming,
  Easing,
  useSharedValue,
  interpolateColor,
  useAnimatedProps,
  runOnJS,
  LinearTransition,
} from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/RootNavigator";
import loadingError from "../../assets/loading_error_gif.gif";
import Text from "../../components/UI/Text";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

type PublicForumNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "PublicForum"
>;
import AnimatedIconBackground from "../../components/UI/ChatBackground";
import { getGifs, getGifsByQuery } from "../../api/chat";

const AnimatedIcon = Animated.createAnimatedComponent(Ionicons);

const MessageItem = ({
  item,
  styles,
  userId,
}: {
  item: Message;
  styles: ReturnType<typeof createStyles>;
  userId: string;
}) => {
  const isMyMessage = item.sender_id === userId;
  const [imageLoadingError, setImageLoadingError] = useState(false);

  // Check if message has image_url property
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

const GifPickerModal = ({
  visible,
  onClose,
  onSelect,
  colors,
  styles,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  colors: ThemeColors;
  styles: ReturnType<typeof createStyles>;
}) => {
  const [gifs, setGifs] = useState<GifData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const insets = useSafeAreaInsets();

  const currGifsRef = useRef<GifData[]>([]);
  const translateY = useSharedValue(0);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      if (e.translationY > 300) {
        runOnJS(onClose)();
      } else {
        translateY.value = withTiming(0, {
          duration: 300,
          easing: Easing.out(Easing.ease),
        });
      }
    });

  const animStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  useEffect(() => {
    return () => {
      setGifs([]);
      setSearchQuery("");
      currGifsRef.current = [];
    };
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        getGifsByQuery(searchQuery)
          .then((data) => {
            setGifs(data.results || []);
          })
          .catch((e) => {
            console.error("Error fetching gifs:", e);
          });
      } else {
        setGifs(currGifsRef.current);
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    if (!visible) return;
    let isMounted = true;
    translateY.value = 0;
    const loadGifs = async () => {
      setLoading(true);
      try {
        if (currGifsRef.current.length > 0) {
          setGifs(currGifsRef.current);
          setLoading(false);
          return;
        }
        const data = await getGifs();
        if (isMounted) {
          setGifs(data.results || []);
          currGifsRef.current = data.results || [];
        }
      } catch (e) {
        console.error("Error fetching gifs:", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadGifs();
    return () => {
      isMounted = false;
    };
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <GestureDetector gesture={pan}>
        <KeyboardAvoidingView
          style={styles.gifContainer}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Animated.View
            style={[
              styles.gifView,
              {
                paddingBottom: insets.bottom,
              },
              animStyle,
            ]}
          >
            {/* Header */}
            <View style={styles.gifHeader}>
              <View
                style={{
                  flex: 1,
                  backgroundColor: colors.surface,
                  borderRadius: 20,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  flexDirection: "row",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.border + "30",
                }}
              >
                <Ionicons
                  name="search"
                  size={20}
                  color={colors.textSecondary}
                />
                <TextInput
                  style={{
                    flex: 1,
                    marginLeft: 10,
                    color: colors.text,
                    fontSize: 16,
                    padding: 0,
                  }}
                  placeholder="Search Tenor GIFs..."
                  placeholderTextColor={colors.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={{
                  marginLeft: 16,
                  padding: 4,
                  width: 36,
                  height: 36,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: colors.surface,
                  borderRadius: 18,
                }}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            {loading ? (
              <ActivityIndicator
                style={{ marginTop: 40 }}
                color={colors.primary}
                size="large"
              />
            ) : (
              <Animated.FlatList
                data={gifs}
                keyExtractor={(item) => item.id}
                numColumns={3}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: 16,
                  paddingBottom: 20,
                }}
                itemLayoutAnimation={LinearTransition}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      margin: 4,
                      height: 120,
                      backgroundColor: colors.surface,
                      borderRadius: 12,
                      overflow: "hidden",
                    }}
                    onPress={() => {
                      const gifUrl =
                        item.media_formats?.gif?.url ??
                        item.media?.[0]?.gif?.url;

                      if (gifUrl) {
                        onSelect(gifUrl);
                        onClose();
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Image
                      source={{
                        uri:
                          item.media_formats?.tinygif?.url ??
                          item.media?.[0]?.tinygif?.url,
                        cache: "force-cache",
                      }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                )}
              />
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </GestureDetector>
    </Modal>
  );
};

export const PublicForum: React.FC = () => {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeStore((s) => s.colors);
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const [newMessage, setNewMessage] = useState("");
  const [previewImageUrl, setPreviewImageUrl] = useState<string | undefined>();
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [imageLoadingError, setImageLoadingError] = useState(false);
  const [gifModalVisible, setGifModalVisible] = useState(false);
  const isButtonActive = useRef(false);
  const isAnimating = useRef(false);

  const navigation = useNavigation<PublicForumNavigationProp>();

  const progress = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(
        progress.value,
        [0, 1],
        [colors.surface, colors.background],
      ),
      borderColor: interpolateColor(
        progress.value,
        [0, 1],
        [colors.border + "20", colors.primary],
      ),
      borderWidth: progress.value * 1.5,
    };
  });

  const animatedIconProps = useAnimatedProps(() => {
    return {
      color: interpolateColor(
        progress.value,
        [0, 1],
        [colors.textSecondary, colors.text],
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
    if (!isConnected) return;
    const trimmedMessage = newMessage.trim();
    if (trimmedMessage.length === 0 || !userId || !userName) {
      return;
    }

    // Extract first image URL if present
    const imageMatches = trimmedMessage.match(/\*img:(.+?)\*/g);
    let imageUrl: string | undefined;
    let cleanedContent = trimmedMessage;

    if (imageMatches && imageMatches.length > 0) {
      // Get first image match and extract URL
      const firstImageMatch = imageMatches[0].match(/\*img:(.+)\*$/);
      if (firstImageMatch) {
        imageUrl = firstImageMatch[1].trim();
      }
      // Remove all *img:url* patterns from content
      cleanedContent = trimmedMessage.replace(/\*img:.+?\*/g, "").trim();
    }

    const message: Message = {
      id: Date.now().toString(),
      sender_id: userId,
      sender_name: userName,
      content: cleanedContent,
      timestamp: new Date().toISOString(),
      ...(imageUrl && { image_url: imageUrl }),
    };

    sendMessage(message);
    addMessage(message);
    setNewMessage("");
    setPreviewImageUrl(undefined);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
      deactiveButton();
    }, 100);
  };

  const handleSendGif = (gifUrl: string) => {
    if (!isConnected || !userId || !userName) return;

    const message: Message = {
      id: Date.now().toString(),
      sender_id: userId,
      sender_name: userName,
      content: "",
      timestamp: new Date().toISOString(),
      image_url: gifUrl,
    };

    sendMessage(message);
    addMessage(message);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // Handler for loading more messages
  const handleLoadMore = async () => {
    if (isLoadingHistory) return;
    setIsLoadingHistory(true);
    await onScrollToTop();
    setIsLoadingHistory(false);
  };

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

  // Check for image pattern whenever message changes
  useEffect(() => {
    const imageMatches = newMessage.match(/\*img:(.+?)\*/g);
    if (imageMatches && imageMatches.length > 0) {
      const firstImageMatch = imageMatches[0].match(/\*img:(.+)\*$/);
      if (firstImageMatch) {
        setPreviewImageUrl(firstImageMatch[1].trim());
        setImageLoadingError(false);
      } else {
        setPreviewImageUrl(undefined);
      }
    } else {
      setPreviewImageUrl(undefined);
    }
  }, [newMessage]);

  return (
    <AnimatedIconBackground>
      <View
        style={{
          paddingBottom: insets.bottom,
          flex: 1,
        }}
      >
        <GifPickerModal
          visible={gifModalVisible}
          onClose={() => setGifModalVisible(false)}
          onSelect={handleSendGif}
          colors={colors}
          styles={styles}
        />
        {renderHeader()}
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={({ item }) => (
              <MessageItem item={item} styles={styles} userId={userId} />
            )}
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
              {previewImageUrl &&
                (!imageLoadingError ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image
                      source={{ uri: previewImageUrl, cache: "force-cache" }}
                      style={styles.previewImage}
                      resizeMode="cover"
                      onError={() => setImageLoadingError(true)}
                    />
                  </View>
                ) : (
                  <View
                    style={[
                      styles.imagePreviewContainer,
                      {
                        borderColor: colors.error,
                        borderWidth: 1.5,
                        borderStyle: "dashed",
                        backgroundColor: colors.surface,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.previewImage,
                        { justifyContent: "center", alignItems: "center" },
                      ]}
                    >
                      <Text style={styles.imagePreviewText}>
                        Image failed to load
                      </Text>
                    </View>
                  </View>
                ))}
              <View style={styles.inputWrapperRow}>
                <TouchableOpacity
                  onPress={() => setGifModalVisible(true)}
                  style={styles.gifButton}
                  activeOpacity={0.7}
                  disabled={!isConnected}
                >
                  <Ionicons
                    name="happy-outline"
                    size={26}
                    color={
                      isConnected
                        ? colors.textSecondary
                        : colors.textSecondary + "80"
                    }
                  />
                </TouchableOpacity>
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
                  editable={isConnected}
                  multiline
                  maxLength={500}
                />
              </View>
              <TouchableOpacity
                onPress={handleSendMessage}
                activeOpacity={0.7}
                disabled={newMessage.trim().length === 0 || !isConnected}
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
    inputContainer: {
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    imagePreviewContainer: {
      alignItems: "flex-start",
      justifyContent: "center",
      maxWidth: 150,
      position: "absolute",
      top: -160,
      left: 0,
      borderRadius: 12,
    },
    previewImage: {
      width: 150,
      height: 150,
      borderRadius: 12,
    },
    imagePreviewText: {
      fontSize: 12,
      color: colors.error,
      fontWeight: "bold",
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 10,
      marginBottom: 8,
      position: "relative",
    },
    textInput: {
      fontSize: 16,
      color: colors.text,
      maxHeight: 100,
      marginBottom: 5,
      flex: 1,
    },
    inputWrapperRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 14,
      backgroundColor: colors.surface,
      borderRadius: 24,
      maxHeight: 100,
      paddingHorizontal: 14,
      paddingVertical: 8,
      flex: 1,
    },
    sendButton: {
      width: 44,
      height: 44,
      borderStyle: "dashed",
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
    },
    messageImage: {
      width: 200,
      height: 200,
      borderRadius: 16,
    },
    gifButton: {
      justifyContent: "flex-end",
      alignItems: "center",
    },
    gifContainer: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: "flex-end",
    },
    gifView: {
      height: "80%",
      backgroundColor: colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 20,
    },
    gifHeader: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      marginBottom: 16,
    },
  });
