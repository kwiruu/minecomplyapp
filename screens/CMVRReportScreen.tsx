import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ReportInfoSection from "../components/CMVR/ReportInfoSection";
import ECCConditionsSection from "../components/CMVR/ECCConditionsSection";
import GeneralRemarksSection from "../components/CMVR/GeneralRemarksSection";
import RecommendationsSection from "../components/CMVR/RecommendationsSection";
import SupportingDocumentsSection from "../components/CMVR/SupportingDocumentsSection";

interface ComplianceCondition {
  conditionNo: string;
  requirement: string;
  status: "compliant" | "non-compliant" | "pending" | "n/a" | "";
  remarks: string;
}

const CMVRReportScreen = ({ route, navigation }: any) => {
  const { submissionId, projectName, projectId } = route?.params || {};
  const [reportInfo, setReportInfo] = useState({
    projectName: projectName || "",
    permitHolder: "",
    reportingPeriod: "",
    reportDate: "",
    preparedBy: "",
    location: "",
  });
  const [conditions, setConditions] = useState<ComplianceCondition[]>([]);
  const [generalRemarks, setGeneralRemarks] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  const addCondition = () => {
    const newCondition: ComplianceCondition = {
      conditionNo: "",
      requirement: "",
      status: "",
      remarks: "",
    };
    setConditions((prev) => [...prev, newCondition]);
  };

  const deleteCondition = (index: number) => {
    Alert.alert(
      "Delete Condition",
      "Are you sure you want to delete this condition?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setConditions((prev) => prev.filter((_, i) => i !== index));
          },
        },
      ]
    );
  };

  const updateReportInfo = (field: string, value: string) => {
    setReportInfo((prev) => ({ ...prev, [field]: value }));
  };

  const updateCondition = (
    index: number,
    field: keyof ComplianceCondition,
    value: any
  ) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], [field]: value };
    setConditions(updated);
  };

  const handleSaveDraft = () => {
    Alert.alert("Draft Saved", "Your CMVR report has been saved as draft.");
  };

  const handleSubmit = () => {
    if (
      !reportInfo.permitHolder ||
      !reportInfo.reportingPeriod ||
      !reportInfo.reportDate
    ) {
      Alert.alert(
        "Missing Information",
        "Please fill in all required report information fields."
      );
      return;
    }
    const unfilledConditions = conditions.filter(
      (c) => !c.status || !c.remarks
    ).length;
    if (unfilledConditions > 0) {
      Alert.alert(
        "Incomplete Report",
        `You have ${unfilledConditions} condition(s) without status or remarks. Continue anyway?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Continue",
            onPress: () => {
              Alert.alert(
                "Submit Report",
                "Are you sure you want to submit this CMVR report?",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Submit",
                    onPress: () => {
                      Alert.alert("Success", "CMVR report submitted successfully!");
                      navigation.goBack();
                    },
                  },
                ]
              );
            },
          },
        ]
      );
    } else {
      Alert.alert(
        "Submit Report",
        "Are you sure you want to submit this CMVR report?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Submit",
            onPress: () => {
              Alert.alert("Success", "CMVR report submitted successfully!");
              navigation.goBack();
            },
          },
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <ReportInfoSection
          reportInfo={reportInfo}
          updateReportInfo={updateReportInfo}
        />
        <ECCConditionsSection
          conditions={conditions}
          addCondition={addCondition}
          deleteCondition={deleteCondition}
          updateCondition={updateCondition}
        />
        <GeneralRemarksSection
          generalRemarks={generalRemarks}
          setGeneralRemarks={setGeneralRemarks}
        />
        <RecommendationsSection
          recommendations={recommendations}
          setRecommendations={setRecommendations}
        />
        <SupportingDocumentsSection
          uploadedImages={uploadedImages}
          setUploadedImages={setUploadedImages}
        />
        <View style={{ height: 100 }} />
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleSaveDraft}>
          <Ionicons name="save-outline" size={20} color="#007AFF" />
          <Text style={styles.secondaryButtonText}>Save Draft</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit}>
          <Text style={styles.primaryButtonText}>Submit Report</Text>
          <Ionicons name="checkmark-circle" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    padding: 15,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#007AFF",
    gap: 5,
  },
  secondaryButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
  },
  primaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 5,
  },
  primaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default CMVRReportScreen;
