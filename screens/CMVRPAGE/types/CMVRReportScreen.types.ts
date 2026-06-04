// CMVRReportScreen.types.ts
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";

export type RootStackParamList = {
  CMVRReport: {
    submissionId?: string | null;
    projectName?: string | null;
    projectId?: string | null;
    fileName?: string;
    draftData?: any;
  };
  CMVRPage2: {
    submissionId?: string | null;
    projectName?: string | null;
    projectId?: string | null;
    fileName: string;
    draftData?: any;
  };
};

export type CMVRReportScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "CMVRReport"
>;

export type CMVRReportScreenRouteProp = RouteProp<
  RootStackParamList,
  "CMVRReport"
>;

// Frontend types (UI-friendly field names)
export type GeneralInfo = {
  companyName: string;
  projectName: string;
  location: string;
  region: string;
  province: string;
  municipality: string;
  quarter: string;
  year: string;
  dateOfCompliance: string;
  monitoringPeriod: string;
  dateOfCMRSubmission: string;
};

export type ECCInfo = {
  isNA: boolean;
  permitHolder: string;
  eccNumber: string;
  dateOfIssuance: string;
};

export type ECCAdditionalForm = {
  permitHolder: string;
  eccNumber: string;
  dateOfIssuance: string;
};

export type ISAGInfo = {
  isNA: boolean;
  permitHolder: string;
  isagNumber: string;
  dateOfIssuance: string;
  currentName: string;
  nameInECC: string;
  projectStatus: string;
  gpsX: string;
  gpsY: string;
  proponentName: string;
  proponentContact: string;
  proponentAddress: string;
  proponentPhone: string;
  proponentEmail: string;
};

export type ISAGAdditionalForm = {
  permitHolder: string;
  isagNumber: string;
  dateOfIssuance: string;
};

export type EPEPInfo = {
  isNA: boolean;
  permitHolder: string;
  epepNumber: string;
  dateOfApproval: string;
};

export type RCFInfo = {
  isNA: boolean;
  permitHolder: string;
  savingsAccount: string;
  amountDeposited: string;
  dateUpdated: string;
};

export type MMTInfo = {
  isNA: boolean;
  contactPerson: string;
  mailingAddress: string;
  phoneNumber: string;
  emailAddress: string;
};

// Backend DTO types (matches API structure)
export type ECCDto = {
  permitHolderName: string;
  eccNumber: string;
  dateOfIssuance: string;
};

export type ISAGMPPDto = {
  permitHolderName: string;
  isagPermitNumber: string;
  dateOfIssuance: string;
};

export type ContactInfoDto = {
  contactPersonAndPosition: string;
  mailingAddress: string;
  telephoneFax: string;
  emailAddress: string;
};

export type EPEPDto = {
  permitHolderName: string;
  epepNumber: string;
  dateOfApproval: string;
};

export type FundDto = {
  permitHolderName: string;
  savingsAccountNumber: string;
  amountDeposited: string;
  dateUpdated: string;
};

// Backend request payload type
export type CreateCMVRDto = {
  companyName: string;
  location: string;
  quarter: string;
  year: number;
  dateOfComplianceMonitoringAndValidation: string;
  monitoringPeriodCovered: string;
  dateOfCmrSubmission: string;
  ecc: ECCDto[];
  isagMpp: ISAGMPPDto[];
  projectCurrentName: string;
  projectNameInEcc: string;
  projectStatus: string;
  projectGeographicalCoordinates: string;
  proponent: ContactInfoDto;
  mmt: ContactInfoDto;
  epepFmrdpStatus: string;
  epep: EPEPDto[];
  rehabilitationCashFund: FundDto[];
  monitoringTrustFundUnified: FundDto[];
  finalMineRehabilitationAndDecommissioningFund: FundDto[];
  // These will be added in Page 2
  executiveSummaryOfCompliance?: any;
  complianceMonitoringReportDiscussion?: any;
  processDocumentationOfActivitiesUndertaken?: any;
  complianceMonitoringReport?: any;
  createdById?: string;
  attendanceId?: string;
  eccConditionsAttachment?: {
    fileName: string;
    fileUrl: string | null;
    mimeType: string | null;
    storagePath: string | null;
  };
  attachments?: Array<{
    path: string;
    caption?: string;
  }>;
};
