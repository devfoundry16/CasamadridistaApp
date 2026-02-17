// components/Button.tsx
import { Text } from "@/components/Text";
import React from "react";
import {
  ActivityIndicator,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from "react-native";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "danger";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const variantClasses = {
  primary: "bg-rm-gold",
  secondary: "bg-bg-gray",
  outline: "bg-transparent border border-rm-gold",
  danger: "bg-status-error",
};

const variantTextClasses = {
  primary: "text-white",
  secondary: "text-white",
  outline: "text-rm-gold",
  danger: "text-white",
};

const sizeClasses = {
  small: "px-3 py-2 min-h-8",
  medium: "px-4 py-3 min-h-11",
  large: "px-5 py-4 min-h-[52px]",
};

const sizeTextClasses = {
  small: "text-sm",
  medium: "text-base",
  large: "text-lg",
};

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const isDisabled = disabled || loading;
  const buttonClassName = [
    "rounded-lg justify-center items-center flex-row",
    variantClasses[variant],
    sizeClasses[size],
    isDisabled && "opacity-60",
  ]
    .filter(Boolean)
    .join(" ");

  const textClassName = [
    "font-semibold text-center",
    variantTextClasses[variant],
    sizeTextClasses[size],
    isDisabled && "opacity-70",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <TouchableOpacity
      className={buttonClassName}
      style={style}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === "outline"
              ? "#BC9045"
              : variant === "secondary"
                ? "#666"
                : "#fff"
          }
        />
      ) : (
        <Text className={textClassName} style={textStyle}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

// Convenience component variants
export const PrimaryButton: React.FC<Omit<ButtonProps, "variant">> = (
  props
) => <Button variant="primary" {...props} />;

export const SecondaryButton: React.FC<Omit<ButtonProps, "variant">> = (
  props
) => <Button variant="secondary" {...props} />;

export const OutlineButton: React.FC<Omit<ButtonProps, "variant">> = (
  props
) => <Button variant="outline" {...props} />;

export const DangerButton: React.FC<Omit<ButtonProps, "variant">> = (props) => (
  <Button variant="danger" {...props} />
);
