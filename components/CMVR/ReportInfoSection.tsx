import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";

interface ReportInfoSectionProps {
  reportInfo: {
    projectName: string;
    permitHolder: string;
    reportingPeriod: string;
    reportDate: string;
    preparedBy: string;
    location: string;
  };
  updateReportInfo: (field: string, value: string) => void;
}

const ReportInfoSection: React.FC<ReportInfoSectionProps> = ({
  reportInfo,
  updateReportInfo,
}) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Report Information</Text>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Project Name *</Text>
        <TextInput
          style={styles.input}
          value={reportInfo.projectName}
          onChangeText={(text) => updateReportInfo("projectName", text)}
          placeholder="Enter project name"
        />
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Permit Holder *</Text>
        <TextInput
          style={styles.input}
          value={reportInfo.permitHolder}
          onChangeText={(text) => updateReportInfo("permitHolder", text)}
          placeholder="Enter permit holder name"
        />
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Reporting Period *</Text>
        <TextInput
          style={styles.input}
          value={reportInfo.reportingPeriod}
          onChangeText={(text) => updateReportInfo("reportingPeriod", text)}
          placeholder="e.g., 3rd Quarter 2025"
        />
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Report Date *</Text>
        <TextInput
          style={styles.input}
          value={reportInfo.reportDate}
          onChangeText={(text) => updateReportInfo("reportDate", text)}
          placeholder="e.g., October 11, 2025"
        />
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Prepared By</Text>
        <TextInput
          style={styles.input}
          value={reportInfo.preparedBy}
          onChangeText={(text) => updateReportInfo("preparedBy", text)}
          placeholder="Enter name of preparer"
        />
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Location</Text>
        <TextInput
          style={styles.input}
          value={reportInfo.location}
          onChangeText={(text) => updateReportInfo("location", text)}
          placeholder="Enter project location"
        />
      </View>
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
  fieldGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333",
  },
});

export default ReportInfoSection;
