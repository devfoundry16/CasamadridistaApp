import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Offsets required to make a bottom-docked input work under a
 * <KeyboardAvoidingView behavior="padding">.
 *
 * WHY `headerHeight - bottom`:
 *
 * RN computes the KAV's bottom padding as
 *     Math.max(frame.y + frame.height - (keyboard.screenY - keyboardVerticalOffset), 0)
 * (react-native/Libraries/Components/Keyboard/KeyboardAvoidingView.js)
 *
 * `frame` comes from the KAV's own onLayout, so it is measured *relative to its
 * parent* — the native-stack screen content view, whose origin sits BELOW the
 * native header. `keyboard.screenY` is in absolute *screen* coordinates. The two
 * live in different coordinate spaces and the gap is exactly the header height
 * (bar + top safe-area inset), which is what useHeaderHeight() returns. Without
 * the offset the content is lifted `headerHeight` px too little and the keyboard
 * covers the input.
 *
 * We then subtract `bottom` because the docked footer carries a STATIC
 * `paddingBottom: bottom` for the home indicator / Android gesture bar, which is
 * already part of the total lift. Keeping that padding static (rather than
 * toggling it on keyboard show/hide) avoids a one-frame jump: the KAV animates
 * its padding via LayoutAnimation, and a separate setState would not be part of
 * that transaction.
 *
 * Screens with `headerShown: false` get headerHeight === 0, which is still
 * correct — their KAV frame is not shifted down, so no correction is needed.
 *
 * NOT valid as-is for screens nested in a material-top-tabs navigator: there the
 * frame is additionally shifted by the tab bar height.
 */
export function useKeyboardOffsets() {
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  return {
    /** Static bottom padding for the docked footer. */
    bottomInset: insets.bottom,
    /** Pass to <KeyboardAvoidingView keyboardVerticalOffset={...} />. */
    keyboardVerticalOffset: headerHeight - insets.bottom,
  };
}
