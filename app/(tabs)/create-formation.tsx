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

// import { COACH, FORMATIONS, FormationType, Player, PLAYERS } from '@/mocks/formation';
// import { File, Paths } from "expo-file-system";
// import { Stack } from 'expo-router';
// import * as Sharing from 'expo-sharing';
// import { ChevronDown, Download, RotateCcw } from 'lucide-react-native';
// import React, { useRef, useState } from 'react';
// import {
//   Alert,
//   Animated,
//   Image,
//   ImageBackground,
//   PanResponder,
//   Platform,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from 'react-native';
// import { captureRef } from 'react-native-view-shot';

// const PLAYER_SIZE = 80;
// const PITCH_MIN_HEIGHT = 872;

// export default function CreateFormation() {
//   const [selectedFormation, setSelectedFormation] = useState<FormationType>('4-3-3');
//   const [showFormationDropdown, setShowFormationDropdown] = useState(false);
//   const [showPlayerNames, setShowPlayerNames] = useState(true);
//   const [pitchLayout, setPitchLayout] = useState({ width: 0, height: 0, x: 0, y: 0 });
//   const [isDragging, setIsDragging] = useState(false);
//   const pitchRef = useRef<View>(null);
//   const scrollViewRef = useRef<ScrollView>(null);

//   const initialStarters = PLAYERS.filter(p => p.isStarter);
//   const initialSubs = PLAYERS.filter(p => !p.isStarter);

//   const [startersOnPitch, setStartersOnPitch] = useState<(Player | null)[]>(
//     initialStarters.slice(0, 11)
//   );
//   const [substitutes, setSubstitutes] = useState<Player[]>(initialSubs);

//   const formationPositions = FORMATIONS[selectedFormation];

//   const handleFormationChange = (formation: FormationType) => {
//     setSelectedFormation(formation);
//     setShowFormationDropdown(false);
//   };

//   const handleReset = () => {
//     setStartersOnPitch(initialStarters.slice(0, 11));
//     setSubstitutes(initialSubs);
//     setSelectedFormation('4-3-3');
//   };

//   const handleDownload = async () => {
//     try {
//       if (!pitchRef.current) return;

//       const uri = await captureRef(pitchRef, {
//         format: 'png',
//         quality: 1,
//       });

//       if (Platform.OS === 'web') {
//         const link = document.createElement('a');
//         link.href = uri;
//         link.download = `formation-${selectedFormation}-${Date.now()}.png`;
//         link.click();
//       } else {
//         const destination = new File(Paths.cache, `formation-${selectedFormation}-${Date.now()}.png`);
//         const source = new File(uri);
//         source.copy(destination);

//         if (await Sharing.isAvailableAsync()) {
//           await Sharing.shareAsync(source.uri);
//         } else {
//           Alert.alert('Success', 'Formation saved!');
//         }
//       }
//     } catch (error) {
//       console.error('Error downloading formation:', error);
//       Alert.alert('Error', 'Failed to download formation');
//     }
//   };

//   const getPositionOnPitch = (index: number) => {
//     if (!formationPositions[index] || !pitchLayout.width || !pitchLayout.height) {
//       return { x: 0, y: 0 };
//     }
//     const pos = formationPositions[index];
//     return {
//       x: (pos.x / 100) * pitchLayout.width - PLAYER_SIZE / 2,
//       y: (pos.y / 100) * pitchLayout.height - PLAYER_SIZE / 2,
//     };
//   };

//   return (
//     <View style={styles.container}>
//       <Stack.Screen
//         options={{
//           title: 'Formation Builder',
//           headerStyle: { backgroundColor: '#1a1a2e' },
//           headerTintColor: '#fff',
//         }}
//       />

//       <ScrollView
//         ref={scrollViewRef}
//         style={styles.scrollView}
//         contentContainerStyle={styles.scrollContent}
//         scrollEnabled={!isDragging}
//       >
//         <View style={styles.controls}>
//           <TouchableOpacity
//             style={styles.dropdown}
//             onPress={() => setShowFormationDropdown(!showFormationDropdown)}
//           >
//             <Text style={styles.dropdownText}>{selectedFormation}</Text>
//             <ChevronDown size={20} color="#fff" />
//           </TouchableOpacity>

//           <TouchableOpacity style={styles.toggleButton} onPress={() => setShowPlayerNames(!showPlayerNames)}>
//             <Text style={styles.toggleButtonText}>
//               {showPlayerNames ? 'Hide Names' : 'Show Names'}
//             </Text>
//           </TouchableOpacity>

//           <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
//             <RotateCcw size={20} color="#fff" />
//             <Text style={styles.resetButtonText}>Reset</Text>
//           </TouchableOpacity>

//           <TouchableOpacity style={styles.downloadButton} onPress={handleDownload}>
//             <Download size={20} color="#fff" />
//           </TouchableOpacity>
//         </View>

//         {showFormationDropdown && (
//           <View style={styles.dropdownMenu}>
//             {(Object.keys(FORMATIONS) as FormationType[]).map((formation) => (
//               <TouchableOpacity
//                 key={formation}
//                 style={[
//                   styles.dropdownItem,
//                   selectedFormation === formation && styles.dropdownItemActive,
//                 ]}
//                 onPress={() => handleFormationChange(formation)}
//               >
//                 <Text
//                   style={[
//                     styles.dropdownItemText,
//                     selectedFormation === formation && styles.dropdownItemTextActive,
//                   ]}
//                 >
//                   {formation}
//                 </Text>
//               </TouchableOpacity>
//             ))}
//           </View>
//         )}

//         <View
//           ref={pitchRef}
//           style={styles.pitchContainer}
//           onLayout={(e) => {
//             const { width, height, x, y } = e.nativeEvent.layout;
//             setPitchLayout({ width, height, x, y });
//           }}
//         >
//           <ImageBackground
//             source={{ uri: 'https://casamadridista.com/wp-content/uploads/2025/08/formation-copy.png' }}
//             style={styles.pitch}
//             resizeMode="contain"
//           >
//             {formationPositions.map((pos, index) => {
//               const player = startersOnPitch[index];
//               const position = getPositionOnPitch(index);

//               return (
//                 <DraggablePlayer
//                   key={`position-${index}`}
//                   player={player}
//                   position={position}
//                   positionLabel={pos.position}
//                   showName={showPlayerNames}
//                   onDragStart={() => setIsDragging(true)}
//                   onDragEnd={() => setIsDragging(false)}
//                   onDrop={(droppedPlayer) => {
//                     const newStarters = [...startersOnPitch];
//                     newStarters[index] = droppedPlayer;
//                     setStartersOnPitch(newStarters);
//                   }}
//                   onRemove={() => {
//                     if (player) {
//                       setSubstitutes([...substitutes, player]);
//                       const newStarters = [...startersOnPitch];
//                       newStarters[index] = null;
//                       setStartersOnPitch(newStarters);
//                     }
//                   }}
//                 />
//               );
//             })}

//             <View style={styles.coachContainer}>
//               <Image source={{ uri: COACH.image }} style={styles.coachImage} />
//               {showPlayerNames && <Text style={styles.coachName}>{COACH.name}</Text>}
//             </View>
//           </ImageBackground>
//         </View>

//         <View style={styles.substitutesContainer}>
//           <Text style={styles.substitutesTitle}>Substitutes</Text>
//           <ScrollView horizontal showsHorizontalScrollIndicator={false}>
//             <View style={styles.substitutesList}>
//               {substitutes.map((player) => (
//                 <DraggableSubstitute
//                   key={player.id}
//                   player={player}
//                   showName={showPlayerNames}
//                   onDragStart={() => setIsDragging(true)}
//                   onDragEnd={() => setIsDragging(false)}
//                   onPickup={() => {
//                     setSubstitutes(substitutes.filter(p => p.id !== player.id));
//                   }}
//                 />
//               ))}
//             </View>
//           </ScrollView>
//         </View>
//       </ScrollView>
//     </View>
//   );
// }

// interface DraggablePlayerProps {
//   player: Player | null;
//   position: { x: number; y: number };
//   positionLabel: string;
//   showName: boolean;
//   onDragStart: () => void;
//   onDragEnd: () => void;
//   onDrop: (player: Player) => void;
//   onRemove: () => void;
// }

// function DraggablePlayer({ player, position, positionLabel, showName, onDragStart, onDragEnd, onDrop, onRemove }: DraggablePlayerProps) {
//   const pan = useRef(new Animated.ValueXY(position)).current;
//   const [isLocalDragging, setIsLocalDragging] = useState(false);

//   React.useEffect(() => {
//     Animated.spring(pan, {
//       toValue: position,
//       useNativeDriver: false,
//       friction: 7,
//     }).start();
//   }, [position, pan]);

//   const panResponder = useRef(
//     PanResponder.create({
//       onStartShouldSetPanResponder: () => !!player,
//       onStartShouldSetPanResponderCapture: () => !!player,
//       onMoveShouldSetPanResponder: () => !!player,
//       onMoveShouldSetPanResponderCapture: () => !!player,
//       onPanResponderGrant: () => {
//         setIsLocalDragging(true);
//         onDragStart();
//         pan.setOffset({
//           x: (pan.x as any)._value,
//           y: (pan.y as any)._value,
//         });
//         pan.setValue({ x: 0, y: 0 });
//       },
//       onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
//         useNativeDriver: false,
//       }),
//       onPanResponderRelease: (_, gesture) => {
//         setIsLocalDragging(false);
//         onDragEnd();
//         pan.flattenOffset();

//         if (Math.abs(gesture.dy) > 100 || Math.abs(gesture.dx) > 100) {
//           onRemove();
//           Animated.spring(pan, {
//             toValue: position,
//             useNativeDriver: false,
//           }).start();
//         } else {
//           Animated.spring(pan, {
//             toValue: position,
//             useNativeDriver: false,
//             friction: 7,
//           }).start();
//         }
//       },
//     })
//   ).current;

//   return (
//     <Animated.View
//       style={[
//         styles.playerContainer,
//         {
//           transform: pan.getTranslateTransform(),
//         },
//         isLocalDragging && styles.playerDragging,
//       ]}
//       {...panResponder.panHandlers}
//     >
//       {player ? (
//         <>
//           <Image source={{ uri: player.image }} style={styles.playerImage} />
//           <View style={styles.playerNumber}>
//             <Text style={styles.playerNumberText}>{player.number}</Text>
//           </View>
//           {showName && <Text style={styles.playerName}>{player.name}</Text>}
//         </>
//       ) : (
//         <View style={styles.placeholder}>
//           <Text style={styles.placeholderText}>{positionLabel}</Text>
//         </View>
//       )}
//     </Animated.View>
//   );
// }

// interface DraggableSubstituteProps {
//   player: Player;
//   showName: boolean;
//   onDragStart: () => void;
//   onDragEnd: () => void;
//   onPickup: () => void;
// }

// function DraggableSubstitute({ player, showName, onDragStart, onDragEnd, onPickup }: DraggableSubstituteProps) {
//   const pan = useRef(new Animated.ValueXY()).current;
//   const [isLocalDragging, setIsLocalDragging] = useState(false);

//   const panResponder = useRef(
//     PanResponder.create({
//       onStartShouldSetPanResponder: () => true,
//       onStartShouldSetPanResponderCapture: () => true,
//       onMoveShouldSetPanResponder: () => true,
//       onMoveShouldSetPanResponderCapture: () => true,
//       onPanResponderGrant: () => {
//         setIsLocalDragging(true);
//         onDragStart();
//       },
//       onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
//         useNativeDriver: false,
//       }),
//       onPanResponderRelease: () => {
//         setIsLocalDragging(false);
//         onDragEnd();
//         pan.setValue({ x: 0, y: 0 });
//       },
//     })
//   ).current;

//   return (
//     <Animated.View
//       style={[
//         styles.substituteItem,
//         {
//           transform: pan.getTranslateTransform(),
//         },
//         isLocalDragging && styles.playerDragging,
//       ]}
//       {...panResponder.panHandlers}
//     >
//       <Image source={{ uri: player.image }} style={styles.playerImage} />
//       <View style={styles.playerNumber}>
//         <Text style={styles.playerNumberText}>{player.number}</Text>
//       </View>
//       {showName && <Text style={styles.playerName}>{player.name}</Text>}
//     </Animated.View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#0f0f1e',
//   },
//   scrollView: {
//     flex: 1,
//   },
//   scrollContent: {
//     paddingBottom: 20,
//   },
//   controls: {
//     flexDirection: 'row',
//     padding: 16,
//     gap: 12,
//     alignItems: 'center',
//   },
//   dropdown: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     backgroundColor: '#1a1a2e',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: '#2a2a3e',
//   },
//   dropdownText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600' as const,
//   },
//   dropdownMenu: {
//     marginHorizontal: 16,
//     marginBottom: 16,
//     backgroundColor: '#1a1a2e',
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: '#2a2a3e',
//     overflow: 'hidden',
//   },
//   dropdownItem: {
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: '#2a2a3e',
//   },
//   dropdownItemActive: {
//     backgroundColor: '#2a2a3e',
//   },
//   dropdownItemText: {
//     color: '#fff',
//     fontSize: 16,
//   },
//   dropdownItemTextActive: {
//     fontWeight: '600' as const,
//     color: '#ffd700',
//   },
//   toggleButton: {
//     backgroundColor: '#1a1a2e',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: '#2a2a3e',
//   },
//   toggleButtonText: {
//     color: '#fff',
//     fontSize: 14,
//     fontWeight: '600' as const,
//   },
//   resetButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//     backgroundColor: '#dc2626',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderRadius: 8,
//   },
//   resetButtonText: {
//     color: '#fff',
//     fontSize: 14,
//     fontWeight: '600' as const,
//   },
//   downloadButton: {
//     backgroundColor: '#16a34a',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderRadius: 8,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   pitchContainer: {
//     marginHorizontal: 16,
//     borderRadius: 12,
//     overflow: 'hidden',
//     elevation: 5,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,
//   },
//   pitch: {
//     width: '100%',
//     minHeight: PITCH_MIN_HEIGHT,
//     position: 'relative' as const,
//   },
//   playerContainer: {
//     position: 'absolute' as const,
//     width: PLAYER_SIZE,
//     height: PLAYER_SIZE,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   playerDragging: {
//     opacity: 0.8,
//     zIndex: 9999,
//     elevation: 9999,
//   },
//   playerImage: {
//     width: PLAYER_SIZE,
//     height: PLAYER_SIZE,
//     borderRadius: PLAYER_SIZE / 2,
//     borderWidth: 3,
//     borderColor: '#ffd700',
//     backgroundColor: '#fff',
//   },
//   playerNumber: {
//     position: 'absolute' as const,
//     bottom: -5,
//     right: -5,
//     backgroundColor: '#1a1a2e',
//     borderRadius: 12,
//     width: 24,
//     height: 24,
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderWidth: 2,
//     borderColor: '#ffd700',
//   },
//   playerNumberText: {
//     color: '#ffd700',
//     fontSize: 12,
//     fontWeight: '700' as const,
//   },
//   playerName: {
//     position: 'absolute' as const,
//     bottom: -25,
//     color: '#fff',
//     fontSize: 12,
//     fontWeight: '600' as const,
//     textAlign: 'center' as const,
//     backgroundColor: 'rgba(0, 0, 0, 0.7)',
//     paddingHorizontal: 6,
//     paddingVertical: 2,
//     borderRadius: 4,
//     minWidth: 80,
//   },
//   placeholder: {
//     width: PLAYER_SIZE,
//     height: PLAYER_SIZE,
//     borderRadius: PLAYER_SIZE / 2,
//     backgroundColor: 'rgba(128, 128, 128, 0.3)',
//     borderWidth: 2,
//     borderColor: 'rgba(255, 255, 255, 0.5)',
//     borderStyle: 'dashed' as const,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   placeholderText: {
//     color: '#fff',
//     fontSize: 12,
//     fontWeight: '600' as const,
//     textAlign: 'center' as const,
//   },
//   coachContainer: {
//     position: 'absolute' as const,
//     bottom: 20,
//     left: 20,
//     alignItems: 'center',
//   },
//   coachImage: {
//     width: PLAYER_SIZE,
//     height: PLAYER_SIZE,
//     borderRadius: PLAYER_SIZE / 2,
//     borderWidth: 3,
//     borderColor: '#fff',
//     backgroundColor: '#fff',
//   },
//   coachName: {
//     marginTop: 4,
//     color: '#fff',
//     fontSize: 12,
//     fontWeight: '600' as const,
//     textAlign: 'center' as const,
//     backgroundColor: 'rgba(0, 0, 0, 0.7)',
//     paddingHorizontal: 6,
//     paddingVertical: 2,
//     borderRadius: 4,
//   },
//   substitutesContainer: {
//     marginTop: 24,
//     paddingHorizontal: 16,
//     maxHeight: 200,
//   },
//   substitutesTitle: {
//     color: '#fff',
//     fontSize: 20,
//     fontWeight: '700' as const,
//     marginBottom: 16,
//   },
//   substitutesList: {
//     flexDirection: 'row',
//     gap: 16,
//     paddingVertical: 8,
//     paddingRight: 16,
//   },
//   substituteItem: {
//     alignItems: 'center',
//     width: PLAYER_SIZE,
//   },
// });
