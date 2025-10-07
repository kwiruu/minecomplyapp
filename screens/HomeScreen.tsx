import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";

const HomeScreen: React.FC = () => {
  const { user, signOut } = useAuth();

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to MineComply! 🎉</Text>

        <View style={styles.userInfo}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{user?.email}</Text>
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.label}>User ID:</Text>
          <Text style={styles.value}>{user?.id}</Text>
        </View>

        <View style={styles.connectionStatus}>
          <Text style={styles.successText}>
            ✅ Supabase Connection Working!
          </Text>
          <Text style={styles.infoText}>
            Your Expo app is successfully connected to Supabase. You can now
            build your mining compliance features.
          </Text>
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 40,
    color: "#333",
  },
  userInfo: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  label: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  value: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  connectionStatus: {
    backgroundColor: "#e8f5e8",
    padding: 20,
    borderRadius: 8,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: "#4caf50",
  },
  successText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2e7d32",
    textAlign: "center",
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: "#2e7d32",
    textAlign: "center",
    lineHeight: 20,
  },
  signOutButton: {
    backgroundColor: "#ff6b6b",
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  signOutButtonText: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default HomeScreen;
