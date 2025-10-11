import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";

interface GeneralRemarksSectionProps {
  generalRemarks: string;
  setGeneralRemarks: (text: string) => void;
}

const GeneralRemarksSection: React.FC<GeneralRemarksSectionProps> = ({
  generalRemarks,
  setGeneralRemarks,
}) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>General Remarks</Text>
      <TextInput
        style={styles.textarea}
        value={generalRemarks}
        onChangeText={setGeneralRemarks}
        placeholder="Enter general remarks about the overall compliance status..."
        multiline
        numberOfLines={6}
        textAlignVertical="top"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    backgroundColor: "white",
    marginTop: 10,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  textarea: {
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333",
    minHeight: 120,
  },
});

export default GeneralRemarksSection;
