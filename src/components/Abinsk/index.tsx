import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  Dimensions,
  Image,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
  FadeInDown,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { runOnJS } from "react-native-worklets";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import SendraImg from "./sendra.webp";
import Modal from "./CustomModal";

const { width, height } = Dimensions.get("window");

// --- Constants ---
const ORB_COLORS = ["#FF0080", "#7928CA", "#FF4D4D", "#4158D0", "#FFCC70"];
const PARTICLE_COLORS = ["#FFD700", "#FFF", "#FF69B4", "#00FFFF"];

// --- Types ---
type Orb = {
  id: number;
  size: number;
  color: string;
  x: number;
  y: number;
  duration: number;
};

// --- Components ---

// 1. Kinetic Background Orb
const MovingOrb = React.memo(
  ({ orb, isAntiGravity }: { orb: Orb; isAntiGravity: boolean }) => {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);

    useEffect(() => {
      const duration = isAntiGravity ? orb.duration * 0.2 : orb.duration;
      const range = isAntiGravity ? 200 : 50;

      // Random continuous movement
      translateX.value = withRepeat(
        withSequence(
          withTiming(Math.random() * range * 2 - range, {
            duration: duration,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(Math.random() * range * 2 - range, {
            duration: duration,
            easing: Easing.inOut(Easing.sin),
          })
        ),
        -1,
        true
      );

      translateY.value = withRepeat(
        withSequence(
          withTiming(Math.random() * range * 2 - range, {
            duration: duration * 1.2,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(Math.random() * range * 2 - range, {
            duration: duration * 1.2,
            easing: Easing.inOut(Easing.sin),
          })
        ),
        -1,
        true
      );
    }, [isAntiGravity]);

    const style = useAnimatedStyle(() => ({
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: withSpring(isAntiGravity ? 1.5 : 1) },
      ] as any,
    }));

    return (
      <Animated.View
        style={[
          {
            position: "absolute",
            left: orb.x,
            top: orb.y,
            width: orb.size,
            height: orb.size,
            borderRadius: orb.size / 2,
            backgroundColor: orb.color,
            opacity: 0.6,
          },
          style,
        ]}
      />
    );
  }
);

// 2. Floating Letter
const FloatingLetter = ({
  char,
  index,
  show,
  isAntiGravity,
}: {
  char: string;
  index: number;
  show: boolean;
  isAntiGravity: boolean;
}) => {
  const offset = useSharedValue(100);
  const opacity = useSharedValue(0);
  const floatY = useSharedValue(0);
  const floatX = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    if (show) {
      if (isAntiGravity) {
        // Chaos Mode
        floatX.value = withRepeat(
          withSequence(
            withTiming(Math.random() * 200 - 100, {
              duration: 2000 + Math.random() * 1000,
            }),
            withTiming(Math.random() * 200 - 100, {
              duration: 2000 + Math.random() * 1000,
            })
          ),
          -1,
          true
        );
        floatY.value = withRepeat(
          withSequence(
            withTiming(Math.random() * 200 - 100, {
              duration: 2000 + Math.random() * 1000,
            }),
            withTiming(Math.random() * 200 - 100, {
              duration: 2000 + Math.random() * 1000,
            })
          ),
          -1,
          true
        );
        rotate.value = withRepeat(
          withTiming(Math.random() * 360, { duration: 4000 }),
          -1,
          true
        );
      } else {
        // Normal Mode
        floatX.value = withSpring(0);
        rotate.value = withSpring(0);

        // Entrance
        offset.value = withDelay(
          index * 50,
          withSpring(0, { damping: 12, stiffness: 100 })
        );
        opacity.value = withDelay(index * 50, withTiming(1, { duration: 400 }));

        // Continuous Float
        floatY.value = withDelay(
          1000 + index * 100,
          withRepeat(
            withSequence(
              withTiming(-8, {
                duration: 2000 + index * 200,
                easing: Easing.inOut(Easing.sin),
              }),
              withTiming(0, {
                duration: 2000 + index * 200,
                easing: Easing.inOut(Easing.sin),
              })
            ),
            -1,
            true
          )
        );
      }
    } else {
      offset.value = 100;
      opacity.value = 0;
    }
  }, [show, isAntiGravity]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: offset.value + floatY.value },
      { translateX: floatX.value },
      { rotate: `${rotate.value}deg` },
    ] as any[],
    opacity: opacity.value,
    color: isAntiGravity ? withTiming("#FFD700") : withTiming("#FFF"),
  }));

  return (
    <Animated.Text
      style={[
        {
          fontSize: width * 0.085,
          fontWeight: "900",
          color: "#FFF",
          textShadowColor: "rgba(0,0,0,0.3)",
          textShadowOffset: { width: 0, height: 4 },
          textShadowRadius: 10,
          marginHorizontal: 1,
        },
        style,
      ]}
    >
      {char}
    </Animated.Text>
  );
};

// 3. Explosion Particle
const ExplosionParticle = ({
  trigger,
  index,
}: {
  trigger: boolean;
  index: number;
}) => {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (trigger) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = 100 + Math.random() * 150;

      scale.value = withSpring(1);
      x.value = withTiming(Math.cos(angle) * velocity * 2, { duration: 800 });
      y.value = withTiming(Math.sin(angle) * velocity * 2, { duration: 800 });
      opacity.value = withDelay(400, withTiming(0, { duration: 400 }));
    }
  }, [trigger]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { scale: scale.value },
    ] as any,
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: 8 + Math.random() * 6,
          height: 8 + Math.random() * 6,
          borderRadius: 10,
          backgroundColor: PARTICLE_COLORS[index % PARTICLE_COLORS.length],
        },
        style,
      ]}
    />
  );
};

interface AbinskProps {
  isVisible: boolean;
}

const Abinsk: React.FC<AbinskProps> = ({ isVisible }) => {
  const insets = useSafeAreaInsets();
  const [stage, setStage] = useState<"hidden" | "gift" | "revealed">("hidden");
  const [orbs, setOrbs] = useState<Orb[]>([]);
  const [isAntiGravity, setIsAntiGravity] = useState(false);
  const [tapCount, setTapCount] = useState(0);

  const [visible, setVisible] = useState(isVisible);

  // Animation Values
  const containerOpacity = useSharedValue(0);
  const giftScale = useSharedValue(0);
  const giftRotate = useSharedValue(0);
  const imageScale = useSharedValue(0);
  const imageRotate = useSharedValue(0);

  // Initialize Orbs
  useEffect(() => {
    setOrbs(
      Array.from({ length: 5 }).map((_, i) => ({
        id: i,
        size: width * 0.8 + Math.random() * 100,
        color: ORB_COLORS[i % ORB_COLORS.length],
        x: Math.random() * width - width * 0.4,
        y: Math.random() * height - height * 0.2,
        duration: 4000 + Math.random() * 3000,
      }))
    );
  }, []);

  useEffect(() => {
    if (isVisible) {
      setStage("gift");
      containerOpacity.value = withTiming(1, { duration: 600 });
      giftScale.value = withSpring(1, { damping: 12 });
      giftRotate.value = withRepeat(
        withSequence(
          withTiming(-5, { duration: 1500 }),
          withTiming(5, { duration: 1500 })
        ),
        -1, // Infinite loop
        true
      );
    } else {
      containerOpacity.value = withTiming(0, { duration: 400 }, () => {
        runOnJS(setStage)("hidden");
        runOnJS(setIsAntiGravity)(false);
        runOnJS(setTapCount)(0);
      });
    }
  }, [isVisible]);

  const handleOpen = useCallback(() => {
    // 1. Gift Explodes
    giftScale.value = withSpring(0, { damping: 12 });

    // 2. Switch Stage
    setStage("revealed");

    // 3. Image Enters with "Heavy" Physics
    imageScale.value = withDelay(
      200,
      withSpring(1, {
        damping: 10,
        stiffness: 80,
        mass: 1.2,
      })
    );

    // 4. Continuous Image Float
    imageRotate.value = withDelay(
      1000,
      withRepeat(
        withSequence(
          withTiming(-3, { duration: 2500, easing: Easing.inOut(Easing.sin) }),
          withTiming(3, { duration: 2500, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );
  }, []);

  const handleClose = () => {
    containerOpacity.value = withTiming(0, { duration: 300 }, () => {
      runOnJS(setVisible)(false);
    });
  };

  const handleSecretTap = () => {
    setTapCount((prev) => {
      const newCount = prev + 1;
      if (newCount === 3) {
        setIsAntiGravity((prevMode) => !prevMode);
        return 0;
      }
      return newCount;
    });
  };

  // Styles
  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const giftStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: giftScale.value },
      { rotate: `${giftRotate.value}deg` },
    ] as any,
  }));

  const imageStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: imageScale.value },
      { rotate: `${imageRotate.value}deg` },
    ] as any,
  }));

  if (!isVisible) return null;

  return (
    <Modal visible={visible}>
      <Animated.View style={[styles.container, containerStyle]}>
        {/* --- Kinetic Mesh Background --- */}
        <View style={StyleSheet.absoluteFill}>
          <View style={{ backgroundColor: "#0F0F1E", flex: 1 }} />
          {orbs.map((orb) => (
            <MovingOrb key={orb.id} orb={orb} isAntiGravity={isAntiGravity} />
          ))}
          <BlurView
            intensity={90}
            tint="dark"
            style={StyleSheet.absoluteFill}
            experimentalBlurMethod="dimezisBlurView"
            blurReductionFactor={12}
          />
        </View>

        {/* --- Content Layer --- */}
        <View style={[styles.content, { paddingTop: insets.top }]}>
          {/* GIFT STAGE */}
          {stage === "gift" && (
            <Pressable onPress={handleOpen} style={styles.center}>
              <Animated.View style={[styles.giftBox, giftStyle]}>
                <MaterialCommunityIcons
                  name="gift"
                  size={140}
                  color="#FFD700"
                />
                <Text style={styles.tapText}>TAP TO OPEN</Text>
              </Animated.View>
            </Pressable>
          )}

          {/* REVEALED STAGE */}
          {stage === "revealed" && (
            <View style={styles.fullScreen}>
              {/* Explosion Particles (Center) */}
              <View
                style={[
                  StyleSheet.absoluteFill,
                  { justifyContent: "center", alignItems: "center", zIndex: 0 },
                ]}
                pointerEvents="none"
              >
                {Array.from({ length: 20 }).map((_, i) => (
                  <ExplosionParticle key={i} trigger={true} index={i} />
                ))}
              </View>

              {/* Top Section */}
              <View style={styles.topSection}>
                <View style={styles.textRow}>
                  {"HAPPY".split("").map((char, i) => (
                    <FloatingLetter
                      key={`h-${i}`}
                      char={char}
                      index={i}
                      show={true}
                      isAntiGravity={isAntiGravity}
                    />
                  ))}
                </View>
                {/*<View style={[styles.textRow, { marginTop: 4 }]}>
                  {"BELATED".split("").map((char, i) => (
                    <FloatingLetter
                      key={`b-${i}`}
                      char={char}
                      index={i + 5}
                      show={true}
                      isAntiGravity={isAntiGravity}
                    />
                  ))}
                </View>*/}
                <View style={styles.textRow}>
                  {"BIRTHDAY".split("").map((char, i) => (
                    <FloatingLetter
                      key={`b-${i}`}
                      char={char}
                      index={i + 12}
                      show={true}
                      isAntiGravity={isAntiGravity}
                    />
                  ))}
                </View>
              </View>

              {/* Main Image Section */}
              <View style={styles.imageContainer}>
                <Animated.View style={[styles.imageWrapper, imageStyle]}>
                  <Image
                    source={SendraImg}
                    style={styles.image}
                    resizeMode="cover"
                  />
                  {/* Glossy Overlay */}
                  <View style={styles.gloss} />
                </Animated.View>
              </View>

              {/* Bottom Section */}
              <View style={styles.bottomSection}>
                {/* <View style={styles.textRow}>
                  {"BIRTHDAY".split("").map((char, i) => (
                    <FloatingLetter
                      key={`bd-${i}`}
                      char={char}
                      index={i + 12}
                      show={true}
                      isAntiGravity={isAntiGravity}
                    />
                  ))}
                </View> */}
                <Pressable
                  onPress={handleSecretTap}
                  style={[styles.textRow, { marginTop: 4 }]}
                >
                  {"SANDRAA".split("").map((char, i) => (
                    <FloatingLetter
                      key={`a-${i}`}
                      char={char}
                      index={i + 20}
                      show={true}
                      isAntiGravity={isAntiGravity}
                    />
                  ))}
                </Pressable>

                {/* Message Bubble */}
                <Animated.View
                  entering={FadeInDown.delay(1000).springify()}
                  style={styles.messageBubble}
                >
                  <Text style={styles.messageText}>
                    Wishing you a day as amazing as you are!
                  </Text>
                </Animated.View>

                {/* Close Button */}
                <Pressable onPress={handleClose} style={styles.closeBtn}>
                  <MaterialCommunityIcons name="close" size={24} color="#FFF" />
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 20,
  },
  giftBox: {
    alignItems: "center",
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
  },
  tapText: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "800",
    marginTop: 20,
    letterSpacing: 4,
  },
  topSection: {
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
  bottomSection: {
    alignItems: "center",
    zIndex: 20,
    marginBottom: 20,
  },
  textRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  imageContainer: {
    flex: 1, // Take up remaining space
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    width: "100%",
    paddingHorizontal: 20,
  },
  imageWrapper: {
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    // Ensure image doesn't overflow container
    maxWidth: "100%",
    maxHeight: "100%",
  },
  image: {
    width: Math.min(width * 0.8, 300), // Limit max width
    height: Math.min(width * 1.0, 380), // Limit max height
    borderRadius: 24,
  },
  gloss: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "40%",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  messageBubble: {
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginTop: 20,
    marginBottom: 20,
  },
  messageText: {
    color: "#EEE",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
  closeBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
});

export default Abinsk;
