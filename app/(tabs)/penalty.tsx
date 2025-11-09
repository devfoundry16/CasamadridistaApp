import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Target, RotateCcw } from "lucide-react-native";
import * as Haptics from "expo-haptics";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const GOAL_WIDTH = SCREEN_WIDTH * 0.85;
const GOAL_HEIGHT = SCREEN_HEIGHT * 0.35;
const GOAL_TOP = SCREEN_HEIGHT * 0.15;
const GOAL_LEFT = (SCREEN_WIDTH - GOAL_WIDTH) / 2;

const BALL_SIZE = 40;
const KEEPER_WIDTH = 60;
const KEEPER_HEIGHT = 80;

type GameState = "aiming" | "shooting" | "result";

export default function PenaltyScreen() {
  const insets = useSafeAreaInsets();
  const [gameState, setGameState] = useState<GameState>("aiming");
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [lastResult, setLastResult] = useState<"goal" | "save" | null>(null);

  const ballPosition = useRef(
    new Animated.ValueXY({
      x: SCREEN_WIDTH / 2 - BALL_SIZE / 2,
      y: SCREEN_HEIGHT * 0.75,
    })
  ).current;
  const [aimPosition, setAimPosition] = useState({
    x: SCREEN_WIDTH / 2,
    y: GOAL_TOP + GOAL_HEIGHT / 2,
  });

  const keeperPosition = useRef(new Animated.Value(0.5)).current;
  const keeperOpacity = useRef(new Animated.Value(1)).current;
  const keeperScale = useRef(new Animated.Value(1)).current;

  const resetGame = useCallback(() => {
    setGameState("aiming");
    setLastResult(null);
    ballPosition.setValue({
      x: SCREEN_WIDTH / 2 - BALL_SIZE / 2,
      y: SCREEN_HEIGHT * 0.75,
    });
    keeperPosition.setValue(0.5);
    keeperOpacity.setValue(1);
    keeperScale.setValue(1);
    setAimPosition({ x: SCREEN_WIDTH / 2, y: GOAL_TOP + GOAL_HEIGHT / 2 });
  }, [ballPosition, keeperPosition, keeperOpacity, keeperScale]);

  const shootBall = useCallback(
    (targetX: number, targetY: number) => {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      setGameState("shooting");
      setAttempts((prev) => prev + 1);

      const normalizedTargetX = (targetX - GOAL_LEFT) / GOAL_WIDTH;
      const keeperDiveTarget =
        Math.random() > 0.3
          ? normalizedTargetX + (Math.random() - 0.5) * 0.3
          : Math.random();
      const clampedKeeperTarget = Math.max(
        0.1,
        Math.min(0.9, keeperDiveTarget)
      );

      Animated.parallel([
        Animated.timing(keeperPosition, {
          toValue: clampedKeeperTarget,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(keeperScale, {
            toValue: 1.2,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(keeperScale, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      Animated.timing(ballPosition, {
        toValue: { x: targetX - BALL_SIZE / 2, y: targetY - BALL_SIZE / 2 },
        duration: 600,
        useNativeDriver: false,
      }).start(() => {
        const ballX = targetX;
        const ballY = targetY;

        const isInGoal =
          ballX >= GOAL_LEFT &&
          ballX <= GOAL_LEFT + GOAL_WIDTH &&
          ballY >= GOAL_TOP &&
          ballY <= GOAL_TOP + GOAL_HEIGHT;

        if (isInGoal) {
          const keeperX = GOAL_LEFT + GOAL_WIDTH * clampedKeeperTarget;
          const distance = Math.abs(ballX - keeperX);
          const catchRadius = KEEPER_WIDTH * 1.5;

          if (distance < catchRadius && ballY > GOAL_TOP + GOAL_HEIGHT * 0.2) {
            setLastResult("save");
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Warning
              );
            }
          } else {
            setLastResult("goal");
            setScore((prev) => prev + 1);
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
            }

            Animated.timing(keeperOpacity, {
              toValue: 0.3,
              duration: 300,
              useNativeDriver: true,
            }).start();
          }
        } else {
          setLastResult("save");
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          }
        }

        setGameState("result");
      });
    },
    [ballPosition, keeperPosition, keeperOpacity, keeperScale]
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => gameState === "aiming",
      onMoveShouldSetPanResponder: () => gameState === "aiming",
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setAimPosition({ x: locationX, y: locationY });
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setAimPosition({ x: locationX, y: locationY });
      },
      onPanResponderRelease: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        shootBall(locationX, locationY);
      },
    })
  ).current;

  const keeperTranslateX = keeperPosition.interpolate({
    inputRange: [0, 1],
    outputRange: [GOAL_LEFT, GOAL_LEFT + GOAL_WIDTH - KEEPER_WIDTH],
  });

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Goals</Text>
          <Text style={styles.scoreValue}>{score}</Text>
        </View>
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Attempts</Text>
          <Text style={styles.scoreValue}>{attempts}</Text>
        </View>
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Success</Text>
          <Text style={styles.scoreValue}>
            {attempts > 0 ? Math.round((score / attempts) * 100) : 0}%
          </Text>
        </View>
      </View>

      <View style={styles.fieldContainer}>
        <View
          style={[
            styles.goalContainer,
            {
              top: GOAL_TOP,
              left: GOAL_LEFT,
              width: GOAL_WIDTH,
              height: GOAL_HEIGHT,
            },
          ]}
        >
          <View style={styles.goalBack} />
          <View style={styles.goalNet}>
            {Array.from({ length: 8 }).map((_, i) => (
              <View
                key={`v-${i}`}
                style={[styles.netLineVertical, { left: `${(i + 1) * 11}%` }]}
              />
            ))}
            {Array.from({ length: 5 }).map((_, i) => (
              <View
                key={`h-${i}`}
                style={[styles.netLineHorizontal, { top: `${(i + 1) * 16}%` }]}
              />
            ))}
          </View>
          <View style={styles.goalFrameTop} />
          <View style={styles.goalFrameLeft} />
          <View style={styles.goalFrameRight} />

          <Animated.View
            style={[
              styles.goalkeeper,
              {
                bottom: 10,
                transform: [
                  { translateX: keeperTranslateX },
                  { scale: keeperScale },
                ],
                opacity: keeperOpacity,
              },
            ]}
          >
            <View style={styles.keeperBody}>
              <View style={styles.keeperHead} />
              <View style={styles.keeperTorso} />
              <View style={styles.keeperArms}>
                <View style={styles.keeperArm} />
                <View style={styles.keeperArm} />
              </View>
              <View style={styles.keeperLegs}>
                <View style={styles.keeperLeg} />
                <View style={styles.keeperLeg} />
              </View>
            </View>
          </Animated.View>
        </View>

        <View style={styles.aimingArea} {...panResponder.panHandlers}>
          {gameState === "aiming" && (
            <>
              <View style={styles.aimInstructions}>
                <Target size={24} color="#fff" />
                <Text style={styles.instructionText}>
                  Tap to aim, release to shoot!
                </Text>
              </View>
              <View
                style={[
                  styles.aimTarget,
                  {
                    left: aimPosition.x - 20,
                    top: aimPosition.y - 20,
                  },
                ]}
              >
                <View style={styles.targetOuter} />
                <View style={styles.targetInner} />
              </View>
            </>
          )}
        </View>

        <Animated.View
          style={[
            styles.ball,
            {
              left: ballPosition.x,
              top: ballPosition.y,
            },
          ]}
        >
          <View style={styles.ballGradient}>
            <View style={styles.ballPattern}>
              <View style={styles.ballPentagon1} />
              <View style={styles.ballPentagon2} />
              <View style={styles.ballPentagon3} />
            </View>
          </View>
        </Animated.View>

        {gameState === "result" && (
          <View style={styles.resultOverlay}>
            <View
              style={[
                styles.resultCard,
                lastResult === "goal"
                  ? styles.resultCardGoal
                  : styles.resultCardSave,
              ]}
            >
              <Text style={styles.resultEmoji}>
                {lastResult === "goal" ? "⚽🎉" : "🧤💪"}
              </Text>
              <Text style={styles.resultText}>
                {lastResult === "goal" ? "GOAL!" : "SAVED!"}
              </Text>
              <Text style={styles.resultSubtext}>
                {lastResult === "goal" ? "Amazing shot!" : "The keeper got it!"}
              </Text>
              <TouchableOpacity
                style={styles.nextButton}
                onPress={resetGame}
                activeOpacity={0.8}
              >
                <RotateCcw size={20} color="#fff" />
                <Text style={styles.nextButtonText}>Next Penalty</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#145a32",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    paddingBottom: 12,
    zIndex: 10,
  },
  scoreCard: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    minWidth: 90,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: "rgba(255, 255, 255, 0.8)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#fff",
    marginTop: 2,
  },
  fieldContainer: {
    flex: 1,
    position: "relative",
  },
  goalContainer: {
    position: "absolute",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderRadius: 8,
    overflow: "hidden",
  },
  goalBack: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0a3d1f",
  },
  goalNet: {
    ...StyleSheet.absoluteFillObject,
  },
  netLineVertical: {
    position: "absolute",
    width: 1,
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  netLineHorizontal: {
    position: "absolute",
    height: 1,
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  goalFrameTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: "#fff",
  },
  goalFrameLeft: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: 4,
    backgroundColor: "#fff",
  },
  goalFrameRight: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: 4,
    backgroundColor: "#fff",
  },
  goalkeeper: {
    position: "absolute",
    width: KEEPER_WIDTH,
    height: KEEPER_HEIGHT,
  },
  keeperBody: {
    flex: 1,
    alignItems: "center",
  },
  keeperHead: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#ffdbac",
    borderWidth: 2,
    borderColor: "#333",
  },
  keeperTorso: {
    width: 30,
    height: 28,
    backgroundColor: "#ff6b35",
    borderRadius: 6,
    marginTop: 2,
    borderWidth: 2,
    borderColor: "#333",
  },
  keeperArms: {
    position: "absolute",
    top: 22,
    flexDirection: "row",
    width: 56,
    justifyContent: "space-between",
  },
  keeperArm: {
    width: 12,
    height: 22,
    backgroundColor: "#ff6b35",
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#333",
  },
  keeperLegs: {
    flexDirection: "row",
    gap: 4,
    marginTop: 2,
  },
  keeperLeg: {
    width: 12,
    height: 20,
    backgroundColor: "#222",
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#333",
  },
  aimingArea: {
    ...StyleSheet.absoluteFillObject,
  },
  aimInstructions: {
    position: "absolute",
    top: SCREEN_HEIGHT * 0.55,
    left: 0,
    right: 0,
    alignItems: "center",
    gap: 8,
  },
  instructionText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  aimTarget: {
    position: "absolute",
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  targetOuter: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.8)",
    position: "absolute",
  },
  targetInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
  ball: {
    position: "absolute",
    width: BALL_SIZE,
    height: BALL_SIZE,
    borderRadius: BALL_SIZE / 2,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  ballGradient: {
    width: BALL_SIZE,
    height: BALL_SIZE,
    borderRadius: BALL_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
  },
  ballPattern: {
    width: BALL_SIZE,
    height: BALL_SIZE,
    position: "relative",
  },
  ballPentagon1: {
    position: "absolute",
    width: 10,
    height: 10,
    backgroundColor: "#333",
    top: 8,
    left: 15,
    borderRadius: 2,
  },
  ballPentagon2: {
    position: "absolute",
    width: 8,
    height: 8,
    backgroundColor: "#333",
    top: 20,
    left: 8,
    borderRadius: 2,
  },
  ballPentagon3: {
    position: "absolute",
    width: 8,
    height: 8,
    backgroundColor: "#333",
    top: 20,
    right: 8,
    borderRadius: 2,
  },
  resultOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  resultCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    minWidth: 280,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  resultCardGoal: {
    borderWidth: 4,
    borderColor: "#4caf50",
  },
  resultCardSave: {
    borderWidth: 4,
    borderColor: "#ff6b35",
  },
  resultEmoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  resultText: {
    fontSize: 36,
    fontWeight: "900" as const,
    color: "#222",
    marginBottom: 8,
  },
  resultSubtext: {
    fontSize: 16,
    color: "#666",
    marginBottom: 24,
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#2d5a3d",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#fff",
  },
});
