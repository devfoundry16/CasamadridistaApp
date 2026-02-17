import { Text } from "@/components/Text";
import React, { useRef, useState } from "react";
import {
  View,
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
import {
  DEFAULT_PLAYERS,
  SUBSTITUTES,
  COACH_IMAGE,
} from "@/mocks/lineup-players";
import { useTranslation } from "react-i18next";

const PLAYER_SIZE = 80;
const BENCH_PLAYER_SIZE = 75;

export default function LineupBuilder() {
  const { t } = useTranslation();
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
          Alert.alert(t("common.success"), t("formation.saved"));
        }
      }
    } catch (error: any) {
      Alert.alert(t("common.error"), t("formation.downloadFailed", { message: error.message }));
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
    <View className="flex-1">
      <LinearGradient
        colors={["#0a3d2e", "#0f5740", "#0a3d2e"]}
        style={{ flex: 1 }}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingVertical: 20,
            paddingHorizontal: 16,
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 20,
          }}
        >
          <View className="bg-black/30 rounded-2xl p-4 mb-5">
            <Text className="text-3xl font-extrabold text-white mb-5 text-center tracking-wider">
              {t("formation.lineupBuilder")}
            </Text>

            <View className="flex-row justify-between mb-4">
              <View className="flex-1 mx-1">
                <Text className="text-status-success text-xs font-semibold mb-2 uppercase">
                  {t("formation.formation")}
                </Text>
                <TouchableOpacity
                  className="bg-black/40 rounded-lg p-3 flex-row justify-between items-center"
                  onPress={() => setShowFormationPicker(!showFormationPicker)}
                >
                  <Text className="text-white text-base font-semibold">
                    {formation}
                  </Text>
                  <ChevronDown size={20} color="#fff" />
                </TouchableOpacity>
              </View>

              <View className="flex-1 mx-1">
                <Text className="text-status-success text-xs font-semibold mb-2 uppercase">
                  {t("formation.showNames")}
                </Text>
                <Switch
                  value={showPlayerNames}
                  onValueChange={setShowPlayerNames}
                  trackColor={{ false: "#555", true: "#10b981" }}
                  thumbColor="#fff"
                />
              </View>
            </View>

            {showFormationPicker && (
              <View className="bg-black/50 rounded-lg mb-4 overflow-hidden">
                {formationsList.map((f) => (
                  <TouchableOpacity
                    key={f}
                    className={`p-3 border-b border-white/10 ${
                      formation === f ? "bg-status-success/20" : ""
                    }`}
                    onPress={() => {
                      setFormation(f);
                      setShowFormationPicker(false);
                    }}
                  >
                    <Text className="text-white text-base font-semibold">{f}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View className="flex-1 mx-1">
              <Text className="text-status-success text-xs font-semibold mb-2 uppercase">
                {t("formation.formationTitle")}
              </Text>
              <TextInput
                className="bg-black/40 rounded-lg p-3 text-white text-base"
                value={formationTitle}
                onChangeText={setFormationTitle}
                placeholder={t("formation.placeholderFormationTitle")}
                placeholderTextColor="#888"
              />
            </View>

            <View className="flex-row gap-2 mt-2">
              <TouchableOpacity
                className="flex-1 bg-status-error rounded-lg py-3.5 flex-row justify-center items-center"
                onPress={resetFormation}
              >
                <RotateCcw size={20} color="#fff" />
                <Text className="text-white text-base font-bold ml-2">
                  {t("formation.reset")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-status-success rounded-lg py-3.5 flex-row justify-center items-center"
                onPress={downloadFormation}
              >
                <Download size={20} color="#fff" />
                <Text className="text-white text-base font-bold ml-2">
                  {t("formation.download")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="mb-5 px-1">
            <View className="bg-black/40 rounded-xl border-2 border-rm-gold overflow-hidden">
              <View className="bg-rm-gold/15 py-1.5 items-center">
                <View className="bg-rm-gold px-3 py-1 rounded">
                  <Text className="text-black text-xs font-extrabold tracking-wider">
                    {t("formation.coach")}
                  </Text>
                </View>
              </View>
              <View className="flex-row p-3 items-center">
                <View className="mr-3">
                  <Image
                    source={{ uri: COACH_IMAGE }}
                    style={{ width: 60, height: 60, borderRadius: 8 }}
                    className="border-2 border-white"
                  />
                </View>
                <View className="flex-1">
                  <TextInput
                    className="text-white text-lg font-bold mb-1 p-0"
                    value={coachName}
                    onChangeText={setCoachName}
                    placeholder={t("formation.placeholderCoachName")}
                    placeholderTextColor="#888"
                  />
                  <Text className="text-rm-gold text-xs font-bold tracking-wider">
                    {t("formation.headCoach")}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <ViewShot ref={viewShotRef} options={{ format: "png", quality: 1 }}>
            <View className="mb-5">
              <Text className="text-3xl font-extrabold text-rm-gold text-center mb-1 tracking-wide">
                {formationTitle}
              </Text>
              <Text className="text-base font-semibold text-status-success text-center mb-3">
                {formation}
              </Text>

              <LinearGradient
                colors={["#1a5c47", "#0f4737", "#0a3329"]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={{
                  width: "100%",
                  aspectRatio: 0.7,
                  borderRadius: 16,
                  overflow: "hidden",
                  borderWidth: 3,
                  borderColor: "#fff",
                }}
              >
                <View
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                  }}
                >
                  <View
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: 0,
                      right: 0,
                      height: 2,
                      backgroundColor: "rgba(255,255,255,0.3)",
                      marginTop: -1,
                    }}
                  />
                  <View
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      width: 100,
                      height: 100,
                      borderRadius: 50,
                      borderWidth: 2,
                      borderColor: "rgba(255,255,255,0.3)",
                      marginLeft: -50,
                      marginTop: -50,
                    }}
                  />
                  <View
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: "rgba(255,255,255,0.3)",
                      marginLeft: -4,
                      marginTop: -4,
                    }}
                  />
                  <View
                    style={{
                      position: "absolute",
                      left: "15%",
                      right: "15%",
                      top: 0,
                      height: "18%",
                      borderWidth: 2,
                      borderTopWidth: 0,
                      borderColor: "rgba(255,255,255,0.3)",
                    }}
                  />
                  <View
                    style={{
                      position: "absolute",
                      left: "15%",
                      right: "15%",
                      bottom: 0,
                      height: "18%",
                      borderWidth: 2,
                      borderBottomWidth: 0,
                      borderColor: "rgba(255,255,255,0.3)",
                    }}
                  />
                  <View
                    style={{
                      position: "absolute",
                      left: "30%",
                      right: "30%",
                      top: 0,
                      height: "8%",
                      borderWidth: 2,
                      borderTopWidth: 0,
                      borderColor: "rgba(255,255,255,0.3)",
                    }}
                  />
                  <View
                    style={{
                      position: "absolute",
                      left: "30%",
                      right: "30%",
                      bottom: 0,
                      height: "8%",
                      borderWidth: 2,
                      borderBottomWidth: 0,
                      borderColor: "rgba(255,255,255,0.3)",
                    }}
                  />
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
                      className="absolute items-center"
                      style={{
                        left: `${slot.x}%`,
                        top: `${slot.y}%`,
                        width: PLAYER_SIZE,
                        height: PLAYER_SIZE,
                        marginLeft: -PLAYER_SIZE / 2,
                        marginTop: -PLAYER_SIZE / 2,
                        transform: isSelected ? [{ scale: 1.2 }] : [],
                      }}
                      onPress={handlePress}
                    >
                      {player ? (
                        <View className="items-center">
                          <Image
                            source={{ uri: player.imageUrl }}
                            style={{
                              width: 80,
                              height: PLAYER_SIZE * 1.2,
                              borderRadius: 40,
                            }}
                            className="justify-center items-center"
                          />
                          <Animated.View
                            className="mt-1 bg-black/70 px-2 py-0.5 rounded"
                            style={{ opacity: nameOpacity }}
                          >
                            <Text
                              className="text-white text-[10px] font-bold text-center"
                              numberOfLines={1}
                            >
                              {player.number} {player.name.toUpperCase()}
                            </Text>
                          </Animated.View>
                        </View>
                      ) : (
                        <View className="w-[80px] h-[80px] rounded-full bg-white/10 border-2 border-dashed border-white/30 justify-center items-center">
                          <Text className="text-white/60 text-xs font-bold">
                            {slot.position}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}

                <View
                  className="absolute left-2.5 top-1/2 opacity-15"
                  style={{ transform: [{ translateY: -30 }] }}
                >
                  <Text className="text-white text-sm font-extrabold tracking-wider">
                    {t("formation.lineup")}
                  </Text>
                  <Text className="text-white text-sm font-extrabold tracking-wider">
                    {t("formation.builder")}
                  </Text>
                </View>
                <View
                  className="absolute right-2.5 top-1/2 opacity-15"
                  style={{ transform: [{ translateY: -30 }] }}
                >
                  <Text className="text-white text-sm font-extrabold tracking-wider">
                    {t("formation.lineup")}
                  </Text>
                  <Text className="text-white text-sm font-extrabold tracking-wider">
                    {t("formation.builder")}
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </ViewShot>

          <View className="bg-black/30 rounded-2xl p-4 mb-5">
            <Text className="text-xl font-bold text-status-success mb-4 text-center tracking-wider">
              {t("formation.substitutes")}
            </Text>
            <View className="flex-row flex-wrap justify-around">
              {bench.map((player, index) => {
                const isSelected =
                  selectedType === "bench" && selectedIndex === index;
                return (
                  <TouchableOpacity
                    key={index}
                    className="w-[30%] mb-4 items-center"
                    style={{
                      transform: isSelected ? [{ scale: 1.15 }] : [],
                    }}
                    onPress={() => player && handlePlayerPress(index, "bench")}
                  >
                    {player ? (
                      <View className="items-center">
                        <Image
                          source={{ uri: player.imageUrl }}
                          style={{
                            width: BENCH_PLAYER_SIZE,
                            height: BENCH_PLAYER_SIZE * 1.2,
                            borderRadius: BENCH_PLAYER_SIZE / 2,
                          }}
                          className="justify-center items-center mb-1.5"
                        />
                        <Text className="text-white text-xs font-semibold text-center">
                          {player.name}
                        </Text>
                        <Text className="text-text-secondary text-[10px] mt-0.5">
                          {player.position}
                        </Text>
                      </View>
                    ) : (
                      <View className="w-[75px] h-[75px] rounded-full bg-white/10 border-2 border-white/20 justify-center items-center">
                        <Text className="text-white/30 text-lg">-</Text>
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
