import React from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { theme } from "../theme/theme";

interface CheckboxProps {
  label: string;
  value: boolean;
  onToggle: () => void;
  containerStyle?: any;
}

export const Checkbox: React.FC<CheckboxProps> = ({ label, value, onToggle, containerStyle }) => {
  return (
    <TouchableOpacity style={[styles.container, containerStyle]} onPress={onToggle} activeOpacity={0.8}>
      <View style={[styles.box, value && styles.boxChecked]}>
        {value && <Feather name="check" size={16} color={theme.colors.primaryDark} />}
      </View>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginRight: 12,
    maxWidth: "100%",
  },
  box: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: "#EAEAEA",
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
    flexShrink: 0,
  },
  boxChecked: { borderColor: theme.colors.primaryDark },
  label: {
    fontFamily: theme.typography.regular,
    color: theme.colors.text,
    flex: 1,
    minWidth: 0,
    lineHeight: 20,
  },
});
