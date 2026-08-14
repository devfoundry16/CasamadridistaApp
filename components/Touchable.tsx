import React, { useCallback, useState } from "react";
import {
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type PressableStateCallbackType,
  type StyleProp,
  type ViewStyle,
} from "react-native";

type Props = Omit<PressableProps, "style"> & {
  style?:
    | StyleProp<ViewStyle>
    | ((state: PressableStateCallbackType) => StyleProp<ViewStyle>);
};

/**
 * Pressable whose function-form `style` actually applies.
 *
 * NativeWind's css-interop replaces every React Native component at the
 * JSX-runtime level (`wrapJSX` swaps the type unconditionally, not just when a
 * className is present). Its wrapper treats the inline `style` prop as a style
 * *object* and spreads it — `assignToTarget(props, { ...declaration }, ...)` in
 * react-native-css-interop 0.2.1 — before handing the result to the real
 * component. Spreading a function yields `{}`, so
 *
 *     style={({ pressed }) => ({ flexDirection: "row", height: 64 })}
 *
 * silently resolves to no styles at all: layout, padding and colour all vanish
 * with no warning. Resolving the callback here means Pressable only ever
 * receives a plain object/array, which css-interop merges correctly.
 *
 * Use this instead of Pressable anywhere the style depends on press state.
 * A plain `style={{ ... }}` on a bare Pressable is unaffected and fine.
 */
export default function Touchable({
  style,
  onPressIn,
  onPressOut,
  ...rest
}: Props) {
  const [pressed, setPressed] = useState(false);

  const handlePressIn = useCallback(
    (event: GestureResponderEvent) => {
      setPressed(true);
      onPressIn?.(event);
    },
    [onPressIn],
  );

  const handlePressOut = useCallback(
    (event: GestureResponderEvent) => {
      setPressed(false);
      onPressOut?.(event);
    },
    [onPressOut],
  );

  return (
    <Pressable
      {...rest}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      // `hovered` is only in the type because expo's react-native-web
      // declarations merge it in; there is no hover on a touch device.
      style={typeof style === "function" ? style({ pressed, hovered: false }) : style}
    />
  );
}
