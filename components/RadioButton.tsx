import React from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { theme } from "../theme/theme";

interface RadioButtonProps {
  label: string;
  value: string;
  selectedValue: string;
  onSelect: (value: string) => void;
  hasError?: boolean;
}

export const RadioButton: React.FC<RadioButtonProps> = ({ label, value, selectedValue, onSelect, hasError }) => {
  const isSelected = value === selectedValue;
  return (
    <TouchableOpacity style={styles.container} onPress={() => onSelect(value)}>
      <View style={[styles.outer, isSelected && styles.selected, hasError && styles.error]}>
        {isSelected && <View style={styles.inner} />}
      </View>
      <Text style={[styles.label, hasError && styles.error]}>{label}</Text>
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
  outer: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: "#EAEAEA", alignItems: "center", justifyContent: "center", marginRight: 6, flexShrink: 0 },
  selected: { borderColor: theme.colors.primaryDark },
  inner: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.colors.primaryDark },
  label: {
    fontFamily: theme.typography.regular,
    color: theme.colors.text,
    flex: 1,
    minWidth: 0,
    lineHeight: 20,
  },
  error: { borderColor: theme.colors.error, color: theme.colors.error },
});
