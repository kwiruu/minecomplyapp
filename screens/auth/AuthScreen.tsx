import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
} from "react-native";
import { styles } from "./styles/authScreen";
import { FloatingLabelInput } from "./components/FloatingLabelInput";
// import { scale } from '../utils/responsive';
import { useAuth } from "../../contexts/AuthContext";
import { keyboardShouldPersistTapsForFabric } from "../../utils/nativeRuntimeProps";
import { getSupabaseRuntimeDiagnostics } from "../../lib/supabase";

function getErrorMessage(error: any) {
  return error?.message || String(error || "Something went wrong");
}

function isNetworkAuthError(error: any) {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes("network request failed") ||
    message.includes("failed to fetch") ||
    message.includes("network request timed out")
  );
}

function showAuthError(error: any, action: "sign in" | "sign up") {
  const message = getErrorMessage(error);

  if (isNetworkAuthError(error)) {
    console.error("[AUTH] Authentication network request failed", {
      action,
      message,
      supabase: getSupabaseRuntimeDiagnostics(),
    });
    Alert.alert(
      "Connection Error",
      "The app could not reach the authentication server. Please check your internet connection and try again. If this keeps happening, contact support."
    );
    return;
  }

  Alert.alert("Error", message);
}

export default function AuthScreen({ navigation }: any) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleAuth = async () => {
    if (!isLogin && password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
    if (!email || !password || (!isLogin && (!firstName || !lastName))) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const result = isLogin
        ? await signIn(email, password)
        : await signUp(email, password, firstName, lastName);
      const { data, error } = result;

      if (!error && data?.user) {
        setUser(data.user); // Sets the user state if the operation was successful
      }
      if (result.error) {
        // Check if it's a duplicate email error
        const errorMessage = getErrorMessage(result.error).toLowerCase();
        if (
          errorMessage.includes("already registered") ||
          errorMessage.includes("already exists") ||
          errorMessage.includes("already been taken") ||
          errorMessage.includes("user already registered")
        ) {
          Alert.alert(
            "Email Already Registered",
            "This email is already registered. Please sign in instead or use a different email."
          );
        } else {
          showAuthError(result.error, isLogin ? "sign in" : "sign up");
        }
      } else if (!isLogin) {
        // Handle signup success
        const user: any = result?.data?.user;
        // Supabase quirk: user.identities can be an empty array when the email already exists
        if (
          user &&
          Array.isArray(user?.identities) &&
          user.identities.length === 0
        ) {
          Alert.alert(
            "Email Already Registered",
            "This email is already registered. Please sign in instead or use a different email."
          );
          return;
        }
        if (result.data.user) {
          if (!result.data.user.email_confirmed_at) {
            Alert.alert(
              "Success",
              "Please check your email to confirm your account",
              [
                {
                  text: "OK",
                  onPress: () => {
                    // Switch to login mode and clear signup fields
                    setIsLogin(true);
                    setFirstName("");
                    setLastName("");
                    setConfirmPassword("");
                    // Keep email and password for convenience
                  },
                },
              ]
            );
          } else {
            // User created and already confirmed (rare case)
            Alert.alert("Success", "Account created successfully!");
          }
        } else {
          // No user created and no error - something went wrong
          Alert.alert("Error", "Failed to create account. Please try again.");
        }
      }
    } catch (error: any) {
      showAuthError(error, isLogin ? "sign in" : "sign up");
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFirstName("");
    setLastName("");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps={keyboardShouldPersistTapsForFabric}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <Image
            source={require("../../assets/images/mc-logo.png")}
            style={styles.logo}
          />
          <Text style={styles.title}>
            {isLogin ? "Welcome Back" : "Get Started"}
          </Text>
          <Text style={styles.subtitle}>
            {isLogin
              ? "Sign in to continue your journey"
              : "Create your account to begin"}
          </Text>
        </View>

        {/* Form Section */}
        <View style={styles.formContainer}>
          {!isLogin && (
            <>
              <FloatingLabelInput
                label="First name"
                value={firstName}
                onChangeText={setFirstName}
                editable={!loading}
              />
              <FloatingLabelInput
                label="Last name"
                value={lastName}
                onChangeText={setLastName}
                editable={!loading}
              />
            </>
          )}
          <FloatingLabelInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />
          <FloatingLabelInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />
          {!isLogin && (
            <FloatingLabelInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              editable={!loading}
            />
          )}

          {isLogin && (
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.linkText}>Forgot Password?</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.button, loading && { opacity: 0.5 }]}
            onPress={handleAuth}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Loading..." : isLogin ? "Sign In" : "Create Account"}
            </Text>
          </TouchableOpacity>

          {/* Terms of Service / Privacy Policy */}
          <View style={styles.agreementContainer}>
            <Text style={styles.agreementText}>
              By continuing, you agree to our{" "}
              <Text style={styles.linkText}>Terms of Service</Text> and{" "}
              <Text style={styles.linkText}>Privacy Policy</Text>.
            </Text>
          </View>
        </View>

        {/* Bottom Section*/}
        <View style={styles.bottomSection}>
          <TouchableOpacity
            onPress={toggleAuthMode}
            style={styles.switchButton}
            disabled={loading}
          >
            <Text style={styles.switchText}>
              {isLogin
                ? "Don't have an account? "
                : "Already have an account? "}
              <Text style={styles.switchTextBold}>
                {isLogin ? "Sign Up" : "Sign In"}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
