import React, { useState, useEffect, useRef } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  withTiming,
  Easing,
  useSharedValue,
  runOnJS,
  LinearTransition,
} from "react-native-reanimated";
import { useTheme } from "../../../hooks/useTheme";
import { getGifs, getGifsByQuery } from "../../../api/chat";
import { GifData } from "../../../types/api";
import Text from "../../../components/UI/Text";
import { GifPickerModalProps } from "../types";
import { GifSkeletonGrid } from "./GifSkeletonGrid";
import { GifGridItem } from "./GifGridItem";

export const GifPickerModal: React.FC<GifPickerModalProps> = ({
  visible,
  onClose,
  onSelect,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [gifs, setGifs] = useState<GifData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

  // Debounced search query handler
  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setGifs(currGifsRef.current);
      setLoading(false);
      return;
    }

    setLoading(true);
    const handler = setTimeout(() => {
      getGifsByQuery(searchQuery.trim())
        .then((data) => {
          setGifs(data || []);
        })
        .catch((e) => {
          console.error("Error fetching gifs:", e);
        })
        .finally(() => {
          setLoading(false);
        });
    }, 400);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Initial load on modal display
  useEffect(() => {
    if (!visible) return;
    let isMounted = true;
    translateY.value = 0;

    const loadInitialGifs = async () => {
      setLoading(true);
      try {
        if (currGifsRef.current.length > 0) {
          setGifs(currGifsRef.current);
          setLoading(false);
          return;
        }
        const data = await getGifs();
        if (isMounted) {
          setGifs(data || []);
          currGifsRef.current = data || [];
        }
      } catch (e) {
        console.error("Error fetching initial gifs:", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadInitialGifs();
    return () => {
      isMounted = false;
    };
  }, [visible]);

  const handleSelectGif = (url: string) => {
    onSelect(url);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <GestureDetector gesture={pan}>
        <KeyboardAvoidingView
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Animated.View
            style={[
              styles.sheetContent,
              {
                backgroundColor: colors.background,
                paddingBottom: insets.bottom,
              },
              animStyle,
            ]}
          >
            {/* Header with Search Input & Close Button */}
            <View style={styles.header}>
              <View
                style={[
                  styles.searchContainer,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border + "30",
                  },
                ]}
              >
                <Ionicons
                  name="search"
                  size={20}
                  color={colors.textSecondary}
                />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Search Klipy GIFs..."
                  placeholderTextColor={colors.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCorrect={false}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSearchQuery("")}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name="close-circle"
                      size={18}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                onPress={onClose}
                style={[
                  styles.closeButton,
                  { backgroundColor: colors.surface },
                ]}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Content Area: Skeleton Loading Grid or GIF FlatList */}
            {loading ? (
              <GifSkeletonGrid count={12} numColumns={3} />
            ) : gifs.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="images-outline"
                  size={48}
                  color={colors.textSecondary}
                  style={styles.emptyIcon}
                />
                <Text
                  style={[styles.emptyText, { color: colors.textSecondary }]}
                >
                  {searchQuery.trim().length > 0
                    ? `No GIFs found for "${searchQuery.trim()}"`
                    : "No GIFs available"}
                </Text>
              </View>
            ) : (
              <Animated.FlatList
                data={gifs}
                keyExtractor={(item) => String(item.id)}
                numColumns={3}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                itemLayoutAnimation={LinearTransition}
                renderItem={({ item }) => (
                  <GifGridItem item={item} onSelect={handleSelectGif} />
                )}
              />
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </GestureDetector>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheetContent: {
    height: "80%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchContainer: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    padding: 0,
  },
  closeButton: {
    marginLeft: 16,
    padding: 4,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingBottom: 80,
  },
  emptyIcon: {
    marginBottom: 12,
    opacity: 0.7,
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
  },
});

export default GifPickerModal;
