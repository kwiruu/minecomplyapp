// ComplianceMonitoringScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useNavigation, CommonActions } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { CMSHeader } from "../../../components/CMSHeader";
import { saveDraft } from "../../../lib/drafts";
import { keyboardShouldPersistTapsForFabric } from "../../../utils/nativeRuntimeProps";
import {
  createSignedDownloadUrl,
  uploadProjectLocationImage,
} from "../../../lib/storage";
import { supabase } from "../../../lib/supabase";
import { CMSTitlePill } from "./components/CMSTitlePill";
import { CMSSectionHeader } from "./components/CMSSectionHeader";
import { CMSFormField } from "./components//CMSFormField";
import { CMSOtherComponents } from "./components/CMSOtherComponents";
import { useFileName } from "../../../contexts/FileNameContext";
import { useCmvrStore } from "../../../store/cmvrStore";
import {
  FormData,
  OtherComponent,
  UploadedImages,
} from "../types/ComplianceMonitoringScreen.types";
import { styles } from "../styles/ComplianceMonitoringScreen.styles";

const ComplianceMonitoringScreen = ({ navigation, route }: any) => {
  // Use the fileName context
  const { fileName, setFileName } = useFileName();
  
  // ✅ FIX: Use Zustand store for proper draft management
  const { updateMultipleSections, saveDraft: saveDraftToStore, currentReport } = useCmvrStore();

  // Initialize fileName from route params if provided
  useEffect(() => {
    if (route?.params?.fileName && route.params.fileName !== fileName) {
      setFileName(route.params.fileName);
    }
  }, [route?.params?.fileName]);

  const [formData, setFormData] = useState<FormData>({
    projectLocation: {
      label: "Project Location",
      specification: "",
      remarks: "",
      withinSpecs: null,
    },
    projectArea: {
      label: "Project Area (ha)",
      specification: "",
      remarks: "",
      withinSpecs: null,
    },
    capitalCost: {
      label: "Capital Cost (Php)",
      specification: "",
      remarks: "",
      withinSpecs: null,
    },
    typeOfMinerals: {
      label: "Type of Minerals",
      specification: "",
      remarks: "",
      withinSpecs: null,
    },
    miningMethod: {
      label: "Mining Method",
      specification: "",
      remarks: "",
      withinSpecs: null,
    },
    production: {
      label: "Production",
      specification: "",
      remarks: "",
      withinSpecs: null,
    },
    mineLife: {
      label: "Mine Life",
      specification: "",
      remarks: "",
      withinSpecs: null,
    },
    mineralReserves: {
      label: "Mineral Reserves/ Resources",
      specification: "",
      remarks: "",
      withinSpecs: null,
    },
    accessTransportation: {
      label: "Access/ Transportation",
      specification: "",
      remarks: "",
      withinSpecs: null,
    },
    powerSupply: {
      label: "Power Supply",
      specification: "",
      remarks: "",
      withinSpecs: null,
      subFields: [
        { label: "Plant:", specification: "" },
        { label: "Port:", specification: "" },
      ],
    },
    miningEquipment: {
      label: "Mining Equipment",
      specification: "",
      remarks: "",
      withinSpecs: null,
      subFields: [
        { label: "Quarry/Plant:", specification: "" },
        { label: "Port:", specification: "" },
      ],
    },
    workForce: {
      label: "Work Force",
      specification: "",
      remarks: "",
      withinSpecs: null,
      subFields: [{ label: "Employees:", specification: "" }],
    },
    developmentSchedule: {
      label: "Development/ Utilization Schedule",
      specification: "",
      remarks: "",
      withinSpecs: null,
    },
  });

  const [otherComponents, setOtherComponents] = useState<OtherComponent[]>([]);
  const [uploadedImages, setUploadedImages] = useState<UploadedImages>({});
  const [imagePreviews, setImagePreviews] = useState<Record<string, string>>(
    {}
  );
  const [uploadingImages, setUploadingImages] = useState<
    Record<string, boolean>
  >({});

  const pickImage = async (
    fieldKey: string,
    source: "camera" | "gallery" = "gallery"
  ) => {
    if (fieldKey !== "projectLocation") {
      console.warn(
        `Image uploads are currently supported only for projectLocation. Ignoring field: ${fieldKey}`
      );
      return;
    }

    // Request appropriate permissions based on source
    if (source === "camera") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Sorry, we need camera permissions to take photos."
        );
        return;
      }
    } else {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Sorry, we need camera roll permissions to upload images."
        );
        return;
      }
    }

    // Launch appropriate picker based on source
    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
            presentationStyle:
              ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
            presentationStyle:
              ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN,
          });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    const asset = result.assets[0];
    const previousPath = uploadedImages[fieldKey];
    const previousPreview = imagePreviews[fieldKey];

    setUploadingImages((prev) => ({ ...prev, [fieldKey]: true }));
    setImagePreviews((prev) => ({ ...prev, [fieldKey]: asset.uri }));

    try {
      const { path } = await uploadProjectLocationImage({
        uri: asset.uri,
        fileName: asset.fileName ?? undefined,
        mimeType: asset.mimeType,
      });

      setUploadedImages((prev) => ({ ...prev, [fieldKey]: path }));

      if (previousPath && previousPath !== path) {
        try {
          await supabase.storage
            .from("minecomplyapp-bucket")
            .remove([previousPath]);
        } catch (removeErr) {
          console.warn(
            "Failed to remove previous project location image from storage",
            removeErr
          );
        }
      }
    } catch (error: any) {
      console.error("Failed to upload project location image:", error);
      if (previousPreview) {
        setImagePreviews((prev) => ({
          ...prev,
          [fieldKey]: previousPreview,
        }));
      } else {
        setImagePreviews((prev) => {
          const updated = { ...prev };
          delete updated[fieldKey];
          return updated;
        });
      }
      Alert.alert(
        "Upload failed",
        error?.message || "Could not upload the image. Please try again."
      );
    } finally {
      setUploadingImages((prev) => {
        const updated = { ...prev };
        delete updated[fieldKey];
        return updated;
      });
    }
  };

  const removeImage = async (fieldKey: string) => {
    const existingPath = uploadedImages[fieldKey];
    if (existingPath) {
      try {
        await supabase.storage
          .from("minecomplyapp-bucket")
          .remove([existingPath]);
      } catch (error) {
        console.warn("Failed to remove image from Supabase storage", error);
      }
    }

    setUploadedImages((prev) => {
      const updated = { ...prev };
      delete updated[fieldKey];
      return updated;
    });

    setImagePreviews((prev) => {
      const updated = { ...prev };
      delete updated[fieldKey];
      return updated;
    });
  };

  const updateField = (
    key: keyof FormData,
    field: "specification" | "remarks" | "withinSpecs",
    value: string | boolean | null
  ) => {
    setFormData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }));
  };

  const updateSubField = (
    key: keyof FormData,
    index: number,
    value: string
  ) => {
    setFormData((prev) => {
      const currentField = prev[key];
      const updatedSubFields = currentField?.subFields?.map((field, i) =>
        i === index ? { ...field, specification: value } : field
      );
      return {
        ...prev,
        [key]: {
          ...currentField,
          subFields: updatedSubFields,
        },
      };
    });
  };

  const addOtherComponent = () => {
    setOtherComponents([
      ...otherComponents,
      { specification: "", remarks: "", withinSpecs: null },
    ]);
  };

  const updateOtherComponent = (
    index: number,
    field: "specification" | "remarks",
    value: string
  ) => {
    setOtherComponents((prev) => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = { ...updated[index], [field]: value };
      }
      return updated;
    });
  };

  const handleWithinSpecsChange = (index: number, value: boolean) => {
    setOtherComponents((prev) => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index].withinSpecs = value;
      }
      return updated;
    });
  };

  const handleDeleteComponent = (index: number) => {
    Alert.alert(
      "Delete Parameter",
      "Are you sure you want to delete this parameter?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setOtherComponents((prev) => prev.filter((_, i) => i !== index));
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    console.log("Proceeding to next page (no draft save)");
    const complianceToProjectLocationAndCoverageLimits = {
      formData,
      otherComponents,
      uploadedImages,
    };
    const nextParams = {
      ...(route?.params || {}),
      fileName: (route?.params as any)?.fileName || fileName,
      complianceToProjectLocationAndCoverageLimits,
    } as any;
    console.log(
      "Navigating with ComplianceMonitoring params keys:",
      Object.keys(nextParams)
    );
    navigation.navigate("EIACompliance", nextParams);
  };

  const handleStay = () => {
    console.log("User chose to stay");
  };

  // ✅ FIX: Auto-sync form data to store
  useEffect(() => {
    updateMultipleSections({
      complianceToProjectLocationAndCoverageLimits: {
        formData,
        otherComponents,
        uploadedImages,
      },
    });
  }, [formData, otherComponents, uploadedImages]);

  // ✅ FIX: Load existing data from store on mount - merge with defaults to ensure all parameters are always present
  useEffect(() => {
    const stored = currentReport?.complianceToProjectLocationAndCoverageLimits;
    if (stored) {
      // Merge stored formData with default formData to ensure all 14 parameters are always present
      if (stored.formData) {
        setFormData((prevDefault) => {
          // Start with default formData structure (all 14 parameters)
          const merged = { ...prevDefault };
          // Overlay stored values, preserving structure for missing parameters
          Object.keys(prevDefault).forEach((key) => {
            if (stored.formData[key]) {
              merged[key] = {
                ...prevDefault[key],
                ...stored.formData[key],
                // Preserve subFields structure if it exists in default
                subFields: stored.formData[key].subFields || prevDefault[key].subFields,
              };
            }
          });
          return merged;
        });
      }
      if (stored.otherComponents) setOtherComponents(stored.otherComponents);
      if (stored.uploadedImages) setUploadedImages(stored.uploadedImages);
    }
  }, []);

  const handleSaveToDraft = async () => {
    try {
      // ✅ FIX: Use store's saveDraft which includes all sections
      const result = await saveDraftToStore();
      
      if (result.success) {
        Alert.alert("Success", "Draft saved successfully");
        // Navigate to Dashboard using CommonActions.reset
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "Dashboard" }],
          })
        );
      } else {
        Alert.alert("Error", result.error || "Failed to save draft. Please try again.");
      }
    } catch (error: any) {
      console.error("Error saving draft:", error);
      Alert.alert("Error", error?.message || "Failed to save draft. Please try again.");
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

  const handleGoToSummary = async () => {
    try {
      console.log("Navigating to summary with current data");

      // Prepare current page data
      const complianceToProjectLocationAndCoverageLimits = {
        formData,
        otherComponents,
        uploadedImages,
      };

      // Collect all data from route params and current page
      const prevPageData: any = route.params || {};

      // Prepare complete snapshot with all sections
      const completeData = {
        generalInfo: prevPageData.generalInfo,
        eccInfo: prevPageData.eccInfo,
        eccAdditionalForms: prevPageData.eccAdditionalForms,
        isagInfo: prevPageData.isagInfo,
        isagAdditionalForms: prevPageData.isagAdditionalForms,
        epepInfo: prevPageData.epepInfo,
        epepAdditionalForms: prevPageData.epepAdditionalForms,
        rcfInfo: prevPageData.rcfInfo,
        rcfAdditionalForms: prevPageData.rcfAdditionalForms,
        mtfInfo: prevPageData.mtfInfo,
        mtfAdditionalForms: prevPageData.mtfAdditionalForms,
        fmrdfInfo: prevPageData.fmrdfInfo,
        fmrdfAdditionalForms: prevPageData.fmrdfAdditionalForms,
        mmtInfo: prevPageData.mmtInfo,
        executiveSummary: prevPageData.executiveSummary,
        processDocumentation: prevPageData.processDocumentation,
        complianceToProjectLocationAndCoverageLimits, // Current page data
        complianceToImpactManagement: prevPageData.complianceToImpactManagement,
        airQuality: prevPageData.airQuality,
        waterQuality: prevPageData.waterQuality,
        noiseQuality: prevPageData.noiseQuality,
        wasteManagement: prevPageData.wasteManagement,
        chemicalSafety: prevPageData.chemicalSafety,
        complaints: prevPageData.complaints,
        recommendationsData: prevPageData.recommendationsData,
        attendanceUrl: prevPageData.attendanceUrl,
        savedAt: new Date().toISOString(),
      };

      // Resolve fileName from params or context
      const resolvedFileName = prevPageData.fileName || fileName || "Untitled";

      // Save to draft before navigating
      await saveDraft(resolvedFileName, completeData);

      // Navigate to summary screen with all data
      navigation.navigate("CMVRDocumentExport", {
        ...prevPageData,
        fileName: resolvedFileName,
        complianceToProjectLocationAndCoverageLimits,
        draftData: completeData,
      });
    } catch (error) {
      console.error("Error navigating to summary:", error);
      Alert.alert("Error", "Failed to navigate to summary. Please try again.");
    }
  };

  const fillTestData = () => {
    // Populate main form fields with sample values
    setFormData({
      projectLocation: {
        label: "Project Location",
        specification: "Sitio Sta. Rosa, Brgy. San Miguel",
        remarks: "Within permitted boundaries",
        withinSpecs: true,
      },
      projectArea: {
        label: "Project Area (ha)",
        specification: "125.4",
        remarks: "As per approved ECC",
        withinSpecs: true,
      },
      capitalCost: {
        label: "Capital Cost (Php)",
        specification: "150000000",
        remarks: "Updated estimate",
        withinSpecs: true,
      },
      typeOfMinerals: {
        label: "Type of Minerals",
        specification: "Nickel",
        remarks: "Primary commodity",
        withinSpecs: null,
      },
      miningMethod: {
        label: "Mining Method",
        specification: "Open pit with staged rehabilitation",
        remarks: "Conforms to EPEP",
        withinSpecs: true,
      },
      production: {
        label: "Production",
        specification: "120000 tons/month",
        remarks: "Stable production",
        withinSpecs: null,
      },
      mineLife: {
        label: "Mine Life",
        specification: "15 years",
        remarks: "Estimated remaining life",
        withinSpecs: null,
      },
      mineralReserves: {
        label: "Mineral Reserves/ Resources",
        specification: "Measured: 2.5M tons",
        remarks: "Geological update 2024",
        withinSpecs: null,
      },
      accessTransportation: {
        label: "Access/ Transportation",
        specification: "Existing access road maintained",
        remarks: "No encroachment",
        withinSpecs: true,
      },
      powerSupply: {
        label: "Power Supply",
        specification: "On-grid with backup genset",
        remarks: "Verified via plant inspection",
        withinSpecs: true,
        subFields: [
          { label: "Plant:", specification: "2x 1MW genset" },
          { label: "Port:", specification: "Shared power line" },
        ],
      },
      miningEquipment: {
        label: "Mining Equipment",
        specification: "2x excavator, 3x haul trucks",
        remarks: "Maintained per SOP",
        withinSpecs: true,
        subFields: [
          { label: "Quarry/Plant:", specification: "1 crusher" },
          { label: "Port:", specification: "Conveyor system" },
        ],
      },
      workForce: {
        label: "Work Force",
        specification: "450 employees",
        remarks: "Includes contractors",
        withinSpecs: null,
        subFields: [{ label: "Employees:", specification: "450" }],
      },
      developmentSchedule: {
        label: "Development/ Utilization Schedule",
        specification: "Phase 2 development Q3 2025",
        remarks: "On schedule",
        withinSpecs: null,
      },
    });

    // Add 3 other components for testing
    setOtherComponents([
      {
        specification: "Waste Management Facility - Cell A",
        remarks: "Operational",
        withinSpecs: true,
      },
      {
        specification: "Sediment Pond - SP1",
        remarks: "Maintenance required",
        withinSpecs: false,
      },
      {
        specification: "Rehabilitation Plot - R1",
        remarks: "Planted with native species",
        withinSpecs: true,
      },
    ]);

    Alert.alert(
      "Test Data",
      "Compliance Monitoring section filled with test data (3 other components)"
    );
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  // Hydrate from route params when coming from a draft
  useEffect(() => {
    const params: any = route?.params || {};
    const saved = params.complianceToProjectLocationAndCoverageLimits;
    let isCancelled = false;

    if (saved) {
      // ✅ FIX: Merge saved formData with default formData to ensure all 14 parameters are always present
      if (saved.formData) {
        setFormData((prevDefault) => {
          // Start with default formData structure (all 14 parameters)
          const merged = { ...prevDefault };
          // Overlay saved values, preserving structure for missing parameters
          Object.keys(prevDefault).forEach((key) => {
            if (saved.formData[key]) {
              merged[key] = {
                ...prevDefault[key],
                ...saved.formData[key],
                // Preserve subFields structure if it exists in default
                subFields: saved.formData[key].subFields || prevDefault[key].subFields,
              };
            }
          });
          return merged;
        });
      }
      if (Array.isArray(saved.otherComponents)) {
        setOtherComponents(saved.otherComponents);
      }
      if (saved.uploadedImages) {
        setUploadedImages(saved.uploadedImages);

        const loadPreviews = async () => {
          const entries = Object.entries(saved.uploadedImages).filter(
            ([, path]) => Boolean(path)
          );
          if (!entries.length) {
            setImagePreviews((prev) => {
              const updated = { ...prev };
              Object.keys(saved.uploadedImages).forEach((key) => {
                delete updated[key];
              });
              return updated;
            });
            return;
          }

          const previews: Record<string, string> = {};
          await Promise.all(
            entries.map(async ([key, path]) => {
              const storagePath = String(path);
              if (!storagePath) {
                return;
              }
              try {
                const { url } = await createSignedDownloadUrl(storagePath, 600);
                if (url) {
                  previews[key] = url;
                }
              } catch (error) {
                console.error(
                  `Failed to fetch signed URL for project location image at ${storagePath}`,
                  error
                );
              }
            })
          );

          if (isCancelled) {
            return;
          }

          setImagePreviews((prev) => {
            const updated = { ...prev };
            Object.keys(saved.uploadedImages).forEach((key) => {
              const previewUrl = previews[key];
              if (previewUrl) {
                updated[key] = previewUrl;
              } else {
                delete updated[key];
              }
            });
            return updated;
          });
        };

        loadPreviews();
      }
    }

    return () => {
      isCancelled = true;
    };
  }, [route?.params]);

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <View style={styles.headerContainer}>
          <CMSHeader
            onBack={() => navigation.goBack()}
            onSave={handleSave}
            onStay={handleStay}
            onSaveToDraft={handleSaveToDraft}
            onDiscard={handleDiscard}
            onGoToSummary={handleGoToSummary}
          />
        </View>
        <CMSTitlePill title="COMPLIANCE MONITORING REPORT AND DISCUSSIONS" />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps={keyboardShouldPersistTapsForFabric}
        >
          <CMSSectionHeader
            sectionNumber="1."
            title="Compliance to Project Location and Coverage Limits (As specified in ECC and/ or EPEP)"
          />
          <View style={styles.parametersHeader}>
            <Text style={styles.parametersText}>PARAMETERS:</Text>
          </View>
          {Object.entries(formData).map(([key, field]) => (
            <CMSFormField
              key={key}
              label={field.label}
              specification={field.specification}
              remarks={field.remarks}
              withinSpecs={field.withinSpecs}
              subFields={field.subFields}
              showUploadImage={key === "projectLocation"}
              uploadedImage={imagePreviews[key]}
              isUploadingImage={!!uploadingImages[key]}
              onSpecificationChange={(text) =>
                updateField(key as keyof FormData, "specification", text)
              }
              onRemarksChange={(text) =>
                updateField(key as keyof FormData, "remarks", text)
              }
              onWithinSpecsChange={(value) =>
                updateField(key as keyof FormData, "withinSpecs", value)
              }
              onSubFieldChange={(index, value) =>
                updateSubField(key as keyof FormData, index, value)
              }
              onUploadImage={(source) => pickImage(key, source)}
              onRemoveImage={() => removeImage(key)}
            />
          ))}
          <CMSOtherComponents
            components={otherComponents}
            onComponentChange={updateOtherComponent}
            onWithinSpecsChange={handleWithinSpecsChange}
            onAddComponent={addOtherComponent}
            onDeleteComponent={handleDeleteComponent}
          />
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

          <TouchableOpacity style={styles.saveNextButton} onPress={handleSave}>
            <Text style={styles.saveNextButtonText}>Save & Next</Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
};

export default ComplianceMonitoringScreen;
