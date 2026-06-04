import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  Alert,
  TouchableOpacity,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CommonActions } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { CMSHeader } from "../../../components/CMSHeader";
import { useCmvrStore } from "../../../store/cmvrStore";
import { ChemicalSafetySection } from "./components/ChemicalSafetySection";
import { ComplianceCheckboxSection } from "./components/ComplianceCheckboxSection";
import { ComplaintsSection } from "./components/ComplaintsSection";
import {
  ChemicalSafetyData,
  Complaint,
  YesNoNull,
  ChemicalCategory,
} from "../types/ChemicalSafetyScreen.types";
import { styles } from "../styles/ChemicalSafetyScreen.styles";

export default function ChemicalSafetyScreen({ navigation, route }: any) {
  // **ZUSTAND STORE** - Single source of truth
  const {
    currentReport,
    fileName: storeFileName,
    submissionId: storeSubmissionId,
    projectId: storeProjectId,
    projectName: storeProjectName,
    updateMultipleSections,
    saveDraft,
  } = useCmvrStore();

  // Initialize from store
  const storedChemicalSafety =
    currentReport?.complianceWithGoodPracticeInChemicalSafetyManagement;
  const storedComplaints = currentReport?.complaintsVerificationAndManagement;

  const [chemicalSafety, setChemicalSafety] = useState<ChemicalSafetyData>(
    storedChemicalSafety?.chemicalSafety || {
      isNA: false,
      riskManagement: null,
      training: null,
      handling: null,
      emergencyPreparedness: null,
      remarks: "",
      chemicalCategory: null,
      othersSpecify: "",
    }
  );

  const [healthSafetyChecked, setHealthSafetyChecked] = useState(
    storedChemicalSafety?.healthSafetyChecked || false
  );

  const [socialDevChecked, setSocialDevChecked] = useState(
    storedChemicalSafety?.socialDevChecked || false
  );

  const [complaints, setComplaints] = useState<Complaint[]>(
    storedComplaints || [
      {
        id: `complaint-${Date.now()}`,
        isNA: false,
        dateFiled: "",
        filedLocation: null,
        othersSpecify: "",
        nature: "",
        resolutions: "",
      },
    ]
  );

  const [hasHydratedFromStore, setHasHydratedFromStore] = useState(false);

  // Hydrate from store when data becomes available
  useEffect(() => {
    if (hasHydratedFromStore || !currentReport) return;

    if (storedChemicalSafety) {
      setChemicalSafety(
        storedChemicalSafety.chemicalSafety || {
          isNA: false,
          riskManagement: null,
          training: null,
          handling: null,
          emergencyPreparedness: null,
          remarks: "",
          chemicalCategory: null,
          othersSpecify: "",
        }
      );
      setHealthSafetyChecked(storedChemicalSafety.healthSafetyChecked ?? false);
      setSocialDevChecked(storedChemicalSafety.socialDevChecked ?? false);
    }

    if (storedComplaints && Array.isArray(storedComplaints)) {
      setComplaints(storedComplaints);
    }

    setHasHydratedFromStore(true);
  }, [
    currentReport,
    storedChemicalSafety,
    storedComplaints,
    hasHydratedFromStore,
  ]);

  // Auto-sync to store
  useEffect(() => {
    updateMultipleSections({
      complianceWithGoodPracticeInChemicalSafetyManagement: {
        chemicalSafety,
        healthSafetyChecked,
        socialDevChecked,
      },
      complaintsVerificationAndManagement: complaints,
    });
  }, [chemicalSafety, healthSafetyChecked, socialDevChecked, complaints]);

  const updateChemicalSafety = (
    field: keyof ChemicalSafetyData,
    value: YesNoNull | string | boolean | ChemicalCategory
  ) => {
    setChemicalSafety((prev) => {
      const newState = { ...prev };
      if (field === "isNA") {
        newState.isNA = value as boolean;
        if (newState.isNA) {
          newState.riskManagement = null;
          newState.training = null;
          newState.handling = null;
          newState.emergencyPreparedness = null;
          newState.remarks = "";
          newState.chemicalCategory = null;
          newState.othersSpecify = "";
        }
      } else {
        newState.isNA = false;
        (newState[field] as any) = value;
        if (field === "chemicalCategory" && value !== "Others") {
          newState.othersSpecify = "";
        }
      }
      return newState;
    });
  };

  const addComplaint = () => {
    const newComplaint: Complaint = {
      id: `complaint-${Date.now()}`,
      isNA: false,
      dateFiled: "",
      filedLocation: null,
      othersSpecify: "",
      nature: "",
      resolutions: "",
    };
    setComplaints((prev) => [...prev, newComplaint]);
  };

  const updateComplaint = (
    id: string,
    field: keyof Omit<Complaint, "id">,
    value: string | boolean | Complaint["filedLocation"]
  ) => {
    setComplaints((prev) =>
      prev.map((complaint) => {
        if (complaint.id === id) {
          const updatedComplaint = { ...complaint };
          if (field === "isNA") {
            updatedComplaint.isNA = value as boolean;
            if (updatedComplaint.isNA) {
              updatedComplaint.dateFiled = "";
              updatedComplaint.filedLocation = null;
              updatedComplaint.othersSpecify = "";
              updatedComplaint.nature = "";
              updatedComplaint.resolutions = "";
            }
          } else {
            updatedComplaint.isNA = false;
            (updatedComplaint[field] as any) = value;
            if (field === "filedLocation" && value !== "Others") {
              updatedComplaint.othersSpecify = "";
            }
          }
          return updatedComplaint;
        }
        return complaint;
      })
    );
  };

  const removeComplaint = (id: string) => {
    Alert.alert(
      "Remove Complaint",
      "Are you sure you want to remove this complaint?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            if (complaints.length > 1) {
              setComplaints((prev) => prev.filter((c) => c.id !== id));
            } else {
              Alert.alert(
                "Cannot Remove",
                "At least one complaint entry is required."
              );
            }
          },
        },
      ]
    );
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

  const fillTestData = () => {
    setChemicalSafety({
      isNA: false,
      riskManagement: "YES",
      training: "YES",
      handling: "YES",
      emergencyPreparedness: "YES",
      remarks:
        "All chemical safety protocols are in place and being followed. Regular training conducted quarterly.",
      chemicalCategory: null,
      othersSpecify: "",
    });

    setHealthSafetyChecked(true);
    setSocialDevChecked(true);

    // Add 3 complaints
    setComplaints([
      {
        id: "1",
        isNA: false,
        dateFiled: "January 15, 2025",
        filedLocation: "DENR",
        othersSpecify: "",
        nature:
          "Noise complaint from nearby residents during blasting operations",
        resolutions:
          "Adjusted blasting schedule to avoid early morning hours. Provided advance notice to community. Issue resolved.",
      },
      {
        id: "2",
        isNA: false,
        dateFiled: "February 20, 2025",
        filedLocation: "Others",
        othersSpecify: "LGU",
        nature: "Dust accumulation on crops near haul road reported by farmer",
        resolutions:
          "Increased frequency of water spraying on haul road. Installed additional dust suppressors. Compensated affected farmer.",
      },
      {
        id: "3",
        isNA: false,
        dateFiled: "March 5, 2025",
        filedLocation: "Others",
        othersSpecify: "Barangay",
        nature:
          "Request for road maintenance on access road used by mining trucks",
        resolutions:
          "Agreed to co-fund road repair with LGU. Work scheduled for April 2025. Regular maintenance plan established.",
      },
    ]);

    Alert.alert(
      "Test Data",
      "Chemical Safety filled with test data (3 complaints)"
    );
  };

  const handleSaveNext = () => {
    console.log("Navigating to Recommendations screen (no draft save)...");
    const complianceWithGoodPracticeInChemicalSafetyManagement = {
      chemicalSafety,
      healthSafetyChecked,
      socialDevChecked,
    };
    const complaintsVerificationAndManagement = complaints;
    const nextParams = {
      ...(route?.params || {}),
      complianceWithGoodPracticeInChemicalSafetyManagement,
      complaintsVerificationAndManagement,
    } as any;
    console.log(
      "Navigating with ChemicalSafety params keys:",
      Object.keys(nextParams)
    );
    navigation.navigate("Recommendations", nextParams);
  };

  return (
    <SafeAreaView style={styles.container}>
      <CMSHeader
        onBack={() => navigation.goBack()}
        onSave={handleSave}
        onStay={handleStay}
        onSaveToDraft={handleSaveToDraft}
        onDiscard={handleDiscard}
        onGoToSummary={handleGoToSummary}
        allowEdit={false}
      />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <ChemicalSafetySection
          chemicalSafety={chemicalSafety}
          updateChemicalSafety={updateChemicalSafety}
        />
        <ComplianceCheckboxSection
          sectionNumber="5"
          title="Health and Safety Program"
          subtitle="Independent Monitoring c/o TSHES Team"
          icon="shield-checkmark"
          checked={healthSafetyChecked}
          onToggle={() => setHealthSafetyChecked(!healthSafetyChecked)}
        />
        <ComplianceCheckboxSection
          sectionNumber="6"
          title="Social Development Plan"
          subtitle="Independent Monitoring c/o TSHES Team"
          icon="people"
          checked={socialDevChecked}
          onToggle={() => setSocialDevChecked(!socialDevChecked)}
        />
        <ComplaintsSection
          complaints={complaints}
          updateComplaint={updateComplaint}
          addComplaint={addComplaint}
          removeComplaint={removeComplaint}
        />
        {__DEV__ && (
          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: "#ff8c00", marginTop: 12 },
            ]}
            onPress={fillTestData}
          >
            <Text style={styles.saveButtonText}>Fill Test Data</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveNext}>
          <Text style={styles.saveButtonText}>Save & Next</Text>
          <Ionicons name="arrow-forward" size={20} color="white" />
        </TouchableOpacity>
        {/* filler gap ts not advisable tbh*/}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
