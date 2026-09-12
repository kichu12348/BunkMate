import React from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { useTheme } from "../../../hooks/useTheme";
import { SkeletonShimmerProvider } from "../../../components/Skeletons/SkeletonBase";
import { GifSkeletonGridProps } from "../types";

export const GifSkeletonGrid: React.FC<GifSkeletonGridProps> = ({
  count = 12,
  numColumns = 3,
  itemHeight = 120,
  borderRadius = 12,
  style,
}) => {
  const { colors } = useTheme();
  const dummyData = Array.from({ length: count }, (_, i) => `skeleton-${i}`);

  return (
    <SkeletonShimmerProvider style={styles.shimmerContainer}>
      <FlatList
        data={dummyData}
        keyExtractor={(item) => item}
        numColumns={numColumns}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
        contentContainerStyle={[styles.listContainer, style]}
        renderItem={() => (
          <View
            style={[
              styles.skeletonCard,
              {
                height: itemHeight,
                borderRadius,
                backgroundColor: colors.surface,
                borderColor: colors.border + "30",
              },
            ]}
          >
            <View
              style={[
                styles.innerPlaceholder,
                {
                  borderRadius: borderRadius - 4,
                  backgroundColor: colors.border + "20",
                },
              ]}
            />
          </View>
        )}
      />
    </SkeletonShimmerProvider>
  );
};

const styles = StyleSheet.create({
  shimmerContainer: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  skeletonCard: {
    flex: 1,
    margin: 4,
    borderWidth: 1,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    padding: 8,
  },
  innerPlaceholder: {
    width: "100%",
    height: "100%",
  },
});

export default GifSkeletonGrid;
