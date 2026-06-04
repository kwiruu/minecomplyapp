import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Animated,
  ScrollView,
} from "react-native";
import { Users, UserCog, User, UserPlus } from "lucide-react-native";
import { theme } from "../../theme/theme";
import styles from "./styles/roleSelectionScreen";

const roles = [
  { label: "MMT Chair", icon: UserCog },
  { label: "Co-chair", icon: Users },
  { label: "Member", icon: User },
  { label: "Guest", icon: UserPlus },
];

function RoleCard({ role, onPress }: any) {
  const [scaleAnim] = useState(new Animated.Value(1));
  const Icon = role.icon;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 50,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      style={styles.roleWrapper}
    >
      <Animated.View
        style={[styles.roleCard, { transform: [{ scale: scaleAnim }] }]}
      >
        <View style={styles.iconCircle}>
          <Icon color={theme.colors.primaryDark} strokeWidth={2.2} />
        </View>
        <Text style={styles.roleLabel}>{role.label}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function RoleSelectionScreen({ navigation }: any) {
  const handleRoleSelect = (roleLabel: string) => {
    if (roleLabel === "MMT Chair" || roleLabel === "Co-chair") {
      navigation.replace("Dashboard", { role: roleLabel });
    } else if (roleLabel === "Member" || roleLabel === "Guest") {
      navigation.replace("GuestDashboard", { role: roleLabel });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Image
            source={require("../../assets/images/mc-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Select Your Role</Text>
          <Text style={styles.subtitle}>Choose how you'll use MineComply</Text>
        </View>

        <View style={styles.rolesContainer}>
          {roles.map((role) => (
            <RoleCard
              key={role.label}
              role={role}
              onPress={() => handleRoleSelect(role.label)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
