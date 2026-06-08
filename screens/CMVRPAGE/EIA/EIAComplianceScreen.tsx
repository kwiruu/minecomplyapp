// EIAComplianceScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useNavigation, CommonActions } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { CMSHeader } from "../../../components/CMSHeader";
import { useCmvrStore } from "../../../store/cmvrStore";
import { keyboardShouldPersistTapsForFabric } from "../../../utils/nativeRuntimeProps";
import { ProjectImpacts } from "./components/ProjectImpacts";
import { OperationSectionComponent } from "./components/OperationSection";
import { OverallCompliance } from "./components/OverallCompliance";
import {
  EIAComplianceScreenNavigationProp,
  YesNoNull,
  OperationSection,
  MitigatingMeasure,
} from "../types/EIAComplianceScreen.types";
import { styles } from "../styles/EIAComplianceScreen.styles";

const createDefaultOperationSection = (title: string): OperationSection => ({
  title,
  isNA: false,
  measures: [
    {
      id: "1",
      planned: "",
      actualObservation: "",
      isEffective: null,
      recommendations: "",
    },
  ],
});

const EIAComplianceScreen: React.FC<{
  navigation: EIAComplianceScreenNavigationProp;
  route: any;
}> = ({ navigation, route }) => {
  // Zustand store
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
  const storedEIA = currentReport?.complianceToImpactManagementCommitments;

  const [preConstruction, setPreConstruction] = useState<YesNoNull>(
    storedEIA?.preConstruction ?? null
  );
  const [construction, setConstruction] = useState<YesNoNull>(
    storedEIA?.construction ?? null
  );

  const [quarryOperation, setQuarryOperation] = useState<OperationSection>(
    storedEIA?.quarryOperation ||
      createDefaultOperationSection("Quarry Operation")
  );

  const [plantOperation, setPlantOperation] = useState<OperationSection>(
    storedEIA?.plantOperation ||
      createDefaultOperationSection("Plant Operation")
  );

  const [portOperation, setPortOperation] = useState<OperationSection>(
    storedEIA?.portOperation || createDefaultOperationSection("Port Operation")
  );

  const [overallCompliance, setOverallCompliance] = useState(
    storedEIA?.overallCompliance || ""
  );

  const [hasHydratedFromStore, setHasHydratedFromStore] = useState(false);

  useEffect(() => {
    if (hasHydratedFromStore || !currentReport) return;

    if (storedEIA) {
      setPreConstruction(storedEIA.preConstruction ?? null);
      setConstruction(storedEIA.construction ?? null);
      setQuarryOperation(
        storedEIA.quarryOperation ||
          createDefaultOperationSection("Quarry Operation")
      );
      setPlantOperation(
        storedEIA.plantOperation ||
          createDefaultOperationSection("Plant Operation")
      );
      setPortOperation(
        storedEIA.portOperation ||
          createDefaultOperationSection("Port Operation")
      );
      setOverallCompliance(storedEIA.overallCompliance || "");
    }

    setHasHydratedFromStore(true);
  }, [currentReport, storedEIA, hasHydratedFromStore]);

  // Auto-sync to store
  useEffect(() => {
    updateMultipleSections({
      complianceToImpactManagementCommitments: {
        preConstruction,
        construction,
        quarryOperation,
        plantOperation,
        portOperation,
        overallCompliance,
      },
    });
  }, [
    preConstruction,
    construction,
    quarryOperation,
    plantOperation,
    portOperation,
    overallCompliance,
  ]);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

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
      Alert.alert("Error", "Failed to save draft");
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
      Alert.alert("Error", "Failed to save draft");
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

    (navigation as any).navigate("CMVRDocumentExport", {
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
    setPreConstruction("yes");
    setConstruction("yes");

    // Quarry Operation - 3 mitigating measures
    setQuarryOperation({
      title: "Quarry Operation",
      isNA: false,
      measures: [
        {
          id: "1",
          planned: "Dust suppression through water spraying",
          actualObservation:
            "Water spraying system operational, regular application observed",
          isEffective: "yes",
          recommendations:
            "Maintain current practices, consider additional coverage during dry season",
        },
        {
          id: "2",
          planned: "Progressive rehabilitation of mined-out areas",
          actualObservation:
            "Rehabilitation ongoing in Phase 1 area, native species planted",
          isEffective: "yes",
          recommendations:
            "Continue monitoring survival rates, expand to Phase 2",
        },
        {
          id: "3",
          planned: "Noise control through equipment maintenance",
          actualObservation:
            "Regular maintenance schedule followed, noise levels within limits",
          isEffective: "yes",
          recommendations: "No changes required, continue monitoring",
        },
      ],
    });

    // Plant Operation - 3 mitigating measures
    setPlantOperation({
      title: "Plant Operation",
      isNA: false,
      measures: [
        {
          id: "1",
          planned: "Air quality monitoring and emission controls",
          actualObservation:
            "Baghouse filters operational, emissions below standards",
          isEffective: "yes",
          recommendations:
            "Replace filters as scheduled, continue quarterly monitoring",
        },
        {
          id: "2",
          planned: "Wastewater treatment before discharge",
          actualObservation:
            "Treatment facility functioning, effluent meets DENR standards",
          isEffective: "yes",
          recommendations: "Maintain current treatment processes",
        },
        {
          id: "3",
          planned: "Solid waste segregation and disposal",
          actualObservation:
            "Segregation protocols followed, disposal records complete",
          isEffective: "yes",
          recommendations: "Continue waste audit program",
        },
      ],
    });

    // Port Operation - 3 mitigating measures
    setPortOperation({
      title: "Port Operation",
      isNA: false,
      measures: [
        {
          id: "1",
          planned: "Marine water quality monitoring",
          actualObservation:
            "Monthly monitoring conducted, parameters within limits",
          isEffective: "yes",
          recommendations: "Expand monitoring points near coral reef areas",
        },
        {
          id: "2",
          planned: "Spill prevention and response procedures",
          actualObservation:
            "Spill kits positioned strategically, staff trained on response",
          isEffective: "yes",
          recommendations:
            "Conduct quarterly drills, update emergency contacts",
        },
        {
          id: "3",
          planned: "Dust control during loading operations",
          actualObservation:
            "Conveyor enclosures installed, minimal dust generation observed",
          isEffective: "yes",
          recommendations: "Inspect enclosures monthly for wear and tear",
        },
      ],
    });

    setOverallCompliance(
      "The mining operation demonstrates strong compliance with EIA commitments and EPEP requirements. All environmental impact control strategies are being effectively implemented across quarry, plant, and port operations. Recommended areas for improvement include expanding marine monitoring coverage and continuing progressive rehabilitation efforts."
    );

    Alert.alert(
      "Test Data",
      "EIA Compliance filled with test data (3 measures per operation)"
    );
  };

  const handleSaveAndNext = () => {
    console.log("Proceeding to next page (no draft save)");
    const complianceToImpactManagementCommitments = {
      preConstruction,
      construction,
      quarryOperation,
      plantOperation,
      portOperation,
      overallCompliance,
    };
    const nextParams = {
      ...(route?.params || {}),
      complianceToImpactManagementCommitments,
    } as any;
    console.log(
      "Navigating with EIACompliance params keys:",
      Object.keys(nextParams)
    );
    navigation.navigate("EnvironmentalCompliance", nextParams);
  };

  const addMeasure = (section: "quarry" | "plant" | "port") => {
    const newMeasure: MitigatingMeasure = {
      id: Date.now().toString(),
      planned: "",
      actualObservation: "",
      isEffective: null,
      recommendations: "",
    };
    if (section === "quarry") {
      setQuarryOperation({
        ...quarryOperation,
        measures: [...quarryOperation.measures, newMeasure],
      });
    } else if (section === "plant") {
      setPlantOperation({
        ...plantOperation,
        measures: [...plantOperation.measures, newMeasure],
      });
    } else {
      setPortOperation({
        ...portOperation,
        measures: [...portOperation.measures, newMeasure],
      });
    }
  };

  const deleteMeasure = (
    section: "quarry" | "plant" | "port",
    measureId: string
  ) => {
    const deleteFromSection = (current: OperationSection) => {
      if (current.measures.length <= 1) {
        return current;
      }
      return {
        ...current,
        measures: current.measures.filter((m) => m.id !== measureId),
      };
    };

    // Show confirmation alert
    Alert.alert(
      "Delete Measure",
      "Are you sure you want to remove this mitigating measure?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            if (section === "quarry") {
              setQuarryOperation(deleteFromSection(quarryOperation));
            } else if (section === "plant") {
              setPlantOperation(deleteFromSection(plantOperation));
            } else {
              setPortOperation(deleteFromSection(portOperation));
            }
          },
        },
      ]
    );
  };

  const updateMeasure = (
    section: "quarry" | "plant" | "port",
    measureId: string,
    field: keyof MitigatingMeasure,
    value: any
  ) => {
    const updateSection = (current: OperationSection) => ({
      ...current,
      measures: current.measures.map((m) =>
        m.id === measureId ? { ...m, [field]: value } : m
      ),
    });
    if (section === "quarry") {
      setQuarryOperation(updateSection(quarryOperation));
    } else if (section === "plant") {
      setPlantOperation(updateSection(plantOperation));
    } else {
      setPortOperation(updateSection(portOperation));
    }
  };

  return (
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
          allowEdit={true}
        />
      </View>
      <View style={styles.titleContainer}>
        <View style={styles.titleAccent}>
          <Text style={styles.titleAccentText}>2.</Text>
        </View>
        <Text style={styles.titleText}>
          Compliance to Impact Management Commitments in EIA report & EPEP
        </Text>
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps={keyboardShouldPersistTapsForFabric}
      >
        <ProjectImpacts
          preConstruction={preConstruction}
          construction={construction}
          onPreConstructionChange={setPreConstruction}
          onConstructionChange={setConstruction}
        />
        <View style={styles.divider} />
        <Text style={styles.mainTitle}>
          Implementation of Environmental Impact Control Strategies
        </Text>
        <OperationSectionComponent
          section={quarryOperation}
          onNAToggle={() =>
            setQuarryOperation({
              ...quarryOperation,
              isNA: !quarryOperation.isNA,
            })
          }
          onMeasureUpdate={(measureId, field, value) =>
            updateMeasure("quarry", measureId, field, value)
          }
          onAddMeasure={() => addMeasure("quarry")}
          onDeleteMeasure={(measureId) => deleteMeasure("quarry", measureId)}
        />
        <View style={styles.dividerSmall} />
        <OperationSectionComponent
          section={plantOperation}
          onNAToggle={() =>
            setPlantOperation({
              ...plantOperation,
              isNA: !plantOperation.isNA,
            })
          }
          onMeasureUpdate={(measureId, field, value) =>
            updateMeasure("plant", measureId, field, value)
          }
          onAddMeasure={() => addMeasure("plant")}
          onDeleteMeasure={(measureId) => deleteMeasure("plant", measureId)}
        />
        <View style={styles.dividerSmall} />
        <OperationSectionComponent
          section={portOperation}
          onNAToggle={() =>
            setPortOperation({
              ...portOperation,
              isNA: !portOperation.isNA,
            })
          }
          onMeasureUpdate={(measureId, field, value) =>
            updateMeasure("port", measureId, field, value)
          }
          onAddMeasure={() => addMeasure("port")}
          onDeleteMeasure={(measureId) => deleteMeasure("port", measureId)}
        />
        <View style={styles.divider} />
        <OverallCompliance
          value={overallCompliance}
          onChangeText={setOverallCompliance}
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
        <TouchableOpacity
          style={styles.saveNextButton}
          onPress={handleSaveAndNext}
        >
          <Text style={styles.saveNextButtonText}>Save & Next</Text>
          <Ionicons name="arrow-forward" size={20} color="white" />
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default EIAComplianceScreen;
