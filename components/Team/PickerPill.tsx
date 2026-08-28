import React, { useState } from "react";
import { FlatList, Modal, View, type TextStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Check, ChevronDown, X } from "lucide-react-native";
import { Text } from "@/components/Text";
import Touchable from "@/components/Touchable";
import Colors from "@/constants/colors";

export interface PickerOption<T extends string | number> {
  value: T;
  label: string;
  /** Leading crest or flag on the option row. */
  iconUri?: string;
  /** Secondary line, e.g. a country. */
  caption?: string;
}

interface Props<T extends string | number> {
  /** Sheet heading, and the a11y name of the control. */
  title: string;
  options: PickerOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Leading icon on the pill itself. */
  iconUri?: string;
  /** Shown while `value` isn't in `options` yet — i.e. while the list loads. */
  placeholder?: string;
  disabled?: boolean;
  /**
   * For digit labels like "26/27". Without an explicit LTR direction, bidi
   * reorders that to "27/26" next to Arabic text.
   */
  numeric?: boolean;
  /** Stops a long competition name pushing its sibling pill off screen. */
  maxWidth?: number;
}

/**
 * A pill that opens a list of options.
 *
 * Presented in a React Native `Modal` rather than an in-scene overlay or a
 * pushed route, and that choice is load-bearing. The team tabs are a
 * MaterialTopTabs pager with `swipeEnabled: true`, so an overlay rendered inside
 * the scene sits inside the pager's pan responder — a horizontal drag across the
 * option list would swipe to the next tab mid-selection. It would also be
 * clipped by the scene and sit under the tab bar. A pushed route risks the
 * Fabric pager-index reset that team/_layout.tsx documents. `Modal` renders into
 * its own native window, above all of it.
 *
 * Every option is already in memory, so the sheet has no loading state.
 */
export default function PickerPill<T extends string | number>({
  title,
  options,
  value,
  onChange,
  iconUri,
  placeholder,
  disabled = false,
  numeric = false,
  maxWidth,
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const selected = options.find((o) => o.value === value);
  const label = selected?.label ?? placeholder ?? "—";
  const interactive = !disabled && options.length > 1;

  const numericStyle: TextStyle | null = numeric
    ? { fontVariant: ["tabular-nums"], writingDirection: "ltr" }
    : null;

  return (
    <>
      <Touchable
        onPress={() => setOpen(true)}
        disabled={!interactive}
        accessibilityRole="button"
        accessibilityState={{ expanded: open, disabled: !interactive }}
        accessibilityLabel={`${title}: ${label}`}
        style={({ pressed }) => [
          {
            flexDirection: "row",
            alignItems: "center",
            height: 36,
            borderRadius: 18,
            paddingHorizontal: 14,
            backgroundColor: Colors.background.card,
            borderWidth: 1,
            borderColor: Colors.border.default,
            opacity: !interactive ? 0.6 : pressed ? 0.85 : 1,
            // Shrink rather than overflow: two pills at their natural widths
            // exceed the row on a narrow phone, and without this the second one
            // is pushed off screen instead of the first one ellipsising.
            flexShrink: 1,
          },
          maxWidth ? { maxWidth } : null,
        ]}
      >
        {iconUri ? <Crest uri={iconUri} size={16} /> : null}

        <Text
          className="text-[13px] font-semibold"
          // flexShrink is load-bearing: with maxWidth clamping the pill, a long
          // competition name that refuses to shrink pushes the chevron out past
          // the rounded border instead of ellipsising.
          style={[{ flexShrink: 1, color: Colors.text.primary }, numericStyle]}
          numberOfLines={1}
          maxFontSizeMultiplier={1.2}
        >
          {label}
        </Text>

        {interactive ? (
          <ChevronDown
            size={14}
            color={Colors.text.tertiary}
            style={{ marginStart: 6, flexShrink: 0 }}
          />
        ) : null}
      </Touchable>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
        statusBarTranslucent
      >
        <Touchable
          onPress={() => setOpen(false)}
          accessibilityRole="button"
          accessibilityLabel={title}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)" }}
        />

        <View
          accessibilityViewIsModal
          style={{
            position: "absolute",
            start: 0,
            end: 0,
            bottom: 0,
            maxHeight: "70%",
            backgroundColor: Colors.background.deepDark,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            borderTopWidth: 1,
            borderColor: Colors.border.default,
            paddingBottom: insets.bottom + 8,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 14,
            }}
          >
            <Text
              className="text-[17px] font-bold"
              style={{ flex: 1, color: Colors.text.primary }}
            >
              {title}
            </Text>
            <Touchable
              onPress={() => setOpen(false)}
              accessibilityRole="button"
              accessibilityLabel={title}
              hitSlop={10}
              style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
            >
              <X size={20} color={Colors.text.tertiary} />
            </Touchable>
          </View>

          <FlatList
            data={options}
            keyExtractor={(o) => String(o.value)}
            accessibilityRole="radiogroup"
            renderItem={({ item }) => {
              const active = item.value === value;
              return (
                <Touchable
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active }}
                  accessibilityLabel={item.label}
                  style={({ pressed }) => [
                    {
                      flexDirection: "row",
                      alignItems: "center",
                      minHeight: 52,
                      paddingHorizontal: 16,
                      borderBottomWidth: 1,
                      borderBottomColor: Colors.border.default,
                    },
                    pressed && { backgroundColor: Colors.background.card },
                  ]}
                >
                  {item.iconUri ? (
                    <Crest uri={item.iconUri} size={22} marginEnd={12} />
                  ) : null}

                  <View style={{ flex: 1 }}>
                    <Text
                      className="text-[15px] font-semibold"
                      style={[
                        { color: active ? Colors.darkGold : Colors.text.primary },
                        numericStyle,
                      ]}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                    {item.caption ? (
                      <Text
                        className="text-[11px]"
                        style={{ color: Colors.text.tertiary, marginTop: 2 }}
                        numberOfLines={1}
                      >
                        {item.caption}
                      </Text>
                    ) : null}
                  </View>

                  {active ? (
                    <Check
                      size={16}
                      color={Colors.darkGold}
                      style={{ marginStart: 12 }}
                    />
                  ) : null}
                </Touchable>
              );
            }}
          />
        </View>
      </Modal>
    </>
  );
}

/**
 * A competition crest on a light backing.
 *
 * Several are near-black on transparent — the UEFA Champions League mark is
 * dark navy — so drawn straight onto a #2F2F2F pill or a #1A1A1A sheet they
 * read as a smudge. The white plate is what these marks are designed to sit on.
 */
function Crest({
  uri,
  size,
  marginEnd = 6,
}: {
  uri: string;
  size: number;
  marginEnd?: number;
}) {
  const box = size + 6;
  return (
    <View
      style={{
        width: box,
        height: box,
        borderRadius: 5,
        marginEnd,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: Colors.brand.white,
      }}
    >
      <Image
        source={{ uri }}
        style={{ width: size, height: size }}
        contentFit="contain"
      />
    </View>
  );
}
