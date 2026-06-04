import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { CommonActions } from "@react-navigation/native";
import RNPickerSelect from "react-native-picker-select";
import { CMSHeader } from "../../../components/CMSHeader";
import { useCmvrStore } from "../../../store/cmvrStore";
import { QuarrySection } from "./components/QuarrySection";
import { PlantSection } from "./components/PlantSection";
import { PlantPortSection } from "./components/PlantPortSection";
import { PortSection } from "./components/PortSection";
import {
  WasteEntry,
  PlantPortSectionData,
  QuarrySectionData,
  PortSectionData,
  PlantSectionData,
} from "../types/WasteManagementScreen.types";
import {
  styles,
  pickerSelectStyles,
} from "../styles/WasteManagementScreen.styles";

export default function WasteManagementScreen({ navigation, route }: any) {
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
  const storedWasteManagement =
    currentReport?.complianceWithGoodPracticeInSolidAndHazardousWasteManagement;

  const [quarryData, setQuarryData] = useState<QuarrySectionData>(
    storedWasteManagement?.quarryData || {
      noSignificantImpact: false,
      generateTable: false,
      N_A: false,
    }
  );

  const [plantSimpleData, setPlantSimpleData] = useState<PlantSectionData>(
    storedWasteManagement?.plantSimpleData || {
      noSignificantImpact: false,
      generateTable: false,
      N_A: false,
    }
  );

  const [selectedQuarter, setSelectedQuarter] = useState(
    storedWasteManagement?.selectedQuarter || "Q2"
  );

  const quarterItems = [
    { label: "Q1", value: "Q1" },
    { label: "Q2", value: "Q2" },
    { label: "Q3", value: "Q3" },
    { label: "Q4", value: "Q4" },
  ];

  const [quarryPlantData, setQuarryPlantData] = useState<PlantPortSectionData>(
    storedWasteManagement?.quarryPlantData || {
      eccEpepCommitments: [
        {
          id: `waste-${Date.now()}-quarry`,
          typeOfWaste: "",
          handling: "",
          storage: "",
          disposal: "",
        },
      ],
      isAdequate: null,
      previousRecord: "",
      currentQuarterWaste: "",
    }
  );

  const [plantData, setPlantData] = useState<PlantPortSectionData>(
    storedWasteManagement?.plantData || {
      eccEpepCommitments: [
        {
          id: `waste-${Date.now()}-1`,
          typeOfWaste: "",
          handling: "",
          storage: "",
          disposal: "",
        },
      ],
      isAdequate: null,
      previousRecord: "",
      currentQuarterWaste: "",
    }
  );

  const [portData, setPortData] = useState<PortSectionData>(
    storedWasteManagement?.portData || {
      noSignificantImpact: false,
      generateTable: false,
      N_A: false,
    }
  );

  const [portPlantData, setPortPlantData] = useState<PlantPortSectionData>(
    storedWasteManagement?.portPlantData || {
      eccEpepCommitments: [
        {
          id: `waste-${Date.now()}-2`,
          typeOfWaste: "",
          handling: "",
          storage: "",
          disposal: "",
        },
      ],
      isAdequate: null,
      previousRecord: "",
      currentQuarterWaste: "",
    }
  );

  // Auto-sync to store
  useEffect(() => {
    updateSection(
      "complianceWithGoodPracticeInSolidAndHazardousWasteManagement",
      {
        selectedQuarter,
        quarryData,
        quarryPlantData,
        plantSimpleData,
        plantData,
        portData,
        portPlantData,
      }
    );
  }, [
    selectedQuarter,
    quarryData,
    quarryPlantData,
    plantSimpleData,
    plantData,
    portData,
    portPlantData,
  ]);

  const updateQuarryData = (field: keyof QuarrySectionData, value: boolean) => {
    setQuarryData((prev) => {
      if (field === "N_A") {
        return {
          ...prev,
          N_A: value,
          noSignificantImpact: value ? false : prev.noSignificantImpact,
          generateTable: value ? false : prev.generateTable,
        };
      } else if (field === "noSignificantImpact") {
        return {
          ...prev,
          noSignificantImpact: value,
          generateTable: value ? false : prev.generateTable,
        };
      } else if (field === "generateTable") {
        return {
          ...prev,
          generateTable: value,
          noSignificantImpact: value ? false : prev.noSignificantImpact,
        };
      }
      return prev;
    });
  };

  const updatePlantSimpleData = (
    field: keyof PlantSectionData,
    value: boolean
  ) => {
    setPlantSimpleData((prev) => {
      if (field === "N_A") {
        return {
          ...prev,
          N_A: value,
          noSignificantImpact: value ? false : prev.noSignificantImpact,
          generateTable: value ? false : prev.generateTable,
        };
      } else if (field === "noSignificantImpact") {
        return {
          ...prev,
          noSignificantImpact: value,
          generateTable: value ? false : prev.generateTable,
        };
      } else if (field === "generateTable") {
        return {
          ...prev,
          generateTable: value,
          noSignificantImpact: value ? false : prev.noSignificantImpact,
        };
      }
      return prev;
    });
  };

  const updatePortData = (field: keyof PortSectionData, value: boolean) => {
    setPortData((prev) => {
      if (field === "noSignificantImpact") {
        return {
          ...prev,
          noSignificantImpact: value,
          generateTable: value ? false : prev.generateTable,
          N_A: value ? false : prev.N_A,
        };
      } else if (field === "generateTable") {
        return {
          ...prev,
          generateTable: value,
          noSignificantImpact: value ? false : prev.noSignificantImpact,
          N_A: value ? false : prev.N_A,
        };
      } else if (field === "N_A") {
        return {
          ...prev,
          N_A: value,
          noSignificantImpact: value ? false : prev.noSignificantImpact,
          generateTable: value ? false : prev.generateTable,
        };
      }
      return prev;
    });
  };

  const addWasteEntry = (section: "quarry" | "plant" | "port") => {
    // include the section-level typeOfWaste value when creating a new entry
    const sectionType =
      section === "quarry"
        ? quarryPlantData.typeOfWaste
        : section === "plant"
          ? plantData.typeOfWaste
          : portPlantData.typeOfWaste;

    const newEntry = {
      id: `waste-${Date.now()}-${section}`,
      typeOfWaste: sectionType ?? "",
      handling: "",
      storage: "",
      disposal: "",
    };

    if (section === "quarry") {
      setQuarryPlantData((prev) => ({
        ...prev,
        eccEpepCommitments: [...prev.eccEpepCommitments, newEntry],
      }));
    } else if (section === "plant") {
      setPlantData((prev) => ({
        ...prev,
        eccEpepCommitments: [...prev.eccEpepCommitments, newEntry],
      }));
    } else {
      setPortPlantData((prev) => ({
        ...prev,
        eccEpepCommitments: [...prev.eccEpepCommitments, newEntry],
      }));
    }
  };

  const updateWasteEntry = (
    section: "quarry" | "plant" | "port",
    id: string,
    field: keyof Omit<WasteEntry, "id">,
    value: string
  ) => {
    if (section === "quarry") {
      setQuarryPlantData((prev) => ({
        ...prev,
        eccEpepCommitments: prev.eccEpepCommitments.map((entry) =>
          entry.id === id ? { ...entry, [field]: value } : entry
        ),
      }));
    } else if (section === "plant") {
      setPlantData((prev) => ({
        ...prev,
        eccEpepCommitments: prev.eccEpepCommitments.map((entry) =>
          entry.id === id ? { ...entry, [field]: value } : entry
        ),
      }));
    } else if (section === "port") {
      setPortPlantData((prev) => ({
        ...prev,
        eccEpepCommitments: prev.eccEpepCommitments.map((entry) =>
          entry.id === id ? { ...entry, [field]: value } : entry
        ),
      }));
    }
  };

  const removeWasteEntry = (
    section: "quarry" | "plant" | "port",
    id: string
  ) => {
    Alert.alert(
      "Confirm Removal",
      "Are you sure you want to remove this waste entry?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            if (section === "quarry") {
              if (quarryPlantData.eccEpepCommitments.length > 1) {
                setQuarryPlantData((prev) => ({
                  ...prev,
                  eccEpepCommitments: prev.eccEpepCommitments.filter(
                    (entry) => entry.id !== id
                  ),
                }));
              } else {
                Alert.alert(
                  "Cannot Remove",
                  "At least one waste entry is required."
                );
              }
            } else if (section === "plant") {
              if (plantData.eccEpepCommitments.length > 1) {
                setPlantData((prev) => ({
                  ...prev,
                  eccEpepCommitments: prev.eccEpepCommitments.filter(
                    (entry) => entry.id !== id
                  ),
                }));
              } else {
                Alert.alert(
                  "Cannot Remove",
                  "At least one waste entry is required."
                );
              }
            } else if (section === "port") {
              if (portPlantData.eccEpepCommitments.length > 1) {
                setPortPlantData((prev) => ({
                  ...prev,
                  eccEpepCommitments: prev.eccEpepCommitments.filter(
                    (entry) => entry.id !== id
                  ),
                }));
              } else {
                Alert.alert(
                  "Cannot Remove",
                  "At least one waste entry is required."
                );
              }
            }
          },
        },
      ]
    );
  };

  const updateQuarryPlantData = (
    field: keyof PlantPortSectionData,
    value: any
  ) => {
    setQuarryPlantData((prev) => ({ ...prev, [field]: value }));
  };

  const updatePlantData = (field: keyof PlantPortSectionData, value: any) => {
    setPlantData((prev) => ({ ...prev, [field]: value }));
  };

  const updatePortPlantData = (
    field: keyof PlantPortSectionData,
    value: any
  ) => {
    setPortPlantData((prev) => ({ ...prev, [field]: value }));
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

  const handleSaveAndNext = () => {
    console.log("Saving Waste Management data...");
    console.log("Selected Quarter:", selectedQuarter);
    console.log("Quarry Checkboxes:", quarryData);
    console.log("Quarry Table:", quarryPlantData);
    console.log("Plant Checkboxes:", plantSimpleData);
    console.log("Plant Table:", plantData);
    console.log("Port Checkboxes:", portData);
    console.log("Port Table:", portPlantData);
    const complianceWithGoodPracticeInSolidAndHazardousWasteManagement = {
      selectedQuarter,
      quarryData,
      quarryPlantData,
      plantSimpleData,
      plantData,
      portData,
      portPlantData,
    };
    const nextParams = {
      ...(route?.params || {}),
      complianceWithGoodPracticeInSolidAndHazardousWasteManagement,
    } as any;
    console.log(
      "Navigating with WasteManagement params keys:",
      Object.keys(nextParams)
    );
    navigation.navigate("ChemicalSafety", nextParams);
  };

  const fillTestData = () => {
    setSelectedQuarter("Q2");

    // Quarry section
    setQuarryData({
      noSignificantImpact: false,
      generateTable: true,
      N_A: false,
    });

    setQuarryPlantData({
      eccEpepCommitments: [
        {
          id: "1",
          typeOfWaste: "Overburden, Topsoil, Mine Tailings",
          handling: "Segregated handling by type",
          storage: "Designated stockpile areas with erosion control",
          disposal: "Progressive backfilling and rehabilitation",
        },
        {
          id: "2",
          typeOfWaste: "Overburden, Topsoil, Mine Tailings",
          handling: "Use of covered trucks for transport",
          storage: "Temporary storage in lined containment",
          disposal: "Treatment before disposal",
        },
        {
          id: "3",
          typeOfWaste: "Overburden, Topsoil, Mine Tailings",
          handling: "Immediate containment of spills",
          storage: "Bunded storage areas",
          disposal: "Licensed disposal facility",
        },
      ],
      isAdequate: "YES",
      previousRecord: "2,450 tons",
      currentQuarterWaste: "2,680 tons",
    });

    // Plant section
    setPlantSimpleData({
      noSignificantImpact: false,
      generateTable: true,
      N_A: false,
    });

    setPlantData({
      eccEpepCommitments: [
        {
          id: "1",
          typeOfWaste: "Used oil, Filters, Scrap metal, Office waste",
          handling: "Segregation at source",
          storage: "Designated waste storage shed",
          disposal: "Accredited TSD facility",
        },
        {
          id: "2",
          typeOfWaste: "Used oil, Filters, Scrap metal, Office waste",
          handling: "Containerized collection",
          storage: "Roofed and secured area",
          disposal: "Recycling facility",
        },
        {
          id: "3",
          typeOfWaste: "Used oil, Filters, Scrap metal, Office waste",
          handling: "Regular collection schedule",
          storage: "Separate biodegradable and non-biodegradable bins",
          disposal: "Municipal waste collection",
        },
      ],
      isAdequate: "YES",
      previousRecord: "850 liters (used oil), 12 tons (scrap)",
      currentQuarterWaste: "920 liters (used oil), 14 tons (scrap)",
    });

    // Port section
    setPortData({
      noSignificantImpact: false,
      generateTable: true,
      N_A: false,
    });

    setPortPlantData({
      eccEpepCommitments: [
        {
          id: "1",
          typeOfWaste: "Bilge water, Oily rags, Packaging materials",
          handling: "Spill containment protocols",
          storage: "Sealed drums in designated area",
          disposal: "Authorized waste hauler",
        },
        {
          id: "2",
          typeOfWaste: "Bilge water, Oily rags, Packaging materials",
          handling: "Immediate bagging and labeling",
          storage: "Secured hazmat storage",
          disposal: "TSD facility",
        },
        {
          id: "3",
          typeOfWaste: "Bilge water, Oily rags, Packaging materials",
          handling: "Segregation and compaction",
          storage: "Covered waste bins",
          disposal: "Recycling or proper disposal",
        },
      ],
      isAdequate: "YES",
      previousRecord: "180 liters (bilge), 0.5 tons (packaging)",
      currentQuarterWaste: "165 liters (bilge), 0.6 tons (packaging)",
    });

    Alert.alert(
      "Test Data",
      "Waste Management filled with test data (3 entries per section)"
    );
  };

  return (
    <SafeAreaView style={styles.container}>
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
      <View style={styles.sectionHeaderContainer}>
        <View style={styles.sectionHeaderContent}>
          <View style={styles.sectionBadge}>
            <Text style={styles.sectionBadgeText}>3</Text>
          </View>
          <Text style={styles.sectionTitle}>
            Compliance with Good Practice in Solid and Hazardous Waste
            Management
          </Text>
        </View>
      </View>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.quarterPickerContainer}>
          <Text style={styles.quarterLabel}>Select Quarter</Text>
          <View style={styles.quarterButtonsRow}>
            {quarterItems.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.quarterButton,
                  selectedQuarter === item.value && styles.quarterButtonActive,
                ]}
                onPress={() => setSelectedQuarter(item.value)}
              >
                <Text
                  style={[
                    styles.quarterButtonText,
                    selectedQuarter === item.value &&
                      styles.quarterButtonTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <QuarrySection data={quarryData} onUpdate={updateQuarryData} />

        {quarryData.generateTable && !quarryData.N_A && (
          <PlantPortSection
            title="QUARRY DETAILS"
            icon="hammer"
            data={quarryPlantData}
            selectedQuarter={selectedQuarter}
            onUpdateData={updateQuarryPlantData}
            onAddWaste={() => addWasteEntry("quarry")}
            onUpdateWaste={(id, field, value) =>
              updateWasteEntry("quarry", id, field, value)
            }
            onRemoveWaste={(id) => removeWasteEntry("quarry", id)}
          />
        )}

        <PlantSection data={plantSimpleData} onUpdate={updatePlantSimpleData} />

        {plantSimpleData.generateTable && !plantSimpleData.N_A && (
          <PlantPortSection
            title="PLANT DETAILS"
            icon="business"
            data={plantData}
            selectedQuarter={selectedQuarter}
            onUpdateData={updatePlantData}
            onAddWaste={() => addWasteEntry("plant")}
            onUpdateWaste={(id, field, value) =>
              updateWasteEntry("plant", id, field, value)
            }
            onRemoveWaste={(id) => removeWasteEntry("plant", id)}
          />
        )}

        <PortSection data={portData} onUpdate={updatePortData} />

        {portData.generateTable && !portData.N_A && (
          <PlantPortSection
            title="PORT DETAILS"
            icon="boat"
            data={portPlantData}
            selectedQuarter={selectedQuarter}
            onUpdateData={updatePortPlantData}
            onAddWaste={() => addWasteEntry("port")}
            onUpdateWaste={(id, field, value) =>
              updateWasteEntry("port", id, field, value)
            }
            onRemoveWaste={(id) => removeWasteEntry("port", id)}
          />
        )}

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
  );
}
