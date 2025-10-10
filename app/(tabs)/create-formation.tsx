// import { altColors as colors } from "@/constants/colors";
// import { File, Paths } from "expo-file-system";
// import * as Sharing from "expo-sharing";
// import {
//   ChevronDown,
//   Download,
//   Eye,
//   EyeOff,
//   RotateCcw,
// } from "lucide-react-native";
// import React, { useRef, useState } from "react";
// import {
//   Alert,
//   Animated,
//   Dimensions,
//   Image,
//   PanResponder,
//   Platform,
//   Pressable,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { useSafeAreaInsets } from "react-native-safe-area-context";
// import { captureRef } from "react-native-view-shot";

// const SCREEN_WIDTH = Dimensions.get("window").width;
// const PITCH_WIDTH = SCREEN_WIDTH - 32;
// const PITCH_HEIGHT = Math.max(872, PITCH_WIDTH * 1.4);
// const PLAYER_SIZE = 80;

// interface Player {
//   id: string;
//   name: string;
//   position: string;
//   number: number;
//   imageUrl: string;
// }

// interface PositionSlot {
//   id: string;
//   x: number;
//   y: number;
//   label: string;
//   playerId: string | null;
// }

// const PLAYERS: Player[] = [
//   {
//     id: "courtois",
//     name: "Courtois",
//     position: "GK",
//     number: 13,
//     imageUrl:
//       "https://casamadridista.com/wp-content/uploads/2025/08/Courtois-1.png",
//   },
//   {
//     id: "carvajal",
//     name: "Carvajal",
//     position: "RB",
//     number: 2,
//     imageUrl:
//       "https://casamadridista.com/wp-content/uploads/2025/08/Carvajal-1.png",
//   },
//   {
//     id: "militao",
//     name: "Militao",
//     position: "CB",
//     number: 3,
//     imageUrl:
//       "https://casamadridista.com/wp-content/uploads/2025/08/Militao-1.png",
//   },
//   {
//     id: "huijsen",
//     name: "Huijsen",
//     position: "CB",
//     number: 24,
//     imageUrl:
//       "https://casamadridista.com/wp-content/uploads/2025/08/Huijsen-1.png",
//   },
//   {
//     id: "carreras",
//     name: "Carreras",
//     position: "LB",
//     number: 18,
//     imageUrl:
//       "https://casamadridista.com/wp-content/uploads/2025/08/Carreras-1.png",
//   },
//   {
//     id: "tchouameni",
//     name: "Tchouameni",
//     position: "DMF",
//     number: 14,
//     imageUrl:
//       "https://casamadridista.com/wp-content/uploads/2025/08/Tchouameni-1.png",
//   },
//   {
//     id: "valverde",
//     name: "Valverde",
//     position: "CM",
//     number: 8,
//     imageUrl:
//       "https://casamadridista.com/wp-content/uploads/2025/08/Valverde-1.png",
//   },
//   {
//     id: "arda",
//     name: "Arda",
//     position: "CAM",
//     number: 15,
//     imageUrl:
//       "https://casamadridista.com/wp-content/uploads/2025/08/Arda-1.png",
//   },
//   {
//     id: "mastantuono",
//     name: "Mastantuono",
//     position: "RW",
//     number: 30,
//     imageUrl:
//       "https://casamadridista.com/wp-content/uploads/2025/08/Mastantuono-1.png",
//   },
//   {
//     id: "mbappe",
//     name: "Mbappe",
//     position: "ST",
//     number: 10,
//     imageUrl:
//       "https://casamadridista.com/wp-content/uploads/2025/08/Mbappe-1.png",
//   },
//   {
//     id: "vinicius",
//     name: "Vinicius",
//     position: "LW",
//     number: 7,
//     imageUrl:
//       "https://casamadridista.com/wp-content/uploads/2025/08/Vinicius-1.png",
//   },
// ];

// const SUBSTITUTES: Player[] = [
//   {
//     id: "lunin",
//     name: "Lunin",
//     position: "GK",
//     number: 1,
//     imageUrl:
//       "https://casamadridista.com/wp-content/uploads/2025/08/Lunin-1.png",
//   },
//   {
//     id: "alaba",
//     name: "Alaba",
//     position: "CB",
//     number: 4,
//     imageUrl:
//       "https://casamadridista.com/wp-content/uploads/2025/08/Alaba-1.png",
//   },
//   {
//     id: "arnold",
//     name: "Arnold",
//     position: "RB",
//     number: 12,
//     imageUrl:
//       "https://casamadridista.com/wp-content/uploads/2025/08/Arnold-1.png",
//   },
//   {
//     id: "asencio",
//     name: "Asencio",
//     position: "CB",
//     number: 17,
//     imageUrl:
//       "https://casamadridista.com/wp-content/uploads/2025/08/Asencio-1.png",
//   },
//   {
//     id: "frangarcia",
//     name: "Fran Garcia",
//     position: "LB",
//     number: 20,
//     imageUrl:
//       "https://casamadridista.com/wp-content/uploads/2025/08/Fran-Garcia-1.png",
//   },
//   {
//     id: "rudiger",
//     name: "Rudiger",
//     position: "CB",
//     number: 22,
//     imageUrl:
//       "https://casamadridista.com/wp-content/uploads/2025/08/Rudiger-1.png",
//   },
//   {
//     id: "mendy",
//     name: "Mendy",
//     position: "LB",
//     number: 23,
//     imageUrl:
//       "https://casamadridista.com/wp-content/uploads/2025/08/Mendy-1.png",
//   },
//   {
//     id: "bellingham",
//     name: "Bellingham",
//     position: "CAM",
//     number: 5,
//     imageUrl:
//       "https://casamadridista.com/wp-content/uploads/2025/08/Bellingham-1.png",
//   },
//   {
//     id: "diaz",
//     name: "Diaz",
//     position: "RW",
//     number: 21,
//     imageUrl:
//       "https://casamadridista.com/wp-content/uploads/2025/08/Diaz-1.png",
//   },
//   {
//     id: "camavinga",
//     name: "Camavinga",
//     position: "DMF",
//     number: 6,
//     imageUrl:
//       "https://casamadridista.com/wp-content/uploads/2025/08/Camavinga-1.png",
//   },
//   {
//     id: "ceballos",
//     name: "Ceballos",
//     position: "CM",
//     number: 19,
//     imageUrl:
//       "https://casamadridista.com/wp-content/uploads/2025/08/Ceballos-1.png",
//   },
//   {
//     id: "rodrygo",
//     name: "Rodrygo",
//     position: "RW",
//     number: 11,
//     imageUrl:
//       "https://casamadridista.com/wp-content/uploads/2025/08/Rodrygo-1.png",
//   },
//   {
//     id: "gonzalo",
//     name: "Gonzalo",
//     position: "ST",
//     number: 16,
//     imageUrl:
//       "https://casamadridista.com/wp-content/uploads/2025/08/Gonzalo-1.png",
//   },
//   {
//     id: "endrick",
//     name: "Endrick",
//     position: "ST",
//     number: 9,
//     imageUrl:
//       "https://casamadridista.com/wp-content/uploads/2025/08/Endrick-1.png",
//   },
// ];

// const COACH_IMAGE =
//   "https://casamadridista.com/wp-content/uploads/2025/08/Xabi-Alonso-1.png";
// // const PITCH_IMAGE =
// //   "https://casamadridista.com/wp-content/uploads/2025/08/formation-copy.png";

// const PITCH_IMAGE = {
//   uri: require("@/assets/images/pitch.png"),
// };

// const FORMATIONS: Record<string, PositionSlot[]> = {
//   "4-3-3": [
//     { id: "gk", x: 50, y: 92, label: "GK", playerId: "courtois" },
//     { id: "lb", x: 15, y: 72, label: "LB", playerId: "carreras" },
//     { id: "cb1", x: 38, y: 75, label: "CB", playerId: "militao" },
//     { id: "cb2", x: 62, y: 75, label: "CB", playerId: "huijsen" },
//     { id: "rb", x: 85, y: 72, label: "RB", playerId: "carvajal" },
//     { id: "cm1", x: 30, y: 50, label: "CM", playerId: "tchouameni" },
//     { id: "cm2", x: 50, y: 48, label: "CM", playerId: "valverde" },
//     { id: "cm3", x: 70, y: 50, label: "CM", playerId: "arda" },
//     { id: "lw", x: 15, y: 20, label: "LW", playerId: "vinicius" },
//     { id: "st", x: 50, y: 15, label: "ST", playerId: "mbappe" },
//     { id: "rw", x: 85, y: 20, label: "RW", playerId: "mastantuono" },
//   ],
//   "4-4-2": [
//     { id: "gk", x: 50, y: 92, label: "GK", playerId: "courtois" },
//     { id: "lb", x: 15, y: 72, label: "LB", playerId: "carreras" },
//     { id: "cb1", x: 38, y: 75, label: "CB", playerId: "militao" },
//     { id: "cb2", x: 62, y: 75, label: "CB", playerId: "huijsen" },
//     { id: "rb", x: 85, y: 72, label: "RB", playerId: "carvajal" },
//     { id: "lm", x: 15, y: 48, label: "LM", playerId: "vinicius" },
//     { id: "cm1", x: 38, y: 50, label: "CM", playerId: "tchouameni" },
//     { id: "cm2", x: 62, y: 50, label: "CM", playerId: "valverde" },
//     { id: "rm", x: 85, y: 48, label: "RM", playerId: "mastantuono" },
//     { id: "st1", x: 35, y: 18, label: "ST", playerId: "mbappe" },
//     { id: "st2", x: 65, y: 18, label: "ST", playerId: "arda" },
//   ],
//   "3-5-2": [
//     { id: "gk", x: 50, y: 92, label: "GK", playerId: "courtois" },
//     { id: "cb1", x: 25, y: 75, label: "CB", playerId: "militao" },
//     { id: "cb2", x: 50, y: 78, label: "CB", playerId: "huijsen" },
//     { id: "cb3", x: 75, y: 75, label: "CB", playerId: "carvajal" },
//     { id: "lwb", x: 10, y: 55, label: "LWB", playerId: "carreras" },
//     { id: "cm1", x: 32, y: 50, label: "CM", playerId: "tchouameni" },
//     { id: "cm2", x: 50, y: 48, label: "CM", playerId: "valverde" },
//     { id: "cm3", x: 68, y: 50, label: "CM", playerId: "arda" },
//     { id: "rwb", x: 90, y: 55, label: "RWB", playerId: "mastantuono" },
//     { id: "st1", x: 35, y: 18, label: "ST", playerId: "mbappe" },
//     { id: "st2", x: 65, y: 18, label: "ST", playerId: "vinicius" },
//   ],
//   "4-2-3-1": [
//     { id: "gk", x: 50, y: 92, label: "GK", playerId: "courtois" },
//     { id: "lb", x: 15, y: 72, label: "LB", playerId: "carreras" },
//     { id: "cb1", x: 38, y: 75, label: "CB", playerId: "militao" },
//     { id: "cb2", x: 62, y: 75, label: "CB", playerId: "huijsen" },
//     { id: "rb", x: 85, y: 72, label: "RB", playerId: "carvajal" },
//     { id: "dmf1", x: 38, y: 55, label: "DMF", playerId: "tchouameni" },
//     { id: "dmf2", x: 62, y: 55, label: "DMF", playerId: "valverde" },
//     { id: "lw", x: 15, y: 32, label: "LW", playerId: "vinicius" },
//     { id: "cam", x: 50, y: 35, label: "CAM", playerId: "arda" },
//     { id: "rw", x: 85, y: 32, label: "RW", playerId: "mastantuono" },
//     { id: "st", x: 50, y: 15, label: "ST", playerId: "mbappe" },
//   ],
//   "5-3-2": [
//     { id: "gk", x: 50, y: 92, label: "GK", playerId: "courtois" },
//     { id: "lwb", x: 10, y: 72, label: "LWB", playerId: "carreras" },
//     { id: "cb1", x: 28, y: 75, label: "CB", playerId: "militao" },
//     { id: "cb2", x: 50, y: 78, label: "CB", playerId: "huijsen" },
//     { id: "cb3", x: 72, y: 75, label: "CB", playerId: "carvajal" },
//     { id: "rwb", x: 90, y: 72, label: "RWB", playerId: "mastantuono" },
//     { id: "cm1", x: 30, y: 48, label: "CM", playerId: "tchouameni" },
//     { id: "cm2", x: 50, y: 45, label: "CM", playerId: "valverde" },
//     { id: "cm3", x: 70, y: 48, label: "CM", playerId: "arda" },
//     { id: "st1", x: 35, y: 18, label: "ST", playerId: "mbappe" },
//     { id: "st2", x: 65, y: 18, label: "ST", playerId: "vinicius" },
//   ],
//   "4-1-4-1": [
//     { id: "gk", x: 50, y: 92, label: "GK", playerId: "courtois" },
//     { id: "lb", x: 15, y: 72, label: "LB", playerId: "carreras" },
//     { id: "cb1", x: 38, y: 75, label: "CB", playerId: "militao" },
//     { id: "cb2", x: 62, y: 75, label: "CB", playerId: "huijsen" },
//     { id: "rb", x: 85, y: 72, label: "RB", playerId: "carvajal" },
//     { id: "dmf", x: 50, y: 58, label: "DMF", playerId: "tchouameni" },
//     { id: "lm", x: 15, y: 38, label: "LM", playerId: "vinicius" },
//     { id: "cm1", x: 38, y: 40, label: "CM", playerId: "valverde" },
//     { id: "cm2", x: 62, y: 40, label: "CM", playerId: "arda" },
//     { id: "rm", x: 85, y: 38, label: "RM", playerId: "mastantuono" },
//     { id: "st", x: 50, y: 15, label: "ST", playerId: "mbappe" },
//   ],
//   "3-4-3": [
//     { id: "gk", x: 50, y: 92, label: "GK", playerId: "courtois" },
//     { id: "cb1", x: 25, y: 75, label: "CB", playerId: "militao" },
//     { id: "cb2", x: 50, y: 78, label: "CB", playerId: "huijsen" },
//     { id: "cb3", x: 75, y: 75, label: "CB", playerId: "carvajal" },
//     { id: "lm", x: 15, y: 50, label: "LM", playerId: "carreras" },
//     { id: "cm1", x: 38, y: 52, label: "CM", playerId: "tchouameni" },
//     { id: "cm2", x: 62, y: 52, label: "CM", playerId: "valverde" },
//     { id: "rm", x: 85, y: 50, label: "RM", playerId: "mastantuono" },
//     { id: "lw", x: 15, y: 20, label: "LW", playerId: "vinicius" },
//     { id: "st", x: 50, y: 15, label: "ST", playerId: "mbappe" },
//     { id: "rw", x: 85, y: 20, label: "RW", playerId: "arda" },
//   ],
//   "4-5-1": [
//     { id: "gk", x: 50, y: 92, label: "GK", playerId: "courtois" },
//     { id: "lb", x: 15, y: 72, label: "LB", playerId: "carreras" },
//     { id: "cb1", x: 38, y: 75, label: "CB", playerId: "militao" },
//     { id: "cb2", x: 62, y: 75, label: "CB", playerId: "huijsen" },
//     { id: "rb", x: 85, y: 72, label: "RB", playerId: "carvajal" },
//     { id: "lm", x: 10, y: 45, label: "LM", playerId: "vinicius" },
//     { id: "cm1", x: 30, y: 48, label: "CM", playerId: "tchouameni" },
//     { id: "cm2", x: 50, y: 45, label: "CM", playerId: "valverde" },
//     { id: "cm3", x: 70, y: 48, label: "CM", playerId: "arda" },
//     { id: "rm", x: 90, y: 45, label: "RM", playerId: "mastantuono" },
//     { id: "st", x: 50, y: 15, label: "ST", playerId: "mbappe" },
//   ],
// };

// export default function FormationScreen() {
//   const insets = useSafeAreaInsets();
//   const [selectedFormation, setSelectedFormation] = useState<string>("4-3-3");
//   const [positions, setPositions] = useState<PositionSlot[]>(
//     FORMATIONS["4-3-3"]
//   );
//   const [showDropdown, setShowDropdown] = useState(false);
//   const [showNames, setShowNames] = useState(true);
//   const pitchRef = useRef<View>(null);
//   const [pitchLayout, setPitchLayout] = useState({
//     x: 0,
//     y: 0,
//     width: 0,
//     height: 0,
//   });
//   const substitutesRef = useRef<View>(null);
//   const [substitutesLayout, setSubstitutesLayout] = useState({
//     x: 0,
//     y: 0,
//     width: 0,
//     height: 0,
//   });
//   const scrollRef = useRef<ScrollView>(null);
//   const [isDragging, setIsDragging] = useState(false);

//   const handleFormationChange = (formation: string) => {
//     setSelectedFormation(formation);
//     setPositions(FORMATIONS[formation]);
//     setShowDropdown(false);
//   };

//   const handleReset = () => {
//     setPositions(FORMATIONS[selectedFormation]);
//   };
//   const handleDownload = async () => {
//     try {
//       if (!pitchRef.current) return;

//       const uri = await captureRef(pitchRef, {
//         format: "png",
//         quality: 1,
//       });

//       if (Platform.OS === "web") {
//         const link = document.createElement("a");
//         link.href = uri;
//         link.download = `formation-${selectedFormation}-${Date.now()}.png`;
//         link.click();
//       } else {
//         const destination = new File(
//           Paths.cache,
//           `formation-${selectedFormation}-${Date.now()}.png`
//         );
//         const source = new File(uri);
//         source.copy(destination);

//         if (await Sharing.isAvailableAsync()) {
//           await Sharing.shareAsync(source.uri);
//         } else {
//           Alert.alert("Success", "Formation saved!");
//         }
//       }
//     } catch (error) {
//       console.error("Error downloading formation:", error);
//       Alert.alert("Error", "Failed to download formation");
//     }
//   };

//   const getPlayerById = (playerId: string | null): Player | null => {
//     if (!playerId) return null;
//     return [...PLAYERS, ...SUBSTITUTES].find((p) => p.id === playerId) || null;
//   };

//   const swapPlayers = (slotId: string, newPlayerId: string) => {
//     setPositions((prev) => {
//       const newPositions = [...prev];
//       const targetSlot = newPositions.find((s) => s.id === slotId);
//       const sourceSlot = newPositions.find((s) => s.playerId === newPlayerId);

//       if (targetSlot) {
//         const oldPlayerId = targetSlot.playerId;
//         targetSlot.playerId = newPlayerId;

//         if (sourceSlot && oldPlayerId) {
//           sourceSlot.playerId = oldPlayerId;
//         } else if (sourceSlot) {
//           sourceSlot.playerId = null;
//         }
//       }

//       return newPositions;
//     });
//   };

//   const swapWithSubstitute = (slotId: string, newPlayerId: string) => {
//     setPositions((prev) =>
//       prev.map((slot) =>
//         slot.id === slotId ? { ...slot, playerId: newPlayerId } : slot
//       )
//     );
//   };

//   const addPlayerToSlot = (playerId: string) => {
//     const emptySlot = positions.find((s) => s.playerId === null);
//     if (emptySlot) {
//       setPositions((prev) =>
//         prev.map((slot) =>
//           slot.id === emptySlot.id ? { ...slot, playerId } : slot
//         )
//       );
//     }
//   };

//   const findNearestSlot = (x: number, y: number): PositionSlot | null => {
//     const SNAP_DISTANCE = 60;
//     let nearest: PositionSlot | null = null;
//     let minDistance = SNAP_DISTANCE;

//     positions.forEach((slot) => {
//       const slotX = (slot.x / 100) * pitchLayout.width;
//       const slotY = (slot.y / 100) * pitchLayout.height;
//       const distance = Math.sqrt(
//         Math.pow(x - slotX, 2) + Math.pow(y - slotY, 2)
//       );

//       if (distance < minDistance) {
//         minDistance = distance;
//         nearest = slot;
//       }
//     });

//     return nearest;
//   };

//   const removePlayerFromSlot = (slotId: string) => {
//     setPositions((prev) =>
//       prev.map((slot) =>
//         slot.id === slotId ? { ...slot, playerId: null } : slot
//       )
//     );
//   };

//   const getAvailableSubstitutes = () => {
//     const usedPlayerIds = positions.map((p) => p.playerId).filter(Boolean);
//     return SUBSTITUTES.filter((sub) => !usedPlayerIds.includes(sub.id));
//   };

//   return (
//     <View style={[styles.container, { backgroundColor: colors.background }]}>
//       <View
//         style={[
//           styles.header,
//           {
//             backgroundColor: colors.card,
//             borderBottomColor: colors.border,
//           },
//         ]}
//       >
//         <Text style={[styles.headerTitle, { color: colors.textWhite }]}>
//           Formation Builder
//         </Text>

//         <Pressable
//           style={[
//             styles.formationDropdown,
//             {
//               backgroundColor: colors.backgroundSecondary,
//               borderColor: colors.border,
//             },
//           ]}
//           onPress={() => setShowDropdown(!showDropdown)}
//         >
//           <Text style={[styles.formationDropdownText, { color: colors.text }]}>
//             {selectedFormation}
//           </Text>
//           <ChevronDown size={20} color={colors.text} />
//         </Pressable>

//         <TouchableOpacity
//           style={styles.downloadButton}
//           onPress={handleDownload}
//         >
//           <Text>Download </Text>
//           <Download size={20} color="#fff" />
//         </TouchableOpacity>

//         {showDropdown && (
//           <View
//             style={[
//               styles.dropdownMenu,
//               { backgroundColor: colors.card, borderColor: colors.border },
//             ]}
//           >
//             {Object.keys(FORMATIONS).map((formation) => (
//               <Pressable
//                 key={formation}
//                 style={[
//                   styles.dropdownItem,
//                   selectedFormation === formation && {
//                     backgroundColor: colors.backgroundSecondary,
//                   },
//                 ]}
//                 onPress={() => handleFormationChange(formation)}
//               >
//                 <Text
//                   style={[
//                     styles.dropdownItemText,
//                     {
//                       color:
//                         selectedFormation === formation
//                           ? colors.primary
//                           : colors.text,
//                     },
//                   ]}
//                 >
//                   {formation}
//                 </Text>
//               </Pressable>
//             ))}
//           </View>
//         )}
//       </View>

//       <ScrollView
//         ref={scrollRef}
//         contentContainerStyle={styles.content}
//         scrollEnabled={!isDragging}
//       >
//         <View
//           ref={pitchRef}
//           style={styles.pitchContainer}
//           onLayout={(e) => {
//             const { x, y, width, height } = e.nativeEvent.layout;
//             setPitchLayout({ x, y, width, height });
//           }}
//         >
//           <Image
//             source={PITCH_IMAGE.uri}
//             style={styles.pitchImage}
//             resizeMode="contain"
//           />

//           <Image
//             source={{ uri: COACH_IMAGE }}
//             style={styles.coachImage}
//             resizeMode="cover"
//           />

//           {positions.map((slot) => {
//             const player = getPlayerById(slot.playerId);
//             return (
//               <DraggablePlayer
//                 key={slot.id}
//                 slot={slot}
//                 player={player}
//                 showName={showNames}
//                 onDrop={(playerId) => swapPlayers(slot.id, playerId)}
//                 onRemove={() => removePlayerFromSlot(slot.id)}
//                 pitchWidth={pitchLayout.width || PITCH_WIDTH}
//                 pitchHeight={pitchLayout.height || PITCH_HEIGHT}
//                 pitchLayout={pitchLayout}
//                 findNearestSlot={findNearestSlot}
//                 setIsDragging={setIsDragging}
//                 substitutesLayout={substitutesLayout}
//               />
//             );
//           })}
//         </View>

//         <View style={styles.actions}>
//           <Pressable
//             style={[
//               styles.actionButton,
//               { backgroundColor: colors.card, borderColor: colors.border },
//             ]}
//             onPress={() => setShowNames(!showNames)}
//           >
//             {showNames ? (
//               <EyeOff size={20} color={colors.textWhite} />
//             ) : (
//               <Eye size={20} color={colors.textWhite} />
//             )}
//             <Text
//               style={[styles.actionButtonText, { color: colors.textWhite }]}
//             >
//               {showNames ? "Hide Names" : "Show Names"}
//             </Text>
//           </Pressable>
//           <Pressable
//             style={[
//               styles.actionButton,
//               { backgroundColor: colors.card, borderColor: colors.border },
//             ]}
//             onPress={handleReset}
//           >
//             <RotateCcw size={20} color={colors.textWhite} />
//             <Text
//               style={[styles.actionButtonText, { color: colors.textWhite }]}
//             >
//               Reset
//             </Text>
//           </Pressable>
//         </View>

//         <View
//           ref={substitutesRef}
//           style={styles.substitutesSection}
//           onLayout={(e) => {
//             substitutesRef.current?.measure(
//               (x, y, width, height, pageX, pageY) => {
//                 setSubstitutesLayout({ x: pageX, y: pageY, width, height });
//               }
//             );
//           }}
//         >
//           <Text style={[styles.substitutesTitle, { color: colors.textWhite }]}>
//             Substitutes
//           </Text>
//           <View style={styles.substitutesGrid}>
//             {getAvailableSubstitutes().map((sub) => (
//               <SubstitutePlayer
//                 key={sub.id}
//                 player={sub}
//                 showName={showNames}
//                 onDrop={addPlayerToSlot}
//                 onSwap={swapWithSubstitute}
//                 pitchLayout={pitchLayout}
//                 findNearestSlot={findNearestSlot}
//                 setIsDragging={setIsDragging}
//               />
//             ))}
//           </View>
//         </View>
//       </ScrollView>
//     </View>
//   );
// }

// interface DraggablePlayerProps {
//   slot: PositionSlot;
//   player: Player | null;
//   showName: boolean;
//   onDrop: (playerId: string) => void;
//   onRemove: () => void;
//   pitchWidth: number;
//   pitchHeight: number;
//   pitchLayout: { x: number; y: number; width: number; height: number };
//   findNearestSlot: (x: number, y: number) => PositionSlot | null;
//   setIsDragging: (dragging: boolean) => void;
//   substitutesLayout: { x: number; y: number; width: number; height: number };
// }

// function DraggablePlayer({
//   slot,
//   player,
//   showName,
//   onDrop,
//   onRemove,
//   pitchWidth,
//   pitchHeight,
//   pitchLayout,
//   findNearestSlot,
//   setIsDragging: setParentDragging,
//   substitutesLayout,
// }: DraggablePlayerProps) {
//   const pan = useRef(new Animated.ValueXY()).current;
//   const [isDragging, setIsDragging] = useState(false);
//   const [initialPosition, setInitialPosition] = useState({ x: 0, y: 0 });

//   const panResponder = useRef(
//     PanResponder.create({
//       onStartShouldSetPanResponder: () => !!player,
//       onMoveShouldSetPanResponder: () => !!player,
//       onPanResponderGrant: (e) => {
//         setIsDragging(true);
//         setParentDragging(true);
//         e.currentTarget.measure((x, y, width, height, pageX, pageY) => {
//           setInitialPosition({ x: pageX, y: pageY });
//         });
//         pan.setOffset({
//           x: (pan.x as any)._value,
//           y: (pan.y as any)._value,
//         });
//         pan.setValue({ x: 0, y: 0 });
//       },
//       onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
//         useNativeDriver: false,
//       }),
//       onPanResponderRelease: (e, gestureState) => {
//         setIsDragging(false);
//         setParentDragging(false);
//         pan.flattenOffset();

//         const currentX = initialPosition.x + (pan.x as any)._value;
//         const currentY = initialPosition.y + (pan.y as any)._value;

//         const isInSubstitutesArea =
//           currentX >= substitutesLayout.x &&
//           currentX <= substitutesLayout.x + substitutesLayout.width &&
//           currentY >= substitutesLayout.y &&
//           currentY <= substitutesLayout.y + substitutesLayout.height;

//         if (isInSubstitutesArea && player) {
//           onRemove();
//         } else {
//           const pitchRelativeX = currentX - pitchLayout.x;
//           const pitchRelativeY = currentY - pitchLayout.y;
//           const nearestSlot = findNearestSlot(pitchRelativeX, pitchRelativeY);

//           if (nearestSlot && nearestSlot.id !== slot.id && player) {
//             onDrop(player.id);
//             if (nearestSlot.playerId) {
//               onDrop(nearestSlot.playerId);
//             }
//           }
//         }

//         Animated.spring(pan, {
//           toValue: { x: 0, y: 0 },
//           useNativeDriver: false,
//         }).start();
//       },
//     })
//   ).current;

//   const left = (slot.x / 100) * pitchWidth - PLAYER_SIZE / 2;
//   const top = (slot.y / 100) * pitchHeight - PLAYER_SIZE / 2;

//   return (
//     <Animated.View
//       style={[
//         styles.playerSlot,
//         {
//           left,
//           top,
//           transform: pan.getTranslateTransform(),
//           zIndex: isDragging ? 1000 : 1,
//         },
//       ]}
//       {...panResponder.panHandlers}
//     >
//       {player ? (
//         <>
//           <Image source={{ uri: player.imageUrl }} style={styles.playerImage} />
//           {showName && (
//             <View style={styles.playerNameContainer}>
//               <Text style={styles.playerName}>{player.name}</Text>
//               <Text style={styles.playerNumber}>{player.number}</Text>
//             </View>
//           )}
//         </>
//       ) : (
//         <View style={styles.emptySlot}>
//           <Text style={styles.emptySlotText}>{slot.label}</Text>
//         </View>
//       )}
//     </Animated.View>
//   );
// }

// interface SubstitutePlayerProps {
//   player: Player;
//   showName: boolean;
//   onDrop: (playerId: string) => void;
//   pitchLayout: { x: number; y: number; width: number; height: number };
//   onSwap: (slotId: string, playerId: string) => void;
//   findNearestSlot: (x: number, y: number) => PositionSlot | null;
//   setIsDragging: (dragging: boolean) => void;
// }

// function SubstitutePlayer({ player, showName, onDrop, onSwap, pitchLayout, findNearestSlot, setIsDragging: setParentDragging }: SubstitutePlayerProps) {
//   const pan = useRef(new Animated.ValueXY()).current;
//   const [isDragging, setIsDragging] = useState(false);
//   const [initialPosition, setInitialPosition] = useState({ x: 0, y: 0 });

//   const panResponder = useRef(
//     PanResponder.create({
//       onStartShouldSetPanResponder: () => true,
//       onMoveShouldSetPanResponder: () => true,
//       onPanResponderGrant: (e) => {
//         setIsDragging(true);
//         setParentDragging(true);
//         e.currentTarget.measure((x, y, width, height, pageX, pageY) => {
//           setInitialPosition({ x: pageX, y: pageY });
//         });
//         pan.setOffset({
//           x: (pan.x as any)._value,
//           y: (pan.y as any)._value,
//         });
//         pan.setValue({ x: 0, y: 0 });
//       },
//       onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
//         useNativeDriver: false,
//       }),
//       onPanResponderRelease: () => {
//         setIsDragging(false);
//         setParentDragging(false);
//         pan.flattenOffset();

//         const currentX =
//           initialPosition.x + (pan.x as any)._value - pitchLayout.x;
//         const currentY =
//           initialPosition.y + (pan.y as any)._value - pitchLayout.y;

//         const nearestSlot = findNearestSlot(currentX, currentY);

//         if (nearestSlot) {
//           if (nearestSlot.playerId) {
//             onSwap(nearestSlot.id, player.id);
//           } else {
//             onDrop(player.id);
//           }
//         }

//         Animated.spring(pan, {
//           toValue: { x: 0, y: 0 },
//           useNativeDriver: false,
//         }).start();
//       },
//     })
//   ).current;

//   return (
//     <Animated.View
//       style={[
//         styles.substitutePlayer,
//         {
//           transform: pan.getTranslateTransform(),
//           zIndex: isDragging ? 1000 : 1,
//         },
//       ]}
//       {...panResponder.panHandlers}
//     >
//       <Image source={{ uri: player.imageUrl }} style={styles.substituteImage} />
//       {showName && (
//         <View style={styles.substituteInfo}>
//           <Text style={styles.substituteName}>{player.name}</Text>
//           <Text style={styles.substituteNumber}>{player.number}</Text>
//         </View>
//       )}
//     </Animated.View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   header: {
//     alignItems: "center",
//     paddingHorizontal: 16,
//     paddingBottom: 16,
//     borderBottomWidth: 1,
//     position: "relative",
//   },
//   headerTitle: {
//     fontSize: 28,
//     fontWeight: "700" as const,
//     marginBottom: 12,
//   },
//   formationDropdown: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderRadius: 12,
//     borderWidth: 1,
//   },
//   formationDropdownText: {
//     fontSize: 16,
//     fontWeight: "600" as const,
//   },
//   dropdownMenu: {
//     position: "absolute",
//     top: "100%",
//     left: 16,
//     right: 16,
//     marginTop: 4,
//     borderRadius: 12,
//     borderWidth: 1,
//     zIndex: 1000,
//     ...Platform.select({
//       ios: {
//         shadowColor: "#000",
//         shadowOffset: { width: 0, height: 4 },
//         shadowOpacity: 0.15,
//         shadowRadius: 8,
//       },
//       android: {
//         elevation: 8,
//       },
//     }),
//   },
//   dropdownItem: {
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderRadius: 8,
//   },
//   dropdownItemText: {
//     fontSize: 16,
//     fontWeight: "500" as const,
//   },
//   content: {
//     padding: 16,
//   },
//   pitchContainer: {
//     width: "100%",
//     height: PITCH_HEIGHT,
//     borderRadius: 16,
//     overflow: "hidden",
//     position: "relative",
//   },
//   pitchImage: {
//     width: "100%",
//     height: "100%",
//     position: "absolute",
//   },
//   coachImage: {
//     position: "absolute",
//     bottom: 16,
//     left: 16,
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     borderWidth: 3,
//     borderColor: "#fff",
//   },
//   playerSlot: {
//     position: "absolute",
//     width: PLAYER_SIZE,
//     height: PLAYER_SIZE,
//   },
//   playerImage: {
//     width: PLAYER_SIZE,
//     height: PLAYER_SIZE,
//     borderRadius: PLAYER_SIZE / 2,
//     borderWidth: 3,
//     borderColor: "#fff",
//   },
//   playerNameContainer: {
//     position: "absolute",
//     bottom: -24,
//     left: 0,
//     right: 0,
//     alignItems: "center",
//     backgroundColor: "rgba(0, 0, 0, 0.7)",
//     paddingVertical: 2,
//     paddingHorizontal: 4,
//     borderRadius: 4,
//   },
//   playerName: {
//     color: "#fff",
//     fontSize: 10,
//     fontWeight: "700" as const,
//   },
//   playerNumber: {
//     color: "#fff",
//     fontSize: 8,
//     fontWeight: "500" as const,
//   },
//   emptySlot: {
//     width: PLAYER_SIZE,
//     height: PLAYER_SIZE,
//     borderRadius: PLAYER_SIZE / 2,
//     backgroundColor: "rgba(128, 128, 128, 0.3)",
//     borderWidth: 2,
//     borderColor: "rgba(255, 255, 255, 0.5)",
//     borderStyle: "dashed",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   emptySlotText: {
//     color: "#fff",
//     fontSize: 12,
//     fontWeight: "700" as const,
//   },
//   actions: {
//     flexDirection: "row",
//     gap: 12,
//     marginTop: 24,
//   },
//   actionButton: {
//     flex: 1,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 14,
//     borderRadius: 12,
//     borderWidth: 1,
//     gap: 8,
//   },
//   actionButtonText: {
//     fontSize: 14,
//     fontWeight: "600" as const,
//   },
//   substitutesSection: {
//     marginTop: 32,
//   },
//   substitutesTitle: {
//     fontSize: 20,
//     fontWeight: "700" as const,
//     marginBottom: 16,
//   },
//   substitutesGrid: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     gap: 16,
//   },
//   substitutePlayer: {
//     alignItems: "center",
//     width: 80,
//   },
//   substituteImage: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     borderWidth: 3,
//     borderColor: "#fff",
//   },
//   substituteInfo: {
//     marginTop: 4,
//     alignItems: "center",
//   },
//   substituteName: {
//     fontSize: 12,
//     fontWeight: "700" as const,
//     color: colors.textWhite,
//   },
//   substituteNumber: {
//     fontSize: 10,
//     fontWeight: "500" as const,
//     color: colors.textWhite,
//   },
//   downloadButton: {
//     backgroundColor: "#16a34a",
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderRadius: 8,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//   },
// });
import Colors from "@/constants/colors";
import { Stack } from "expo-router";
import React, { useRef } from "react";
import {
  Platform,
  StyleSheet,
  View
} from "react-native";

import { WebView } from "react-native-webview";
export default function CreateFormationScreen() {
  const htmlSource = Platform.select({
    default: { uri: "http://localhost:5000" },
    android: { uri: "http://192.168.110.111:5000" },
  });
  const pitchRef = useRef<WebView>(null);
  return (
    <>
      <Stack.Screen
        options={{
          title: "Create Formation",
          headerStyle: {
            backgroundColor: Colors.secondary,
          },
          headerTintColor: Colors.textWhite,
          headerTitleStyle: {
            fontWeight: "700" as const,
          },
        }}
      />
      <View style={styles.container}>
        <WebView
          ref={pitchRef}
          source={htmlSource}
          style={styles.webview}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.text,
    margin: 0,
    padding: 0,
  },
  webview: {
    flex: 1,
    backgroundColor: "transparent",
    margin: 0,
    padding: 0,
  },
});