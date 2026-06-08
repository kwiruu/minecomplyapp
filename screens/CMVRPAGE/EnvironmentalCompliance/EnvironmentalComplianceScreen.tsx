// EnvironmentalComplianceScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { Ionicons } from "@expo/vector-icons";
import { CommonActions } from "@react-navigation/native";
import { CMSHeader } from "../../../components/CMSHeader";
import { useCmvrStore } from "../../../store/cmvrStore";
import { supabase } from "../../../lib/supabase";
import { SectionHeader } from "./components/SectionHeader";
import { FormInputField } from "./components/FormInputField";
import { styles } from "../styles/EnvironmentalComplianceScreen.styles";

export default function EnvironmentalComplianceScreen({
  navigation,
  route,
}: any) {
  // Zustand store
  const {
    currentReport,
    fileName: storeFileName,
    submissionId: storeSubmissionId,
    projectId: storeProjectId,
    projectName: storeProjectName,
    updateSection,
    saveDraft,
  } = useCmvrStore();

  // Extract route params with fallback to store values
  const {
    submissionId = storeSubmissionId || null,
    projectId = storeProjectId || null,
    projectName = storeProjectName || "",
    fileName: routeFileName = storeFileName || "Untitled",
  } = route?.params || {};

  // ✅ FIX: Initialize from separate ECC Conditions store field (not air quality)
  const storedEccConditions = currentReport?.eccConditionsAttachment;
  // ✅ RESTORE: Initialize from air quality store field for B.3 section
  const storedAirQuality = currentReport?.airQualityImpactAssessment;

  const [uploadedEccFile, setUploadedEccFile] = useState<any>(
    storedEccConditions?.uploadedEccFile || null
  );
  const [isUploadingEcc, setIsUploadingEcc] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(
    storedEccConditions?.uploadedImage || null
  );

  // ✅ RESTORE: Air Quality location description states
  const [quarry, setQuarry] = useState(storedAirQuality?.quarry || "");
  const [plant, setPlant] = useState(storedAirQuality?.plant || "");
  const [port, setPort] = useState(storedAirQuality?.port || "");
  const [quarryPlant, setQuarryPlant] = useState(
    storedAirQuality?.quarryPlant || ""
  );
  const [quarryEnabled, setQuarryEnabled] = useState(
    storedAirQuality?.quarryEnabled ?? Boolean(storedAirQuality?.quarry)
  );
  const [plantEnabled, setPlantEnabled] = useState(
    storedAirQuality?.plantEnabled ?? Boolean(storedAirQuality?.plant)
  );
  const [portEnabled, setPortEnabled] = useState(
    storedAirQuality?.portEnabled ?? Boolean(storedAirQuality?.port)
  );
  const [quarryPlantEnabled, setQuarryPlantEnabled] = useState(
    storedAirQuality?.quarryPlantEnabled ??
      Boolean(storedAirQuality?.quarryPlant)
  );

  const [hasHydratedFromStore, setHasHydratedFromStore] = useState(false);
  const [canSyncStore, setCanSyncStore] = useState(false);
  const [canSyncAirQuality, setCanSyncAirQuality] = useState(false);

  useEffect(() => {
    if (hasHydratedFromStore || !currentReport) return;

    if (storedEccConditions) {
      setUploadedEccFile(storedEccConditions.uploadedEccFile || null);
      setUploadedImage(storedEccConditions.uploadedImage || null);
    }

    // ✅ RESTORE: Load air quality data
    if (storedAirQuality) {
      setQuarry(storedAirQuality.quarry || "");
      setPlant(storedAirQuality.plant || "");
      setPort(storedAirQuality.port || "");
      setQuarryPlant(storedAirQuality.quarryPlant || "");
      setQuarryEnabled(
        storedAirQuality.quarryEnabled ?? Boolean(storedAirQuality.quarry)
      );
      setPlantEnabled(
        storedAirQuality.plantEnabled ?? Boolean(storedAirQuality.plant)
      );
      setPortEnabled(
        storedAirQuality.portEnabled ?? Boolean(storedAirQuality.port)
      );
      setQuarryPlantEnabled(
        storedAirQuality.quarryPlantEnabled ??
          Boolean(storedAirQuality.quarryPlant)
      );
    }

    setHasHydratedFromStore(true);
    setCanSyncStore(true);
    setCanSyncAirQuality(true);
  }, [currentReport, storedEccConditions, storedAirQuality, hasHydratedFromStore]);

  // ✅ FIX: Auto-sync to separate ECC Conditions store field
  useEffect(() => {
    if (!canSyncStore) return;
    updateSection("eccConditionsAttachment", {
      uploadedEccFile,
      uploadedImage,
    });
  }, [canSyncStore, uploadedEccFile, uploadedImage]);

  // ✅ RESTORE: Auto-sync air quality data to store
  useEffect(() => {
    if (!canSyncAirQuality) return;
    updateSection("airQualityImpactAssessment", {
      quarry,
      plant,
      port,
      quarryPlant,
      quarryEnabled,
      plantEnabled,
      portEnabled,
      quarryPlantEnabled,
    });
  }, [
    canSyncAirQuality,
    quarry,
    plant,
    port,
    quarryPlant,
    quarryEnabled,
    plantEnabled,
    portEnabled,
    quarryPlantEnabled,
  ]);


  const uploadEccFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];

        setIsUploadingEcc(true);

        try {
          // Create unique filename
          const timestamp = Date.now();
          const fileExt = file.name.split(".").pop() || "docx";
          const fileName = `cmvr-ecc/ecc-${timestamp}.${fileExt}`;

          // Read file as ArrayBuffer (React Native Blob polyfill may not support creating from ArrayBuffer)
          const response = await fetch(file.uri);
          const arrayBuffer = await response.arrayBuffer();

          // Try direct ArrayBuffer upload first
          let uploadError;
          let uploadData;
          ({ data: uploadData, error: uploadError } = await supabase.storage
            .from("minecomplyapp-bucket")
            .upload(fileName, arrayBuffer, {
              contentType:
                file.mimeType ||
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
              upsert: false,
            }));

          // Fallback: convert to Uint8Array if ArrayBuffer not accepted
          if (uploadError) {
            try {
              const uint8 = new Uint8Array(arrayBuffer);
              ({ data: uploadData, error: uploadError } = await supabase.storage
                .from("minecomplyapp-bucket")
                .upload(fileName, uint8, {
                  contentType:
                    file.mimeType ||
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                  upsert: false,
                }));
            } catch (fallbackErr) {
              console.warn("Uint8Array fallback failed", fallbackErr);
            }
          }

          // Final fallback: base64 via Expo FileSystem (if available)
          if (uploadError) {
            try {
              // Dynamically import to avoid bundling if not needed
              const FileSystemImport = await import("expo-file-system");
              const FileSystem = FileSystemImport.default || FileSystemImport;
              const base64 = await FileSystem.readAsStringAsync(file.uri, {
                encoding: "base64" as any,
              });
              // Supabase JS storage client in RN accepts a base64 string with contentType
              ({ data: uploadData, error: uploadError } = await supabase.storage
                .from("minecomplyapp-bucket")
                .upload(fileName, base64, {
                  contentType:
                    file.mimeType ||
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                  upsert: false,
                }));
            } catch (base64Err) {
              console.warn("Base64 fallback failed", base64Err);
            }
          }

          if (uploadError) {
            throw uploadError;
          }

          // Get public URL
          const {
            data: { publicUrl },
          } = supabase.storage
            .from("minecomplyapp-bucket")
            .getPublicUrl(fileName);

          // Store file info with storage path and public URL
          const fileInfo = {
            name: file.name,
            uri: file.uri,
            mimeType: file.mimeType,
            size: file.size,
            storagePath: fileName, // Store the storage path for deletion
            publicUrl: publicUrl,
          };

          setUploadedEccFile(fileInfo);

          Alert.alert(
            "File Uploaded",
            `File "${file.name}" uploaded successfully to storage!`
          );
        } catch (uploadError) {
          console.error("Supabase upload error:", uploadError);
          Alert.alert(
            "Upload Failed",
            "Failed to upload file to storage. Please try again."
          );
        } finally {
          setIsUploadingEcc(false);
        }
      }
    } catch (error) {
      Alert.alert("Upload Error", "Failed to select file. Please try again.");
      console.error("Document picker error:", error);
      setIsUploadingEcc(false);
    }
  };

  const removeEccFile = async () => {
    Alert.alert("Remove File", "Are you sure you want to remove this file?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          // Delete from Supabase storage if storagePath exists
          if (uploadedEccFile?.storagePath) {
            try {
              const { error } = await supabase.storage
                .from("minecomplyapp-bucket")
                .remove([uploadedEccFile.storagePath]);

              if (error) {
                console.error("Failed to delete file from storage:", error);
              }
            } catch (error) {
              console.error("Error deleting file from storage:", error);
            }
          }

          setUploadedEccFile(null);
        },
      },
    ]);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Sorry, we need camera roll permissions to upload images."
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setUploadedImage(result.assets[0].uri);
    }
  };

  const handleBack = () => {
    navigation.goBack();
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
    const params = route?.params || {};

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


  const handleSaveNext = () => {
    console.log("Navigating to Water Quality Impact Assessment");
    const airQualityImpactAssessment = {
      quarry,
      plant,
      port,
      quarryPlant,
      quarryEnabled,
      plantEnabled,
      portEnabled,
      quarryPlantEnabled,
    };
    const nextParams = {
      submissionId: submissionId || storeSubmissionId,
      projectId: projectId || storeProjectId,
      projectName: projectName || storeProjectName,
      fileName: routeFileName || storeFileName,
      airQualityImpactAssessment,
    } as any;
    navigation.navigate("WaterQuality", nextParams);
  };

  return (
    <SafeAreaView style={styles.container}>
      <CMSHeader
        onBack={handleBack}
        onSave={handleSave}
        onStay={handleStay}
        onSaveToDraft={handleSaveToDraft}
        onDiscard={handleDiscard}
        onGoToSummary={handleGoToSummary}
        allowEdit={true}
      />
      <SectionHeader
        number="B.2."
        title="Compliance to Environmental Compliance Certificate Conditions"
      />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Upload ECC Conditions File */}
        <View style={styles.uploadSection}>
          <Text style={styles.uploadLabel}>Upload ECC Conditions Document</Text>
          {!uploadedEccFile ? (
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={uploadEccFile}
              disabled={isUploadingEcc}
            >
              {isUploadingEcc ? (
                <>
                  <ActivityIndicator color="#02217C" />
                  <Text style={styles.uploadButtonText}>Uploading...</Text>
                </>
              ) : (
                <>
                  <Ionicons
                    name="cloud-upload-outline"
                    size={24}
                    color="#02217C"
                  />
                  <Text style={styles.uploadButtonText}>Choose File</Text>
                  <Text style={styles.uploadHint}>DOC or DOCX</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.uploadedFileContainer}>
              <View style={styles.fileInfo}>
                <Ionicons name="document-text" size={24} color="#10B981" />
                <View style={styles.fileDetails}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {uploadedEccFile.name}
                  </Text>
                  <Text style={styles.fileSize}>
                    {uploadedEccFile.size
                      ? `${(uploadedEccFile.size / 1024).toFixed(2)} KB`
                      : "Size unknown"}
                  </Text>
                  {uploadedEccFile.storagePath && (
                    <Text style={styles.fileUploaded}>
                      ✓ Uploaded to storage
                    </Text>
                  )}
                </View>
              </View>
              <TouchableOpacity
                onPress={removeEccFile}
                style={styles.removeButton}
              >
                <Ionicons name="close-circle" size={24} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ✅ RESTORE: B.3 Air Quality Impact Assessment Section */}
        <SectionHeader
          number="B.3."
          title="Air Quality Impact Assessment"
        />

        {/* Quarry Location Description */}
        <View style={styles.locationInputContainer}>
          <View style={styles.locationHeaderRow}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => {
                setQuarryEnabled(!quarryEnabled);
                if (quarryEnabled) setQuarry(""); // Clear text when disabled
              }}
            >
              <View
                style={[
                  styles.checkbox,
                  quarryEnabled && styles.checkboxChecked,
                ]}
              >
                {quarryEnabled && (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                )}
              </View>
              <Text style={styles.locationLabel}>
                Quarry Location Description
              </Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={[
              styles.locationInput,
              !quarryEnabled && styles.locationInputDisabled,
            ]}
            value={quarry}
            onChangeText={setQuarry}
            placeholder="Enter quarry location description..."
            multiline
            numberOfLines={3}
            editable={quarryEnabled}
          />
        </View>

        {/* Plant Location Description */}
        <View style={styles.locationInputContainer}>
          <View style={styles.locationHeaderRow}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => {
                setPlantEnabled(!plantEnabled);
                if (plantEnabled) setPlant(""); // Clear text when disabled
              }}
            >
              <View
                style={[
                  styles.checkbox,
                  plantEnabled && styles.checkboxChecked,
                ]}
              >
                {plantEnabled && (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                )}
              </View>
              <Text style={styles.locationLabel}>
                Plant Location Description
              </Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={[
              styles.locationInput,
              !plantEnabled && styles.locationInputDisabled,
            ]}
            value={plant}
            onChangeText={setPlant}
            placeholder="Enter plant location description..."
            multiline
            numberOfLines={3}
            editable={plantEnabled}
          />
        </View>

        {/* Quarry / Plant Location Description */}
        <View style={styles.locationInputContainer}>
          <View style={styles.locationHeaderRow}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => {
                setQuarryPlantEnabled(!quarryPlantEnabled);
                if (quarryPlantEnabled) setQuarryPlant(""); // Clear text when disabled
              }}
            >
              <View
                style={[
                  styles.checkbox,
                  quarryPlantEnabled && styles.checkboxChecked,
                ]}
              >
                {quarryPlantEnabled && (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                )}
              </View>
              <Text style={styles.locationLabel}>
                Quarry / Plant Location Description
              </Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={[
              styles.locationInput,
              !quarryPlantEnabled && styles.locationInputDisabled,
            ]}
            value={quarryPlant}
            onChangeText={setQuarryPlant}
            placeholder="Enter quarry & plant location description..."
            multiline
            numberOfLines={3}
            editable={quarryPlantEnabled}
          />
        </View>

        {/* Port Location Description */}
        <View style={styles.locationInputContainer}>
          <View style={styles.locationHeaderRow}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => {
                setPortEnabled(!portEnabled);
                if (portEnabled) setPort(""); // Clear text when disabled
              }}
            >
              <View
                style={[styles.checkbox, portEnabled && styles.checkboxChecked]}
              >
                {portEnabled && (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                )}
              </View>
              <Text style={styles.locationLabel}>
                Port Location Description
              </Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={[
              styles.locationInput,
              !portEnabled && styles.locationInputDisabled,
            ]}
            value={port}
            onChangeText={setPort}
            placeholder="Enter port location description..."
            multiline
            numberOfLines={3}
            editable={portEnabled}
          />
        </View>

        {/* Save & Next Button */}
        <TouchableOpacity
          style={styles.saveNextButton}
          onPress={handleSaveNext}
        >
          <Text style={styles.saveNextText}>Save & Next</Text>
          <Ionicons name="arrow-forward" size={20} color="white" />
        </TouchableOpacity>
        {/* filler gap ts not advisable tbh*/}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
