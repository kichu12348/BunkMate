import React, { useState } from "react";
import { TouchableOpacity, Image, StyleSheet, View } from "react-native";
import { useTheme } from "../../../hooks/useTheme";
import { GifGridItemProps } from "../types";

export const GifGridItem: React.FC<GifGridItemProps> = ({
  item,
  onSelect,
  height = 120,
  borderRadius = 12,
}) => {
  const { colors } = useTheme();
  const [isLoaded, setIsLoaded] = useState(false);

  const gifUrl =
    item.file?.hd?.gif?.url ??
    item.file?.md?.gif?.url ??
    item.file?.sm?.gif?.url;

  const previewUrl = item.file?.sm?.gif?.url ?? item.file?.md?.gif?.url;

  const handlePress = () => {
    if (gifUrl) {
      onSelect(gifUrl);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          height,
          borderRadius,
          backgroundColor: colors.surface,
          borderColor: colors.border + "20",
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {!isLoaded && (
        <View
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.surface }]}
        />
      )}
      {previewUrl && (
        <Image
          source={{
            uri: previewUrl,
            cache: "force-cache",
          }}
          style={styles.image}
          resizeMode="cover"
          onLoadEnd={() => setIsLoaded(true)}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 4,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});

export default GifGridItem;
