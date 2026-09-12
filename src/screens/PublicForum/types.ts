import { StyleProp, ViewStyle } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/RootNavigator";
import { GifData, Message } from "../../types/api";

export type PublicForumNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "PublicForum"
>;

export interface GifPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}

export interface GifSkeletonGridProps {
  count?: number;
  numColumns?: number;
  itemHeight?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export interface GifGridItemProps {
  item: GifData;
  onSelect: (url: string) => void;
  height?: number;
  borderRadius?: number;
}

export interface MessageItemProps {
  item: Message;
  userId: string;
}
