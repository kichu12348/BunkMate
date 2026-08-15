import { TransitionOrigin } from "../types";

/**
 * Calculates the Euclidean distance from the origin coordinate to the furthest corner of the viewport.
 * This guarantees the expanding circle completely covers the screen.
 */
export const calculateMaxRadius = (
  origin: TransitionOrigin,
  width: number,
  height: number
): number => {
  const maxDeltaX = Math.max(origin.x, width - origin.x);
  const maxDeltaY = Math.max(origin.y, height - origin.y);
  return Math.hypot(maxDeltaX, maxDeltaY) + 15;
};

/**
 * Resolves a valid origin point. If no origin is provided, defaults to the viewport center.
 */
export const resolveOrigin = (
  origin?: TransitionOrigin | null,
  width: number = 0,
  height: number = 0
): TransitionOrigin => {
  if (origin && typeof origin.x === "number" && typeof origin.y === "number") {
    return origin;
  }
  return {
    x: width / 2,
    y: height / 2,
  };
};
