// AppNavigator.tsx

import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../contexts/AuthContext";
import { FileNameProvider } from "../contexts/FileNameContext";

// Screens
import AuthScreen from "../screens/auth/AuthScreen";
import RoleSelectionScreen from "../screens/role-selection/RoleSelectionScreen";
import DashboardScreen from "../screens/dashboard/DashboardScreen";
import DuplicateReportScreen from "../screens/dashboard/DuplicateReportScreen";
import SubmissionsScreen from "../screens/SubmissionsScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";
import EditProfileScreen from "../screens/profile/EditProfileScreen";
import CMVRReportScreen from "../screens/CMVRPAGE/CMVR/CMVRReportScreen";
import CMVRPage2Screen from "../screens/CMVRPAGE/CMVRPage2/CMVRPage2Screen";
import CreateAttendanceScreen from "../screens/attendance/CreateAttendanceScreen";
import AttendanceRecordScreen from "../screens/attendance/AttendanceRecordScreen";
import AttendanceListScreen from "../screens/CMVRPAGE/AttendanceListScreen";
import ReportsScreen from "../screens/reports/ReportsScreen";
import ComplianceMonitoringScreen from "../screens/CMVRPAGE/CMS/ComplianceMonitoringScreen";
import EIAComplianceScreen from "../screens/CMVRPAGE/EIA/EIAComplianceScreen";
import EnvironmentalComplianceScreen from "../screens/CMVRPAGE/EnvironmentalCompliance/EnvironmentalComplianceScreen";
import WaterQualityScreen from "../screens/CMVRPAGE/water-quality/WaterQualityScreen";
import NoiseQualityScreen from "../screens/CMVRPAGE/NoiseQuality/NoiseQualityScreen";
import WasteManagementScreen from "../screens/CMVRPAGE/WasteManagement/WasteManagementScreen";
import ChemicalSafetyScreen from "../screens/CMVRPAGE/chemical/ChemicalSafetyScreen";
import RecommendationsScreen from "../screens/CMVRPAGE/recommendations/RecommendationsScreen";
import ECCMonitoringScreen from "../screens/ecc/ECCMonitoringScreen";
import ECCMonitoringScreen2 from "../screens/ecc/conditions";
import CMVRDocumentExportScreen from "../screens/CMVRPAGE/CMVRDocumentExportScreen";
import CMVRAttachmentsScreen from "../screens/CMVRPAGE/CMVRAttachmentsScreen";
import ExportReportScreen from "../screens/CMVRPAGE/ExportReportScreen";
import CMVRDraftsScreen from "../screens/CMVRPAGE/CMVRDraftsScreen";
import GuestDashboardScreen from "../screens/dashboard/GuestDashboardScreen";
import EPEPScreen from "../screens/EPEP/epepScreen";
import ECCDraftsScreen from "../screens/ecc/ECCDraftsScreen";
import ComplianceDiscussionScreen from "../screens/CMVRPAGE/ComplianceMonitoringDiscussion/ComplianceDiscussionScreen";
import GuestRemarksForm from "../screens/guest/GuestRemarksForm";



const RootStack = createNativeStackNavigator();

const AppNavigator = () => {
  const { session, loading } = useAuth();

  if (loading) return null;

  return (
    <FileNameProvider>
      <NavigationContainer>
        {/* Use a different navigator key to fully reset routes on auth changes */}
        <RootStack.Navigator
          key={session ? "app" : "auth"}
          screenOptions={{ headerShown: false }}
        >
          {!session ? (
            <RootStack.Screen
              name="Auth"
              component={AuthScreen}
              options={{ headerShown: false }}
            />
          ) : (
            <>
              <RootStack.Screen
                name="RoleSelection"
                component={RoleSelectionScreen}
                options={{ headerShown: false }}
              />
              <RootStack.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{ headerShown: false }}
              />
              <RootStack.Screen
                name="DuplicateReport"
                component={DuplicateReportScreen}
                options={{ headerShown: false }}
              />
              <RootStack.Screen
                name="AttendanceRecords"
                component={AttendanceRecordScreen}
                options={{ headerShown: false }}
              />
              <RootStack.Screen
                name="CreateAttendance"
                component={CreateAttendanceScreen}
                options={{ headerShown: false }}
              />
              <RootStack.Screen
                name="AttendanceList"
                component={AttendanceListScreen}
                options={{ headerShown: false }}
              />
              <RootStack.Screen
                name="CMVRDrafts"
                component={CMVRDraftsScreen}
                options={{ headerShown: false }}
              />
            <RootStack.Screen
                name="ECCDraftScreen"
                component={ECCDraftsScreen}
                options={{ headerShown: false }}
              />
            
              <RootStack.Screen
                name="GuestDashboard"
                component={GuestDashboardScreen}
                options={{ headerShown: false }}
              />
              <RootStack.Screen name="Reports" component={ReportsScreen} />
              <RootStack.Screen
                name="Submissions"
                component={SubmissionsScreen}
              />
              <RootStack.Screen name="Profile" component={ProfileScreen} />
              <RootStack.Screen
                name="EditProfile"
                component={EditProfileScreen}
              />
              <RootStack.Screen
                name="CMVRReport"
                component={CMVRReportScreen}
              />
              <RootStack.Screen name="CMVRPage2" component={CMVRPage2Screen} />
              <RootStack.Screen
                name="ECCMonitoring"
                component={ECCMonitoringScreen}
              />
              <RootStack.Screen name="EPEP" component={EPEPScreen} />
              <RootStack.Screen
                name="EnvironmentalCompliance"
                component={EnvironmentalComplianceScreen}
                options={{ headerShown: false }}
              />
              <RootStack.Screen
                name="WaterQuality"
                component={WaterQualityScreen}
                options={{ headerShown: false }}
              />
              <RootStack.Screen
                name="NoiseQuality"
                component={NoiseQualityScreen}
                options={{ headerShown: false }}
              />
              <RootStack.Screen
                name="WasteManagement"
                component={WasteManagementScreen}
                options={{ headerShown: false }}
              />
              <RootStack.Screen
                name="ChemicalSafety"
                component={ChemicalSafetyScreen}
                options={{ headerShown: false }}
              />
              <RootStack.Screen
                name="ComplianceMonitoring"
                component={ComplianceMonitoringScreen}
                options={{ headerShown: false }}
              />
              <RootStack.Screen
                name="EIACompliance"
                component={EIAComplianceScreen}
                options={{ headerShown: false }}
              />
              <RootStack.Screen
                name="Recommendations"
                component={RecommendationsScreen}
                options={{ headerShown: false }}
              />
              <RootStack.Screen
                name="ComplianceDiscussionScreen"
                component={ComplianceDiscussionScreen}
                options={{ headerShown: false }}
              />
              <RootStack.Screen
                name="GuestRemarksForm"
                component={GuestRemarksForm}
                options={{ headerShown: false }}
              />
              <RootStack.Screen
                name="CMVRAttachments"
                component={CMVRAttachmentsScreen}
                options={{ headerShown: false }}
              />
              <RootStack.Screen
                name="CMVRDocumentExport"
                component={CMVRDocumentExportScreen}
                options={{ headerShown: false }}
              />
              <RootStack.Screen
                name="ExportReport"
                component={ExportReportScreen}
                options={{ headerShown: false }}
              />
            </>
          )}
        </RootStack.Navigator>
      </NavigationContainer>
    </FileNameProvider>
  );
};

export default AppNavigator;
