import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { CommonActions } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import { CMSHeader } from "../../../components/CMSHeader";
import { useCmvrStore } from "../../../store/cmvrStore";
import { uploadNoiseQualityFile } from "../../../lib/storage";
import { NoiseParameterCard } from "./components/NoiseParameterCard";
import { FileUploadSection } from "./components/FileUploadSection";
import { UploadedFile, QuarterData, NoiseParameter } from "./types";
import { noiseQualityScreenStyles as styles } from "./styles";

export default function NoiseQualityScreen({ navigation, route }: any) {
  // **ZUSTAND STORE** - Single source of truth
  const {
    currentReport,
    fileName: storeFileName,
    submissionId: storeSubmissionId,
    projectId: storeProjectId,
    projectName: storeProjectName,
    updateSection,
    saveDraft,
  } = useCmvrStore();

  // Initialize from store
  const storedNoiseQuality = currentReport?.noiseQualityImpactAssessment;

  const [hasInternalNoise, setHasInternalNoise] = useState(
    storedNoiseQuality?.hasInternalNoise || false
  );
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(
    storedNoiseQuality?.uploadedFiles || []
  );
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>(
    {}
  );
  const [parameters, setParameters] = useState<NoiseParameter[]>(
    storedNoiseQuality?.parameters || [
      {
        id: `param-${Date.now()}`,
        parameter: "",
        isParameterNA: false,
        currentInSMR: "",
        previousInSMR: "",
        mmtCurrent: "",
        mmtPrevious: "",
        redFlag: "",
        isRedFlagChecked: false,
        action: "",
        isActionChecked: false,
        limit: "",
        isLimitChecked: false,
      },
    ]
  );
  const [remarks, setRemarks] = useState(storedNoiseQuality?.remarks || "");
  const [dateTime, setDateTime] = useState(storedNoiseQuality?.dateTime || "");
  const [weatherWind, setWeatherWind] = useState(
    storedNoiseQuality?.weatherWind || ""
  );
  const [explanation, setExplanation] = useState(
    storedNoiseQuality?.explanation || ""
  );
  const [explanationNA, setExplanationNA] = useState(
    storedNoiseQuality?.explanationNA || false
  );
  const [quarters, setQuarters] = useState<QuarterData>(
    storedNoiseQuality?.quarters || {
      first: "",
      isFirstChecked: false,
      second: "",
      isSecondChecked: false,
      third: "",
      isThirdChecked: false,
      fourth: "",
      isFourthChecked: false,
    }
  );

  // Auto-sync to store
  useEffect(() => {
    updateSection("noiseQualityImpactAssessment", {
      hasInternalNoise,
      uploadedFiles,
      parameters,
      remarks,
      dateTime,
      weatherWind,
      explanation,
      explanationNA,
      quarters,
    });
  }, [
    hasInternalNoise,
    uploadedFiles,
    parameters,
    remarks,
    dateTime,
    weatherWind,
    explanation,
    explanationNA,
    quarters,
  ]);

  // Handle file changes with Supabase upload
  const handleFilesChange = async (newFiles: UploadedFile[]) => {
    // Find newly added files (those without storagePath)
    const filesToUpload = newFiles.filter(
      (file) => !file.storagePath && !uploadingFiles[file.uri]
    );

    if (filesToUpload.length === 0) {
      // Just update the list if no new files to upload
      setUploadedFiles(newFiles);
      return;
    }

    // Mark files as uploading
    const uploadingState: Record<string, boolean> = {};
    filesToUpload.forEach((file) => {
      uploadingState[file.uri] = true;
    });
    setUploadingFiles((prev) => ({ ...prev, ...uploadingState }));
    setUploadedFiles(newFiles);

    // Upload each file
    const uploadPromises = filesToUpload.map(async (file) => {
      try {
        console.log(`Uploading noise quality file: ${file.name}`);
        const result = await uploadNoiseQualityFile({
          uri: file.uri,
          fileName: file.name,
          mimeType: file.mimeType,
        });

        console.log(`✅ Successfully uploaded: ${file.name} to ${result.path}`);

        // Update the file with storage path
        setUploadedFiles((prevFiles) =>
          prevFiles.map((f) =>
            f.uri === file.uri ? { ...f, storagePath: result.path } : f
          )
        );

        return { success: true, uri: file.uri, path: result.path };
      } catch (error: any) {
        console.error(`❌ Failed to upload ${file.name}:`, error);
        Alert.alert(
          "Upload Failed",
          `Failed to upload ${file.name}: ${error.message}`
        );

        // Remove the failed file from the list
        setUploadedFiles((prevFiles) =>
          prevFiles.filter((f) => f.uri !== file.uri)
        );

        return { success: false, uri: file.uri };
      } finally {
        // Mark as no longer uploading
        setUploadingFiles((prev) => {
          const updated = { ...prev };
          delete updated[file.uri];
          return updated;
        });
      }
    });

    await Promise.all(uploadPromises);
  };

  const handleSave = async () => {
    try {
      await saveDraft();
      Alert.alert("Success", "Draft saved successfully");
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
    console.log("User chose to stay");
  };

  const handleSaveToDraft = async () => {
    try {
      await saveDraft();
      Alert.alert("Success", "Draft saved successfully");
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

  const handleDiscard = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "Dashboard" }],
      })
    );
  };

  const handleGoToSummary = () => {
    const params: any = route?.params || {};

    navigation.navigate("CMVRDocumentExport", {
      cmvrReportId: params.submissionId || storeSubmissionId || undefined,
      fileName: params.fileName || storeFileName || "Untitled",
      projectId: params.projectId || storeProjectId || undefined,
      projectName:
        params.projectName ||
        storeProjectName ||
        currentReport?.generalInfo?.projectName ||
        "",
    });
  };

  const addParameter = () => {
    const newId = `param-${Date.now()}`;
    setParameters([
      ...parameters,
      {
        id: newId,
        parameter: "",
        isParameterNA: false,
        currentInSMR: "",
        previousInSMR: "",
        mmtCurrent: "",
        mmtPrevious: "",
        redFlag: "",
        isRedFlagChecked: false,
        action: "",
        isActionChecked: false,
        limit: "",
        isLimitChecked: false,
      },
    ]);
  };

  const updateParameter = (
    id: string,
    field: keyof Omit<NoiseParameter, "id">,
    value: string | boolean
  ) => {
    setParameters(
      parameters.map((param) =>
        param.id === id ? { ...param, [field]: value } : param
      )
    );
  };

  const removeParameter = (id: string) => {
    Alert.alert(
      "Remove Parameter",
      "Are you sure you want to remove this parameter?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            if (parameters.length > 1) {
              setParameters(parameters.filter((param) => param.id !== id));
            } else {
              Alert.alert(
                "Cannot Remove",
                "At least one parameter is required."
              );
            }
          },
        },
      ]
    );
  };

  const updateQuarter = (field: keyof QuarterData, value: string | boolean) => {
    setQuarters((prevQuarters) => ({
      ...prevQuarters,
      [field]: value,
    }));
  };

  const handleSaveAndNext = () => {
    console.log("Saving Noise Quality data...");
    const noiseQualityImpactAssessment = {
      hasInternalNoise,
      uploadedFiles,
      parameters,
      remarks,
      dateTime,
      weatherWind,
      explanation,
      explanationNA,
      quarters,
    };
    const nextParams = {
      ...(route?.params || {}),
      noiseQualityImpactAssessment,
    } as any;
    console.log(
      "Navigating with NoiseQuality params keys:",
      Object.keys(nextParams)
    );
    navigation.navigate("WasteManagement", nextParams);
  };

  const fillTestData = () => {
    setHasInternalNoise(true);

    // Fill 3 noise parameters
    setParameters([
      {
        id: "1",
        parameter: "Quarry Blasting Operations",
        isParameterNA: false,
        currentInSMR: "78 dB(A)",
        previousInSMR: "80 dB(A)",
        mmtCurrent: "77 dB(A)",
        mmtPrevious: "79 dB(A)",
        redFlag: "No",
        isRedFlagChecked: false,
        action: "Continue noise monitoring near residential areas",
        isActionChecked: false,
        limit: "85 dB(A)",
        isLimitChecked: false,
      },
      {
        id: "2",
        parameter: "Crushing Plant Operations",
        isParameterNA: false,
        currentInSMR: "72 dB(A)",
        previousInSMR: "74 dB(A)",
        mmtCurrent: "71 dB(A)",
        mmtPrevious: "73 dB(A)",
        redFlag: "No",
        isRedFlagChecked: false,
        action: "Maintain acoustic barriers",
        isActionChecked: false,
        limit: "85 dB(A)",
        isLimitChecked: false,
      },
      {
        id: "3",
        parameter: "Haul Truck Traffic",
        isParameterNA: false,
        currentInSMR: "65 dB(A)",
        previousInSMR: "67 dB(A)",
        mmtCurrent: "64 dB(A)",
        mmtPrevious: "66 dB(A)",
        redFlag: "No",
        isRedFlagChecked: false,
        action: "Continue speed limits on haul roads",
        isActionChecked: false,
        limit: "75 dB(A)",
        isLimitChecked: false,
      },
    ]);

    setRemarks("All noise levels within DENR permissible limits");
    setDateTime("March 15, 2025, 11:00 AM - 3:00 PM");
    setWeatherWind("Sunny, Wind speed 3-5 m/s from East");
    setExplanation(
      "Noise monitoring conducted at boundary and sensitive receptor locations"
    );
    setExplanationNA(false);

    setQuarters({
      first: "Average: 68 dB(A)",
      isFirstChecked: true,
      second: "Average: 70 dB(A)",
      isSecondChecked: true,
      third: "Average: 69 dB(A)",
      isThirdChecked: false,
      fourth: "",
      isFourthChecked: false,
    });

    Alert.alert(
      "Test Data",
      "Noise Quality filled with test data (3 parameters + quarterly data)"
    );
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <SafeAreaView style={styles.container}>
        <View style={styles.headerContainer}>
          <CMSHeader
            onBack={() => navigation.goBack()}
            onSave={handleSave}
            onStay={handleStay}
            onSaveToDraft={handleSaveToDraft}
            onDiscard={handleDiscard}
            onGoToSummary={handleGoToSummary}
            allowEdit={false}
          />
        </View>
        <View style={styles.sectionHeaderContainer}>
          <View style={styles.sectionHeaderContent}>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>B.4</Text>
            </View>
            <Text style={styles.sectionTitle}>
              Noise Quality Impact Assessment
            </Text>
          </View>
        </View>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <FileUploadSection
            uploadedFiles={uploadedFiles}
            uploadingFiles={uploadingFiles}
            onFilesChange={handleFilesChange}
          />

          <View style={styles.parametersSection}>
            {parameters.map((param, index) => (
              <NoiseParameterCard
                key={param.id}
                parameter={param}
                index={index}
                canDelete={parameters.length > 1}
                onUpdate={updateParameter}
                onDelete={removeParameter}
              />
            ))}

            {/* Remarks placed above Add More Parameter button */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Remarks</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={remarks}
                onChangeText={setRemarks}
                placeholder="Enter remarks..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity style={styles.addButton} onPress={addParameter}>
              <Ionicons name="add-circle" size={20} color="#02217C" />
              <Text style={styles.addButtonText}>Add More Parameter</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.additionalFieldsContainer}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Date/Time of Sampling</Text>
              <TextInput
                style={styles.input}
                value={dateTime}
                onChangeText={setDateTime}
                placeholder="MM/DD/YYYY HH:MM"
                placeholderTextColor="#94A3B8"
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Weather and Wind Direction</Text>
              <TextInput
                style={styles.input}
                value={weatherWind}
                onChangeText={setWeatherWind}
                placeholder="Enter weather conditions..."
                placeholderTextColor="#94A3B8"
              />
            </View>
            <View style={styles.fieldGroup}>
              <View style={styles.labelWithAction}>
                <Text style={styles.label}>
                  Explanation of Confirmatory Sampling
                </Text>
              </View>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  explanationNA && styles.disabledInput,
                ]}
                value={explanation}
                onChangeText={setExplanation}
                placeholder="Explain why confirmatory sampling was conducted..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                editable={!explanationNA}
              />
            </View>
          </View>

          <View style={styles.overallAssessmentContainer}>
            <View style={styles.overallHeader}>
              <Ionicons name="analytics" size={20} color="#02217C" />
              <Text style={styles.overallTitle}>
                Overall Noise Quality Impact Assessment
              </Text>
            </View>
          </View>

          {/* Changed quarters from checkboxes to bullets */}
          <View style={styles.quartersContainer}>
            {[
              { key: "first", label: "1st Quarter" },
              { key: "second", label: "2nd Quarter" },
              { key: "third", label: "3rd Quarter" },
              { key: "fourth", label: "4th Quarter" },
            ].map((quarter) => (
              <View key={quarter.key} style={styles.quarterRow}>
                <View style={styles.bulletRow}>
                  <View style={styles.bullet} />
                  <Text style={styles.quarterLabel}>{quarter.label}</Text>
                </View>
                <TextInput
                  style={styles.quarterInput}
                  value={quarters[quarter.key as keyof QuarterData] as string}
                  onChangeText={(text) =>
                    updateQuarter(quarter.key as keyof QuarterData, text)
                  }
                  placeholder="Enter assessment"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            ))}
          </View>

          {__DEV__ && (
            <TouchableOpacity
              style={[
                styles.saveNextButton,
                { backgroundColor: "#ff8c00", marginTop: 12 },
              ]}
              onPress={fillTestData}
            >
              <Text style={styles.saveNextButtonText}>Fill Test Data</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.saveNextButton}
            onPress={handleSaveAndNext}
          >
            <Text style={styles.saveNextButtonText}>Save & Next</Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </TouchableOpacity>
          <View style={styles.bottomSpacing} />
          {/* filler gap ts not advisable tbh*/}
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
