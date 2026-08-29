import React, { Suspense, ComponentType } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useTheme } from "../hooks/useTheme";

export const DefaultScreenFallback: React.FC = () => {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.fallbackContainer, { backgroundColor: colors.background }]}
    >
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
};

const styles = StyleSheet.create({
  fallbackContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

/**
 * Creates a lazily loaded screen component wrapped in React.lazy and Suspense
 * with a theme-aware fallback loader.
 *
 * @param importFn Dynamic import returning module, e.g. () => import("../screens/Settings")
 * @param exportName Name of the exported component, e.g. "SettingsScreen" or "default" (defaults to "default")
 * @param Fallback Optional custom Fallback component
 */
export function lazyScreen<P extends object = any>(
  importFn: () => Promise<any>,
  exportName: string = "default",
  Fallback: ComponentType = DefaultScreenFallback,
): React.FC<P> {
  const LazyComponent = React.lazy(async () => {
    const module = await importFn();
    const Component =
      exportName === "default"
        ? module.default || module
        : module[exportName] || module.default || module;
    return { default: Component };
  });

  return function LazyScreenWrapper(props: P) {
    return (
      <Suspense fallback={<Fallback />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}
