import React from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ComplianceCondition {
  conditionNo: string;
  requirement: string;
  status: "compliant" | "non-compliant" | "pending" | "n/a" | "";
  remarks: string;
}

interface ECCConditionsSectionProps {
  conditions: ComplianceCondition[];
  addCondition: () => void;
  deleteCondition: (index: number) => void;
  updateCondition: (
    index: number,
    field: keyof ComplianceCondition,
    value: any
  ) => void;
}

const ECCConditionsSection: React.FC<ECCConditionsSectionProps> = ({
  conditions,
  addCondition,
  deleteCondition,
  updateCondition,
}) => {
  const getStatusColor = (status: ComplianceCondition["status"]) => {
    switch (status) {
      case "compliant":
        return "#34C759";
      case "non-compliant":
        return "#FF3B30";
      case "pending":
        return "#FF9500";
      case "n/a":
        return "#8E8E93";
      default:
        return "#E5E5EA";
    }
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>ECC Conditions Compliance</Text>
          <Text style={styles.sectionSubtitle}>
            Add conditions and mark compliance status with remarks
          </Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={addCondition}>
          <Ionicons name="add-circle" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
      {conditions.length === 0 ? (
        <View style={styles.emptyConditions}>
          <Ionicons name="clipboard-outline" size={48} color="#ccc" />
          <Text style={styles.emptyConditionsText}>No conditions added yet</Text>
          <Text style={styles.emptyConditionsSubtext}>
            Tap the + button above to add your first condition
          </Text>
        </View>
      ) : (
        conditions.map((condition, index) => (
          <View key={index} style={styles.conditionCard}>
            <View style={styles.conditionHeader}>
              <TextInput
                style={styles.conditionNumberInput}
                value={condition.conditionNo}
                onChangeText={(text) => updateCondition(index, "conditionNo", text)}
                placeholder="e.g., 1.1"
              />
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(condition.status) },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {condition.status ? condition.status.toUpperCase() : "NOT SET"}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => deleteCondition(index)}>
                  <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            </View>
            <TextInput
              style={styles.requirementInput}
              value={condition.requirement}
              onChangeText={(text) => updateCondition(index, "requirement", text)}
              placeholder="Enter requirement description..."
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />
            <View style={styles.statusButtons}>
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  condition.status === "compliant" && styles.statusButtonActive,
                ]}
                onPress={() => updateCondition(index, "status", "compliant")}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={condition.status === "compliant" ? "#34C759" : "#8E8E93"}
                />
                <Text
                  style={[
                    styles.statusButtonText,
                    condition.status === "compliant" && styles.statusButtonTextActive,
                  ]}
                >
                  Compliant
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  condition.status === "non-compliant" && styles.statusButtonActive,
                ]}
                onPress={() => updateCondition(index, "status", "non-compliant")}
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={condition.status === "non-compliant" ? "#FF3B30" : "#8E8E93"}
                />
                <Text
                  style={[
                    styles.statusButtonText,
                    condition.status === "non-compliant" && styles.statusButtonTextActive,
                  ]}
                >
                  Non-Compliant
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  condition.status === "pending" && styles.statusButtonActive,
                ]}
                onPress={() => updateCondition(index, "status", "pending")}
              >
                <Ionicons
                  name="time"
                  size={20}
                  color={condition.status === "pending" ? "#FF9500" : "#8E8E93"}
                />
                <Text
                  style={[
                    styles.statusButtonText,
                    condition.status === "pending" && styles.statusButtonTextActive,
                  ]}
                >
                  Pending
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  condition.status === "n/a" && styles.statusButtonActive,
                ]}
                onPress={() => updateCondition(index, "status", "n/a")}
              >
                <Ionicons
                  name="remove-circle"
                  size={20}
                  color={condition.status === "n/a" ? "#8E8E93" : "#8E8E93"}
                />
                <Text
                  style={[
                    styles.statusButtonText,
                    condition.status === "n/a" && styles.statusButtonTextActive,
                  ]}
                >
                  N/A
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.remarksContainer}>
              <Text style={styles.remarksLabel}>Remarks / Observations:</Text>
              <TextInput
                style={styles.remarksInput}
                value={condition.remarks}
                onChangeText={(text) => updateCondition(index, "remarks", text)}
                placeholder="Enter detailed remarks and observations..."
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    backgroundColor: "white",
    marginTop: 10,
    padding: 15,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  addButton: {
    padding: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
  },
  emptyConditions: {
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderStyle: "dashed",
  },
  emptyConditionsText: {
    fontSize: 16,
    color: "#666",
    marginTop: 10,
    fontWeight: "600",
  },
  emptyConditionsSubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 5,
    textAlign: "center",
  },
  conditionCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  conditionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  conditionNumberInput: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#007AFF",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    padding: 8,
    minWidth: 60,
  },
  requirementInput: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    color: "#333",
    marginBottom: 12,
    minHeight: 60,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "white",
  },
  statusButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  statusButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
    gap: 4,
  },
  statusButtonActive: {
    backgroundColor: "#E8F5FF",
    borderColor: "#007AFF",
  },
  statusButtonText: {
    fontSize: 12,
    color: "#666",
  },
  statusButtonTextActive: {
    color: "#007AFF",
    fontWeight: "600",
  },
  remarksContainer: {
    marginTop: 8,
  },
  remarksLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
    marginBottom: 6,
  },
  remarksInput: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    color: "#333",
    minHeight: 70,
  },
});

export default ECCConditionsSection;
