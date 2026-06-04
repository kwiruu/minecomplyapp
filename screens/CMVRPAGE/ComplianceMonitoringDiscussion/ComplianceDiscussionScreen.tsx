import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { CommonActions } from "@react-navigation/native";
import { CMSHeader } from "../../../components/CMSHeader";
import { useCmvrStore } from "../../../store/cmvrStore";
import { StyleSheet } from "react-native";
import { theme } from "../../../theme/theme";

/**
 * Compliance Monitoring Report Discussion Screen
 * 
 * This new section comes after the Executive Summary in the CMVR flow.
 * It provides space for detailed discussion of compliance findings.
 */
export default function ComplianceDiscussionScreen({ navigation, route }: any) {
  const { currentReport, updateSection, saveDraft } = useCmvrStore();
  
  const [discussion, setDiscussion] = useState({
    summary: "",
    keyFindings: [""],
    recommendations: [""],
    nextSteps: "",
  });

  // Load existing data on mount
  useEffect(() => {
    if (currentReport?.complianceMonitoringReportDiscussion) {
      setDiscussion({
        summary: currentReport.complianceMonitoringReportDiscussion.summary || "",
        keyFindings: currentReport.complianceMonitoringReportDiscussion.keyFindings || [""],
        recommendations: currentReport.complianceMonitoringReportDiscussion.recommendations || [""],
        nextSteps: currentReport.complianceMonitoringReportDiscussion.nextSteps || "",
      });
    }
  }, []);

  const handleSave = () => {
    updateSection("complianceMonitoringReportDiscussion", discussion);
    saveDraft();
    Alert.alert("Saved", "Compliance Discussion saved successfully");
  };

  const handleSaveToDraft = async () => {
    try {
      updateSection("complianceMonitoringReportDiscussion", discussion);
      await saveDraft();
      Alert.alert("Success", "Draft saved successfully");
      // Navigate to Dashboard using reset
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "Dashboard" }],
        })
      );
    } catch (error) {
      console.error("Error saving draft:", error);
      Alert.alert("Error", "Failed to save draft. Please try again.");
    }
  };

  const handleStay = () => {
    // User chose to stay on the page
    console.log("User chose to stay on Compliance Discussion screen");
  };

  const handleDiscard = () => {
    Alert.alert(
      "Discard Changes",
      "Are you sure you want to discard your changes?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => {
            // Reload original data from store
            if (currentReport?.complianceMonitoringReportDiscussion) {
              setDiscussion({
                summary: currentReport.complianceMonitoringReportDiscussion.summary || "",
                keyFindings: currentReport.complianceMonitoringReportDiscussion.keyFindings || [""],
                recommendations: currentReport.complianceMonitoringReportDiscussion.recommendations || [""],
                nextSteps: currentReport.complianceMonitoringReportDiscussion.nextSteps || "",
              });
            } else {
              setDiscussion({
                summary: "",
                keyFindings: [""],
                recommendations: [""],
                nextSteps: "",
              });
            }
          },
        },
      ]
    );
  };

  const handleExit = () => {
    // Save and navigate back
    updateSection("complianceMonitoringReportDiscussion", discussion);
    saveDraft();
    navigation.goBack();
  };

  const handleSaveAndNext = async () => {
    try {
      // Save current discussion data to store
      updateSection("complianceMonitoringReportDiscussion", discussion);
      // Save draft before navigating
      await saveDraft();
      // Navigate to the next section (Compliance Monitoring - Section IV)
      const params: any = route?.params || {};
      navigation.navigate("ComplianceMonitoring", {
        submissionId: params.submissionId,
        projectId: params.projectId,
        projectName: params.projectName,
        fileName: params.fileName,
      });
    } catch (error) {
      console.error("Error saving draft:", error);
      Alert.alert("Error", "Failed to save draft. Please try again.");
    }
  };

  const addKeyFinding = () => {
    setDiscussion((prev) => ({
      ...prev,
      keyFindings: [...prev.keyFindings, ""],
    }));
  };

  const removeKeyFinding = (index: number) => {
    if (discussion.keyFindings.length > 1) {
      setDiscussion((prev) => ({
        ...prev,
        keyFindings: prev.keyFindings.filter((_, i) => i !== index),
      }));
    }
  };

  const updateKeyFinding = (index: number, value: string) => {
    setDiscussion((prev) => ({
      ...prev,
      keyFindings: prev.keyFindings.map((item, i) => (i === index ? value : item)),
    }));
  };

  const addRecommendation = () => {
    setDiscussion((prev) => ({
      ...prev,
      recommendations: [...prev.recommendations, ""],
    }));
  };

  const removeRecommendation = (index: number) => {
    if (discussion.recommendations.length > 1) {
      setDiscussion((prev) => ({
        ...prev,
        recommendations: prev.recommendations.filter((_, i) => i !== index),
      }));
    }
  };

  const updateRecommendation = (index: number, value: string) => {
    setDiscussion((prev) => ({
      ...prev,
      recommendations: prev.recommendations.map((item, i) => (i === index ? value : item)),
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <CMSHeader 
        onBack={() => navigation.goBack()}
        onSave={handleSave}
        onStay={handleStay}
        onSaveToDraft={handleSaveToDraft}
        onDiscard={handleDiscard}
        allowEdit={false}
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.headerSection}>
          <Text style={styles.title}>Compliance Monitoring Report Discussion</Text>
          <Text style={styles.subtitle}>
            Provide detailed discussion of compliance findings and recommendations
          </Text>
        </View>

        {/* Summary Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Executive Summary <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={discussion.summary}
            onChangeText={(value) => setDiscussion({ ...discussion, summary: value })}
            placeholder="Provide an executive summary of the compliance monitoring report..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={6}
          />
        </View>

        {/* Key Findings Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Key Findings <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity style={styles.addButton} onPress={addKeyFinding}>
              <Ionicons name="add-circle" size={24} color={theme.colors.primary} />
              <Text style={styles.addButtonText}>Add Finding</Text>
            </TouchableOpacity>
          </View>

          {discussion.keyFindings.map((finding, index) => (
            <View key={index} style={styles.listItem}>
              <View style={styles.listItemHeader}>
                <Text style={styles.listItemLabel}>Finding {index + 1}</Text>
                {discussion.keyFindings.length > 1 && (
                  <TouchableOpacity 
                    onPress={() => removeKeyFinding(index)}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={finding}
                onChangeText={(value) => updateKeyFinding(index, value)}
                placeholder={`Enter key finding ${index + 1}...`}
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
              />
            </View>
          ))}
        </View>

        {/* Recommendations Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Recommendations <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity style={styles.addButton} onPress={addRecommendation}>
              <Ionicons name="add-circle" size={24} color={theme.colors.primary} />
              <Text style={styles.addButtonText}>Add Recommendation</Text>
            </TouchableOpacity>
          </View>

          {discussion.recommendations.map((recommendation, index) => (
            <View key={index} style={styles.listItem}>
              <View style={styles.listItemHeader}>
                <Text style={styles.listItemLabel}>Recommendation {index + 1}</Text>
                {discussion.recommendations.length > 1 && (
                  <TouchableOpacity 
                    onPress={() => removeRecommendation(index)}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={recommendation}
                onChangeText={(value) => updateRecommendation(index, value)}
                placeholder={`Enter recommendation ${index + 1}...`}
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
              />
            </View>
          ))}
        </View>

        {/* Next Steps Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Next Steps</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={discussion.nextSteps}
            onChangeText={(value) => setDiscussion({ ...discussion, nextSteps: value })}
            placeholder="Describe the next steps and action items..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Save & Next Button */}
        <TouchableOpacity
          style={styles.saveNextButton}
          onPress={handleSaveAndNext}
        >
          <Text style={styles.saveNextButtonText}>Save & Next</Text>
          <Ionicons name="arrow-forward" size={18} color="white" />
        </TouchableOpacity>
        {/* Bottom spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  headerSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.primaryDark,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.primaryDark,
  },
  required: {
    color: "#EF4444",
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1E293B",
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  listItem: {
    marginBottom: 16,
  },
  listItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  listItemLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
  },
  deleteButton: {
    padding: 4,
  },
  saveNextButton: {
    backgroundColor: "#02217C",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    shadowColor: "#02217C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveNextButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
});

