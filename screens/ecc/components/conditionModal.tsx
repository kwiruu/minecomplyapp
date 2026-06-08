import React from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ConditionModalProps } from "../types/eccMonitoring";
import { styles } from "../styles/eccMonitoringScreen";
import { keyboardShouldPersistTapsForFabric } from "../../../utils/nativeRuntimeProps";

export const ConditionModal = ({
  visible,
  mode,
  editing,
  onChange,
  onCancel,
  onSave,
}: ConditionModalProps) => {
  if (!editing) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalBackdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <View style={styles.modalWrapper}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>
                {mode === "add" ? "Add Condition" : "Edit Condition"}
              </Text>

              <ScrollView
                style={styles.modalScrollArea}
                keyboardShouldPersistTaps={keyboardShouldPersistTapsForFabric}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.modalLabel}>Title</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Condition title"
                  placeholderTextColor="#C0C0C0"
                  value={editing?.title}
                  onChangeText={(t) => onChange({ ...editing, title: t })}
                />

                {/* <Text style={styles.modalLabel}>Complied (description)</Text>
                <TextInput
                  style={[styles.modalInput, styles.modalTextarea]}
                  placeholder="Complied description"
                  placeholderTextColor="#C0C0C0"
                  value={editing?.descriptions.complied}
                  onChangeText={(t) =>
                    onChange({
                      ...editing,
                      descriptions: { ...editing.descriptions, complied: t },
                    })
                  }
                  multiline
                /> */}

                {/* <Text style={styles.modalLabel}>
                  Partially Complied (description)
                </Text>
                <TextInput
                  style={[styles.modalInput, styles.modalTextarea]}
                  placeholder="Partially complied description"
                  placeholderTextColor="#C0C0C0"
                  value={editing?.descriptions.partial}
                  onChangeText={(t) =>
                    onChange({
                      ...editing,
                      descriptions: { ...editing.descriptions, partial: t },
                    })
                  }
                  multiline
                /> */}

                {/* <Text style={styles.modalLabel}>
                  Not Complied (description)
                </Text>
                <TextInput
                  style={[styles.modalInput, styles.modalTextarea]}
                  placeholder="Not complied description"
                  placeholderTextColor="#C0C0C0"
                  value={editing?.descriptions.not}
                  onChangeText={(t) =>
                    onChange({
                      ...editing,
                      descriptions: { ...editing.descriptions, not: t },
                    })
                  }
                  multiline
                /> */}
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalCancel]}
                  onPress={onCancel}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalSave]}
                  onPress={onSave}
                >
                  <Text style={styles.modalSaveText}>
                    {mode === "add" ? "Add" : "Save"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};
