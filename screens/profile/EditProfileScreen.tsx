import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CustomHeader } from "../../components/CustomHeader";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { theme } from "../../theme/theme";
import { keyboardShouldPersistTapsForFabric } from "../../utils/nativeRuntimeProps";
import styles from "./styles/profileScreen";

const EditProfileScreen = ({ navigation }: any) => {
  const { user, refreshProfile, profile: authProfile, updateLocalProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [position, setPosition] = useState("");
  const [mailingAddress, setMailingAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [fax, setFax] = useState("");

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    // If AuthContext already has the profile cached, use it to prefill fields
    if (authProfile) {
      setFirstName(authProfile.first_name || "");
      setLastName(authProfile.last_name || "");
      setPosition(authProfile.position || "");
      setMailingAddress(authProfile.mailing_address || "");
      setPhoneNumber(authProfile.phone_number || "");
      setFax(authProfile.fax || "");
      setLoading(false);
      return;
    }

    // Fallback: fetch directly if AuthContext doesn't have it
    (async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select(
            "first_name,last_name,position,mailing_address,phone_number,fax"
          )
          .eq("id", user.id)
          .single();
        if (error && (error as any).code !== "PGRST116") throw error;
        if (data) {
          setFirstName(data.first_name || "");
          setLastName(data.last_name || "");
          setPosition(data.position || "");
          setMailingAddress(data.mailing_address || "");
          setPhoneNumber(data.phone_number || "");
          setFax(data.fax || "");
        }
      } catch (e: any) {
        console.error("Failed to load profile for edit", e);
        Alert.alert("Error", "Failed to load your profile details.");
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id, authProfile]);

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      // Use upsert so we create the profile row if it doesn't exist yet.
      const payload = {
        id: user.id,
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        position: position.trim() || null,
        mailing_address: mailingAddress.trim() || null,
        phone_number: phoneNumber.trim() || null,
        fax: fax.trim() || null,
        email: user.email || null,
        full_name: [firstName.trim(), lastName.trim()].filter(Boolean).join(" ") || null,
      };

      // Optimistic local update: apply new values to AuthContext immediately
      const prevProfile = (authProfile && { ...authProfile }) || null;
      try {
        updateLocalProfile(payload);
      } catch (e) {}

      const { error } = await supabase.from("profiles").upsert(payload, {
        onConflict: "id",
      });

      if (error) {
        // revert optimistic update on failure
        if (prevProfile) updateLocalProfile(prevProfile);
        throw error;
      }

      // Ensure server-state is in sync with cache
      try {
        await refreshProfile();
      } catch (e) {}

      Alert.alert("Saved", "Your profile has been updated.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      console.error("Failed to save profile", e);
      Alert.alert("Error", e.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={theme.colors.primaryDark} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      <CustomHeader showSave onSave={handleSave} saveDisabled={saving} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps={keyboardShouldPersistTapsForFabric}
        >
          <View style={styles.section}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.sectionTitle}>Edit Profile Information</Text>
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>First Name</Text>
                <TextInput
                  placeholder="Enter first name"
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholderTextColor="#9CA3AF"
                  style={{
                    borderWidth: 1,
                    borderColor: '#E0E0E0',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                    fontFamily: theme.typography.regular,
                  }}
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Last Name</Text>
                <TextInput
                  placeholder="Enter last name"
                  value={lastName}
                  onChangeText={setLastName}
                  placeholderTextColor="#9CA3AF"
                  style={{
                    borderWidth: 1,
                    borderColor: '#E0E0E0',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                    fontFamily: theme.typography.regular,
                  }}
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Position</Text>
                <TextInput
                  placeholder="Enter position"
                  value={position}
                  onChangeText={setPosition}
                  placeholderTextColor="#9CA3AF"
                  style={{
                    borderWidth: 1,
                    borderColor: '#E0E0E0',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                    fontFamily: theme.typography.regular,
                  }}
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Mailing Address</Text>
                <TextInput
                  placeholder="Enter mailing address"
                  value={mailingAddress}
                  onChangeText={setMailingAddress}
                  placeholderTextColor="#9CA3AF"
                  style={{
                    borderWidth: 1,
                    borderColor: '#E0E0E0',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                    fontFamily: theme.typography.regular,
                  }}
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Phone Number</Text>
                <TextInput
                  placeholder="Enter phone number"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  placeholderTextColor="#9CA3AF"
                  style={{
                    borderWidth: 1,
                    borderColor: '#E0E0E0',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                    fontFamily: theme.typography.regular,
                  }}
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Fax</Text>
                <TextInput
                  placeholder="Enter fax"
                  value={fax}
                  onChangeText={setFax}
                  placeholderTextColor="#9CA3AF"
                  style={{
                    borderWidth: 1,
                    borderColor: '#E0E0E0',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                    fontFamily: theme.typography.regular,
                  }}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default EditProfileScreen;
