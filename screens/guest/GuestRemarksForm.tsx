import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAuth } from "../../contexts/AuthContext";
import { apiPost } from "../../lib/api";
import { theme } from "../../theme/theme";

interface GuestRemarksFormProps {
  navigation: any;
  route?: {
    params?: {
      reportId?: string;
      reportType?: "CMVR" | "ECC";
    };
  };
}

/**
 * MMT Observation Form Screen
 * 
 * Replaces Google Forms "MMT Observation Form – MGB Region I" with internal feature.
 * Matches all fields from the original Google Form:
 * 1. Full Name *
 * 2. Agency/Organization Represented * (MGB, EMB, LGU, CENRO, PENRO, NGO, COMPANY, Other)
 * 3. Position/Designation *
 * 4. Date of Monitoring *
 * 5. Site / Company Monitored *
 * 6. Observations (optional)
 * 7. Issues or Concerns Noted (If any) (optional)
 * 8. Recommendations *
 */
export default function GuestRemarksForm({ navigation, route }: GuestRemarksFormProps) {
  const { user } = useAuth();
  const reportId = route?.params?.reportId || "";
  const reportType = route?.params?.reportType || "CMVR";

  // ✅ FIX: Match Google Form fields exactly
  const [formData, setFormData] = useState({
    // 1. Full Name *
    fullName: user?.displayName || "",
    // 2. Agency/Organization Represented *
    agency: "" as "MGB" | "EMB" | "LGU" | "CENRO" | "PENRO" | "NGO" | "COMPANY" | "Other" | "",
    agencyOther: "", // For "Other" option
    // 3. Position/Designation *
    position: "",
    // 4. Date of Monitoring *
    dateOfMonitoring: new Date(),
    showDatePicker: false,
    // 5. Site / Company Monitored *
    siteCompanyMonitored: "",
    // 6. Observations (optional)
    observations: "",
    // 7. Issues or Concerns Noted (optional)
    issuesConcerns: "",
    // 8. Recommendations *
    recommendations: "",
  });

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    // ✅ FIX: Validate all required fields matching Google Form
    if (!formData.fullName.trim()) {
      Alert.alert("Validation Error", "Please enter your full name");
      return;
    }

    if (!formData.agency) {
      Alert.alert("Validation Error", "Please select your Agency/Organization");
      return;
    }

    if (formData.agency === "Other" && !formData.agencyOther.trim()) {
      Alert.alert("Validation Error", "Please specify your agency/organization");
      return;
    }

    if (!formData.position.trim()) {
      Alert.alert("Validation Error", "Please enter your Position/Designation");
      return;
    }

    if (!formData.siteCompanyMonitored.trim()) {
      Alert.alert("Validation Error", "Please enter the Site / Company Monitored");
      return;
    }

    if (!formData.recommendations.trim()) {
      Alert.alert("Validation Error", "Please enter your Recommendations");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        // Match Google Form structure
        fullName: formData.fullName.trim(),
        agency: formData.agency === "Other" ? formData.agencyOther.trim() : formData.agency,
        position: formData.position.trim(),
        dateOfMonitoring: formData.dateOfMonitoring.toISOString().split('T')[0], // YYYY-MM-DD format
        siteCompanyMonitored: formData.siteCompanyMonitored.trim(),
        observations: formData.observations.trim() || null,
        issuesConcerns: formData.issuesConcerns.trim() || null,
        recommendations: formData.recommendations.trim(),
        // Additional metadata
        reportId: reportId || null,
        reportType: reportType || null,
        createdById: user?.id || null,
        createdByEmail: user?.email || null,
      };

      await apiPost("/guest-remarks", payload);

      Alert.alert(
        "Success",
        "Your MMT Observation Form has been submitted successfully!",
        [
          {
            text: "OK",
            onPress: () => {
              // Reset form
              setFormData({
                fullName: user?.displayName || "",
                agency: "",
                agencyOther: "",
                position: "",
                dateOfMonitoring: new Date(),
                showDatePicker: false,
                siteCompanyMonitored: "",
                observations: "",
                issuesConcerns: "",
                recommendations: "",
              });
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error("Error submitting MMT observation:", error);
      Alert.alert(
        "Submission Failed",
        error?.message || "Failed to submit observation. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.primaryDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MMT Observation Form</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.introSection}>
          <Ionicons name="clipboard" size={48} color={theme.colors.primary} />
          <Text style={styles.introTitle}>MMT Observation Form</Text>
          <Text style={styles.introText}>
            MGB Region I - Multi-Partite Monitoring Team Observation Form
          </Text>
          <Text style={styles.introSubtext}>
            Please fill out all required fields (*) to submit your observation.
          </Text>
        </View>

        {/* 1. Full Name * */}
        <View style={styles.field}>
          <Text style={styles.label}>
            1. Full Name <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={formData.fullName}
            onChangeText={(value) => setFormData({ ...formData, fullName: value })}
            placeholder="Enter your full name"
            placeholderTextColor="#94A3B8"
          />
        </View>

        {/* 2. Agency/Organization Represented * */}
        <View style={styles.field}>
          <Text style={styles.label}>
            2. Agency/Organization Represented <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.agency}
              onValueChange={(value) => setFormData({ ...formData, agency: value, agencyOther: "" })}
              style={styles.picker}
            >
              <Picker.Item label="Select Agency/Organization" value="" />
              <Picker.Item label="MGB" value="MGB" />
              <Picker.Item label="EMB" value="EMB" />
              <Picker.Item label="LGU" value="LGU" />
              <Picker.Item label="CENRO" value="CENRO" />
              <Picker.Item label="PENRO" value="PENRO" />
              <Picker.Item label="NGO" value="NGO" />
              <Picker.Item label="COMPANY" value="COMPANY" />
              <Picker.Item label="Other" value="Other" />
            </Picker>
          </View>
          {formData.agency === "Other" && (
            <TextInput
              style={[styles.input, { marginTop: 8 }]}
              value={formData.agencyOther}
              onChangeText={(value) => setFormData({ ...formData, agencyOther: value })}
              placeholder="Specify your agency/organization"
              placeholderTextColor="#94A3B8"
            />
          )}
        </View>

        {/* 3. Position/Designation * */}
        <View style={styles.field}>
          <Text style={styles.label}>
            Position/Designation <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={formData.position}
            onChangeText={(value) => setFormData({ ...formData, position: value })}
            placeholder="Enter your position or designation"
            placeholderTextColor="#94A3B8"
          />
        </View>

        {/* 4. Date of Monitoring * */}
        <View style={styles.field}>
          <Text style={styles.label}>
            Date of Monitoring <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setFormData({ ...formData, showDatePicker: true })}
          >
            <Text style={formData.dateOfMonitoring ? styles.dateText : styles.placeholderText}>
              {formData.dateOfMonitoring
                ? formData.dateOfMonitoring.toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })
                : "dd/mm/yyyy"}
            </Text>
          </TouchableOpacity>
          {formData.showDatePicker && (
            <DateTimePicker
              value={formData.dateOfMonitoring}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, selectedDate) => {
                setFormData({
                  ...formData,
                  showDatePicker: Platform.OS === "ios",
                  dateOfMonitoring: selectedDate || formData.dateOfMonitoring,
                });
              }}
            />
          )}
        </View>

        {/* 5. Site / Company Monitored * */}
        <View style={styles.field}>
          <Text style={styles.label}>
            Site / Company Monitored <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={formData.siteCompanyMonitored}
            onChangeText={(value) => setFormData({ ...formData, siteCompanyMonitored: value })}
            placeholder="Enter site or company name"
            placeholderTextColor="#94A3B8"
          />
        </View>

        {/* 6. Observations (Optional) */}
        <View style={styles.field}>
          <Text style={styles.label}>Observations</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.observations}
            onChangeText={(value) => setFormData({ ...formData, observations: value })}
            placeholder="Enter your observations..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={4}
          />
        </View>

        {/* 7. Issues or Concerns Noted (Optional) */}
        <View style={styles.field}>
          <Text style={styles.label}>Issues or Concerns Noted (If any)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.issuesConcerns}
            onChangeText={(value) => setFormData({ ...formData, issuesConcerns: value })}
            placeholder="Enter any issues or concerns..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={4}
          />
        </View>

        {/* 8. Recommendations * */}
        <View style={styles.field}>
          <Text style={styles.label}>
            Recommendations <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.recommendations}
            onChangeText={(value) => setFormData({ ...formData, recommendations: value })}
            placeholder="Enter your recommendations..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={6}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <Text style={styles.submitButtonText}>Submitting...</Text>
          ) : (
            <>
              <Ionicons name="send" size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Submit</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.primaryDark,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  introSection: {
    alignItems: "center",
    marginBottom: 32,
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.primaryDark,
    marginTop: 12,
    marginBottom: 8,
  },
  introText: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 4,
  },
  introSubtext: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
    fontStyle: "italic",
  },
  dateText: {
    fontSize: 14,
    color: "#1E293B",
  },
  placeholderText: {
    fontSize: 14,
    color: "#94A3B8",
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 8,
  },
  required: {
    color: "#EF4444",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: "#1E293B",
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  pickerContainer: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    overflow: "hidden",
  },
  picker: {
    height: 48,
    color: "#1E293B",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 10,
    marginTop: 24,
    gap: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: "#94A3B8",
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});

