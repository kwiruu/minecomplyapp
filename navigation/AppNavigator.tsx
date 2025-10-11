import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";

// Screens
import AuthScreen from "../screens/AuthScreen";
import DashboardScreen from "../screens/DashboardScreen";
import SubmissionsScreen from "../screens/SubmissionsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import CMVRReportScreen from "../screens/CMVRReportScreen";

// Create navigators
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const RootStack = createStackNavigator();

/* -------------------- Dashboard Stack -------------------- */
function DashboardStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="DashboardMain"
        component={DashboardScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CMVRReport"
        component={CMVRReportScreen}
        options={{
          title: "CMVR Report",
          headerStyle: { backgroundColor: "#007AFF" },
          headerTintColor: "white",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      />
    </Stack.Navigator>
  );
}

/* -------------------- Submissions Stack -------------------- */
function SubmissionsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="SubmissionsMain"
        component={SubmissionsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

/* -------------------- Bottom Tabs -------------------- */
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === "Dashboard") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Submissions") {
            iconName = focused ? "document-text" : "document-text-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          } else {
            iconName = "ellipse";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "gray",
        headerStyle: {
          backgroundColor: "#007AFF",
        },
        headerTintColor: "white",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardStack}
        options={{ title: "MineComply Dashboard" }}
      />
      <Tab.Screen
        name="Submissions"
        component={SubmissionsStack}
        options={{ title: "My Submissions" }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: "Profile" }}
      />
    </Tab.Navigator>
  );
}

/* -------------------- Root Stack (Global Navigation) -------------------- */
function RootNavigator() {
  return (
    <RootStack.Navigator>
      <RootStack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <RootStack.Screen
        name="CMVRReport"
        component={CMVRReportScreen}
        options={{
          title: "CMVR Report",
          headerStyle: { backgroundColor: "#007AFF" },
          headerTintColor: "white",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      />
    </RootStack.Navigator>
  );
}

/* -------------------- App Navigator -------------------- */
const AppNavigator = () => {
  const { session, loading } = useAuth();

  if (loading) {
    return null; // You can add a loading spinner here
  }

  if (!session) {
    return <AuthScreen />;
  }

  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
};

export default AppNavigator;
