import 'react-native-gesture-handler';
import "./global.css";
import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View, Text, StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./contexts/AuthContext";
import AppNavigator from "./navigation/AppNavigator";
import { ThemeProvider as AppThemeProvider } from "./theme/ThemeProvider";
import { SafeAreaWebProvider } from "./contexts/SafeAreaWebContext";
import ConfigurationErrorScreen from "./components/ConfigurationErrorScreen";

// Validation imports
import { isSupabaseConfigured, supabaseConfigError } from "./lib/supabase";
import { getApiBaseUrl } from "./lib/api";

export default function App() {
  const [configError, setConfigError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    // Validate configuration on app start
    const validateConfiguration = async () => {
      try {
        // Check Supabase configuration
        if (!isSupabaseConfigured) {
          setConfigError(supabaseConfigError || "Supabase not configured");
          setIsValidating(false);
          return;
        }

        // Check API base URL (this will use fallback if not configured, so just verify it's set)
        const apiUrl = getApiBaseUrl();
        console.log("[APP] API Base URL configured:", apiUrl);

        // All checks passed
        setConfigError(null);
        setIsValidating(false);
      } catch (error: any) {
        console.error("[APP] Configuration validation error:", error);
        setConfigError(error.message || "Failed to validate app configuration");
        setIsValidating(false);
      }
    };

    validateConfiguration();
  }, []);

  // Show loading screen while validating
  if (isValidating) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loadingText}>Initializing MineComply...</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  // Show configuration error screen if validation failed
  if (configError) {
    return (
      <SafeAreaProvider>
        <ConfigurationErrorScreen
          error={configError}
          details="This APK was built without the required environment variables. Please rebuild with proper configuration or contact your administrator."
        />
      </SafeAreaProvider>
    );
  }

  // Normal app flow
  return (
    <SafeAreaProvider>
      <AppThemeProvider>
        <SafeAreaWebProvider>
          <AuthProvider>
            <AppNavigator />
            <StatusBar style="auto" />
          </AuthProvider>
        </SafeAreaWebProvider>
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666666",
  },
});
