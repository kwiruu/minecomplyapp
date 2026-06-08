import React from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ProcessDocumentationProps } from "../types/processDocumentation.types";
import { styles } from "../styles/processDocumentation.styles";

export const ProcessDocumentationSection: React.FC<ProcessDocumentationProps> = ({
  processDoc,
  updateProcessDoc,
  eccMmtAdditional,
  epepMmtAdditional,
  ocularMmtAdditional,
  addEccMmtMember,
  addEpepMmtMember,
  addOcularMmtMember,
  updateEccMmtAdditional,
  updateEpepMmtAdditional,
  updateOcularMmtAdditional,
  removeEccMmtAdditional,
  removeEpepMmtAdditional,
  removeOcularMmtAdditional,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <View style={styles.iconContainer}>
          <Ionicons name="clipboard" size={24} color='#02217C' />
        </View>
        <View style={styles.headerTextContainer}>
          <Text style={styles.sectionTitle}>Process Documentation</Text>
          <Text style={styles.sectionSubtitle}>Details of Monitoring Activities</Text>
        </View>
      </View>

      <View style={styles.sectionContent}>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Date Conducted</Text>
          <TextInput
            style={styles.input}
            value={processDoc.dateConducted}
            onChangeText={(text) => updateProcessDoc("dateConducted", text)}
            placeholder="MM/DD/YYYY"
            placeholderTextColor="#94A3B8"
          />
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => updateProcessDoc("sameDateForAll", !processDoc.sameDateForAll)}
          >
            <View style={[styles.checkbox, processDoc.sameDateForAll && styles.checkboxChecked]}>
              {processDoc.sameDateForAll && <Ionicons name="checkmark" size={16} color="white" />}
            </View>
            <Text style={styles.checkboxLabel}>Same date for all activities</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <View style={styles.subsectionHeader}>
          <View style={styles.subsectionIconContainer}>
            <Ionicons name="folder-open" size={18} color='#02217C'/>
          </View>
          <Text style={styles.subsectionTitle}>Document Review Activities</Text>
        </View>

        <View style={styles.activityCard}>
          <View style={styles.activityHeader}>
            <Ionicons name="document" size={18} color='#02217C' />
            <Text style={styles.activityTitle}>ECC Conditions/Commitments</Text>
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.labelSmall}>MMT MEMBERS INVOLVED</Text>
            <TextInput
              style={styles.input}
              value={processDoc.eccMmtMembers}
              onChangeText={(text) => updateProcessDoc("eccMmtMembers", text)}
              placeholder="Enter primary member name"
              placeholderTextColor="#94A3B8"
            />
          </View>
          {eccMmtAdditional.map((member, index) => (
            <View key={`ecc-${index}`} style={styles.additionalMemberRow}>
              <TextInput
                style={[styles.input, styles.additionalInput]}
                value={member}
                onChangeText={(text) => updateEccMmtAdditional(index, text)}
                placeholder={`Enter member #${index + 2}`}
                placeholderTextColor="#94A3B8"
              />
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => removeEccMmtAdditional(index)}
              >
                <Ionicons name="trash-outline" size={16} color="#DC2626" />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.addButton} onPress={addEccMmtMember}>
            <Ionicons name="add-circle" size={20} color='#02217C' />
            <Text style={styles.addButtonText}>Add more members</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.activityCard}>
          <View style={styles.activityHeader}>
            <Ionicons name="leaf" size={18} color='#02217C' />
            <Text style={styles.activityTitle}>EPEP/AEPEP Conditions</Text>
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.labelSmall}>MMT MEMBERS INVOLVED</Text>
            <TextInput
              style={styles.input}
              value={processDoc.epepMmtMembers}
              onChangeText={(text) => updateProcessDoc("epepMmtMembers", text)}
              placeholder="Enter primary member name"
              placeholderTextColor="#94A3B8"
            />
          </View>
          {epepMmtAdditional.map((member, index) => (
            <View key={`epep-${index}`} style={styles.additionalMemberRow}>
              <TextInput
                style={[styles.input, styles.additionalInput]}
                value={member}
                onChangeText={(text) => updateEpepMmtAdditional(index, text)}
                placeholder={`Enter member #${index + 2}`}
                placeholderTextColor="#94A3B8"
              />
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => removeEpepMmtAdditional(index)}
              >
                <Ionicons name="trash" size={20} color="#DC2626" />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.addButton} onPress={addEpepMmtMember}>
            <Ionicons name="add-circle" size={20} color='#02217C'/>
            <Text style={styles.addButtonText}>Add more members</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <View style={styles.subsectionHeader}>
          <View style={styles.subsectionIconContainer}>
            <Ionicons name="eye" size={18} color='#02217C'/>
          </View>
          <Text style={styles.subsectionTitle}>Site Validation Activities</Text>
        </View>

        <View style={styles.activityCard}>
          <View style={styles.activityHeader}>
            <Ionicons name="walk" size={18} color='#02217C'/>
            <Text style={styles.activityTitle}>Site Ocular Validation</Text>
            <TouchableOpacity
              style={styles.naButton}
              onPress={() => updateProcessDoc("ocularNA", !processDoc.ocularNA)}
            >
              <View style={[styles.checkboxSmall, processDoc.ocularNA && styles.checkboxChecked]}>
                {processDoc.ocularNA && <Ionicons name="checkmark" size={14} color="white" />}
              </View>
              <Text style={styles.naButtonText}>N/A</Text>
            </TouchableOpacity>
          </View>
          

          <View style={[processDoc.ocularNA && styles.disabledContent]}>
            <View style={styles.fieldGroup}>
              <Text style={styles.labelSmall}>MMT MEMBERS INVOLVED</Text>
              <TextInput
                style={[styles.input, processDoc.ocularNA && styles.disabledInput]}
                value={processDoc.ocularMmtMembers}
                onChangeText={(text) => updateProcessDoc("ocularMmtMembers", text)}
                placeholder="Enter primary member name"
                placeholderTextColor="#94A3B8"
                editable={!processDoc.ocularNA}
              />
            </View>
            
            {ocularMmtAdditional.map((member, index) => (
              <View key={`ocular-${index}`} style={styles.additionalMemberRow}>
                <TextInput
                  style={[styles.input, styles.additionalInput, processDoc.ocularNA && styles.disabledInput]}
                  value={member}
                  onChangeText={(text) => updateOcularMmtAdditional(index, text)}
                  placeholder={`Enter member #${index + 2}`}
                  placeholderTextColor="#94A3B8"
                  editable={!processDoc.ocularNA}
                />
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => removeOcularMmtAdditional(index)}
                  disabled={processDoc.ocularNA}
                >
                  <Ionicons name="trash" size={20} color={processDoc.ocularNA ? "#CBD5E1" : "#DC2626"} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={[styles.addButton, processDoc.ocularNA && styles.disabledButton]}
              onPress={addOcularMmtMember}
              disabled={processDoc.ocularNA}
            >
              <Ionicons name="add-circle" size={20} color={processDoc.ocularNA ? "#94A3B8" : '#02217C'} />
              <Text style={[styles.addButtonText, processDoc.ocularNA && styles.disabledButtonText]}>Add more members</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Methodology / Other Remarks</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={processDoc.methodologyRemarks}
            onChangeText={(text) => updateProcessDoc("methodologyRemarks", text)}
            placeholder="Enter methodology details or any other relevant remarks..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.activityCard}>
          <View style={styles.activityHeader}>
            <Ionicons name="flask" size={18} color='#02217C' />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.activityTitle}>Site Validation - Confirmatory Sampling</Text>
              <Text style={styles.activitySubtitle}>(if needed)</Text>
            </View>
          </View>
          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => updateProcessDoc("siteValidationApplicable", "applicable")}
            >
              <View style={[styles.checkbox, processDoc.siteValidationApplicable === "applicable" && styles.checkboxChecked]}>
                {processDoc.siteValidationApplicable === "applicable" && <Ionicons name="checkmark" size={16} color="white" />}
              </View>
              <Text style={styles.checkboxLabel}>Applicable</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => updateProcessDoc("siteValidationApplicable", "none")}
            >
              <View style={[styles.checkbox, processDoc.siteValidationApplicable === "none" && styles.checkboxChecked]}>
                {processDoc.siteValidationApplicable === "none" && <Ionicons name="checkmark" size={16} color="white" />}
              </View>
              <Text style={styles.checkboxLabel}>None</Text>
            </TouchableOpacity>
          </View>

          {/* Conditional fields when "Applicable" is selected */}
          {processDoc.siteValidationApplicable === "applicable" && (
            <View style={styles.samplingFieldsContainer}>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Date Conducted</Text>
                <TextInput
                  style={styles.input}
                  value={processDoc.samplingDateConducted}
                  onChangeText={(text) => updateProcessDoc("samplingDateConducted", text)}
                  placeholder="Month/Date/Year"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>MMT Members Involved</Text>
                <TextInput
                  style={styles.input}
                  value={processDoc.samplingMmtMembers}
                  onChangeText={(text) => updateProcessDoc("samplingMmtMembers", text)}
                  placeholder="Type here..."
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Methodology/ Other Remarks</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={processDoc.samplingMethodologyRemarks}
                  onChangeText={(text) => updateProcessDoc("samplingMethodologyRemarks", text)}
                  placeholder="Type here..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={4}
                />
              </View>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        
      </View>
    </View>
  );
};
