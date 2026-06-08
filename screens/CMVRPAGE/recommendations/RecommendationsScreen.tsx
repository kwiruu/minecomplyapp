// RecommendationsScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { CMSHeader } from "../../../components/CMSHeader";
import { useCmvrStore } from "../../../store/cmvrStore";
import {
  RecommendationItem,
  SectionData,
  SectionKey,
  PickerItem,
  RecommendationsScreenNavigationProp,
  RecommendationsScreenRouteProp,
} from "../types/RecommendationsScreen.types";
import { styles } from "../styles/RecommendationsScreen.styles";

// --- Components ---
const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <View style={styles.sectionHeaderContainer}>
    <Text style={styles.sectionHeaderTitle}>{title}</Text>
  </View>
);

const CustomPicker: React.FC<{
  selectedValue: string;
  onValueChange: (value: string) => void;
  items: PickerItem[];
}> = ({ selectedValue, onValueChange, items }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const selectedLabel =
    items.find((item) => item.value === selectedValue)?.label || "Select...";

  const handleSelect = (value: string) => {
    onValueChange(value);
    setModalVisible(false);
  };

  return (
    <View style={styles.pickerContainer}>
      <TouchableOpacity
        style={styles.pickerButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.pickerButtonText}>{selectedLabel}</Text>
        <Ionicons name="chevron-down" size={20} color="#64748B" />
      </TouchableOpacity>
      <Modal
        transparent
        animationType="fade"
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            {items.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.modalItem,
                  item.value === selectedValue && styles.modalItemSelected,
                ]}
                onPress={() => handleSelect(item.value)}
              >
                <Text
                  style={[
                    styles.modalItemText,
                    item.value === selectedValue &&
                      styles.modalItemTextSelected,
                  ]}
                >
                  {item.label}
                </Text>
                {item.value === selectedValue && (
                  <Ionicons name="checkmark-circle" size={20} color="#1E40AF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const quarterItems = [
  { label: "1st", value: "1st" },
  { label: "2nd", value: "2nd" },
  { label: "3rd", value: "3rd" },
  { label: "4th", value: "4th" },
];

const QuarterSelector: React.FC<{
  selectedQuarter: string;
  onQuarterChange: (quarter: string) => void;
  year: string;
  onYearChange: (year: string) => void;
}> = ({ selectedQuarter, onQuarterChange, year, onYearChange }) => (
  <View style={styles.quarterSelectorCard}>
    <View style={styles.quarterRow}>
      <Text style={styles.fieldLabel}>Prev Quarter:</Text>
      <CustomPicker
        selectedValue={selectedQuarter}
        onValueChange={onQuarterChange}
        items={quarterItems}
      />
    </View>
    <View style={styles.quarterRow}>
      <Text style={styles.fieldLabel}>Year:</Text>
      <TextInput
        style={[styles.input, styles.yearInput]}
        placeholder="YYYY"
        placeholderTextColor="#94A3B8"
        value={year}
        onChangeText={onYearChange}
        keyboardType="numeric"
        maxLength={4}
      />
    </View>
  </View>
);

const RecommendationItemComponent: React.FC<{
  index: number;
  data: RecommendationItem;
  onChange: (data: RecommendationItem) => void;
  onRemove: (() => void) | null;
  showStatus: boolean;
}> = ({ index, data, onChange, onRemove, showStatus }) => {
  const handleRemoveWithConfirmation = () => {
    if (onRemove) {
      Alert.alert(
        "Delete Recommendation",
        "Are you sure you want to delete this recommendation?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Delete",
            style: "destructive",
            onPress: onRemove,
          },
        ],
        { cancelable: true }
      );
    }
  };

  return (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <View style={styles.itemNumber}>
          <Text style={styles.itemNumberText}>{index}</Text>
        </View>
        {onRemove && (
          <TouchableOpacity
            onPress={handleRemoveWithConfirmation}
            style={styles.removeButton}
          >
            <Ionicons name="trash-outline" size={16} color="#DC2626" />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Recommendation</Text>
        <TextInput
          style={styles.input}
          placeholder="Type here..."
          placeholderTextColor="#94A3B8"
          value={data.recommendation}
          onChangeText={(text) => onChange({ ...data, recommendation: text })}
          multiline
        />
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Commitment</Text>
        <TextInput
          style={styles.input}
          placeholder="Type here..."
          placeholderTextColor="#94A3B8"
          value={data.commitment}
          onChangeText={(text) => onChange({ ...data, commitment: text })}
          multiline
        />
      </View>
      {showStatus && (
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Status</Text>
          <TextInput
            style={styles.input}
            placeholder="Type here..."
            placeholderTextColor="#94A3B8"
            value={data.status}
            onChangeText={(text) => onChange({ ...data, status: text })}
          />
        </View>
      )}
    </View>
  );
};

const RecommendationSection: React.FC<{
  title: string;
  data: SectionData;
  onChange: (data: SectionData) => void;
  onAdd: () => void;
  showStatus: boolean;
}> = ({ title, data, onChange, onAdd, showStatus }) => {
  const hasNA = data.isNA || false;

  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionTitleBar}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.naContainer}>
          <Text style={styles.naLabel}>N/A</Text>
          <TouchableOpacity
            style={[styles.checkbox, hasNA && styles.checkboxChecked]}
            onPress={() => onChange({ ...data, isNA: !hasNA })}
          >
            {hasNA && <Ionicons name="checkmark" size={14} color="white" />}
          </TouchableOpacity>
        </View>
      </View>
      {!hasNA && (
        <View style={styles.sectionContent}>
          {data.items.map((item, index) => (
            <RecommendationItemComponent
              key={index}
              index={index + 1}
              data={item}
              onChange={(updated: RecommendationItem) => {
                const newItems = [...data.items];
                newItems[index] = updated;
                onChange({ ...data, items: newItems });
              }}
              onRemove={
                data.items.length > 1
                  ? () => {
                      const newItems = data.items.filter(
                        (_: RecommendationItem, i: number) => i !== index
                      );
                      onChange({ ...data, items: newItems });
                    }
                  : null
              }
              showStatus={showStatus}
            />
          ))}
          <TouchableOpacity style={styles.addButton} onPress={onAdd}>
            <Ionicons name="add" size={18} color="#1E40AF" />
            <Text style={styles.addButtonText}>Add More Recommendation</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const RecommendationsScreen: React.FC = () => {
  const navigation = useNavigation<RecommendationsScreenNavigationProp>();
  const route = useRoute<RecommendationsScreenRouteProp>();
  const allPreviousParams = route.params || {};

  // Zustand store
  const { currentReport, updateSection, saveDraft } = useCmvrStore();

  // Initialize from store
  const storedRecommendations = currentReport?.recommendationsData;

  const [prevYear, setPrevYear] = useState(
    storedRecommendations?.prevYear || ""
  );
  const [prevQuarter, setPrevQuarter] = useState(
    storedRecommendations?.prevQuarter || "1st"
  );

  const [currentSections, setCurrentSections] = useState<
    Record<SectionKey, SectionData>
  >(
    storedRecommendations?.currentRecommendations || {
      plant: {
        isNA: false,
        items: [{ recommendation: "", commitment: "", status: "" }],
      },
      quarry: {
        isNA: false,
        items: [{ recommendation: "", commitment: "", status: "" }],
      },
      port: {
        isNA: false,
        items: [{ recommendation: "", commitment: "", status: "" }],
      },
    }
  );

  const [previousSections, setPreviousSections] = useState<
    Record<SectionKey, SectionData>
  >(
    storedRecommendations?.previousRecommendations || {
      plant: {
        isNA: false,
        items: [{ recommendation: "", commitment: "", status: "" }],
      },
      quarry: {
        isNA: false,
        items: [{ recommendation: "", commitment: "", status: "" }],
      },
      port: {
        isNA: false,
        items: [{ recommendation: "", commitment: "", status: "" }],
      },
    }
  );

  const [hasHydratedFromStore, setHasHydratedFromStore] = useState(false);

  // Hydrate from store when data becomes available
  useEffect(() => {
    if (hasHydratedFromStore || !currentReport) return;

    if (storedRecommendations) {
      setPrevYear(storedRecommendations.prevYear || "");
      setPrevQuarter(storedRecommendations.prevQuarter || "1st");

      if (storedRecommendations.currentRecommendations) {
        setCurrentSections(storedRecommendations.currentRecommendations);
      }

      if (storedRecommendations.previousRecommendations) {
        setPreviousSections(storedRecommendations.previousRecommendations);
      }
    }

    setHasHydratedFromStore(true);
  }, [currentReport, storedRecommendations, hasHydratedFromStore]);

  // Auto-sync to store
  useEffect(() => {
    updateSection("recommendationsData", {
      currentRecommendations: currentSections,
      previousRecommendations: previousSections,
      prevQuarter,
      prevYear,
    });
  }, [currentSections, previousSections, prevQuarter, prevYear]);

  const updateCurrentSection = (sectionKey: SectionKey, data: SectionData) =>
    setCurrentSections({ ...currentSections, [sectionKey]: data });

  const addCurrentRecommendation = (sectionKey: SectionKey) => {
    const newItems = [
      ...currentSections[sectionKey].items,
      { recommendation: "", commitment: "", status: "" },
    ];
    updateCurrentSection(sectionKey, {
      ...currentSections[sectionKey],
      items: newItems,
    });
  };

  const updatePreviousSection = (sectionKey: SectionKey, data: SectionData) =>
    setPreviousSections({ ...previousSections, [sectionKey]: data });

  const addPreviousRecommendation = (sectionKey: SectionKey) => {
    const newItems = [
      ...previousSections[sectionKey].items,
      { recommendation: "", commitment: "", status: "" },
    ];
    updatePreviousSection(sectionKey, {
      ...previousSections[sectionKey],
      items: newItems,
    });
  };

  const fillTestData = () => {
    setPrevYear("2024");
    setPrevQuarter("4th");

    // Current recommendations - 3 per section
    setCurrentSections({
      plant: {
        isNA: false,
        items: [
          {
            recommendation:
              "Upgrade baghouse filters to improve emission control efficiency",
            commitment: "Install new filters by end of Q3 2025",
            status: "",
          },
          {
            recommendation: "Implement real-time air quality monitoring system",
            commitment: "Deploy monitoring equipment by Q2 2025",
            status: "",
          },
          {
            recommendation:
              "Conduct quarterly training on waste segregation protocols",
            commitment: "Training sessions scheduled for all quarters",
            status: "",
          },
        ],
      },
      quarry: {
        isNA: false,
        items: [
          {
            recommendation: "Expand progressive rehabilitation to Phase 2 area",
            commitment: "Begin planting native species by June 2025",
            status: "",
          },
          {
            recommendation:
              "Install additional dust suppression misters at loading zones",
            commitment: "Complete installation by May 2025",
            status: "",
          },
          {
            recommendation: "Improve drainage system to prevent siltation",
            commitment: "Construct additional drainage channels by August 2025",
            status: "",
          },
        ],
      },
      port: {
        isNA: false,
        items: [
          {
            recommendation: "Upgrade marine water quality monitoring frequency",
            commitment: "Increase from monthly to bi-weekly sampling",
            status: "",
          },
          {
            recommendation: "Install covered conveyor system to reduce dust",
            commitment: "Project completion by Q4 2025",
            status: "",
          },
          {
            recommendation: "Conduct spill response drill with coast guard",
            commitment: "Quarterly drills starting Q2 2025",
            status: "",
          },
        ],
      },
    });

    // Previous recommendations with status - 3 per section
    setPreviousSections({
      plant: {
        isNA: false,
        items: [
          {
            recommendation: "Repair cracks in wastewater treatment pond liner",
            commitment: "Complete repairs by Q1 2025",
            status: "Completed - Repairs finished January 2025",
          },
          {
            recommendation: "Update MSDS for all chemicals in use",
            commitment: "Review and update by Q4 2024",
            status: "Completed - MSDS updated December 2024",
          },
          {
            recommendation: "Install flow meters on effluent discharge lines",
            commitment: "Install by Q1 2025",
            status: "In Progress - Installation ongoing",
          },
        ],
      },
      quarry: {
        isNA: false,
        items: [
          {
            recommendation: "Stabilize haul road slopes to prevent erosion",
            commitment: "Stabilization works by Q4 2024",
            status: "Completed - Slopes reinforced November 2024",
          },
          {
            recommendation: "Replace aging water spraying system",
            commitment: "New system operational by Q1 2025",
            status: "Completed - System replaced February 2025",
          },
          {
            recommendation:
              "Conduct biodiversity monitoring in rehabilitation areas",
            commitment: "Quarterly monitoring starting Q1 2025",
            status: "Ongoing - First survey completed March 2025",
          },
        ],
      },
      port: {
        isNA: false,
        items: [
          {
            recommendation: "Repair damaged sections of pier decking",
            commitment: "Repairs by Q4 2024",
            status: "Completed - Repairs finished December 2024",
          },
          {
            recommendation: "Upgrade oil spill containment boom",
            commitment: "Purchase and deploy new boom by Q1 2025",
            status: "Completed - New boom deployed January 2025",
          },
          {
            recommendation: "Install CCTV cameras for security monitoring",
            commitment: "Install by Q1 2025",
            status: "In Progress - 50% installation complete",
          },
        ],
      },
    });

    Alert.alert(
      "Test Data",
      "Recommendations filled with test data (3 per section, current & previous)"
    );
  };

  const handleSave = () => {
    console.log("Navigating to AttendanceList");
    // Navigate to AttendanceList in selection mode
    navigation.navigate("AttendanceList", {
      fromRecommendations: true,
      selectedAttendanceId:
        currentReport?.attendanceId ?? currentReport?.attendanceUrl ?? null,
    });
  };

  const handleStay = () => {
    console.log("User chose to stay");
  };

  const handleSaveToDraft = async () => {
    try {
      await saveDraft();
      Alert.alert("Success", "Draft saved successfully");
      const { CommonActions } = await import("@react-navigation/native");
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

  const handleDiscard = async () => {
    const { CommonActions } = await import("@react-navigation/native");
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "Dashboard" }],
      })
    );
  };

  const handleBack = () => navigation.goBack();

  let nextQuarterStr = "2nd";
  let nextYearStr = prevYear;
  if (prevQuarter === "1st") {
    nextQuarterStr = "2nd";
  } else if (prevQuarter === "2nd") {
    nextQuarterStr = "3rd";
  } else if (prevQuarter === "3rd") {
    nextQuarterStr = "4th";
  } else if (prevQuarter === "4th") {
    nextQuarterStr = "1st";
    const yearNum = parseInt(prevYear, 10);
    if (!isNaN(yearNum)) {
      nextYearStr = (yearNum + 1).toString();
    } else {
      nextYearStr = "";
    }
  }
  const yearForTitle = nextYearStr || "[YEAR]";
  const currentTitle = `RECOMMENDATIONS FOR THE ${nextQuarterStr} QUARTER ${yearForTitle}`;

  return (
    <SafeAreaView style={styles.container}>
      <CMSHeader
        onBack={handleBack}
        onSave={handleSave}
        onStay={handleStay}
        onSaveToDraft={handleSaveToDraft}
        onDiscard={handleDiscard}
        allowEdit={false}
      />
      <SectionHeader title="PREVIOUS RECOMMENDATIONS" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <QuarterSelector
          selectedQuarter={prevQuarter}
          onQuarterChange={setPrevQuarter}
          year={prevYear}
          onYearChange={setPrevYear}
        />
        <RecommendationSection
          title="PLANT"
          data={previousSections.plant}
          onChange={(data: SectionData) => updatePreviousSection("plant", data)}
          onAdd={() => addPreviousRecommendation("plant")}
          showStatus={true}
        />
        <RecommendationSection
          title="QUARRY"
          data={previousSections.quarry}
          onChange={(data: SectionData) =>
            updatePreviousSection("quarry", data)
          }
          onAdd={() => addPreviousRecommendation("quarry")}
          showStatus={true}
        />
        <RecommendationSection
          title="PORT"
          data={previousSections.port}
          onChange={(data: SectionData) => updatePreviousSection("port", data)}
          onAdd={() => addPreviousRecommendation("port")}
          showStatus={true}
        />
        <SectionHeader title={currentTitle} />
        <RecommendationSection
          title="PLANT"
          data={currentSections.plant}
          onChange={(data: SectionData) => updateCurrentSection("plant", data)}
          onAdd={() => addCurrentRecommendation("plant")}
          showStatus={false}
        />
        <RecommendationSection
          title="QUARRY"
          data={currentSections.quarry}
          onChange={(data: SectionData) => updateCurrentSection("quarry", data)}
          onAdd={() => addCurrentRecommendation("quarry")}
          showStatus={false}
        />
        <RecommendationSection
          title="PORT"
          data={currentSections.port}
          onChange={(data: SectionData) => updateCurrentSection("port", data)}
          onAdd={() => addCurrentRecommendation("port")}
          showStatus={false}
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
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save & Next</Text>
          <Ionicons name="arrow-forward" size={20} color="white" />
        </TouchableOpacity>
        {/* filler gap ts not advisable tbh*/}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default RecommendationsScreen;
