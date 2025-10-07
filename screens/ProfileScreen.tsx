import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../contexts/AuthContext";
import { apiGet } from "../lib/api";
import { uploadFileFromUri } from "../lib/storage";

const ProfileScreen = () => {
  const { user, signOut } = useAuth();
  const [uploadingSample, setUploadingSample] = React.useState(false);

  const handleTestApiAuth = async () => {
    try {
      const res = await apiGet<{ user: any; authorization: string | null }>(
        "/auth-debug/me"
      );
      Alert.alert(
        "Auth OK",
        `User: ${res.user?.id || "?"}\nEmail: ${
          res.user?.email || "?"
        }\nAuth header: ${res.authorization ? "present" : "missing"}`
      );
    } catch (e: any) {
      Alert.alert("Auth Failed", e?.message || String(e));
    }
  };

  const handleTokenInfo = async () => {
    try {
      const res = await apiGet<{
        authorization: string | null;
        header: { alg?: string; kid?: string } | null;
        payload: { iss?: string; aud?: string; sub?: string } | null;
      }>("/auth-debug/headers");
      const lines = [
        `Auth header: ${res.authorization ? "present" : "missing"}`,
        `alg: ${res.header?.alg ?? "?"}`,
        `kid: ${res.header?.kid ?? "?"}`,
        `iss: ${res.payload?.iss ?? "?"}`,
        `aud: ${res.payload?.aud ?? "?"}`,
        `sub: ${res.payload?.sub ?? "?"}`,
      ];
      Alert.alert("Token Info", lines.join("\n"));
    } catch (e: any) {
      Alert.alert("Token Info Failed", e?.message || String(e));
    }
  };

  const handleSampleUpload = async () => {
    if (uploadingSample) {
      return;
    }

    setUploadingSample(true);

    try {
      // Request media library permissions first
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Sorry, we need media library permissions to create sample files. Please grant permissions in your device settings."
        );
        return;
      }

      // Create a simple text content
      const timestamp = Date.now();
      const fileName = `profile-sample-${timestamp}.txt`;
      const content = `Sample profile upload created at ${new Date().toISOString()} from MineComply mobile app.

User ID: ${user?.id || "unknown"}
User Email: ${user?.email || "unknown"}
Device timestamp: ${timestamp}
Platform: Mobile App

This is a test upload to verify that file uploads are working correctly.
The file was created in-memory and uploaded directly to Supabase storage.`;

      // Create a Blob and convert to data URI
      const blob = new Blob([content], { type: "text/plain" });
      const reader = new FileReader();

      const dataUri = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      console.log(`Creating sample file: ${fileName}`);
      console.log(`Data URI length: ${dataUri.length}`);

      // Upload directly from data URI
      console.log("Starting upload process...");
      const { path } = await uploadFileFromUri({
        uri: dataUri,
        fileName,
        contentType: "text/plain; charset=utf-8",
        upsert: true,
      });
      console.log(`Upload completed successfully! Path: ${path}`);

      Alert.alert(
        "Upload Successful! 🎉",
        `File uploaded successfully!\n\nFilename: ${fileName}\nPath: ${path}\nSize: ${content.length} characters`
      );
    } catch (e: any) {
      console.error("Upload error details:", {
        message: e?.message,
        stack: e?.stack,
        name: e?.name,
        cause: e?.cause,
        fullError: e,
      });

      // Try to parse if it's a JSON error response
      let errorDetails = String(e?.message || e);
      try {
        const parsed = JSON.parse(errorDetails);
        errorDetails = `Status: ${parsed.statusCode}\nError: ${parsed.error}\nMessage: ${parsed.message}`;
      } catch {
        // Not JSON, use as-is
      }

      Alert.alert(
        "Upload Failed",
        `Error: ${errorDetails}\n\nPlease check the console for detailed logs.`
      );
    } finally {
      setUploadingSample(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
          } catch (error: any) {
            Alert.alert("Error", error.message);
          }
        },
      },
    ]);
  };

  const handleComingSoon = (feature: string) => {
    Alert.alert(
      "Coming Soon",
      `${feature} functionality will be implemented in future updates!`
    );
  };

  const MenuItem = ({
    icon,
    title,
    subtitle,
    onPress,
    showArrow = true,
    danger = false,
    disabled = false,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    onPress: () => void;
    showArrow?: boolean;
    danger?: boolean;
    disabled?: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.menuItem, disabled && styles.menuItemDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.menuItemLeft}>
        <View
          style={[styles.iconContainer, danger && styles.iconContainerDanger]}
        >
          <Ionicons
            name={icon}
            size={20}
            color={danger ? "#FF3B30" : "#007AFF"}
          />
        </View>
        <View style={styles.menuItemText}>
          <Text
            style={[styles.menuItemTitle, danger && styles.menuItemTitleDanger]}
          >
            {title}
          </Text>
          {subtitle && <Text style={styles.menuItemSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {showArrow && <Ionicons name="chevron-forward" size={20} color="#ccc" />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.email?.charAt(0).toUpperCase() || "U"}
              </Text>
            </View>
          </View>
          <Text style={styles.userName}>{user?.email}</Text>
          <Text style={styles.userRole}>Mining Proponent</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>✓ Verified Account</Text>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <MenuItem
            icon="person-outline"
            title="Personal Information"
            subtitle="Update your profile details"
            onPress={() => handleComingSoon("Profile editing")}
          />
          <MenuItem
            icon="business-outline"
            title="Organization Details"
            subtitle="Mining company information"
            onPress={() => handleComingSoon("Organization management")}
          />
          <MenuItem
            icon="shield-checkmark-outline"
            title="Security & Privacy"
            subtitle="Password, 2FA settings"
            onPress={() => handleComingSoon("Security settings")}
          />
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          <MenuItem
            icon="key-outline"
            title="Test API Auth"
            subtitle="Verify token reaches the backend"
            onPress={handleTestApiAuth}
          />
          <MenuItem
            icon="information-circle-outline"
            title="Token Info (public)"
            subtitle="Show alg/kid/iss/aud/sub"
            onPress={handleTokenInfo}
          />
          <MenuItem
            icon="cloud-upload-outline"
            title="Upload Sample File"
            subtitle={
              uploadingSample
                ? "Uploading sample file..."
                : "Send a temporary sample text file"
            }
            onPress={handleSampleUpload}
            disabled={uploadingSample}
          />
          <MenuItem
            icon="notifications-outline"
            title="Notifications"
            subtitle="Manage your notification preferences"
            onPress={() => handleComingSoon("Notification settings")}
          />
          <MenuItem
            icon="download-outline"
            title="Offline Mode"
            subtitle="Download reports for offline access"
            onPress={() => handleComingSoon("Offline functionality")}
          />
          <MenuItem
            icon="language-outline"
            title="Language"
            subtitle="English"
            onPress={() => handleComingSoon("Language selection")}
          />
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <MenuItem
            icon="help-circle-outline"
            title="Help & FAQ"
            subtitle="Get help with MineComply"
            onPress={() => handleComingSoon("Help center")}
          />
          <MenuItem
            icon="bug-outline"
            title="Report a Bug"
            subtitle="Help us improve the app"
            onPress={() => handleComingSoon("Bug reporting")}
          />
          <MenuItem
            icon="document-text-outline"
            title="Terms & Privacy"
            subtitle="Legal information"
            onPress={() => handleComingSoon("Legal documents")}
          />
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <MenuItem
            icon="information-circle-outline"
            title="App Version"
            subtitle="1.0.0 (Beta)"
            onPress={() => {}}
            showArrow={false}
          />
        </View>

        {/* Sign Out */}
        <View style={styles.section}>
          <MenuItem
            icon="log-out-outline"
            title="Sign Out"
            onPress={handleSignOut}
            showArrow={false}
            danger={true}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            MineComply © 2024{"\n"}
            Ensuring mining compliance and environmental protection
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "white",
    alignItems: "center",
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    marginBottom: 15,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "white",
    fontSize: 32,
    fontWeight: "bold",
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  userRole: {
    fontSize: 16,
    color: "#666",
    marginBottom: 10,
  },
  statusBadge: {
    backgroundColor: "#E8F5E8",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: "#34C759",
    fontSize: 14,
    fontWeight: "500",
  },
  section: {
    backgroundColor: "white",
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#f0f0f0",
  },
  menuItemDisabled: {
    opacity: 0.5,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F0F8FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  iconContainerDanger: {
    backgroundColor: "#FFEBEA",
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 2,
  },
  menuItemTitleDanger: {
    color: "#FF3B30",
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  footer: {
    padding: 30,
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    lineHeight: 20,
  },
});

export default ProfileScreen;
