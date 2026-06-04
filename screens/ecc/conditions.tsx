// ECCMonitoringScreen2.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../theme/theme";
import {
  scale,
  verticalScale,
  moderateScale,
  normalizeFont,
} from "../../utils/responsive";
import { keyboardShouldPersistTapsForFabric } from "../../utils/nativeRuntimeProps";
import { CustomHeader } from "../../components/CustomHeader";

type ChoiceKey = "complied" | "partial" | "not";
type CondID = string; // e.g. "1", "1.1", "7a", "custom-15"
type BaseCondition = {
  id: CondID;
  title: string;
  descriptions: Record<ChoiceKey, string>;
  isDefault?: boolean; // default conditions
  nested_to?: CondID | null; // for subconditions like 7a -> nested_to "7"
};

type StoredState = {
  edits: Record<CondID, Partial<BaseCondition>>;
  customs: BaseCondition[];
  selections: Record<CondID, ChoiceKey | null>;
};

const STORAGE_KEY = "ECC_MONITORING_V1";

/* ---------- DEFAULT CONDITIONS EXACT (IDs follow your numbering) ---------- */
const DEFAULTS: BaseCondition[] = [
  {
    id: "1",
    title: "Condition 1: Secure all necessary Permits from concerned agencies",
    descriptions: {
      complied: "All necessary permits are secured.",
      partial:
        "Some permits are secured while others are still being processed.",
      not: "Still in the process of securing the necessary permits from concerned agencies.",
    },
    isDefault: true,
  },
  {
    id: "1.1",
    title:
      "Condition 1.1: That this Certificate shall cover the extraction and processing of 70,000 cu. m. sand, gravel and boulders annually and the installation of 2 units of sand and gravel classifiers with a production capacity of 80 cu. m./ hr; confined within an applied area of 19.9999 ha.",
    descriptions: {
      complied:
        "The project complies with the approved extraction and processing limit of 70,000 cu. m. annually and ensures that only 2 units of sand and gravel classifiers with a maximum production capacity of 80 cu. m./hr are installed and operated within the applied area of 19.9999 hectares.",
      partial:
        "The proponent adheres to the set annual extraction and processing volume of 70,000 cu. m. and limits the installation of sand and gravel classifiers to 2 units with a production capacity of 80 cu. m./hr within the 19.9999-hectare applied area.",
      not: "Still in the process of securing the necessary requirements for ECC EIS category application for MPSA Contract.",
    },
    isDefault: true,
    nested_to: "1",
  },
  {
    id: "1.2",
    title:
      "Condition 1.2: Submission of semi-annual Compliance Monitoring Report (CMR)",
    descriptions: {
      complied: "CMRs are regularly submitted.",
      partial: "CMRs are submitted with occasional delay or minor deficiency.",
      not: "Still in the process of completing and preparing the necessary reports for submission.",
    },
    isDefault: true,
    nested_to: "1",
  },
  {
    id: "2",
    title:
      "Condition 2: Provision of adequate drainage system and soil erosion control measures",
    descriptions: {
      complied: "Adequate drainage system is constructed.",
      partial:
        "Partial drainage system and soil erosion control measures are in place, with improvements ongoing.",
      not: "Still in the process of establishing adequate drainage system and soil erosion control measures",
    },
    isDefault: true,
  },
  {
    id: "3",
    title:
      "Condition 3: Implementation of regular sanitary housekeeping practices, proper collection of solid and hazardous waste",
    descriptions: {
      complied:
        "Permit to transport application is in process. The permittee attended the Technical Conference on May 19, 2025 regarding NOV issued for non-compliance with the provisions of RA 6969 and commitments will be undertaken until June 15, 2025.",
      partial:
        "Regular sanitary housekeeping practices are in place, with proper collection of solid waste observed; hazardous waste management is partially complied with pending permit issuance.",
      not: "Still in the process of fully implementing regular sanitary housekeeping practices, proper collection, and hazardous waste management measures",
    },
    isDefault: true,
  },
  {
    id: "4",
    title:
      "Condition 4: Conduct of Tree Planting and submission of annual report (if applicable)",
    descriptions: {
      complied:
        "Tree planting is regularly conducted and annual report is submitted",
      partial:
        "Tree planting activities are conducted but annual report submission is delayed or incomplete",
      not: "Still in the process of conducting tree planting activities and preparing the annual report",
    },
    isDefault: true,
  },
  {
    id: "5",
    title: "Condition 5: Secure Tree Cutting Permit",
    descriptions: {
      complied: "Tree Cutting Permit is secured",
      partial: "Application for Tree Cutting Permit is in process",
      not: "No cutting of trees involved",
    },
    isDefault: true,
  },
  {
    id: "6",
    title:
      "Condition 6: Conduct of Information, Education & Communication (IEC) Campaign and submission of annual report of compliance (if applicable)",
    descriptions: {
      complied:
        "IEC is regularly conducted with report submitted to this Office",
      partial:
        "IEC is conducted but annual report submission is delayed or incomplete",
      not: "Still in the process of conducting IEC and preparing the annual report for submission",
    },
    isDefault: true,
  },

  // Condition 7 (parent) with subconditions 7a..7f (each subcondition is also a BaseCondition with nested_to "7")
  {
    id: "7",
    title:
      "Compliance with the provisions of RA 8749, RA 9275, RA 9003 and RA 6969",
    descriptions: { complied: "", partial: "", not: "" },
    isDefault: true,
  },
  {
    id: "7a",
    title: "Condition 7a: Secure a PTO and Discharge Permit",
    descriptions: {
      complied:
        "PTO-OL-R01-2021-02801-R valid until 05/06/2026 and DP-R01-20-02099 valid until 09/01/2025. WWDP requirements for domestic wastewater are in process. The permittee attended the Technical Conference on May 19, 2025 regarding NOV issued for non-compliance with the provisions of RA 9275 and commitments will be undertaken until June 15, 2025",
      partial:
        "PTO and Discharge Permit are secured, but renewal/application for WWDP requirements is ongoing",
      not: "Still in the process of securing PTO, Discharge Permit, and WWDP requirements",
    },
    isDefault: true,
    nested_to: "7",
  },
  {
    id: "7b",
    title: "Condition 7b: Designate a PCO",
    descriptions: {
      complied: "With designated PCO. PCO accreditation renewal is in process",
      partial:
        "PCO is designated but accreditation has not yet been renewed/updated",
      not: "Still in the process of designating a PCO and securing accreditation",
    },
    isDefault: true,
    nested_to: "7",
  },
  {
    id: "7c",
    title: "Condition 7c: Registration as a HW Generator",
    descriptions: {
      complied: "OL-GR-R1-28-012653 issued on 12-14-2024",
      partial:
        "Registration as HW Generator is secured but renewal/validation is in process",
      not: "Still in the process of securing registration as HW Generator",
    },
    isDefault: true,
    nested_to: "7",
  },
  {
    id: "7d",
    title: "Condition 7d: Submission of SMR (if applicable)",
    descriptions: {
      complied: "SMRs are regularly and timely submitted",
      partial:
        "SMRs are submitted but with occasional delays or incomplete documentation",
      not: "Still in the process of preparing and submitting SMRs",
    },
    isDefault: true,
    nested_to: "7",
  },
  {
    id: "7e",
    title: "Condition 7e: Submission of ROLA (if applicable)",
    descriptions: {
      complied:
        "ROLA is regularly submitted and passed the DENR Effluent Standards",
      partial:
        "ROLA is submitted but with delay or has minor deficiencies in meeting the DENR Effluent Standards",
      not: "Still in the process of preparing and submitting ROLA",
    },
    isDefault: true,
    nested_to: "7",
  },
  {
    id: "7f",
    title:
      "Condition 7f: Secure Permit to Transport (PTT) and submission of HW-Manifest and Certificate of Treatment (COT) (if applicable)",
    descriptions: {
      complied:
        "PTT requirements are still in process. The permittee attended the Technical Conference on May 19, 2025 regarding NOV issued for non-compliance with the provisions of RA 9275 and commitments will be undertaken until June 15, 2025",
      partial:
        "PTT and HW-Manifest are secured, but Certificate of Treatment (COT) is pending/partially complied with",
      not: "Still in the process of securing PTT, HW-Manifest, and COT",
    },
    isDefault: true,
    nested_to: "7",
  },

  {
    id: "8",
    title:
      "Condition 8: Submission of report on the implemented mitigating measures and the corresponding cost of such activities",
    descriptions: {
      complied: "Included in the submitted CMRs",
      partial:
        "Report on mitigating measures is prepared but submission is delayed or incomplete",
      not: "Still in the process of preparing and submitting report on mitigating measures and corresponding costs",
    },
    isDefault: true,
  },
  {
    id: "9",
    title:
      "Condition 9: Conduct of Information, Education & Communication (IEC) Campaign and submission of annual report of compliance (if applicable)",
    descriptions: {
      complied:
        "IEC is regularly conducted with report submitted to this Office",
      partial:
        "IEC is conducted but annual report submission is delayed or incomplete",
      not: "Still in the process of conducting IEC and preparing the annual report for submission",
    },
    isDefault: true,
  },
  {
    id: "10",
    title:
      "Condition 10: Creation of Environmental Unit and designation of PCO",
    descriptions: {
      complied: "With designated PCO. PCO accreditation renewal is in process",
      partial:
        "Environmental Unit is organized but PCO accreditation is still pending/for renewal",
      not: "Still in the process of creating an Environmental Unit and designating a PCO",
    },
    isDefault: true,
  },
  {
    id: "11",
    title:
      "Condition 11: Submit abandonment plan in case of abandonment, 3 months prior abandonment",
    descriptions: {
      complied:
        "Abandonment plan is prepared and submitted 3 months prior to project abandonment",
      partial: "Abandonment plan is being prepared but not yet submitted",
      not: "The management has no plans of abandoning the project",
    },
    isDefault: true,
  },
  {
    id: "12",
    title:
      "Condition 12: Project expansion and/or construction of additional structures, change in location shall be subject to a new EIA",
    descriptions: {
      complied:
        "Still in the process of securing the necessary requirements for ECC EIS category application for MPSA Contract",
      partial:
        "Application for new EIA requirements is prepared but pending submission/approval",
      not: "No project expansion, additional structures, or change in location undertaken that requires a new EIA",
    },
    isDefault: true,
  },
  {
    id: "13",
    title: "Condition 13: Land clearing within the project description",
    descriptions: {
      complied: "Land area developed is within the project description",
      partial:
        "Land clearing activities are ongoing but still within the approved project description",
      not: "Still in the process of securing confirmation that land clearing activities are within the approved project description",
    },
    isDefault: true,
  },
  {
    id: "14",
    title:
      "Condition 14: Notify EMB in case of transfer of ownership within 15 days from the date of transfer",
    descriptions: {
      complied: "No transfer of ownership",
      partial:
        "Transfer of ownership occurred, EMB was notified within 15 days",
      not: "Transfer of ownership occurred, but EMB notification is still in process / delayed",
    },
    isDefault: true,
  },
];

/* ---------- UTILS: Async storage load/save ---------- */
const loadStored = async (): Promise<StoredState | null> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredState;
  } catch (e) {
    console.warn("loadStored err", e);
    return null;
  }
};

const saveStored = async (state: StoredState) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("saveStored err", e);
  }
};

/* ---------- SCREEN COMPONENT ---------- */
export default function ECCMonitoringScreen2() {
  // UI state
  const [collapsed, setCollapsed] = useState(false);

  // persisted pieces
  const [edits, setEdits] = useState<Record<CondID, Partial<BaseCondition>>>(
    {}
  );
  const [customs, setCustoms] = useState<BaseCondition[]>([]);
  const [selections, setSelections] = useState<
    Record<CondID, ChoiceKey | null>
  >({});

  // transient removed defaults (only in-memory; defaults reappear next open)
  const [removedDefaults, setRemovedDefaults] = useState<CondID[]>([]);

  // modal
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editing, setEditing] = useState<BaseCondition | null>(null);

  // load stored edits/customs/selections on mount
  useEffect(() => {
    (async () => {
      const stored = await loadStored();
      if (stored) {
        setEdits(stored.edits ?? {});
        setCustoms(stored.customs ?? []);
        setSelections(stored.selections ?? {});
      }
    })();
  }, []);

  // whenever edits/customs/selections change, persist
  useEffect(() => {
    const toSave: StoredState = {
      edits,
      customs,
      selections,
    };
    saveStored(toSave);
  }, [edits, customs, selections]);

  // build the current list in ORDER (DEFAULTS order + customs appended)
  const currentList = useMemo(() => {
    // Start with defaults in the exact DEFAULTS order
    const list: BaseCondition[] = DEFAULTS.map((d) => {
      const e = edits[d.id];
      if (!e) return { ...d };
      return {
        ...d,
        nested_to: d.nested_to,
      
        title: (e.title as string) ?? d.title,
        descriptions: (e.descriptions as any) ?? d.descriptions,
      };
    });

    // Filter out defaults that are transiently removed
    const filtered = list.filter((c) => !removedDefaults.includes(c.id));

    // Append persistent custom conditions (customs)
    const appended = filtered.concat(customs);

    return appended;
  }, [edits, customs, removedDefaults]);

  // helper radio color
  const colorFor = (k: ChoiceKey) =>
    k === "complied"
      ? theme.colors.success
      : k === "partial"
        ? theme.colors.warning
        : theme.colors.error;

  // set selection for a condition (persist for defaults/customs)
  const setSelection = (id: CondID, choice: ChoiceKey) => {
    setSelections((s) => {
      const next = { ...s, [id]: choice };
      // persist handled by effect
      return next;
    });
  };

  // open add modal
  const openAdd = () => {
    // next custom id: custom-{timestamp}
    const id = `custom-${Date.now()}`;
    const base: BaseCondition = {
      id,
      title: ``,
      descriptions: { complied: "", partial: "", not: "" },
      isDefault: false,
    };
    setModalMode("add");
    setEditing(base);
    setModalVisible(true);
  };

  // open edit modal for condition
  const openEdit = (cond: BaseCondition) => {
    setModalMode("edit");
    // clone
    setEditing(JSON.parse(JSON.stringify(cond)));
    setModalVisible(true);
  };
  const clearAppStorage = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    console.log("AsyncStorage data cleared for:", STORAGE_KEY);
    Alert.alert("Data Wiped", "App storage cleared. Restart your app to load fresh DEFAULTS.");
    
    // Optional: Reset state immediately to reflect changes without a full restart
    setEdits({});
    setCustoms([]);
    setSelections({});
  } catch (e) {
    console.error("Failed to clear storage:", e);
  }
};
// clearAppStorage();

  const saveModal = async () => {
    if (!editing) return;
    if (modalMode === "add") {
      // add to customs
      const next = [...customs, editing];
      setCustoms(next);
      setModalVisible(false);
    } else {
      // edit existing: if isDefault then update edits object, else update customs
      if (editing.isDefault) {
        setEdits((prev) => ({
          ...prev,
          [editing.id]: {
            title: editing.title,
            descriptions: editing.descriptions,
          },
        }));
      } else {
        setCustoms((prev) =>
          prev.map((c) => (c.id === editing.id ? editing : c))
        );
      }
      setModalVisible(false);
    }
  };

  // delete condition: defaults -> transient remove; custom -> permanent remove
  const deleteCondition = (cond: BaseCondition) => {
    // Only allow deletion of sub-conditions of Condition 7
    if (cond.nested_to === "7") {
      Alert.alert(
        "Delete Condition",
        "Delete this sub-condition permanently?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => {
              if (cond.isDefault) {
                // Remove default sub-condition temporarily
                setRemovedDefaults((prev) => [...prev, cond.id]);
              } else {
                // Remove custom sub-condition
                setCustoms((prev) => prev.filter((c) => c.id !== cond.id));
              }

              // Check if there are any remaining sub-conditions
              const remainingChildren = currentList.filter(
                (c) =>
                  c.nested_to === "7" &&
                  c.id !== cond.id &&
                  !removedDefaults.includes(c.id)
              );

              // If no remaining sub-conditions, remove Condition 7 title
              if (remainingChildren.length === 0) {
                setRemovedDefaults((prev) => [...prev, "7"]);
              }
            },
          },
        ]
      );
      return;
    }

    // Other defaults/customs logic
    if (cond.isDefault) {
      Alert.alert(
        "Remove default",
        "This removes the default from current view only. It will return when you reopen the screen. Continue?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Remove",
            style: "destructive",
            onPress: () => setRemovedDefaults((r) => [...r, cond.id]),
          },
        ]
      );
    } else {
      Alert.alert("Delete", "Delete this custom condition permanently?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () =>
            setCustoms((prev) => prev.filter((c) => c.id !== cond.id)),
        },
      ]);
    }
  };



  // helpers for rendering: compute a visible index label consistent with DEFAULT order:
  // We'll compute display label by walking DEFAULTS (in their order) and then appending customs with incrementing index.
  const displayItems = useMemo(() => {
    const items: { cond: BaseCondition; displayLabel: string }[] = [];
    // iterate DEFAULTS in their order, but skip removed ones
    let counter = 1;
    for (const d of DEFAULTS) {
      if (removedDefaults.includes(d.id)) continue;
      const found = currentList.find((c) => c.id === d.id);
      if (!found) continue;
      items.push({ cond: found, displayLabel: String(counter) });
      counter++;
      // if this default has children (IDs with nested_to === d.id), they appear immediately after but numbered according to their explicit IDs like 1.1,7a etc.
      // In our model, those children are separate entries in DEFAULTS (we set nested_to on them), and they will be iterated next naturally
      // So the numbering we present follows the item's explicit ID labeling — user requested exact numbering, so we will show original ID labels for children.
      // To keep things consistent with "Condition 1.1", we'll render parent counter + ".1" for the child if child's id includes a dot or letter (we'll show child's explicit id).
      // For simplicity, displayLabel for a child will be its explicit id (e.g. "1.1" or "7a").
    }

    // After defaults, include any remaining currentList items that are not defaults (customs)
    for (const c of currentList) {
      if (!c.isDefault) {
        items.push({ cond: c, displayLabel: String(items.length + 1) }); // continue numbering
      }
    }

    // However we must ensure that items keep the order as in currentList. So instead, rebuild by currentList order:
    const finalItems: { cond: BaseCondition; displayLabel: string }[] = [];
    let idx = 1;
    for (const c of currentList) {
      // For items that are defaults and whose id contains '.' or letter (like 1.1,7a) we will use their id as label.
      // For top-level items with numeric ids we use idx numeric label.
      const isChild = !!c.nested_to;
      const label = isChild ? c.id : String(idx);
      finalItems.push({ cond: c, displayLabel: label });
      if (!isChild) idx++;
      // children do not increment the primary idx (so numbering like: 1, 1.1, 1.2, 2, 3, ... will appear).
    }
    return finalItems;
  }, [currentList, removedDefaults]);

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container}>
        <CustomHeader showSave />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Monitoring Data</Text>
          </View>

          {/* Collapsible Monitoring Data (only this collapses) */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setCollapsed((p) => !p)}
            >
              <Text style={styles.sectionTitle}>Monitoring Data</Text>
              <Ionicons
                name={collapsed ? "chevron-down" : "chevron-up"}
                size={20}
                color={theme.colors.primaryDark}
              />
            </TouchableOpacity>

            {!collapsed && (
              <>
                <View style={styles.instructionPill}>
                  <Text style={styles.instructionText}>
                    Choose only one (1) of the following statements that best
                    applies to the project status.
                  </Text>
                </View>

                {/* Render items in displayItems order. If item has nested_to (child), we indent it. */}
                {displayItems.map(({ cond, displayLabel }) => {
                  const isChild = !!cond.nested_to;

                  // Check if this is Condition 7 (title-only)
                  const isTitleOnly = cond.id === "7";

                  const selected = selections[cond.id] ?? null;

                  return (
                    <View
                      key={cond.id}
                      style={[
                        styles.conditionCard,
                        isChild && styles.childCard,
                      ]}
                    >
                      {isTitleOnly ? (
                        // Render Condition 7 as a pill (instructionPill style)
                        <View style={styles.condition7Title}>
                          <View style={styles.condition7Strip} />
                          <Text style={styles.condition7Text}>
                            {cond.title}
                          </Text>
                        </View>
                      ) : (
                        <>
                          <View style={styles.conditionHeader}>
                            <Text style={styles.conditionIndex}>
                              Condition {displayLabel}
                            </Text>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.conditionTitle}>
                                {cond.title}
                              </Text>
                            </View>
                            <View style={styles.actionRow}>
                              <TouchableOpacity
                                onPress={() => openEdit(cond)}
                                style={styles.iconButton}
                              >
                                <Ionicons
                                  name="create-outline"
                                  size={18}
                                  color={theme.colors.primaryDark}
                                />
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => deleteCondition(cond)}
                                style={styles.iconButton}
                              >
                                <Ionicons
                                  name="trash-outline"
                                  size={18}
                                  color={theme.colors.error}
                                />
                              </TouchableOpacity>
                            </View>
                          </View>

                          <View style={styles.radioGroup}>
                            {(
                              ["complied", "partial", "not"] as ChoiceKey[]
                            ).map((k) => {
                              const isSelected = selected === k;
                              return (
                                <View key={k} style={styles.radioRow}>
                                  <TouchableOpacity
                                    onPress={() => setSelection(cond.id, k)}
                                    style={styles.radioTouch}
                                    activeOpacity={0.8}
                                  >
                                    <View
                                      style={[
                                        styles.radioOuter,
                                        isSelected && {
                                          borderColor: colorFor(k),
                                        },
                                      ]}
                                    >
                                      {isSelected && (
                                        <View
                                          style={[
                                            styles.radioInner,
                                            { backgroundColor: colorFor(k) },
                                          ]}
                                        />
                                      )}
                                    </View>
                                    <View style={styles.radioLabelWrap}>
                                      <Text
                                        style={[
                                          styles.radioLabel,
                                          isSelected && { color: colorFor(k) },
                                        ]}
                                      >
                                        {k === "complied"
                                          ? "Complied"
                                          : k === "partial"
                                            ? "Partially Complied"
                                            : "Not Complied"}
                                      </Text>
                                      <Text style={styles.radioDescription}>
                                        {cond.descriptions[k]}
                                      </Text>
                                    </View>
                                  </TouchableOpacity>
                                </View>
                              );
                            })}
                          </View>
                        </>
                      )}
                    </View>
                  );
                })}

                {/* Add Condition at the very end */}
                <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
                  <Ionicons
                    name="add-circle-outline"
                    size={20}
                    color={theme.colors.primaryDark}
                  />
                  <Text style={styles.addText}>Add Condition</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>

        {/* Modal for add/edit */}
        <Modal visible={modalVisible} transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={{ flex: 1, justifyContent: "center" }}
            >
              <ScrollView
                contentContainerStyle={{
                  flexGrow: 1,
                  justifyContent: "center",
                }}
                keyboardShouldPersistTaps={keyboardShouldPersistTapsForFabric}
              >
                <View style={styles.modalCard}>
                  <Text style={styles.modalTitle}>
                    {modalMode === "add" ? "Add Condition" : "Edit Condition"}
                  </Text>

                  <Text style={styles.modalLabel}>Title</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Condition title"
                    placeholderTextColor="#C0C0C0"
                    value={editing?.title}
                    onChangeText={(t) =>
                      setEditing((s) => (s ? { ...s, title: t } : s))
                    }
                  />

                  {/* <Text style={styles.modalLabel}>Complied (description)</Text>
                  <TextInput
                    style={[styles.modalInput, { height: verticalScale(80) }]}
                    placeholder="Complied description"
                    placeholderTextColor="#C0C0C0"
                    value={editing?.descriptions.complied}
                    onChangeText={(t) =>
                      setEditing((s) =>
                        s
                          ? {
                              ...s,
                              descriptions: { ...s.descriptions, complied: t },
                            }
                          : s
                      )
                    }
                    multiline
                  /> */}

                  {/* <Text style={styles.modalLabel}>
                    Partially Complied (description)
                  </Text>
                  <TextInput
                    style={[styles.modalInput, { height: verticalScale(80) }]}
                    placeholder="Partially complied description"
                    placeholderTextColor="#C0C0C0"
                    value={editing?.descriptions.partial}
                    onChangeText={(t) =>
                      setEditing((s) =>
                        s
                          ? {
                              ...s,
                              descriptions: { ...s.descriptions, partial: t },
                            }
                          : s
                      )
                    }
                    multiline
                  /> */}

                  {/* <Text style={styles.modalLabel}>
                    Not Complied (description)
                  </Text>
                  <TextInput
                    style={[styles.modalInput, { height: verticalScale(80) }]}
                    placeholder="Not complied description"
                    placeholderTextColor="#C0C0C0"
                    value={editing?.descriptions.not}
                    onChangeText={(t) =>
                      setEditing((s) =>
                        s
                          ? {
                              ...s,
                              descriptions: { ...s.descriptions, not: t },
                            }
                          : s
                      )
                    }
                    multiline
                  /> */}

                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={[styles.modalBtn, styles.modalCancel]}
                      onPress={() => setModalVisible(false)}
                    >
                      <Text>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.modalBtn, styles.modalSave]}
                      onPress={async () => {
                        if (!editing) return;
                        if (modalMode === "add") {
                          setCustoms((prev) => [
                            ...prev,
                            { ...editing, isDefault: false },
                          ]);
                        } else {
                          if (editing.isDefault) {
                            setEdits((p) => ({
                              ...p,
                              [editing.id]: {
                                title: editing.title,
                                descriptions: editing.descriptions,
                              },
                            }));
                          } else {
                            setCustoms((prev) =>
                              prev.map((c) =>
                                c.id === editing.id ? editing : c
                              )
                            );
                          }
                        }
                        setModalVisible(false);
                      }}
                    >
                      <Text style={{ color: "#fff" }}>
                        {modalMode === "add" ? "Add" : "Save"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

/* ---------------- Styles ---------------- */
const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: theme.colors.background || "#F8F9FA",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 40,
  },

  container: {
    flex: 1,
    backgroundColor: theme.colors.background || "#F8F9FA",
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 48,
    paddingTop: 8,
  },

  header: {
    paddingTop: 20,
    paddingBottom: 8,
  },

  headerTitle: {
    fontFamily: theme.typography.bold,
    fontSize: 22,
    color: theme.colors.primaryDark,
  },

  section: {
    marginTop: 12,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },

  sectionTitle: {
    fontFamily: theme.typography.semibold,
    fontSize: 18,
    color: theme.colors.title,
  },

  instructionPill: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.primaryLight + "15",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 10,
  },

  instructionText: {
    fontFamily: theme.typography.regular,
    fontSize: 13,
    color: theme.colors.primaryDark,
  },

  conditionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    ...theme.shadows.light,
  },

  childCard: {
    marginLeft: 10,
    backgroundColor: "#FBFBFB",
  },
  titleOnlyCard: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
  },

  titleOnlyText: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.primaryDark,
  },
  conditionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },

  conditionIndex: {
    fontFamily: theme.typography.medium,
    fontSize: 13,
    color: theme.colors.textLight,
    marginRight: 8,
  },

  conditionTitle: {
    fontFamily: theme.typography.semibold,
    fontSize: 15,
    color: theme.colors.title,
    flexShrink: 1,
  },
  condition7Title: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.primaryLight + "15", // light background
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 10,
  },

  condition7Strip: {
    width: 6,
    height: "100%",
    backgroundColor: theme.colors.primaryDark,
    borderRadius: 3,
    marginRight: 10,
  },

  condition7Text: {
    fontFamily: theme.typography.bold,
    fontSize: 16, // bigger than instructionPill
    color: theme.colors.primaryDark,
    flex: 1,
  },

  actionRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  radioGroup: {
    marginTop: 6,
  },

  radioRow: {
    marginBottom: 10,
  },

  radioTouch: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  radioOuter: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#D0D5DD",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    marginTop: 2,
  },

  radioInner: {
    height: 10,
    width: 10,
    borderRadius: 5,
  },

  radioLabelWrap: {
    flex: 1,
  },

  radioLabel: {
    fontFamily: theme.typography.medium,
    fontSize: 14,
    color: theme.colors.title,
  },

  radioDescription: {
    fontFamily: theme.typography.regular,
    fontSize: 13,
    color: theme.colors.text,
    marginTop: 4,
  },

  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  addText: {
    marginLeft: 8,
    fontFamily: theme.typography.semibold,
    color: theme.colors.primaryDark,
    fontSize: 15,
  },

  /* Modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.36)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },

  modalCard: {
    width: "100%",
    maxWidth: 820,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
  },

  modalTitle: {
    fontFamily: theme.typography.semibold,
    fontSize: 16,
    color: theme.colors.title,
    marginBottom: 8,
  },

  modalLabel: {
    fontFamily: theme.typography.medium,
    fontSize: 13,
    color: theme.colors.text,
    marginTop: 6,
    marginBottom: 4,
  },

  modalInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontFamily: theme.typography.regular,
    fontSize: 14,
    color: theme.colors.text,
    backgroundColor: "#fff",
  },

  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },

  modalBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginLeft: 8,
  },

  modalCancel: {
    backgroundColor: "#F0F0F0",
  },

  modalSave: {
    backgroundColor: theme.colors.primaryDark,
  },
});
