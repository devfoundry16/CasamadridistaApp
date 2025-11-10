import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Platform,
  Alert,
  Animated,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Player,
  PositionSlot,
  FormationType,
  FORMATIONS,
} from "@/types/soccer/formation";
import { ChevronDown, Download, RotateCcw } from "lucide-react-native";
import ViewShot, { captureRef } from "react-native-view-shot";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PLAYER_SIZE = 80;
const BENCH_PLAYER_SIZE = 75;

const DEFAULT_PLAYERS: Player[] = [
  {
    id: "1",
    name: "Courtois",
    position: "GK",
    number: 13,
    imageUrl:
      "https://casamadridista.com/wp-content/uploads/2025/08/Courtois-1.png",
  },
  {
    id: "2",
    name: "Carvajal",
    position: "RB",
    number: 2,
    imageUrl:
      "https://casamadridista.com/wp-content/uploads/2025/08/Carvajal-1.png",
  },
  {
    id: "3",
    name: "Militao",
    position: "CB",
    number: 3,
    imageUrl:
      "https://casamadridista.com/wp-content/uploads/2025/08/Militao-1.png",
  },
  {
    id: "4",
    name: "Huijsen",
    position: "CB",
    number: 24,
    imageUrl:
      "https://casamadridista.com/wp-content/uploads/2025/08/Huijsen-1.png",
  },
  {
    id: "5",
    name: "Carreras",
    position: "LB",
    number: 18,
    imageUrl:
      "https://casamadridista.com/wp-content/uploads/2025/08/Carreras-1.png",
  },
  {
    id: "6",
    name: "Tchouameni",
    position: "DMF",
    number: 14,
    imageUrl:
      "https://casamadridista.com/wp-content/uploads/2025/08/Tchouameni-1.png",
  },
  {
    id: "7",
    name: "Valverde",
    position: "CM",
    number: 8,
    imageUrl:
      "https://casamadridista.com/wp-content/uploads/2025/08/Valverde-1.png",
  },
  {
    id: "8",
    name: "Arda",
    position: "CAM",
    number: 15,
    imageUrl:
      "https://casamadridista.com/wp-content/uploads/2025/08/Arda-1.png",
  },
  {
    id: "9",
    name: "Mastantuono",
    position: "RW",
    number: 30,
    imageUrl:
      "https://casamadridista.com/wp-content/uploads/2025/08/Mastantuono-1.png",
  },
  {
    id: "10",
    name: "Mbappe",
    position: "ST",
    number: 10,
    imageUrl:
      "https://casamadridista.com/wp-content/uploads/2025/08/Mbappe-1.png",
  },
  {
    id: "11",
    name: "Vinicius",
    position: "LW",
    number: 7,
    imageUrl:
      "https://casamadridista.com/wp-content/uploads/2025/08/Vinicius-1.png",
  },
];

const SUBSTITUTES: Player[] = [
  {
    id: "s1",
    name: "Lunin",
    position: "GK",
    number: 1,
    imageUrl:
      "https://casamadridista.com/wp-content/uploads/2025/08/Lunin-1.png",
  },
  {
    id: "s2",
    name: "Alaba",
    position: "CB",
    number: 4,
    imageUrl:
      "https://casamadridista.com/wp-content/uploads/2025/08/Alaba-1.png",
  },
  {
    id: "s3",
    name: "Arnold",
    position: "RB",
    number: 12,
    imageUrl:
      "https://casamadridista.com/wp-content/uploads/2025/08/Arnold-1.png",
  },
  {
    id: "s4",
    name: "Asencio",
    position: "CB",
    number: 17,
    imageUrl:
      "https://casamadridista.com/wp-content/uploads/2025/08/Asencio-1.png",
  },
  {
    id: "s5",
    name: "Fran Garcia",
    position: "LB",
    number: 20,
    imageUrl:
      "https://casamadridista.com/wp-content/uploads/2025/08/Fran-Garcia-1.png",
  },
  {
    id: "s6",
    name: "Rudiger",
    position: "CB",
    number: 22,
    imageUrl:
      "https://casamadridista.com/wp-content/uploads/2025/08/Rudiger-1.png",
  },
  {
    id: "s7",
    name: "Mendy",
    position: "LB",
    number: 23,
    imageUrl:
      "https://casamadridista.com/wp-content/uploads/2025/08/Mendy-1.png",
  },
  {
    id: "s8",
    name: "Bellingham",
    position: "CAM",
    number: 5,
    imageUrl:
      "https://casamadridista.com/wp-content/uploads/2025/08/Bellingham-1.png",
  },
  {
    id: "s9",
    name: "Diaz",
    position: "RW",
    number: 21,
    imageUrl:
      "https://casamadridista.com/wp-content/uploads/2025/08/Diaz-1.png",
  },
  {
    id: "s10",
    name: "Camavinga",
    position: "DMF",
    number: 6,
    imageUrl:
      "https://casamadridista.com/wp-content/uploads/2025/08/Camavinga-1.png",
  },
  {
    id: "s11",
    name: "Ceballos",
    position: "CM",
    number: 19,
    imageUrl:
      "https://casamadridista.com/wp-content/uploads/2025/08/Ceballos-1.png",
  },
  {
    id: "s12",
    name: "Rodrygo",
    position: "RW",
    number: 11,
    imageUrl:
      "https://casamadridista.com/wp-content/uploads/2025/08/Rodrygo-1.png",
  },
  {
    id: "s13",
    name: "Gonzalo",
    position: "ST",
    number: 16,
    imageUrl:
      "https://casamadridista.com/wp-content/uploads/2025/08/Gonzalo-1.png",
  },
  {
    id: "s14",
    name: "Endrick",
    position: "ST",
    number: 9,
    imageUrl:
      "https://casamadridista.com/wp-content/uploads/2025/08/Endrick-1.png",
  },
];

const COACH_IMAGE =
  "https://casamadridista.com/wp-content/uploads/2025/08/Xabi-Alonso-1.png";
const PITCH_IMAGE =
  "https://casamadridista.com/wp-content/uploads/2025/08/formation-copy.png";

export default function LineupBuilder() {
  const insets = useSafeAreaInsets();
  const viewShotRef = useRef<ViewShot>(null);
  const [formation, setFormation] = useState<FormationType>("4-3-3");
  const [formationTitle, setFormationTitle] = useState<string>("MY FORMATION");
  const [showPlayerNames, setShowPlayerNames] = useState<boolean>(true);
  const [startingXI, setStartingXI] =
    useState<(Player | null)[]>(DEFAULT_PLAYERS);
  const [bench, setBench] = useState<(Player | null)[]>(SUBSTITUTES);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<"starting" | "bench" | null>(
    null
  );
  const [showFormationPicker, setShowFormationPicker] = useState(false);
  const [coachName, setCoachName] = useState<string>("Xabi Alonso");
  const nameOpacity = useRef(new Animated.Value(1)).current;
  const lastTapTimestamps = useRef<{ [key: number]: number }>({}).current;

  const formationPositions = FORMATIONS[formation];

  React.useEffect(() => {
    Animated.timing(nameOpacity, {
      toValue: showPlayerNames ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showPlayerNames, nameOpacity]);

  const handlePlayerPress = (index: number, type: "starting" | "bench") => {
    if (selectedType === null) {
      setSelectedIndex(index);
      setSelectedType(type);
    } else {
      if (selectedType === "starting" && type === "starting") {
        const newStarting = [...startingXI];
        [newStarting[selectedIndex!], newStarting[index]] = [
          newStarting[index],
          newStarting[selectedIndex!],
        ];
        setStartingXI(newStarting);
      } else if (selectedType === "starting" && type === "bench") {
        const newStarting = [...startingXI];
        const newBench = [...bench];
        [newStarting[selectedIndex!], newBench[index]] = [
          newBench[index],
          newStarting[selectedIndex!],
        ];
        setStartingXI(newStarting);
        setBench(newBench);
      } else if (selectedType === "bench" && type === "starting") {
        const newStarting = [...startingXI];
        const newBench = [...bench];
        [newBench[selectedIndex!], newStarting[index]] = [
          newStarting[index],
          newBench[selectedIndex!],
        ];
        setStartingXI(newStarting);
        setBench(newBench);
      } else if (selectedType === "bench" && type === "bench") {
        const newBench = [...bench];
        [newBench[selectedIndex!], newBench[index]] = [
          newBench[index],
          newBench[selectedIndex!],
        ];
        setBench(newBench);
      }

      setSelectedIndex(null);
      setSelectedType(null);
    }
  };

  const handlePlayerDoubleClick = (index: number) => {
    const newStarting = [...startingXI];
    const player = newStarting[index];
    if (player) {
      const newBench = [...bench];
      const emptyBenchIndex = bench.findIndex((p) => p === null);
      if (emptyBenchIndex !== -1) {
        newBench[emptyBenchIndex] = player;
      } else {
        newBench.push(player);
      }
      setBench(newBench);
      newStarting[index] = null;
      setStartingXI(newStarting);
    }
    setSelectedIndex(null);
    setSelectedType(null);
  };

  const handlePlaceholderPress = (index: number) => {
    if (selectedType === "bench" && selectedIndex !== null) {
      const newStarting = [...startingXI];
      const newBench = [...bench];
      newStarting[index] = bench[selectedIndex];
      newBench[selectedIndex] = null;
      setStartingXI(newStarting);
      setBench(newBench);
      setSelectedIndex(null);
      setSelectedType(null);
    }
  };

  const resetFormation = () => {
    setStartingXI(DEFAULT_PLAYERS);
    setBench(SUBSTITUTES);
    setSelectedIndex(null);
    setSelectedType(null);
  };

  const downloadFormation = async () => {
    // try {
    //   if (Platform.OS === "web") {
    //     if (viewShotRef.current) {
    //       const uri = await viewShotRef.current.capture?.();
    //       if (uri) {
    //         const link = document.createElement("a");
    //         link.download = `${formationTitle.replace(/\s+/g, "_")}.png`;
    //         link.href = uri;
    //         link.click();
    //       }
    //     }
    //   } else {
    //     const { status } = await MediaLibrary.requestPermissionsAsync();
    //     if (status !== "granted") {
    //       Alert.alert(
    //         "Permission needed",
    //         "Please grant media library permission to save images"
    //       );
    //       return;
    //     }

    //     if (viewShotRef.current) {
    //       const uri = await viewShotRef.current.capture?.();
    //       if (uri) {
    //         await MediaLibrary.saveToLibraryAsync(uri);
    //         Alert.alert("Success", "Formation saved to gallery!");
    //       }
    //     }
    //   }
    // } catch (error) {
    //   console.error("Error downloading formation:", error);
    //   Alert.alert("Error", "Failed to save formation");
    // }
    try {
      if (!viewShotRef.current) return;
      const uri = await captureRef(viewShotRef, {
        format: "png",
        quality: 1,
      });

      if (Platform.OS === "web") {
        const link = document.createElement("a");
        link.href = uri;
        link.download = `formation-${formationTitle}-${Date.now()}.png`;
        link.click();
      } else {
        const destination = new File(
          Paths.cache,
          `formation-${formationTitle}-${Date.now()}.png`
        );
        const source = new File(uri);
        source.copy(destination);

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(source.uri);
        } else {
          Alert.alert("Success", "Formation saved!");
          Alert.alert("Success", "Formation saved!");
        }
      }
    } catch (error) {
      console.error("Error downloading formation:", error);
      Alert.alert("Error", "Failed to download formation");
    }
  };

  const formationsList: FormationType[] = [
    "4-3-3",
    "4-4-2",
    "3-5-2",
    "4-2-3-1",
    "5-3-2",
    "4-1-4-1",
    "3-4-3",
    "4-5-1",
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0a3d2e", "#0f5740", "#0a3d2e"]}
        style={styles.gradient}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
          ]}
        >
          <View style={styles.controlPanel}>
            <Text style={styles.headerText}>LINEUP BUILDER</Text>

            <View style={styles.controlRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Formation</Text>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowFormationPicker(!showFormationPicker)}
                >
                  <Text style={styles.pickerText}>{formation}</Text>
                  <ChevronDown size={20} color="#fff" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Show Names</Text>
                <Switch
                  value={showPlayerNames}
                  onValueChange={setShowPlayerNames}
                  trackColor={{ false: "#555", true: "#10b981" }}
                  thumbColor="#fff"
                />
              </View>
            </View>

            {showFormationPicker && (
              <View style={styles.formationList}>
                {formationsList.map((f) => (
                  <TouchableOpacity
                    key={f}
                    style={[
                      styles.formationItem,
                      formation === f && styles.formationItemActive,
                    ]}
                    onPress={() => {
                      setFormation(f);
                      setShowFormationPicker(false);
                    }}
                  >
                    <Text style={styles.formationItemText}>{f}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Formation Title</Text>
              <TextInput
                style={styles.textInput}
                value={formationTitle}
                onChangeText={setFormationTitle}
                placeholder="Enter formation title"
                placeholderTextColor="#888"
              />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={resetFormation}
              >
                <RotateCcw size={20} color="#fff" />
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.downloadButton}
                onPress={downloadFormation}
              >
                <Download size={20} color="#fff" />
                <Text style={styles.downloadButtonText}>Download</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.coachContainer}>
            <View style={styles.coachCard}>
              <View style={styles.coachHeader}>
                <View style={styles.coachBadge}>
                  <Text style={styles.coachBadgeText}>COACH</Text>
                </View>
              </View>
              <View style={styles.coachContent}>
                <View style={styles.coachAvatarContainer}>
                  <Image
                    source={{ uri: COACH_IMAGE }}
                    style={styles.coachAvatar}
                  />
                </View>
                <View style={styles.coachInfo}>
                  <TextInput
                    style={styles.coachNameInput}
                    value={coachName}
                    onChangeText={setCoachName}
                    placeholder="Coach name"
                    placeholderTextColor="#888"
                  />
                  <Text style={styles.coachRole}>HEAD COACH</Text>
                </View>
              </View>
            </View>
          </View>

          <ViewShot ref={viewShotRef} options={{ format: "png", quality: 1 }}>
            <View style={styles.pitchContainer}>
              <Text style={styles.formationTitleText}>{formationTitle}</Text>
              <Text style={styles.formationSubtitle}>{formation}</Text>

              <LinearGradient
                colors={["#1a5c47", "#0f4737", "#0a3329"]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.pitch}
              >
                <View style={styles.pitchLines}>
                  <View style={[styles.line, styles.halfwayLine]} />
                  <View style={styles.centerCircle} />
                  <View style={styles.centerDot} />
                  <View style={[styles.penaltyBox, styles.topPenaltyBox]} />
                  <View style={[styles.penaltyBox, styles.bottomPenaltyBox]} />
                  <View style={[styles.sixYardBox, styles.topSixYardBox]} />
                  <View style={[styles.sixYardBox, styles.bottomSixYardBox]} />
                </View>

                {formationPositions.map((slot: PositionSlot, index: number) => {
                  const player = startingXI[index];
                  const isSelected =
                    selectedType === "starting" && selectedIndex === index;

                  const handlePress = () => {
                    const now = Date.now();
                    const DOUBLE_CLICK_DELAY = 300;
                    const lastTap = lastTapTimestamps[index] || 0;

                    if (player && now - lastTap < DOUBLE_CLICK_DELAY) {
                      handlePlayerDoubleClick(index);
                      lastTapTimestamps[index] = 0;
                    } else {
                      lastTapTimestamps[index] = now;
                      if (player) {
                        handlePlayerPress(index, "starting");
                      } else {
                        handlePlaceholderPress(index);
                      }
                    }
                  };

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.playerSlot,
                        {
                          left: `${slot.x}%`,
                          top: `${slot.y}%`,
                        },
                        isSelected && styles.playerSlotSelected,
                      ]}
                      onPress={handlePress}
                    >
                      {player ? (
                        <View style={styles.playerCircle}>
                          <Image
                            source={{ uri: player.imageUrl }}
                            style={styles.playerAvatar}
                          />
                          <Animated.View
                            style={[
                              styles.playerNameContainer,
                              { opacity: nameOpacity },
                            ]}
                          >
                            <Text style={styles.playerName} numberOfLines={1}>
                              {player.number} {player.name.toUpperCase()}
                            </Text>
                          </Animated.View>
                        </View>
                      ) : (
                        <View style={styles.placeholderCircle}>
                          <Text style={styles.placeholderText}>
                            {slot.position}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}

                <View style={styles.watermarkLeft}>
                  <Text style={styles.watermarkText}>LINEUP</Text>
                  <Text style={styles.watermarkText}>BUILDER</Text>
                </View>
                <View style={styles.watermarkRight}>
                  <Text style={styles.watermarkText}>LINEUP</Text>
                  <Text style={styles.watermarkText}>BUILDER</Text>
                </View>
              </LinearGradient>
            </View>
          </ViewShot>

          <View style={styles.benchContainer}>
            <Text style={styles.benchTitle}>SUBSTITUTES</Text>
            <View style={styles.benchGrid}>
              {bench.map((player, index) => {
                const isSelected =
                  selectedType === "bench" && selectedIndex === index;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.benchSlot,
                      isSelected && styles.benchSlotSelected,
                    ]}
                    onPress={() => player && handlePlayerPress(index, "bench")}
                  >
                    {player ? (
                      <View style={styles.benchPlayer}>
                        <Image
                          source={{ uri: player.imageUrl }}
                          style={styles.benchPlayerAvatar}
                        />
                        <Text style={styles.benchPlayerName}>
                          {player.name}
                        </Text>
                        <Text style={styles.benchPlayerPosition}>
                          {player.position}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.benchEmpty}>
                        <Text style={styles.benchEmptyText}>-</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  headerText: {
    fontSize: 32,
    fontWeight: "800" as const,
    color: "#fff",
    marginBottom: 20,
    textAlign: "center" as const,
    letterSpacing: 2,
  },
  controlPanel: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  controlRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    marginBottom: 16,
  },
  inputGroup: {
    flex: 1,
    marginHorizontal: 4,
  },
  label: {
    color: "#10b981",
    fontSize: 12,
    fontWeight: "600" as const,
    marginBottom: 8,
    textTransform: "uppercase" as const,
  },
  pickerButton: {
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },
  pickerText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  formationList: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 8,
    marginBottom: 16,
    overflow: "hidden" as const,
  },
  formationItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  formationItemActive: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
  },
  formationItemText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  textInput: {
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderRadius: 8,
    padding: 12,
    color: "#fff",
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: "row" as const,
    gap: 8,
    marginTop: 8,
  },
  resetButton: {
    flex: 1,
    backgroundColor: "#ef4444",
    borderRadius: 8,
    padding: 14,
    flexDirection: "row" as const,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  resetButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700" as const,
    marginLeft: 8,
  },
  downloadButton: {
    flex: 1,
    backgroundColor: "#10b981",
    borderRadius: 8,
    padding: 14,
    flexDirection: "row" as const,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  downloadButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700" as const,
    marginLeft: 8,
  },
  pitchContainer: {
    marginBottom: 20,
  },
  formationTitleText: {
    fontSize: 28,
    fontWeight: "800" as const,
    color: "#fff",
    textAlign: "center" as const,
    marginBottom: 4,
    letterSpacing: 1,
  },
  formationSubtitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#10b981",
    textAlign: "center" as const,
    marginBottom: 12,
  },
  pitch: {
    width: "100%",
    aspectRatio: 0.7,
    borderRadius: 16,
    position: "relative" as const,
    overflow: "hidden" as const,
    borderWidth: 3,
    borderColor: "#fff",
  },
  pitchLines: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  line: {
    position: "absolute" as const,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  halfwayLine: {
    top: "50%",
    left: 0,
    right: 0,
    height: 2,
  },
  centerCircle: {
    position: "absolute" as const,
    top: "50%",
    left: "50%",
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    transform: [{ translateX: -50 }, { translateY: -50 }],
  },
  centerDot: {
    position: "absolute" as const,
    top: "50%",
    left: "50%",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    transform: [{ translateX: -4 }, { translateY: -4 }],
  },
  penaltyBox: {
    position: "absolute" as const,
    left: "15%",
    right: "15%",
    height: "18%",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  topPenaltyBox: {
    top: 0,
    borderTopWidth: 0,
  },
  bottomPenaltyBox: {
    bottom: 0,
    borderBottomWidth: 0,
  },
  sixYardBox: {
    position: "absolute" as const,
    left: "30%",
    right: "30%",
    height: "8%",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  topSixYardBox: {
    top: 0,
    borderTopWidth: 0,
  },
  bottomSixYardBox: {
    bottom: 0,
    borderBottomWidth: 0,
  },
  playerSlot: {
    position: "absolute" as const,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    marginLeft: -PLAYER_SIZE / 2,
    marginTop: -PLAYER_SIZE / 2,
  },
  playerSlotSelected: {
    transform: [{ scale: 1.2 }],
  },
  playerCircle: {
    alignItems: "center" as const,
  },
  playerAvatar: {
    width: PLAYER_SIZE,
    height: PLAYER_SIZE * 1.2,
    borderRadius: PLAYER_SIZE / 2,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  playerNumber: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800" as const,
  },
  playerNameContainer: {
    marginTop: 4,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  playerName: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700" as const,
    textAlign: "center" as const,
  },
  placeholderCircle: {
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    borderRadius: PLAYER_SIZE / 2,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderStyle: "dashed" as const,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  placeholderText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
    fontWeight: "700" as const,
  },
  watermarkLeft: {
    position: "absolute" as const,
    left: 10,
    top: "50%",
    transform: [{ translateY: -30 }],
    opacity: 0.15,
  },
  watermarkRight: {
    position: "absolute" as const,
    right: 10,
    top: "50%",
    transform: [{ translateY: -30 }],
    opacity: 0.15,
  },
  watermarkText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800" as const,
    letterSpacing: 1,
  },
  benchContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  benchTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#10b981",
    marginBottom: 16,
    textAlign: "center" as const,
    letterSpacing: 1,
  },
  benchGrid: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    justifyContent: "space-around" as const,
  },
  benchSlot: {
    width: "30%",
    marginBottom: 16,
    alignItems: "center" as const,
  },
  benchSlotSelected: {
    transform: [{ scale: 1.15 }],
  },
  benchPlayer: {
    alignItems: "center" as const,
  },
  benchPlayerAvatar: {
    width: BENCH_PLAYER_SIZE,
    height: BENCH_PLAYER_SIZE * 1.2,
    borderRadius: BENCH_PLAYER_SIZE / 2,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    marginBottom: 6,
  },
  benchPlayerNumber: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700" as const,
  },
  benchPlayerName: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600" as const,
    textAlign: "center" as const,
  },
  benchPlayerPosition: {
    color: "#888",
    fontSize: 10,
    marginTop: 2,
  },
  benchEmpty: {
    width: BENCH_PLAYER_SIZE,
    height: BENCH_PLAYER_SIZE,
    borderRadius: BENCH_PLAYER_SIZE / 2,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  benchEmptyText: {
    color: "rgba(255, 255, 255, 0.3)",
    fontSize: 18,
  },
  coachContainer: {
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  coachCard: {
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#f59e0b",
    overflow: "hidden" as const,
  },
  coachHeader: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    paddingVertical: 6,
    alignItems: "center" as const,
  },
  coachBadge: {
    backgroundColor: "#f59e0b",
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 4,
  },
  coachBadgeText: {
    color: "#000",
    fontSize: 10,
    fontWeight: "800" as const,
    letterSpacing: 1.5,
  },
  coachContent: {
    flexDirection: "row" as const,
    padding: 12,
    alignItems: "center" as const,
  },
  coachAvatarContainer: {
    marginRight: 12,
  },
  coachAvatar: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#fff",
  },
  coachInitials: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800" as const,
    letterSpacing: 1,
  },
  coachInfo: {
    flex: 1,
  },
  coachNameInput: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700" as const,
    marginBottom: 4,
    padding: 0,
  },
  coachRole: {
    color: "#f59e0b",
    fontSize: 11,
    fontWeight: "700" as const,
    letterSpacing: 1,
  },
});

// import Colors from "@/constants/colors";
// import { Stack } from "expo-router";
// import React, { useRef } from "react";
// import { Platform, StyleSheet, View } from "react-native";

// import { WebView } from "react-native-webview";
// export default function CreateFormationScreen() {
//   const htmlSource = Platform.select({
//     default: { uri: "https://casamadridista.com/formation" },
//     android: { uri: "https://casamadridista.com/formation" },
//   });
//   const pitchRef = useRef<WebView>(null);
//   return (
//     <>
//       <Stack.Screen
//         options={{
//           title: "Create Formation",
//           headerStyle: {
//             backgroundColor: Colors.secondary,
//           },
//           headerTintColor: Colors.textWhite,
//           headerTitleStyle: {
//             fontWeight: "700" as const,
//           },
//         }}
//       />
//       <View style={styles.container}>
//         <WebView ref={pitchRef} source={htmlSource} style={styles.webview} />
//       </View>
//     </>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: Colors.text,
//     margin: 0,
//     padding: 0,
//   },
//   webview: {
//     flex: 1,
//     backgroundColor: "transparent",
//     margin: 0,
//     padding: 0,
//   },
// });
