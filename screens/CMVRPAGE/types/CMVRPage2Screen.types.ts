// CMVRPage2Screen.types.ts
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";

export type RootStackParamList = {
  CMVRReport: {
    submissionId: string;
    projectName: string;
    projectId: string;
    fileName?: string;
  };
  CMVRPage2: {
    submissionId?: string;
    projectName?: string;
    projectId?: string;
    fileName?: string;
  };
  ComplianceMonitoring: {
    submissionId?: string;
    projectName?: string;
    projectId?: string;
    fileName?: string;
  };
};

export type CMVRPage2ScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "CMVRPage2"
>;

export type CMVRPage2ScreenRouteProp = RouteProp<
  RootStackParamList,
  "CMVRPage2"
>;

export type EPEPCompliance = {
  safety: boolean;
  social: boolean;
  rehabilitation: boolean;
};

export type ComplaintsManagement = {
  complaintReceiving: boolean;
  caseInvestigation: boolean;
  implementationControl: boolean;
  communicationComplainant: boolean;
  complaintDocumentation: boolean;
  naForAll: boolean;
};

export type ExecutiveSummary = {
  epepCompliance: EPEPCompliance;
  epepRemarks: string;
  sdmpCompliance: string;
  sdmpRemarks: string;
  complaintsManagement: ComplaintsManagement;
  complaintsRemarks: string;
  accountability: string;
  accountabilityRemarks: string;
  othersSpecify: string;
  othersNA: boolean;
};

export type ProcessDocumentation = {
  dateConducted: string;
  sameDateForAll: boolean;
  eccMmtMembers: string;
  epepMmtMembers: string;
  ocularMmtMembers: string;
  ocularNA: boolean;
  methodologyRemarks: string;
  siteValidationApplicable: string;
  samplingDateConducted: string;
  samplingMmtMembers: string;
  samplingMethodologyRemarks: string;
};
