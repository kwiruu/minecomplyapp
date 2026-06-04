import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
  Dimensions,
  Image,
  TextInput,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons, Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../contexts/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { uploadFileFromUri, deleteFilesFromStorage } from "../../lib/storage";
import { apiGet } from "../../lib/api";

import { useFileName } from "../../contexts/FileNameContext";
import { useCmvrStore } from "../../store/cmvrStore";
import {
  createCMVRReport,
  generateCMVRDocx,
  deleteCMVRReport,
  updateCMVRReport,
} from "../../lib/cmvr";
import type {
  GeneralInfo,
  ECCInfo,
  ECCAdditionalForm,
  ISAGInfo,
  ISAGAdditionalForm,
  EPEPInfo,
  RCFInfo,
  MMTInfo,
  CreateCMVRDto,
} from "./types/CMVRReportScreen.types";
import type {
  ExecutiveSummary,
  ProcessDocumentation,
} from "./types/CMVRPage2Screen.types";
import type {
  FormData,
  OtherComponent,
} from "./types/ComplianceMonitoringScreen.types";
import type {
  YesNoNull as EiaYesNoNull,
  OperationSection,
  MitigatingMeasure,
} from "./types/EIAComplianceScreen.types";
import type {
  ComplianceData as AirComplianceData,
  ParameterData as AirParameterData,
} from "./types/EnvironmentalComplianceScreen.types";
import {
  createEmptyLocationData,
  type WaterQualityData,
  type Parameter as WaterParameter,
  type PortData as WaterPortData,
  type LocationData,
} from "./types/WaterQualityScreen.types";
import type {
  NoiseParameter,
  QuarterData,
} from "./types/NoiseQualityScreen.types";
import type {
  WasteEntry,
  PlantPortSectionData,
  QuarrySectionData,
  PlantSectionData,
  PortSectionData,
} from "./types/WasteManagementScreen.types";
import type {
  ChemicalSafetyData,
  Complaint,
  YesNoNull as ChemicalYesNoNull,
  ChemicalCategory,
} from "./types/ChemicalSafetyScreen.types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const isTablet = SCREEN_WIDTH >= 768;
const isSmallPhone = SCREEN_WIDTH < 375;
const DRAFT_KEY = "@cmvr_document_export_draft";

type RecommendationItemShape = {
  recommendation?: string;
  commitment?: string;
  status?: string;
};

type RecommendationSectionShape = {
  isNA?: boolean;
  items?: RecommendationItemShape[];
};

type RecommendationsData = {
  currentRecommendations?: Record<string, RecommendationSectionShape>;
  previousRecommendations?: Record<string, RecommendationSectionShape>;
  prevQuarter?: string;
  prevYear?: string;
};

type EpepAdditionalForm = Omit<EPEPInfo, "isNA">;
type FundAdditionalForm = Omit<RCFInfo, "isNA">;

type CMVRDocumentExportParams = {
  cmvrReportId?: string;
  projectId?: string | null;
  projectName?: string;
  loadDraft?: boolean;
  generalInfo?: GeneralInfo;
  eccInfo?: ECCInfo;
  eccAdditionalForms?: ECCAdditionalForm[];
  isagInfo?: ISAGInfo;
  isagAdditionalForms?: ISAGAdditionalForm[];
  epepInfo?: EPEPInfo;
  epepAdditionalForms?: EpepAdditionalForm[];
  rcfInfo?: RCFInfo;
  rcfAdditionalForms?: FundAdditionalForm[];
  mtfInfo?: RCFInfo;
  mtfAdditionalForms?: FundAdditionalForm[];
  fmrdfInfo?: RCFInfo;
  fmrdfAdditionalForms?: FundAdditionalForm[];
  mmtInfo?: MMTInfo;
  fileName?: string;
  recommendationsData?: RecommendationsData;
  selectedAttendanceId?: string;
  selectedAttendanceTitle?: string;
  executiveSummaryOfCompliance?: any;
  processDocumentationOfActivitiesUndertaken?: any;
  complianceToProjectLocationAndCoverageLimits?: any;
  complianceToImpactManagementCommitments?: any;
  airQualityImpactAssessment?: any;
  waterQualityImpactAssessment?: any;
  noiseQualityImpactAssessment?: any;
  complianceWithGoodPracticeInSolidAndHazardousWasteManagement?: any;
  complianceWithGoodPracticeInChemicalSafetyManagement?: any;
  complaintsVerificationAndManagement?: any;
  recommendationFromPrevQuarter?: any;
  recommendationForNextQuarter?: any;
  attendanceId?: string | null;
  attendanceUrl?: string | null;
  documentation?: any;
  complianceMonitoringReport?: Partial<DraftSnapshot>;
};

type RootStackParamList = {
  CMVRDocumentExport: CMVRDocumentExportParams;
};

type DraftSnapshot = {
  generalInfo: GeneralInfo;
  eccInfo: ECCInfo;
  eccAdditionalForms: ECCAdditionalForm[];
  isagInfo: ISAGInfo;
  isagAdditionalForms: ISAGAdditionalForm[];
  epepInfo: EPEPInfo;
  epepAdditionalForms: EpepAdditionalForm[];
  rcfInfo: RCFInfo;
  rcfAdditionalForms: FundAdditionalForm[];
  mtfInfo: RCFInfo;
  mtfAdditionalForms: FundAdditionalForm[];
  fmrdfInfo: RCFInfo;
  fmrdfAdditionalForms: FundAdditionalForm[];
  mmtInfo: MMTInfo;
  permitHolderList: string[];
  fileName: string;
  savedAt?: string;
  recommendationsData?: RecommendationsData;
  executiveSummaryOfCompliance?: any;
  processDocumentationOfActivitiesUndertaken?: any;
  complianceToProjectLocationAndCoverageLimits?: any;
  complianceToImpactManagementCommitments?: any;
  airQualityImpactAssessment?: any;
  waterQualityImpactAssessment?: any;
  noiseQualityImpactAssessment?: any;
  complianceWithGoodPracticeInSolidAndHazardousWasteManagement?: any;
  complianceWithGoodPracticeInChemicalSafetyManagement?: any;
  complaintsVerificationAndManagement?: any;
  recommendationFromPrevQuarter?: any;
  recommendationForNextQuarter?: any;
  attendanceId?: string | null;
  attendanceUrl?: string | null;
  documentation?: any;
  complianceMonitoringReport?: Partial<DraftSnapshot>;
};

type AttendanceRecordSummary = {
  id: string;
  title?: string | null;
  fileName?: string | null;
  meetingDate?: string | null;
};

type StoreHydrationPayload = DraftSnapshot & {
  id?: string | null;
  submissionId?: string | null;
  projectId?: string | null;
  projectName?: string;
};

const defaultGeneralInfo: GeneralInfo = {
  companyName: "",
  projectName: "",
  location: "",
  region: "",
  province: "",
  municipality: "",
  quarter: "",
  year: "",
  dateOfCompliance: "",
  monitoringPeriod: "",
  dateOfCMRSubmission: "",
};

const defaultEccInfo: ECCInfo = {
  isNA: false,
  permitHolder: "",
  eccNumber: "",
  dateOfIssuance: "",
};

const defaultIsagInfo: ISAGInfo = {
  isNA: false,
  permitHolder: "",
  isagNumber: "",
  dateOfIssuance: "",
  currentName: "",
  nameInECC: "",
  projectStatus: "",
  gpsX: "",
  gpsY: "",
  proponentName: "",
  proponentContact: "",
  proponentAddress: "",
  proponentPhone: "",
  proponentEmail: "",
};

const defaultEpepInfo: EPEPInfo = {
  isNA: false,
  permitHolder: "",
  epepNumber: "",
  dateOfApproval: "",
};

const defaultFundInfo: RCFInfo = {
  isNA: false,
  permitHolder: "",
  savingsAccount: "",
  amountDeposited: "",
  dateUpdated: "",
};

const defaultMmtInfo: MMTInfo = {
  isNA: false,
  contactPerson: "",
  mailingAddress: "",
  phoneNumber: "",
  emailAddress: "",
};

const sanitizeString = (value?: string | null) => (value ?? "").toString();

const parseCoordinateFields = (raw?: string) => {
  if (!raw) {
    return { gpsX: "", gpsY: "" };
  }
  const xMatch = raw.match(/X\s*:\s*([^,]+)/i);
  const yMatch = raw.match(/Y\s*:\s*([^,]+)/i);
  return {
    gpsX: xMatch ? xMatch[1].trim() : "",
    gpsY: yMatch ? yMatch[1].trim() : "",
  };
};

const parseLocationComponents = (raw?: string) => {
  const parts = (raw || "")
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  if (parts.length === 0) {
    return {
      location: "",
      municipality: "",
      province: "",
      region: "",
    };
  }
  if (parts.length >= 4) {
    return {
      location: parts.slice(0, parts.length - 3).join(", ") || parts[0],
      municipality: parts[parts.length - 3] || "",
      province: parts[parts.length - 2] || "",
      region: parts[parts.length - 1] || "",
    };
  }
  if (parts.length === 3) {
    return {
      location: parts[0] || "",
      municipality: parts[0] || "",
      province: parts[1] || "",
      region: parts[2] || "",
    };
  }
  if (parts.length === 2) {
    return {
      location: parts[0] || "",
      municipality: parts[0] || "",
      province: parts[1] || "",
      region: "",
    };
  }
  return {
    location: parts[0] || "",
    municipality: "",
    province: "",
    region: "",
  };
};

const mapEccEntriesToForm = (entries?: any[]) => {
  if (!Array.isArray(entries) || entries.length === 0) {
    return {
      primary: { ...defaultEccInfo, isNA: true },
      additional: [] as ECCAdditionalForm[],
    };
  }
  const [first, ...rest] = entries;
  const convert = (item: any): ECCAdditionalForm => ({
    permitHolder: sanitizeString(item?.permitHolderName),
    eccNumber: sanitizeString(item?.eccNumber),
    dateOfIssuance: sanitizeString(item?.dateOfIssuance),
  });
  return {
    primary: {
      ...defaultEccInfo,
      isNA: false,
      permitHolder: sanitizeString(first?.permitHolderName),
      eccNumber: sanitizeString(first?.eccNumber),
      dateOfIssuance: sanitizeString(first?.dateOfIssuance),
    },
    additional: rest.map(convert),
  };
};

const mapIsagEntriesToForm = (entries?: any[], projectName?: string) => {
  if (!Array.isArray(entries) || entries.length === 0) {
    return {
      primary: { ...defaultIsagInfo, isNA: true },
      additional: [] as ISAGAdditionalForm[],
    };
  }
  const [first, ...rest] = entries;
  const convert = (item: any): ISAGAdditionalForm => ({
    permitHolder: sanitizeString(item?.permitHolderName),
    isagNumber: sanitizeString(item?.isagPermitNumber),
    dateOfIssuance: sanitizeString(item?.dateOfIssuance),
  });
  return {
    primary: {
      ...defaultIsagInfo,
      isNA: false,
      permitHolder: sanitizeString(first?.permitHolderName),
      isagNumber: sanitizeString(first?.isagPermitNumber),
      dateOfIssuance: sanitizeString(first?.dateOfIssuance),
      currentName: sanitizeString(projectName),
    },
    additional: rest.map(convert),
  };
};

const mapEpepEntriesToForm = (entries?: any[]) => {
  if (!Array.isArray(entries) || entries.length === 0) {
    return {
      primary: { ...defaultEpepInfo, isNA: true },
      additional: [] as EpepAdditionalForm[],
    };
  }
  const [first, ...rest] = entries;
  const convert = (item: any): EpepAdditionalForm => ({
    permitHolder: sanitizeString(item?.permitHolderName),
    epepNumber: sanitizeString(item?.epepNumber),
    dateOfApproval: sanitizeString(item?.dateOfApproval),
  });
  return {
    primary: {
      ...defaultEpepInfo,
      isNA: false,
      permitHolder: sanitizeString(first?.permitHolderName),
      epepNumber: sanitizeString(first?.epepNumber),
      dateOfApproval: sanitizeString(first?.dateOfApproval),
    },
    additional: rest.map(convert),
  };
};

const mapFundEntriesToForm = (entries?: any[]) => {
  if (!Array.isArray(entries) || entries.length === 0) {
    return {
      primary: { ...defaultFundInfo, isNA: true },
      additional: [] as FundAdditionalForm[],
    };
  }
  const [first, ...rest] = entries;
  const convert = (item: any): FundAdditionalForm => ({
    permitHolder: sanitizeString(item?.permitHolderName),
    savingsAccount: sanitizeString(item?.savingsAccountNumber),
    amountDeposited: sanitizeString(item?.amountDeposited),
    dateUpdated: sanitizeString(item?.dateUpdated),
  });
  return {
    primary: {
      ...defaultFundInfo,
      isNA: false,
      permitHolder: sanitizeString(first?.permitHolderName),
      savingsAccount: sanitizeString(first?.savingsAccountNumber),
      amountDeposited: sanitizeString(first?.amountDeposited),
      dateUpdated: sanitizeString(first?.dateUpdated),
    },
    additional: rest.map(convert),
  };
};

const buildLocationString = (info: GeneralInfo) =>
  [info.location, info.municipality, info.province, info.region]
    .map(sanitizeString)
    .filter((part) => part.length > 0)
    .join(", ");

const buildCoordinatesString = (info: ISAGInfo) => {
  const x = sanitizeString(info.gpsX);
  const y = sanitizeString(info.gpsY);
  if (!x && !y) return "";
  if (x && y) return `X: ${x}, Y: ${y}`;
  if (x) return `X: ${x}`;
  return `Y: ${y}`;
};

const buildEccEntries = (info: ECCInfo, additional: ECCAdditionalForm[]) => {
  const entries: Array<{
    permitHolderName: string;
    eccNumber: string;
    dateOfIssuance: string;
  }> = [];
  if (!info.isNA) {
    const hasMainData = [info.permitHolder, info.eccNumber, info.dateOfIssuance]
      .map(sanitizeString)
      .some((value) => value.length > 0);
    if (hasMainData) {
      entries.push({
        permitHolderName: sanitizeString(info.permitHolder),
        eccNumber: sanitizeString(info.eccNumber),
        dateOfIssuance: sanitizeString(info.dateOfIssuance),
      });
    }
  }
  additional.forEach((form) => {
    entries.push({
      permitHolderName: sanitizeString(form.permitHolder),
      eccNumber: sanitizeString(form.eccNumber),
      dateOfIssuance: sanitizeString(form.dateOfIssuance),
    });
  });
  return entries;
};

const buildIsagEntries = (info: ISAGInfo, additional: ISAGAdditionalForm[]) => {
  const entries: Array<{
    permitHolderName: string;
    isagPermitNumber: string;
    dateOfIssuance: string;
  }> = [];
  if (!info.isNA) {
    const hasMainData = [
      info.permitHolder,
      info.isagNumber,
      info.dateOfIssuance,
    ]
      .map(sanitizeString)
      .some((value) => value.length > 0);
    if (hasMainData) {
      entries.push({
        permitHolderName: sanitizeString(info.permitHolder),
        isagPermitNumber: sanitizeString(info.isagNumber),
        dateOfIssuance: sanitizeString(info.dateOfIssuance),
      });
    }
  }
  additional.forEach((form) => {
    entries.push({
      permitHolderName: sanitizeString(form.permitHolder),
      isagPermitNumber: sanitizeString(form.isagNumber),
      dateOfIssuance: sanitizeString(form.dateOfIssuance),
    });
  });
  return entries;
};

const buildEpepEntries = (info: EPEPInfo, additional: EpepAdditionalForm[]) => {
  const entries: Array<{
    permitHolderName: string;
    epepNumber: string;
    dateOfApproval: string;
  }> = [];
  if (!info.isNA) {
    const hasMainData = [
      info.permitHolder,
      info.epepNumber,
      info.dateOfApproval,
    ]
      .map(sanitizeString)
      .some((value) => value.length > 0);
    if (hasMainData) {
      entries.push({
        permitHolderName: sanitizeString(info.permitHolder),
        epepNumber: sanitizeString(info.epepNumber),
        dateOfApproval: sanitizeString(info.dateOfApproval),
      });
    }
  }
  additional.forEach((form) => {
    entries.push({
      permitHolderName: sanitizeString(form.permitHolder),
      epepNumber: sanitizeString(form.epepNumber),
      dateOfApproval: sanitizeString(form.dateOfApproval),
    });
  });
  return entries;
};

const buildFundEntries = (info: RCFInfo, additional: FundAdditionalForm[]) => {
  const entries: Array<{
    permitHolderName: string;
    savingsAccountNumber: string;
    amountDeposited: string;
    dateUpdated: string;
  }> = [];
  if (!info.isNA) {
    const hasMainData = [
      info.permitHolder,
      info.savingsAccount,
      info.amountDeposited,
      info.dateUpdated,
    ]
      .map(sanitizeString)
      .some((value) => value.length > 0);
    if (hasMainData) {
      entries.push({
        permitHolderName: sanitizeString(info.permitHolder),
        savingsAccountNumber: sanitizeString(info.savingsAccount),
        amountDeposited: sanitizeString(info.amountDeposited),
        dateUpdated: sanitizeString(info.dateUpdated),
      });
    }
  }
  additional.forEach((form) => {
    entries.push({
      permitHolderName: sanitizeString(form.permitHolder),
      savingsAccountNumber: sanitizeString(form.savingsAccount),
      amountDeposited: sanitizeString(form.amountDeposited),
      dateUpdated: sanitizeString(form.dateUpdated),
    });
  });
  return entries;
};

const mergeDraftData = (
  existing: DraftSnapshot | null,
  updates: Partial<DraftSnapshot>,
  fileName: string
): DraftSnapshot => {
  const base: DraftSnapshot = existing
    ? { ...existing }
    : {
        generalInfo: defaultGeneralInfo,
        eccInfo: defaultEccInfo,
        eccAdditionalForms: [],
        isagInfo: defaultIsagInfo,
        isagAdditionalForms: [],
        epepInfo: defaultEpepInfo,
        epepAdditionalForms: [],
        rcfInfo: defaultFundInfo,
        rcfAdditionalForms: [],
        mtfInfo: defaultFundInfo,
        mtfAdditionalForms: [],
        fmrdfInfo: defaultFundInfo,
        fmrdfAdditionalForms: [],
        mmtInfo: defaultMmtInfo,
        permitHolderList: [],
        attendanceId: null,
        attendanceUrl: null,
        fileName,
        savedAt: new Date().toISOString(),
      };
  const assign = <K extends keyof DraftSnapshot>(key: K) => {
    if (Object.prototype.hasOwnProperty.call(updates, key)) {
      const value = updates[key];
      if (value !== undefined) {
        base[key] = value as DraftSnapshot[K];
      }
    }
  };
  assign("generalInfo");
  assign("eccInfo");
  assign("eccAdditionalForms");
  assign("isagInfo");
  assign("isagAdditionalForms");
  assign("epepInfo");
  assign("epepAdditionalForms");
  assign("rcfInfo");
  assign("rcfAdditionalForms");
  assign("mtfInfo");
  assign("mtfAdditionalForms");
  assign("fmrdfInfo");
  assign("fmrdfAdditionalForms");
  assign("mmtInfo");
  assign("permitHolderList");
  assign("recommendationsData");
  assign("executiveSummaryOfCompliance");
  assign("processDocumentationOfActivitiesUndertaken");
  assign("complianceToProjectLocationAndCoverageLimits");
  assign("complianceToImpactManagementCommitments");
  assign("airQualityImpactAssessment");
  assign("waterQualityImpactAssessment");
  assign("noiseQualityImpactAssessment");
  assign("complianceWithGoodPracticeInSolidAndHazardousWasteManagement");
  assign("complianceWithGoodPracticeInChemicalSafetyManagement");
  assign("complaintsVerificationAndManagement");
  assign("recommendationFromPrevQuarter");
  assign("recommendationForNextQuarter");
  assign("attendanceId");
  assign("attendanceUrl");
  assign("documentation");
  base.fileName = fileName;
  base.savedAt = new Date().toISOString();
  return base;
};

const toNumberOrYear = (value?: string) => {
  const parsed = value ? parseInt(value, 10) : NaN;
  return Number.isFinite(parsed) ? parsed : new Date().getFullYear();
};

const transformRecommendationsForPayload = (
  currentRecommendations?: Record<string, RecommendationSectionShape>,
  quarter?: string,
  year?: string
) => {
  if (!currentRecommendations) return undefined;
  const transformed: any = {};
  if (quarter) {
    const quarterMatch = quarter.match(/(\d+)/);
    if (quarterMatch) {
      transformed.quarter = parseInt(quarterMatch[1], 10);
    }
  }
  if (year) {
    const yearNum = parseInt(year, 10);
    if (!isNaN(yearNum)) {
      transformed.year = yearNum;
    }
  }
  Object.keys(currentRecommendations).forEach((key) => {
    const section = currentRecommendations[key];
    if (section && !section.isNA && section.items && section.items.length > 0) {
      transformed[key] = section.items;
    }
  });
  const hasData = Object.keys(transformed).some(
    (key) => key !== "quarter" && key !== "year"
  );
  return hasData ? transformed : undefined;
};

const transformExecutiveSummaryForPayload = (raw: any) => {
  if (!raw) return undefined;
  const sdmp = (raw.sdmpCompliance || "").toString().trim().toLowerCase();
  const sdmpComplied =
    sdmp === "complied" ||
    sdmp === "yes" ||
    sdmp === "y" ||
    raw.sdmpCompliance === true;
  const sdmpNotComplied =
    sdmp === "not complied" || sdmp === "no" || sdmp === "n";
  const accountability = (raw.accountability || "")
    .toString()
    .trim()
    .toLowerCase();
  const accComplied =
    accountability === "complied" ||
    accountability === "yes" ||
    raw.accountability === true;
  const accNotComplied =
    accountability === "not complied" || accountability === "no";
  const cm = raw.complaintsManagement || {};
  return {
    complianceWithEpepCommitments: {
      safety: !!raw?.epepCompliance?.safety,
      social: !!raw?.epepCompliance?.social,
      rehabilitation: !!raw?.epepCompliance?.rehabilitation,
      remarks: raw?.epepRemarks ?? "",
    },
    complianceWithSdmpCommitments: {
      complied: !!sdmpComplied,
      notComplied: !!sdmpNotComplied,
      remarks: raw?.sdmpRemarks ?? "",
    },
    complaintsManagement: {
      naForAll: !!cm?.naForAll,
      complaintReceivingSetup: !!cm?.complaintReceiving,
      caseInvestigation: !!cm?.caseInvestigation,
      implementationOfControl: !!cm?.implementationControl,
      communicationWithComplainantOrPublic: !!cm?.communicationComplainant,
      complaintDocumentation: !!cm?.complaintDocumentation,
      remarks: raw?.complaintsRemarks ?? "",
    },
    accountability: {
      complied: !!accComplied,
      notComplied: !!accNotComplied,
      remarks: raw?.accountabilityRemarks ?? "",
    },
    others: {
      specify: raw?.othersSpecify ?? "",
      na: !!raw?.othersNA,
    },
  };
};

const transformProcessDocumentationForPayload = (raw: any) => {
  if (!raw) return undefined;
  const parseMembers = (text?: string, extras?: string[]) => {
    // ✅ FIX: Only split by newline, not comma, to preserve "Name, Position" as single entry
    const base = (text || "")
      .split(/\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    const extra = (extras || []).map((s) => (s || "").trim()).filter(Boolean);
    return [...base, ...extra];
  };
  const sva = (raw.siteValidationApplicable || "")
    .toString()
    .trim()
    .toLowerCase();
  const applicable =
    sva === "yes" || sva === "y" || raw.siteValidationApplicable === true;
  const none =
    sva === "no" || sva === "none" || raw.siteValidationApplicable === false;
  return {
    dateConducted: raw?.dateConducted ?? "",
    mergedMethodologyOrOtherRemarks: raw?.methodologyRemarks ?? "",
    sameDateForAllActivities: !!raw?.sameDateForAll,
    activities: {
      complianceWithEccConditionsCommitments: {
        mmtMembersInvolved: parseMembers(
          raw?.eccMmtMembers,
          raw?.eccMmtAdditional
        ),
      },
      complianceWithEpepAepepConditions: {
        mmtMembersInvolved: parseMembers(
          raw?.epepMmtMembers,
          raw?.epepMmtAdditional
        ),
      },
      siteOcularValidation: {
        mmtMembersInvolved: parseMembers(
          raw?.ocularMmtMembers,
          raw?.ocularMmtAdditional
        ),
      },
      siteValidationConfirmatorySampling: {
        mmtMembersInvolved: parseMembers(raw?.samplingMmtMembers),
        dateConducted: raw?.samplingDateConducted ?? "",
        applicable,
        none,
        remarks: raw?.samplingMethodologyRemarks ?? "",
      },
    },
  };
};

const parseFirstNumber = (val?: string): number => {
  if (!val) return 0;
  const matches = String(val).match(/-?\d*\.?\d+/g);
  if (!matches || matches.length === 0) return 0;
  const hasRange = String(val).includes("-") && matches.length > 1;
  const target = hasRange ? matches[matches.length - 1] : matches[0];
  const parsed = parseFloat(target);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const transformProjectLocationCoverageForPayload = (raw: any) => {
  if (!raw) return undefined;
  const formData = raw.formData || {};
  const other = raw.otherComponents || [];
  const parameters = Object.values(formData).map((f: any) => {
    const specObj: any = {};
    if (f?.specification) specObj.main = String(f.specification);
    if (Array.isArray(f?.subFields)) {
      f.subFields.forEach((sf: any) => {
        if (sf?.label)
          specObj[sf.label.replace(/:$/, "")] = sf?.specification ?? "";
      });
    }
    return {
      name: String(f?.label ?? ""),
      specification: specObj,
      remarks: String(f?.remarks ?? ""),
      withinSpecs: Boolean(f?.withinSpecs),
    };
  });
  const otherComponents = other.map((item: any, idx: number) => ({
    name: String(
      item?.name ?? item?.specification ?? `Other Component ${idx + 1}`
    ),
    specification: String(item?.specification ?? ""),
    remarks: String(item?.remarks ?? ""),
    withinSpecs: Boolean(item?.withinSpecs),
  }));

  // Preserve uploaded images metadata
  const uploadedImages =
    raw && typeof raw.uploadedImages === "object"
      ? Object.entries(raw.uploadedImages as Record<string, unknown>).reduce(
          (acc: Record<string, string>, [key, value]) => {
            const cleanKey = String(key).trim();
            if (!cleanKey || typeof value !== "string") return acc;
            const cleanValue = value.trim();
            if (cleanValue) {
              acc[cleanKey] = cleanValue;
            }
            return acc;
          },
          {}
        )
      : {};

  return {
    parameters,
    otherComponents,
    uploadedImages: Object.keys(uploadedImages).length
      ? uploadedImages
      : undefined,
  };
};

const transformImpactCommitmentsForPayload = (raw: any) => {
  if (!raw) return undefined;
  const toBool = (v: any) =>
    String(v).toLowerCase() === "yes"
      ? true
      : String(v).toLowerCase() === "no"
        ? false
        : !!v;
  const mapMeasures = (section: any) => {
    const measures = Array.isArray(section?.measures) ? section.measures : [];
    return {
      areaName: String(section?.title ?? ""),
      commitments: measures.map((m: any) => ({
        plannedMeasure: String(m?.planned ?? ""),
        actualObservation: String(m?.actualObservation ?? ""),
        isEffective: toBool(m?.isEffective),
        recommendations: String(m?.recommendations ?? ""),
      })),
    };
  };
  const constructionInfo = [
    {
      areaName: "Pre-Construction",
      commitments: [
        {
          plannedMeasure: "Pre-construction compliance",
          actualObservation: String(raw?.preConstruction ?? ""),
          isEffective: toBool(raw?.preConstruction),
          recommendations: "",
        },
      ],
    },
    {
      areaName: "Construction",
      commitments: [
        {
          plannedMeasure: "Construction compliance",
          actualObservation: String(raw?.construction ?? ""),
          isEffective: toBool(raw?.construction),
          recommendations: "",
        },
      ],
    },
  ];
  const implementationOfEnvironmentalImpactControlStrategies = [
    mapMeasures(raw?.quarryOperation),
    mapMeasures(raw?.plantOperation),
    mapMeasures(raw?.portOperation),
  ];
  return {
    constructionInfo,
    implementationOfEnvironmentalImpactControlStrategies,
    overallComplianceAssessment: String(raw?.overallCompliance ?? ""),
  };
};

const hasAirParameterValues = (param: AirParameterData) => {
  const fields: Array<keyof AirParameterData> = [
    "parameter",
    "currentSMR",
    "previousSMR",
    "currentMMT",
    "previousMMT",
    "thirdPartyTesting",
    "eqplRedFlag",
    "action",
    "limitPM25",
    "remarks",
  ];
  return fields.some((key) =>
    sanitizeString((param as Record<string, string | undefined>)[key]).trim()
  );
};

const transformAirQualityForPayload = (raw: any) => {
  if (!raw) return undefined;

  console.log("=== transformAirQualityForPayload DEBUG ===");
  console.log("Raw airQuality data keys:", Object.keys(raw));
  console.log("Raw airQuality data:", JSON.stringify(raw, null, 2));

  // NEW STRUCTURE: Handle unified airQuality object with checkbox states
  if (raw.airQuality) {
    const result: any = {};

    // Handle location descriptions (strings) with checkbox states
    if (raw.quarryEnabled && raw.quarry) {
      result.quarry = raw.quarry; // String description
      result.quarryEnabled = true;
    }
    if (raw.plantEnabled && raw.plant) {
      result.plant = raw.plant; // String description
      result.plantEnabled = true;
    }
    if (raw.quarryPlantEnabled && raw.quarryPlant) {
      result.quarryPlant = raw.quarryPlant; // String description
      result.quarryPlantEnabled = true;
    }
    if (raw.portEnabled && raw.port) {
      result.port = raw.port; // String description
      result.portEnabled = true;
    }

    // Transform unified airQuality data
    const airQualityParams = [];

    // Add main parameter if exists
    if (raw.airQuality.parameter?.trim()) {
      airQualityParams.push({
        name: sanitizeString(raw.airQuality.parameter),
        results: {
          inSMR: {
            current: sanitizeString(raw.airQuality.currentSMR),
            previous: sanitizeString(raw.airQuality.previousSMR),
          },
          mmtConfirmatorySampling: {
            current: sanitizeString(raw.airQuality.currentMMT),
            previous: sanitizeString(raw.airQuality.previousMMT),
          },
        },
        eqpl: {
          redFlag: sanitizeString(raw.airQuality.eqplRedFlag),
          action: sanitizeString(raw.airQuality.action),
          limit: sanitizeString(raw.airQuality.limitPM25),
        },
        remarks: sanitizeString(raw.airQuality.remarks),
      });
    }

    // Add additional parameters
    if (Array.isArray(raw.airQuality.parameters)) {
      raw.airQuality.parameters.forEach((param: any) => {
        if (param.parameter?.trim()) {
          airQualityParams.push({
            name: sanitizeString(param.parameter),
            results: {
              inSMR: {
                current: sanitizeString(param.currentSMR),
                previous: sanitizeString(param.previousSMR),
              },
              mmtConfirmatorySampling: {
                current: sanitizeString(param.currentMMT),
                previous: sanitizeString(param.previousMMT),
              },
            },
            eqpl: {
              redFlag: sanitizeString(param.eqplRedFlag),
              action: sanitizeString(param.action),
              limit: sanitizeString(param.limitPM25),
            },
            remarks: sanitizeString(param.remarks),
          });
        }
      });
    }

    result.airQuality = {
      parameters: airQualityParams,
      samplingDate: sanitizeString(raw.airQuality.dateTime),
      weatherAndWind: sanitizeString(raw.airQuality.weatherWind),
      explanationForConfirmatorySampling: sanitizeString(
        raw.airQuality.explanation
      ),
      overallAssessment: sanitizeString(raw.airQuality.overallCompliance),
    };

    return result;
  }

  // OLD STRUCTURE: Check if we have location-based data (quarryData, plantData, etc.)
  const hasOldLocationStructure =
    raw.quarryData ||
    raw.plantData ||
    raw.portData ||
    raw.quarryPlantData ||
    raw.quarryAndPlantData;

  if (hasOldLocationStructure) {
    // Transform old location-based structure
    const result: any = {};

    const transformLocationData = (locationData: any) => {
      if (!locationData) return null;

      const mergeRemarks = (param: any) => {
        const remarks = sanitizeString(param?.remarks);
        const thirdParty = sanitizeString(param?.thirdPartyTesting);
        if (!thirdParty) {
          return remarks;
        }
        const thirdPartyNote = `Third Party Testing: ${thirdParty}`;
        return remarks ? `${remarks} | ${thirdPartyNote}` : thirdPartyNote;
      };

      // Helper to map a single parameter
      const mapParameter = (param: any) => ({
        name: sanitizeString(param?.parameter),
        results: {
          inSMR: {
            current: sanitizeString(param?.currentSMR),
            previous: sanitizeString(param?.previousSMR),
          },
          mmtConfirmatorySampling: {
            current: sanitizeString(param?.currentMMT),
            previous: sanitizeString(param?.previousMMT),
          },
        },
        eqpl: {
          redFlag: sanitizeString(param?.eqplRedFlag),
          action: sanitizeString(param?.action),
          limit: sanitizeString(param?.limitPM25),
        },
        remarks: mergeRemarks(param),
      });

      // Gather all parameters from the parameters array
      const allParameters: ReturnType<typeof mapParameter>[] = [];
      if (Array.isArray(locationData.parameters)) {
        locationData.parameters.forEach((param: any) => {
          if (param.parameter) {
            allParameters.push(mapParameter(param));
          }
        });
      }

      return {
        locationInput: sanitizeString(locationData.locationInput),
        parameters: allParameters,
        samplingDate: sanitizeString(locationData?.samplingDate),
        weatherAndWind: sanitizeString(locationData?.weatherAndWind),
        explanationForConfirmatorySampling: sanitizeString(
          locationData?.explanationForConfirmatorySampling
        ),
        overallAssessment: sanitizeString(locationData?.overallAssessment),
      };
    };

    // Transform each location
    if (raw.quarryData) {
      const transformed = transformLocationData(raw.quarryData);
      if (transformed) result.quarry = transformed;
    }
    if (raw.plantData) {
      const transformed = transformLocationData(raw.plantData);
      if (transformed) result.plant = transformed;
    }
    if (raw.portData) {
      const transformed = transformLocationData(raw.portData);
      if (transformed) result.port = transformed;
    }
    // Handle both quarryPlantData and quarryAndPlantData naming variations
    if (raw.quarryPlantData || raw.quarryAndPlantData) {
      const transformed = transformLocationData(
        raw.quarryPlantData || raw.quarryAndPlantData
      );
      if (transformed) result.quarryAndPlant = transformed;
    }

    console.log("=== Transformed airQuality result (OLD structure) ===");
    console.log(JSON.stringify(result, null, 2));

    return Object.keys(result).length > 0 ? result : undefined;
  }

  // OLDEST LEGACY STRUCTURE: Old format with data object - NO LONGER SUPPORTED
  // Return undefined to prevent invalid data structure from being sent
  console.warn(
    "Oldest legacy air quality format detected but not supported. Please use unified or location-based structure."
  );
  return undefined;
};

const transformWaterQualityForPayload = (raw: any) => {
  if (!raw) return undefined;

  const sanitizeText = (value: any) => sanitizeString(value);
  const hasContent = (value: any) =>
    value !== undefined && value !== null && String(value).trim().length > 0;

  const shouldIncludeParameter = (param: any) => {
    if (!param || typeof param !== "object") return false;
    return [
      param.parameter,
      param.resultType,
      param.tssCurrent,
      param.tssPrevious,
      param.mmtCurrent,
      param.mmtPrevious,
      param.eqplRedFlag,
      param.action,
      param.limit,
      param.remarks,
    ].some((field) => hasContent(field));
  };

  const buildParameterPayload = (param: any, fallbackLabel = "Parameter") => {
    const label = sanitizeText(param?.parameter) || fallbackLabel;
    return {
      name: label,
      result: {
        internalMonitoring: {
          month: sanitizeText(param?.resultType),
          readings: [
            {
              label,
              current_mgL: parseFirstNumber(param?.tssCurrent),
              previous_mgL: parseFirstNumber(param?.tssPrevious),
            },
          ],
        },
        mmtConfirmatorySampling: {
          current: sanitizeText(param?.mmtCurrent),
          previous: sanitizeText(param?.mmtPrevious),
        },
      },
      denrStandard: {
        redFlag: sanitizeText(param?.eqplRedFlag),
        action: sanitizeText(param?.action),
        limit_mgL: parseFirstNumber(param?.limit),
      },
      remark: sanitizeText(param?.remarks),
    };
  };

  const buildLocationDescriptions = () => {
    const pickDescription = (...values: any[]) => {
      for (const value of values) {
        const cleaned = sanitizeText(value);
        if (cleaned) {
          return cleaned;
        }
      }
      return "";
    };

    const entries: Array<[string, string]> = [
      ["quarry", pickDescription(raw.quarry, raw?.data?.quarryInput)],
      ["plant", pickDescription(raw.plant, raw?.data?.plantInput)],
      [
        "quarryPlant",
        pickDescription(raw.quarryPlant, raw?.data?.quarryPlantInput),
      ],
      ["port", pickDescription(raw.portInput, raw.port, raw?.data?.portInput)], // ✅ FIX: Prioritize portInput for port description
    ];

    const labels: Record<string, string> = {
      quarry: "Quarry",
      plant: "Plant",
      quarryPlant: "Quarry / Plant",
      port: "Port", // ✅ FIX: Add port label
    };

    const map: Record<string, string> = {};
    const summaryParts: string[] = [];

    entries.forEach(([key, value]) => {
      if (value) {
        map[key] = value;
        summaryParts.push(`${labels[key] ?? key}: ${value}`);
      }
    });

    return {
      map,
      summary: summaryParts.join("\n\n"),
    };
  };

  // NEW STRUCTURE: Handle waterQuality unified object with checkbox states
  const { map: locationDescriptions, summary: locationSummary } =
    buildLocationDescriptions();
  const hasNewStructurePayload =
    !!raw.waterQuality ||
    !!raw.port ||
    !!raw.portData ||
    Object.values(locationDescriptions).some(Boolean) ||
    !!raw.quarryEnabled ||
    !!raw.plantEnabled ||
    !!raw.quarryPlantEnabled ||
    !!raw.portEnabled;

  if (hasNewStructurePayload) {
    const result: any = {};

    if (locationDescriptions.quarry) {
      result.quarry = locationDescriptions.quarry;
    }
    if (locationDescriptions.plant) {
      result.plant = locationDescriptions.plant;
    }
    if (locationDescriptions.quarryPlant) {
      result.quarryPlant = locationDescriptions.quarryPlant;
    }
    if (locationDescriptions.port) {
      result.port = locationDescriptions.port;
    }

    // Add checkbox states
    if (raw.quarryEnabled != null) {
      result.quarryEnabled = !!raw.quarryEnabled;
    }
    if (raw.plantEnabled != null) {
      result.plantEnabled = !!raw.plantEnabled;
    }
    if (raw.quarryPlantEnabled != null) {
      result.quarryPlantEnabled = !!raw.quarryPlantEnabled;
    }
    if (raw.portEnabled != null) {
      result.portEnabled = !!raw.portEnabled;
    }

    const buildLocationDescription = (source?: any) =>
      sanitizeText(source?.locationInput) || locationSummary;

    const buildExplanation = (source?: any, fallback?: any) => {
      if (source?.isExplanationNA || fallback?.isExplanationNA) {
        return "N/A";
      }
      return (
        sanitizeText(
          source?.explanation ??
            source?.explanationForConfirmatorySampling ??
            fallback?.explanation ??
            fallback?.explanationForConfirmatorySampling
        ) || undefined
      );
    };

    const collectParameters = (
      primary: any,
      extras: any[] = [],
      fallbackLabel = "Parameter"
    ) => {
      const collected: any[] = [];
      if (primary && shouldIncludeParameter(primary)) {
        collected.push(buildParameterPayload(primary, fallbackLabel));
      }
      extras.forEach((param, index) => {
        if (shouldIncludeParameter(param)) {
          collected.push(
            buildParameterPayload(param, `${fallbackLabel} ${index + 1}`)
          );
        }
      });
      return collected;
    };

    // Transform unified waterQuality data
    const waterQualitySource = raw.waterQuality || raw.data;
    if (waterQualitySource) {
      const extraWaterParams = [
        ...(Array.isArray(waterQualitySource.parameters)
          ? waterQualitySource.parameters
          : []),
        ...(Array.isArray(raw.parameters) ? raw.parameters : []),
      ];
      const waterQualityParams = collectParameters(
        waterQualitySource,
        extraWaterParams,
        "Internal Monitoring"
      );

      const samplingDate = sanitizeText(
        waterQualitySource.dateTime ??
          waterQualitySource.samplingDate ??
          raw.data?.dateTime
      );
      const weatherAndWind = sanitizeText(
        waterQualitySource.weatherWind ??
          waterQualitySource.weatherAndWind ??
          raw.data?.weatherWind
      );
      const explanationForConfirmatorySampling = buildExplanation(
        waterQualitySource,
        raw.data
      );
      const overallAssessment = sanitizeText(
        waterQualitySource.overallCompliance ??
          waterQualitySource.overallAssessment ??
          raw.data?.overallCompliance
      );

      const waterMetadataPresent = [
        samplingDate,
        weatherAndWind,
        explanationForConfirmatorySampling,
        overallAssessment,
      ].some((field) => hasContent(field));

      if (waterQualityParams.length > 0 || waterMetadataPresent) {
        const locationDescription =
          buildLocationDescription(waterQualitySource);
        result.waterQuality = {
          parameters: waterQualityParams,
          samplingDate,
          weatherAndWind,
          explanationForConfirmatorySampling,
          overallAssessment,
        };

        if (locationDescription) {
          result.waterQuality.locationDescription = locationDescription;
        }
      }
    }

    const buildPortPayload = (portSource: any) => {
      const extraPortParams = Array.isArray(portSource?.additionalParameters)
        ? portSource.additionalParameters
        : [];
      const params = collectParameters(
        portSource,
        extraPortParams,
        "Port Parameter"
      );
      const samplingDate = sanitizeText(portSource?.dateTime);
      const weatherAndWind = sanitizeText(portSource?.weatherWind);
      const explanationForConfirmatorySampling = buildExplanation(portSource);
      const overallAssessment = sanitizeText(portSource?.overallCompliance);

      const metadataPresent = [
        samplingDate,
        weatherAndWind,
        explanationForConfirmatorySampling,
        overallAssessment,
      ].some((field) => hasContent(field));

      if (!params.length && !metadataPresent) {
        return undefined;
      }

      const locationDescription =
        sanitizeText(portSource?.portName ?? portSource?.locationInput) ||
        "Port";

      return {
        locationDescription,
        parameters: params,
        samplingDate,
        weatherAndWind,
        explanationForConfirmatorySampling,
        overallAssessment,
      };
    };

    // Transform port data (separate from waterQuality)
    // ✅ FIX: Handle port as string description + portData as monitoring object
    if (raw.portEnabled && (typeof raw.port === 'string' || raw.portData)) {
      // Combine port description (string) with portData (monitoring object)
      const portDescription = typeof raw.port === 'string' ? raw.port : "";
      const portMonitoringData = raw.portData || (typeof raw.port === 'object' ? raw.port : {});
      
      // Build combined port source
      const portSource = {
        ...portMonitoringData,
        locationInput: portDescription || portMonitoringData.locationInput || "",
        locationDescription: portDescription || portMonitoringData.locationDescription || "",
      };
      
      const portPayload = buildPortPayload(portSource);
      if (portPayload) {
        // Ensure description is set from port string
        if (portDescription.trim()) {
          portPayload.locationDescription = sanitizeText(portDescription);
        }
        result.port = portPayload;
        result.portEnabled = true;
      }
    }

    return Object.keys(result).length > 0 ? result : undefined;
  }

  // OLD STRUCTURE: Handle quarryData/plantData/quarryPlantData format
  const hasLocationStructure =
    raw.quarryData ||
    raw.plantData ||
    raw.quarryPlantData ||
    (Array.isArray(raw.ports) && raw.ports.some((port: any) => port));

  if (hasLocationStructure) {
    const orFallback = (value: any, fallback: any) => {
      if (value === undefined || value === null || value === "") {
        return fallback;
      }
      return value;
    };

    const mapLocationParam = (param: any, fallback: any) => {
      const resolvedParameter = sanitizeString(
        orFallback(param?.parameter, fallback?.parameter)
      );
      if (!resolvedParameter.trim()) {
        return null;
      }
      const resolvedResultType = sanitizeString(
        orFallback(param?.resultType, fallback?.resultType)
      );
      const currentTss = sanitizeString(
        orFallback(param?.tssCurrent, fallback?.tssCurrent)
      );
      const previousTss = sanitizeString(
        orFallback(param?.tssPrevious, fallback?.tssPrevious)
      );
      return {
        name: resolvedParameter,
        result: {
          internalMonitoring: {
            month: resolvedResultType,
            readings: [
              {
                label: resolvedParameter,
                current_mgL: parseFirstNumber(currentTss),
                previous_mgL: parseFirstNumber(previousTss),
              },
            ],
          },
          mmtConfirmatorySampling: {
            current: sanitizeString(
              orFallback(param?.mmtCurrent, fallback?.mmtCurrent)
            ),
            previous: sanitizeString(
              orFallback(param?.mmtPrevious, fallback?.mmtPrevious)
            ),
          },
        },
        denrStandard: {
          redFlag: sanitizeString(
            orFallback(param?.eqplRedFlag, fallback?.eqplRedFlag)
          ),
          action: sanitizeString(orFallback(param?.action, fallback?.action)),
          limit_mgL: parseFirstNumber(
            sanitizeString(orFallback(param?.limit, fallback?.limit))
          ),
        },
        remark: sanitizeString(orFallback(param?.remarks, fallback?.remarks)),
      };
    };

    const mapLocationData = (locationData: any) => {
      if (!locationData || typeof locationData !== "object") {
        return null;
      }
      const mainParam = mapLocationParam(locationData, locationData);
      const extraParams = Array.isArray(locationData.parameters)
        ? locationData.parameters
            .map((param: any) => mapLocationParam(param, locationData))
            .filter(
              (
                param: ReturnType<typeof mapLocationParam> | null | undefined
              ): param is NonNullable<ReturnType<typeof mapLocationParam>> =>
                !!param
            )
        : [];
      const parameters = [...(mainParam ? [mainParam] : []), ...extraParams];
      if (!parameters.length) {
        return null;
      }
      return {
        locationDescription: sanitizeString(locationData.locationInput),
        parameters,
        samplingDate: sanitizeString(locationData.dateTime),
        weatherAndWind: sanitizeString(locationData.weatherWind),
        explanationForConfirmatorySampling: sanitizeString(
          locationData.isExplanationNA ? "N/A" : locationData.explanation
        ),
        overallAssessment: sanitizeString(locationData.overallCompliance),
      };
    };

    const mapPortData = (portData: any) => {
      if (!portData || typeof portData !== "object") {
        return null;
      }
      const mainParam = mapLocationParam(portData, portData);
      const extraParams = Array.isArray(portData.additionalParameters)
        ? portData.additionalParameters
            .map((param: any) => mapLocationParam(param, portData))
            .filter(
              (
                param: ReturnType<typeof mapLocationParam> | null | undefined
              ): param is NonNullable<ReturnType<typeof mapLocationParam>> =>
                !!param
            )
        : [];
      const parameters = [...(mainParam ? [mainParam] : []), ...extraParams];
      if (!parameters.length) {
        return null;
      }
      return {
        locationDescription: sanitizeString(
          portData.portName ?? portData.locationInput
        ),
        parameters,
        samplingDate: sanitizeString(portData.dateTime),
        weatherAndWind: sanitizeString(portData.weatherWind),
        explanationForConfirmatorySampling: sanitizeString(
          portData.isExplanationNA ? "N/A" : portData.explanation
        ),
        overallAssessment: sanitizeString(
          portData.overallCompliance ?? raw?.data?.overallCompliance
        ),
      };
    };

    const result: any = {};
    if (raw.quarryData) {
      const quarry = mapLocationData(raw.quarryData);
      if (quarry) {
        result.quarry = quarry;
      }
    }
    if (raw.plantData) {
      const plant = mapLocationData(raw.plantData);
      if (plant) {
        result.plant = plant;
      }
    }
    if (raw.quarryPlantData) {
      const quarryPlant = mapLocationData(raw.quarryPlantData);
      if (quarryPlant) {
        result.quarryAndPlant = quarryPlant;
      }
    }
    if (Array.isArray(raw.ports) && raw.ports.length) {
      raw.ports.forEach((portData: any) => {
        const port = mapPortData(portData);
        if (port) {
          result.port = port;
        }
      });
    }

    return Object.keys(result).length > 0 ? result : undefined;
  }

  const sel = raw.selectedLocations || {};
  const d = raw.data || {};
  const params = Array.isArray(raw.parameters) ? raw.parameters : [];
  const ports = Array.isArray(raw.ports) ? raw.ports : [];

  const makeParam = (p: any) => ({
    name: String(p?.parameter ?? ""),
    result: {
      internalMonitoring: {
        month: String(p?.resultType ?? d?.resultType ?? ""),
        readings: [
          {
            label: String(p?.parameter ?? "Reading"),
            current_mgL: parseFirstNumber(p?.tssCurrent ?? d?.tssCurrent),
            previous_mgL: parseFirstNumber(p?.tssPrevious ?? d?.tssPrevious),
          },
        ],
      },
      mmtConfirmatorySampling: {
        current: String(p?.mmtCurrent ?? d?.mmtCurrent ?? ""),
        previous: String(p?.mmtPrevious ?? d?.mmtPrevious ?? ""),
      },
    },
    denrStandard: {
      redFlag: String(p?.eqplRedFlag ?? d?.eqplRedFlag ?? ""),
      action: String(p?.action ?? d?.action ?? ""),
      limit_mgL: parseFirstNumber(p?.limit ?? d?.limit),
    },
    remark: String(p?.remarks ?? d?.remarks ?? ""),
  });

  const result: any = {};

  if (sel.quarry && d?.quarryInput) {
    const mainParam = makeParam(d);
    const extraParams = params.map(makeParam);
    result.quarry = {
      locationDescription: String(d?.quarryInput ?? ""),
      parameters: [mainParam, ...extraParams].filter((p) => p.name),
      samplingDate: String(d?.dateTime ?? ""),
      weatherAndWind: String(d?.weatherWind ?? ""),
      explanationForConfirmatorySampling: String(d?.explanation ?? ""),
      overallAssessment: String(d?.overallCompliance ?? ""),
    };
  }

  if (sel.plant && d?.plantInput) {
    const mainParam = makeParam(d);
    const extraParams = params.map(makeParam);
    result.plant = {
      locationDescription: String(d?.plantInput ?? ""),
      parameters: [mainParam, ...extraParams].filter((p) => p.name),
      samplingDate: String(d?.dateTime ?? ""),
      weatherAndWind: String(d?.weatherWind ?? ""),
      explanationForConfirmatorySampling: String(d?.explanation ?? ""),
      overallAssessment: String(d?.overallCompliance ?? ""),
    };
  }

  if (sel.quarryPlant && d?.quarryPlantInput) {
    const mainParam = makeParam(d);
    const extraParams = params.map(makeParam);
    result.quarryAndPlant = {
      locationDescription: String(d?.quarryPlantInput ?? ""),
      parameters: [mainParam, ...extraParams].filter((p) => p.name),
      samplingDate: String(d?.dateTime ?? ""),
      weatherAndWind: String(d?.weatherWind ?? ""),
      explanationForConfirmatorySampling: String(d?.explanation ?? ""),
      overallAssessment: String(d?.overallCompliance ?? ""),
    };
  }

  // ✅ FIX: Handle portEnabled with port (string) and portData (object) in legacy structure
  if (raw.portEnabled && (typeof raw.port === 'string' || raw.portData)) {
    const portSource = raw.portData || d;
    const portMainParam = makeParam(portSource);
    const portExtraParams = Array.isArray(portSource?.parameters)
      ? portSource.parameters.map(makeParam)
      : [];

    result.port = {
      locationDescription: String(
        typeof raw.port === 'string' 
          ? raw.port 
          : portSource?.portName ?? portSource?.locationInput ?? d?.port ?? ""
      ),
      parameters: [portMainParam, ...portExtraParams].filter((p) => p.name),
      samplingDate: String(portSource?.dateTime ?? d?.dateTime ?? ""),
      weatherAndWind: String(portSource?.weatherWind ?? d?.weatherWind ?? ""),
      explanationForConfirmatorySampling: String(
        portSource?.explanation ?? d?.explanation ?? ""
      ),
      overallAssessment: String(
        portSource?.overallCompliance ?? d?.overallCompliance ?? ""
      ),
    };
  }

  // Legacy ports array handling
  if (ports?.length) {
    ports.forEach((port: any) => {
      const portMainParam = makeParam(port);
      const portExtraParams = Array.isArray(port.additionalParameters)
        ? port.additionalParameters.map(makeParam)
        : [];

      result.port = {
        locationDescription: String(
          port?.portName ?? port?.locationInput ?? d?.port ?? ""
        ),
        parameters: [portMainParam, ...portExtraParams].filter((p) => p.name),
        samplingDate: String(port?.dateTime ?? d?.dateTime ?? ""),
        weatherAndWind: String(port?.weatherWind ?? d?.weatherWind ?? ""),
        explanationForConfirmatorySampling: String(
          port?.explanation ?? d?.explanation ?? ""
        ),
        overallAssessment: String(
          port?.overallCompliance ?? d?.overallCompliance ?? ""
        ),
      };
    });
  }

  return Object.keys(result).length > 0 ? result : undefined;
};

const transformNoiseQualityForPayload = (raw: any) => {
  if (!raw) return undefined;
  const list = Array.isArray(raw.parameters) ? raw.parameters : [];
  const parameters = list.map((p: any) => ({
    name: String(p?.parameter ?? ""),
    isParameterNA: !!p?.isParameterNA, // ✅ FIX: Preserve isParameterNA flag
    results: {
      inSMR: {
        current: String(p?.currentInSMR ?? ""),
        previous: String(p?.previousInSMR ?? ""),
      },
      mmtConfirmatorySampling: {
        current: String(p?.mmtCurrent ?? ""),
        previous: String(p?.mmtPrevious ?? ""),
      },
    },
    eqpl: {
      redFlag: String(p?.redFlag ?? ""),
      action: String(p?.action ?? ""),
      denrStandard: String(p?.limit ?? ""),
    },
  }));
  const toQuarter = (label: string, content: string) =>
    content
      ? {
          year: undefined,
          assessment: String(content),
        }
      : undefined;
  const overallAssessment: any = {};
  if (raw?.quarters?.first)
    overallAssessment.firstQuarter = toQuarter("1st", raw.quarters.first);
  if (raw?.quarters?.second)
    overallAssessment.secondQuarter = toQuarter("2nd", raw.quarters.second);
  if (raw?.quarters?.third)
    overallAssessment.thirdQuarter = toQuarter("3rd", raw.quarters.third);
  if (raw?.quarters?.fourth)
    overallAssessment.fourthQuarter = toQuarter("4th", raw.quarters.fourth);

  // Preserve uploaded files metadata
  const uploadedFiles = (
    Array.isArray(raw?.uploadedFiles) ? raw.uploadedFiles : []
  )
    .map((file: any) => {
      const storagePath =
        typeof file?.storagePath === "string"
          ? file.storagePath.trim()
          : undefined;
      const uri = typeof file?.uri === "string" ? file.uri.trim() : undefined;
      if (!storagePath && !uri) return null;

      const name =
        typeof file?.name === "string" && file.name.trim()
          ? file.name.trim()
          : storagePath?.split("/").pop();

      const size =
        typeof file?.size === "number"
          ? file.size
          : Number.isFinite(Number(file?.size))
            ? Number(file.size)
            : undefined;

      const mimeType =
        typeof file?.mimeType === "string" && file.mimeType.trim()
          ? file.mimeType.trim()
          : undefined;

      return { uri, name, size, mimeType, storagePath };
    })
    .filter(Boolean);

  return {
    parameters: parameters.length ? parameters : undefined,
    samplingDate: String(raw?.dateTime ?? ""),
    weatherAndWind: String(raw?.weatherWind ?? ""),
    explanationForConfirmatorySampling: String(raw?.explanation ?? ""),
    overallAssessment: Object.keys(overallAssessment).length
      ? overallAssessment
      : undefined,
    uploadedFiles: uploadedFiles.length ? uploadedFiles : undefined,
  };
};

const transformWasteManagementForPayload = (raw: any) => {
  if (!raw) return undefined;
  const mapPlantPortSection = (sec: any): any[] => {
    if (!sec) return [];
    const items = Array.isArray(sec?.eccEpepCommitments)
      ? sec.eccEpepCommitments
      : [];
    return items.map((it: any) => ({
      typeOfWaste: String(it?.typeOfWaste ?? ""),
      eccEpepCommitments: {
        handling: String(it?.handling ?? ""),
        storage: String(it?.storage ?? ""),
        disposal: Boolean(it?.disposal),
      },
      adequate: {
        y: String(sec?.isAdequate ?? "").toUpperCase() === "YES",
        n: String(sec?.isAdequate ?? "").toUpperCase() === "NO",
      },
      previousRecord: sec?.previousRecord ?? "",
      q2_2025_Generated_HW: sec?.currentQuarterWaste ?? "",
      total: undefined,
    }));
  };
  const quarry = raw?.quarryData?.N_A
    ? "N/A"
    : raw?.quarryData?.noSignificantImpact && !raw?.quarryData?.generateTable
      ? "No significant impact"
      : mapPlantPortSection(raw?.quarryPlantData);
  const plant = raw?.plantSimpleData?.N_A
    ? "N/A"
    : raw?.plantSimpleData?.noSignificantImpact &&
        !raw?.plantSimpleData?.generateTable
      ? "No significant impact"
      : mapPlantPortSection(raw?.plantData);
  const port = raw?.portData?.N_A
    ? "N/A"
    : raw?.portData?.noSignificantImpact && !raw?.portData?.generateTable
      ? "No significant impact"
      : mapPlantPortSection(raw?.portPlantData);
  return { quarry, plant, port };
};

const transformChemicalSafetyForPayload = (raw: any) => {
  if (!raw) return undefined;
  const cs = raw.chemicalSafety || {};
  const yn = (v: any) => String(v).toUpperCase() === "YES";
  return {
    chemicalSafety: {
      isNA: cs.isNA ?? undefined,
      riskManagement:
        cs.riskManagement != null
          ? (yn(cs.riskManagement) as boolean)
          : undefined,
      training: cs.training != null ? (yn(cs.training) as boolean) : undefined,
      handling: cs.handling != null ? (yn(cs.handling) as boolean) : undefined,
      emergencyPreparedness:
        cs.emergencyPreparedness != null
          ? (yn(cs.emergencyPreparedness) as boolean)
          : undefined,
      remarks: cs.remarks ?? undefined,
      chemicalCategory: cs.chemicalCategory ?? undefined,
      othersSpecify: cs.othersSpecify ?? undefined,
    },
    healthSafetyChecked: !!raw.healthSafetyChecked,
    socialDevChecked: !!raw.socialDevChecked,
  };
};

const transformComplaintsForPayload = (raw: any) => {
  if (!Array.isArray(raw)) return undefined;
  const cleaned = raw
    .filter((c) => !c?.isNA)
    .map((c) => ({
      dateFiled: String(c?.dateFiled ?? ""),
      filedLocation: String(c?.filedLocation ?? ""),
      othersSpecify:
        c?.filedLocation === "Others"
          ? String(c?.othersSpecify ?? "")
          : undefined,
      nature: String(c?.nature ?? ""),
      resolutions: String(c?.resolutions ?? ""),
      id: c?.id ?? undefined,
      isNA: c?.isNA ?? undefined,
    }));
  return cleaned.length ? cleaned : undefined;
};

const createHydrationId = (() => {
  let counter = 0;
  return (prefix: string, index?: number) => {
    counter += 1;
    const randomPart = Math.random().toString(36).slice(2, 8);
    if (typeof index === "number") {
      return `${prefix}-${index}-${counter}-${randomPart}`;
    }
    return `${prefix}-${counter}-${randomPart}`;
  };
})();

const normalizeLabelKey = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]/g, "");

type ComplianceFormFieldDefinition = {
  key: string;
  label: string;
  subFields?: readonly string[];
};

const COMPLIANCE_FORM_FIELD_DEFS: readonly ComplianceFormFieldDefinition[] = [
  { key: "projectLocation", label: "Project Location" },
  { key: "projectArea", label: "Project Area (ha)" },
  { key: "capitalCost", label: "Capital Cost (Php)" },
  { key: "typeOfMinerals", label: "Type of Minerals" },
  { key: "miningMethod", label: "Mining Method" },
  { key: "production", label: "Production" },
  { key: "mineLife", label: "Mine Life" },
  { key: "mineralReserves", label: "Mineral Reserves/ Resources" },
  { key: "accessTransportation", label: "Access/ Transportation" },
  { key: "powerSupply", label: "Power Supply", subFields: ["Plant", "Port"] },
  {
    key: "miningEquipment",
    label: "Mining Equipment",
    subFields: ["Quarry/Plant", "Port"],
  },
  {
    key: "workForce",
    label: "Work Force",
    subFields: ["Employees"],
  },
  {
    key: "developmentSchedule",
    label: "Development/ Utilization Schedule",
  },
] as const;

const buildDefaultComplianceFormData = (): FormData => {
  const base: Partial<FormData> = {};
  COMPLIANCE_FORM_FIELD_DEFS.forEach((def) => {
    (base as Record<string, any>)[def.key] = {
      label: def.label,
      specification: "",
      remarks: "",
      withinSpecs: null,
      ...(Array.isArray(def.subFields)
        ? {
            subFields: def.subFields.map((label: string) => ({
              label: `${label}:`,
              specification: "",
            })),
          }
        : {}),
    };
  });
  return base as FormData;
};

const isExecutiveSummaryFrontEndShape = (raw: any): raw is ExecutiveSummary => {
  return (
    raw &&
    typeof raw === "object" &&
    raw.epepCompliance &&
    typeof raw.epepCompliance === "object" &&
    Object.prototype.hasOwnProperty.call(raw, "sdmpCompliance")
  );
};

const normalizeExecutiveSummaryFromApi = (
  raw: any
): ExecutiveSummary | undefined => {
  if (!raw || typeof raw !== "object") {
    return undefined;
  }
  if (isExecutiveSummaryFrontEndShape(raw)) {
    return raw;
  }
  const epep = raw.complianceWithEpepCommitments || raw.epepCompliance || {};
  const sdmp = raw.complianceWithSdmpCommitments || raw.sdmp || {};
  const complaints = raw.complaintsManagement || {};
  const accountability = raw.accountability || {};
  const others = raw.others || {};
  const sdmpCompliance = sdmp.complied
    ? "complied"
    : sdmp.notComplied
      ? "not-complied"
      : "";
  const accountabilityStatus = accountability.complied
    ? "complied"
    : accountability.notComplied
      ? "not-complied"
      : "";
  return {
    epepCompliance: {
      safety: !!epep.safety,
      social: !!epep.social,
      rehabilitation: !!epep.rehabilitation,
    },
    epepRemarks: sanitizeString(epep.remarks),
    sdmpCompliance,
    sdmpRemarks: sanitizeString(sdmp.remarks),
    complaintsManagement: {
      naForAll: !!complaints.naForAll,
      complaintReceiving: !!(
        complaints.complaintReceiving ?? complaints.complaintReceivingSetup
      ),
      caseInvestigation: !!complaints.caseInvestigation,
      implementationControl: !!(
        complaints.implementationControl ?? complaints.implementationOfControl
      ),
      communicationComplainant: !!(
        complaints.communicationComplainant ??
        complaints.communicationWithComplainantOrPublic
      ),
      complaintDocumentation: !!complaints.complaintDocumentation,
    },
    complaintsRemarks: sanitizeString(complaints.remarks),
    accountability: accountabilityStatus,
    accountabilityRemarks: sanitizeString(accountability.remarks),
    othersSpecify: sanitizeString(others.specify),
    othersNA: !!(others.na ?? others.isNA),
  };
};

type ProcessDocSnapshot = ProcessDocumentation & {
  eccMmtAdditional: string[];
  epepMmtAdditional: string[];
  ocularMmtAdditional: string[];
};

const isProcessDocFrontEndShape = (raw: any): raw is ProcessDocSnapshot => {
  return (
    raw &&
    typeof raw === "object" &&
    Object.prototype.hasOwnProperty.call(raw, "eccMmtMembers") &&
    (Array.isArray(raw.eccMmtAdditional) || raw.eccMmtAdditional === undefined)
  );
};

const normalizeProcessDocumentationFromApi = (
  raw: any
): ProcessDocSnapshot | undefined => {
  if (!raw || typeof raw !== "object") {
    return undefined;
  }
  if (isProcessDocFrontEndShape(raw)) {
    return {
      ...raw,
      eccMmtAdditional: raw.eccMmtAdditional ?? [],
      epepMmtAdditional: raw.epepMmtAdditional ?? [],
      ocularMmtAdditional: raw.ocularMmtAdditional ?? [],
    };
  }
  const activities = raw.activities || {};
  const parseMembers = (value: any): string[] =>
    Array.isArray(value)
      ? value.map((entry) => sanitizeString(entry)).filter(Boolean)
      : [];
  const splitMembers = (value: any) => {
    const list = parseMembers(value);
    const [primary, ...additional] = list;
    return {
      primary: primary ?? "",
      additional,
    };
  };
  const eccMembers = splitMembers(
    activities.complianceWithEccConditionsCommitments?.mmtMembersInvolved
  );
  const epepMembers = splitMembers(
    activities.complianceWithEpepAepepConditions?.mmtMembersInvolved
  );
  const ocularMembers = splitMembers(
    activities.siteOcularValidation?.mmtMembersInvolved
  );
  const sampling = activities.siteValidationConfirmatorySampling || {};
  const siteValidationApplicable = sampling.applicable
    ? "applicable"
    : sampling.none
      ? "none"
      : "";
  const samplingMembers = parseMembers(sampling.mmtMembersInvolved).join(", ");
  return {
    dateConducted: sanitizeString(raw.dateConducted),
    sameDateForAll: !!(raw.sameDateForAll ?? raw.sameDateForAllActivities),
    eccMmtMembers: eccMembers.primary,
    eccMmtAdditional: eccMembers.additional,
    epepMmtMembers: epepMembers.primary,
    epepMmtAdditional: epepMembers.additional,
    ocularMmtMembers: ocularMembers.primary,
    ocularMmtAdditional: ocularMembers.additional,
    ocularNA: !!raw.ocularNA,
    methodologyRemarks: sanitizeString(
      raw.mergedMethodologyOrOtherRemarks ?? raw.methodologyRemarks
    ),
    siteValidationApplicable,
    samplingDateConducted: sanitizeString(sampling.dateConducted),
    samplingMmtMembers: samplingMembers,
    samplingMethodologyRemarks: sanitizeString(sampling.remarks),
  };
};

const normalizeProjectLocationFromApi = (
  raw: any
):
  | {
      formData: FormData;
      otherComponents: OtherComponent[];
      uploadedImages: Record<string, string>;
    }
  | undefined => {
  if (!raw || typeof raw !== "object") {
    return undefined;
  }
  if (raw.formData) {
    return {
      formData: raw.formData,
      otherComponents: Array.isArray(raw.otherComponents)
        ? raw.otherComponents
        : [],
      uploadedImages: raw.uploadedImages ?? {},
    };
  }
  const formData = buildDefaultComplianceFormData();
  const parameters = Array.isArray(raw.parameters) ? raw.parameters : [];
  parameters.forEach((param: any) => {
    const nameKey = normalizeLabelKey(
      sanitizeString(param?.name ?? param?.label ?? "")
    );
    const definition = COMPLIANCE_FORM_FIELD_DEFS.find(
      (def) => normalizeLabelKey(def.label) === nameKey
    );
    if (!definition) {
      return;
    }
    const field = (formData as Record<string, any>)[definition.key];
    if (!field) {
      return;
    }
    const specificationSource = param?.specification;
    if (specificationSource && typeof specificationSource === "object") {
      field.specification = sanitizeString(
        specificationSource.main ??
          specificationSource.Main ??
          specificationSource.default ??
          specificationSource.specification
      );
      if (definition.subFields && field.subFields) {
        field.subFields = field.subFields.map((subField: any) => {
          const key = subField.label.replace(/:$/, "");
          const match =
            specificationSource[key] ??
            specificationSource[key.toLowerCase()] ??
            specificationSource[key.replace(/[^a-z0-9]/gi, "")];
          return {
            ...subField,
            specification: sanitizeString(match),
          };
        });
      }
    } else if (specificationSource != null) {
      field.specification = sanitizeString(specificationSource);
    }
    field.remarks = sanitizeString(param?.remarks);
    field.withinSpecs =
      typeof param?.withinSpecs === "boolean" ? param.withinSpecs : null;
  });
  const otherComponents = Array.isArray(raw.otherComponents)
    ? raw.otherComponents.map((item: any, index: number) => ({
        specification: sanitizeString(
          item?.specification ?? item?.name ?? `Other Component ${index + 1}`
        ),
        remarks: sanitizeString(item?.remarks),
        withinSpecs:
          typeof item?.withinSpecs === "boolean" ? item.withinSpecs : null,
      }))
    : [];
  return {
    formData,
    otherComponents,
    uploadedImages: raw.uploadedImages ?? {},
  };
};

const toEiaYesNo = (value: any): EiaYesNoNull => {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "yes" || normalized === "complied") {
      return "yes";
    }
    if (normalized === "no" || normalized === "not complied") {
      return "no";
    }
  }
  if (value === true) {
    return "yes";
  }
  if (value === false) {
    return "no";
  }
  return null;
};

const createEmptyMitigatingMeasure = (
  prefix: string,
  index: number
): MitigatingMeasure => ({
  id: createHydrationId(prefix, index),
  planned: "",
  actualObservation: "",
  isEffective: null,
  recommendations: "",
});

const mapCommitments = (
  section: any,
  prefix: string,
  fallbackTitle: string
): OperationSection => {
  const title = sanitizeString(section?.areaName) || fallbackTitle;
  const commitments = Array.isArray(section?.commitments)
    ? section.commitments
    : [];
  const measures =
    commitments.length > 0
      ? commitments.map((item: any, index: number) => ({
          id: item?.id || createHydrationId(`${prefix}-measure`, index),
          planned: sanitizeString(item?.plannedMeasure),
          actualObservation: sanitizeString(item?.actualObservation),
          isEffective: toEiaYesNo(item?.isEffective),
          recommendations: sanitizeString(item?.recommendations),
        }))
      : [createEmptyMitigatingMeasure(`${prefix}-measure`, 0)];
  return {
    title,
    isNA: commitments.length === 0,
    measures,
  };
};

const normalizeImpactCommitmentsFromApi = (
  raw: any
):
  | {
      preConstruction: EiaYesNoNull;
      construction: EiaYesNoNull;
      quarryOperation: OperationSection;
      plantOperation: OperationSection;
      portOperation: OperationSection;
      overallCompliance: string;
    }
  | undefined => {
  if (!raw || typeof raw !== "object") {
    return undefined;
  }
  if (
    Object.prototype.hasOwnProperty.call(raw, "quarryOperation") &&
    Object.prototype.hasOwnProperty.call(raw, "preConstruction")
  ) {
    return raw;
  }
  const constructionInfo = Array.isArray(raw.constructionInfo)
    ? raw.constructionInfo
    : [];
  const preConstructionInfo = constructionInfo.find((section: any) =>
    String(section?.areaName || "")
      .toLowerCase()
      .includes("pre")
  );
  const constructionInfoEntry = constructionInfo.find((section: any) =>
    String(section?.areaName || "")
      .toLowerCase()
      .includes("construction")
  );
  const preConstructionCommitment = preConstructionInfo?.commitments?.[0];
  const constructionCommitment = constructionInfoEntry?.commitments?.[0];
  const implementationSections = Array.isArray(
    raw.implementationOfEnvironmentalImpactControlStrategies
  )
    ? raw.implementationOfEnvironmentalImpactControlStrategies
    : [];
  const [quarrySectionRaw, plantSectionRaw, portSectionRaw] =
    implementationSections;
  const quarryOperation = mapCommitments(
    quarrySectionRaw,
    "quarry",
    "Quarry Operation"
  );
  const plantOperation = mapCommitments(
    plantSectionRaw,
    "plant",
    "Plant Operation"
  );
  const portOperation = mapCommitments(
    portSectionRaw,
    "port",
    "Port Operation"
  );
  return {
    preConstruction: toEiaYesNo(preConstructionCommitment?.isEffective),
    construction: toEiaYesNo(constructionCommitment?.isEffective),
    quarryOperation,
    plantOperation,
    portOperation,
    overallCompliance: sanitizeString(raw.overallComplianceAssessment),
  };
};

const createEmptyAirParameter = (
  prefix: string,
  index: number
): AirParameterData => ({
  id: createHydrationId(prefix, index),
  parameter: "",
  currentSMR: "",
  previousSMR: "",
  currentMMT: "",
  previousMMT: "",
  thirdPartyTesting: "",
  eqplRedFlag: "",
  action: "",
  limitPM25: "",
  remarks: "",
});

const createEmptyAirComplianceData = (): AirComplianceData => ({
  eccConditions: "",
  quarry: "",
  plant: "",
  port: "",
  quarryPlant: "",
  parameter: "",
  currentSMR: "",
  previousSMR: "",
  currentMMT: "",
  previousMMT: "",
  thirdPartyTesting: "",
  eqplRedFlag: "",
  action: "",
  limitPM25: "",
  remarks: "",
  parameters: [],
  dateTime: "",
  weatherWind: "",
  explanation: "",
  overallCompliance: "",
});

const normalizeFileLikeFromApi = (file: any) => {
  if (!file) {
    return null;
  }
  if (typeof file === "string") {
    const name = file.split("/").pop() || file;
    return { name, uri: file };
  }
  if (typeof file === "object") {
    const cloned: any = { ...file };
    if (!cloned.name && typeof cloned.uri === "string") {
      cloned.name = cloned.uri.split("/").pop() || "document";
    }
    return cloned;
  }
  return null;
};

const mapAirParameterFromApi = (
  source: any,
  prefix: string,
  index: number
): AirParameterData => {
  const entry = createEmptyAirParameter(prefix, index);
  entry.id = source?.id ?? entry.id;
  entry.parameter = sanitizeString(source?.name ?? source?.parameter);
  entry.currentSMR = sanitizeString(
    source?.results?.inSMR?.current ?? source?.currentSMR
  );
  entry.previousSMR = sanitizeString(
    source?.results?.inSMR?.previous ?? source?.previousSMR
  );
  entry.currentMMT = sanitizeString(
    source?.results?.mmtConfirmatorySampling?.current ?? source?.currentMMT
  );
  entry.previousMMT = sanitizeString(
    source?.results?.mmtConfirmatorySampling?.previous ?? source?.previousMMT
  );
  entry.thirdPartyTesting = sanitizeString(
    source?.results?.thirdPartyTesting ??
      source?.thirdPartyTesting ??
      source?.thirdParty
  );
  entry.eqplRedFlag = sanitizeString(
    source?.eqpl?.redFlag ?? source?.eqplRedFlag
  );
  entry.action = sanitizeString(source?.eqpl?.action ?? source?.action);
  const limitSource =
    source?.eqpl?.limit ??
    source?.eqpl?.limit_mgL ??
    source?.eqplLimit ??
    source?.limitPM25 ??
    source?.limit;
  entry.limitPM25 = sanitizeString(
    typeof limitSource === "number" ? limitSource.toString() : limitSource
  );
  entry.remarks = sanitizeString(source?.remarks);
  return entry;
};

const normalizeAirQualityFromApi = (
  raw: any
):
  | {
      selectedLocations: {
        quarry: boolean;
        plant: boolean;
        port: boolean;
        quarryPlant: boolean;
      };
      data: AirComplianceData;
      uploadedEccFile?: any;
      uploadedImage?: string | null;
    }
  | undefined => {
  if (!raw || typeof raw !== "object") {
    return undefined;
  }
  if (raw.data && typeof raw.data === "object") {
    const normalizedParams = Array.isArray(raw.data.parameters)
      ? raw.data.parameters.map((param: any, index: number) => {
          const mapped = mapAirParameterFromApi(param, "air-extra", index);
          mapped.id = param?.id ?? mapped.id;
          return mapped;
        })
      : [];
    const normalizedData: AirComplianceData = {
      ...createEmptyAirComplianceData(),
      ...raw.data,
      parameters: normalizedParams,
    };
    if (!normalizedData.eccConditions) {
      const inferredName = normalizeFileLikeFromApi(raw.uploadedEccFile)?.name;
      normalizedData.eccConditions = inferredName ? inferredName : "";
    }
    const derivedSelected = {
      quarry: !!sanitizeString(normalizedData.quarry),
      plant: !!sanitizeString(normalizedData.plant),
      port: !!sanitizeString(normalizedData.port),
      quarryPlant: !!sanitizeString(normalizedData.quarryPlant),
    };
    const explicitSelected =
      raw.selectedLocations && typeof raw.selectedLocations === "object"
        ? {
            quarry: !!raw.selectedLocations.quarry,
            plant: !!raw.selectedLocations.plant,
            port: !!raw.selectedLocations.port,
            quarryPlant: !!raw.selectedLocations.quarryPlant,
          }
        : derivedSelected;
    return {
      selectedLocations: explicitSelected,
      data: normalizedData,
      uploadedEccFile: normalizeFileLikeFromApi(raw.uploadedEccFile),
      uploadedImage:
        typeof raw.uploadedImage === "string"
          ? raw.uploadedImage
          : (raw.uploadedImage?.uri ?? null),
    };
  }
  const data = createEmptyAirComplianceData();
  const parameters = Array.isArray(raw.parameters) ? raw.parameters : [];
  if (parameters.length > 0) {
    const mappedMain = mapAirParameterFromApi(parameters[0], "air-main", 0);
    data.parameter = mappedMain.parameter;
    data.currentSMR = mappedMain.currentSMR;
    data.previousSMR = mappedMain.previousSMR;
    data.currentMMT = mappedMain.currentMMT;
    data.previousMMT = mappedMain.previousMMT;
    data.thirdPartyTesting = mappedMain.thirdPartyTesting;
    data.eqplRedFlag = mappedMain.eqplRedFlag;
    data.action = mappedMain.action;
    data.limitPM25 = mappedMain.limitPM25;
    data.remarks = mappedMain.remarks;
  }
  data.parameters = parameters.slice(1).map((param: any, index: number) => {
    const converted = mapAirParameterFromApi(param, "air-extra", index);
    return converted;
  });
  data.quarry = sanitizeString(raw.quarry);
  data.plant = sanitizeString(raw.plant);
  data.port = sanitizeString(raw.port);
  data.quarryPlant = sanitizeString(raw.quarryPlant);
  data.dateTime = sanitizeString(raw.samplingDate);
  data.weatherWind = sanitizeString(raw.weatherAndWind);
  data.explanation = sanitizeString(raw.explanationForConfirmatorySampling);
  data.overallCompliance = sanitizeString(raw.overallAssessment);
  if (!data.eccConditions) {
    const eccSource =
      raw.eccConditions ??
      raw.eccCondition ??
      raw.eccConditionsDocument ??
      normalizeFileLikeFromApi(raw.uploadedEccFile)?.name;
    data.eccConditions = sanitizeString(eccSource);
  }
  return {
    selectedLocations: {
      quarry: !!sanitizeString(raw.quarry),
      plant: !!sanitizeString(raw.plant),
      port: !!sanitizeString(raw.port),
      quarryPlant: !!sanitizeString(raw.quarryPlant),
    },
    data,
    uploadedEccFile: normalizeFileLikeFromApi(raw.uploadedEccFile),
    uploadedImage:
      typeof raw.uploadedImage === "string"
        ? raw.uploadedImage
        : (raw.uploadedImage?.uri ?? null),
  };
};

const createEmptyWaterParameter = (
  prefix: string,
  index: number
): WaterParameter => ({
  id: createHydrationId(prefix, index),
  parameter: "",
  resultType: "Month",
  tssCurrent: "",
  tssPrevious: "",
  eqplRedFlag: "",
  action: "",
  limit: "",
  remarks: "",
  mmtCurrent: "",
  mmtPrevious: "",
  isMMTNA: false,
});

const createEmptyWaterQualityData = (): WaterQualityData => ({
  quarryInput: "",
  plantInput: "",
  quarryPlantInput: "",
  parameter: "",
  resultType: "Month",
  tssCurrent: "",
  tssPrevious: "",
  mmtCurrent: "",
  mmtPrevious: "",
  isMMTNA: false,
  eqplRedFlag: "",
  action: "",
  limit: "",
  remarks: "",
  dateTime: "",
  weatherWind: "",
  explanation: "",
  isExplanationNA: false,
  overallCompliance: "",
});

const convertWaterBackendParam = (
  param: any,
  prefix: string,
  index: number
): WaterParameter => {
  const base = createEmptyWaterParameter(prefix, index);
  base.parameter = sanitizeString(param?.name);
  const month = sanitizeString(param?.result?.internalMonitoring?.month ?? "");
  if (month) {
    base.resultType = month;
  }
  const readings =
    param?.result?.internalMonitoring?.readings &&
    Array.isArray(param.result.internalMonitoring.readings)
      ? param.result.internalMonitoring.readings[0]
      : undefined;
  if (readings) {
    base.tssCurrent =
      readings.current_mgL != null ? String(readings.current_mgL) : "";
    base.tssPrevious =
      readings.previous_mgL != null ? String(readings.previous_mgL) : "";
  }
  base.mmtCurrent = sanitizeString(
    param?.result?.mmtConfirmatorySampling?.current
  );
  base.mmtPrevious = sanitizeString(
    param?.result?.mmtConfirmatorySampling?.previous
  );
  base.eqplRedFlag = sanitizeString(param?.denrStandard?.redFlag);
  base.action = sanitizeString(param?.denrStandard?.action);
  base.limit =
    param?.denrStandard?.limit_mgL != null
      ? String(param.denrStandard.limit_mgL)
      : "";
  base.remarks = sanitizeString(param?.remark);
  return base;
};

const cloneWaterParameters = (
  params: WaterParameter[] = [],
  prefix = "water-param"
): WaterParameter[] =>
  params.map((param, index) => ({
    ...param,
    id: param.id || createHydrationId(prefix, index),
  }));

const buildLocationDataFromPayload = (
  source: any,
  prefix: string
): LocationData => {
  const location = createEmptyLocationData();
  if (!source || typeof source !== "object") {
    location.parameters = [];
    return location;
  }

  const mappedParams = Array.isArray(source.parameters)
    ? source.parameters
        .map((param: any, index: number) =>
          convertWaterBackendParam(param, prefix, index)
        )
        .filter((param: WaterParameter) =>
          [
            param.parameter,
            param.tssCurrent,
            param.tssPrevious,
            param.limit,
            param.remarks,
          ].some((field) => !!field && String(field).trim().length > 0)
        )
    : [];

  if (mappedParams.length > 0) {
    const [main, ...additional] = mappedParams;
    location.parameter = main.parameter;
    location.resultType = main.resultType;
    location.tssCurrent = main.tssCurrent;
    location.tssPrevious = main.tssPrevious;
    location.mmtCurrent = main.mmtCurrent ?? "";
    location.mmtPrevious = main.mmtPrevious ?? "";
    location.isMMTNA = !!main.isMMTNA;
    location.eqplRedFlag = main.eqplRedFlag;
    location.action = main.action;
    location.limit = main.limit;
    location.remarks = main.remarks;
    location.parameters = additional;
  } else {
    location.parameters = [];
  }

  location.locationInput =
    sanitizeString(
      source.locationInput ?? source.locationDescription ?? source.description
    ) || "";
  location.dateTime =
    sanitizeString(source.samplingDate ?? source.dateTime) || "";
  location.weatherWind =
    sanitizeString(source.weatherAndWind ?? source.weatherWind) || "";

  const explanationSource =
    source.explanationForConfirmatorySampling ??
    source.explanation ??
    (source.isExplanationNA ? "N/A" : "");
  if (
    typeof explanationSource === "string" &&
    explanationSource.trim().toUpperCase() === "N/A"
  ) {
    location.explanation = "";
    location.isExplanationNA = true;
  } else {
    location.explanation = sanitizeString(explanationSource);
    location.isExplanationNA = !!source.isExplanationNA;
  }

  location.overallCompliance =
    sanitizeString(source.overallAssessment ?? source.overallCompliance) || "";

  return location;
};

const buildLegacyDataFromLocation = (
  location: LocationData,
  descriptions: { quarry: string; plant: string; quarryPlant: string }
): WaterQualityData => ({
  quarryInput: descriptions.quarry,
  plantInput: descriptions.plant,
  quarryPlantInput: descriptions.quarryPlant,
  parameter: location.parameter,
  resultType: location.resultType,
  tssCurrent: location.tssCurrent,
  tssPrevious: location.tssPrevious,
  mmtCurrent: location.mmtCurrent,
  mmtPrevious: location.mmtPrevious,
  isMMTNA: location.isMMTNA,
  eqplRedFlag: location.eqplRedFlag,
  action: location.action,
  limit: location.limit,
  remarks: location.remarks,
  dateTime: location.dateTime,
  weatherWind: location.weatherWind,
  explanation: location.explanation,
  isExplanationNA: location.isExplanationNA,
  overallCompliance: location.overallCompliance,
});

const buildLegacyPortFromLocation = (
  location: LocationData,
  index = 0
): WaterPortData | null => {
  const hasDetails =
    [
      location.parameter,
      location.remarks,
      location.overallCompliance,
      location.dateTime,
      location.weatherWind,
    ].some((field) => !!field && String(field).trim().length > 0) ||
    (location.parameters?.length ?? 0) > 0;

  if (!hasDetails) {
    return null;
  }

  return {
    id: createHydrationId("port", index),
    portName: location.locationInput || `Port ${index + 1}`,
    parameter: location.parameter,
    resultType: location.resultType,
    tssCurrent: location.tssCurrent,
    tssPrevious: location.tssPrevious,
    mmtCurrent: location.mmtCurrent,
    mmtPrevious: location.mmtPrevious,
    isMMTNA: location.isMMTNA,
    eqplRedFlag: location.eqplRedFlag,
    action: location.action,
    limit: location.limit,
    remarks: location.remarks,
    dateTime: location.dateTime,
    weatherWind: location.weatherWind,
    explanation: location.explanation,
    isExplanationNA: location.isExplanationNA,
    additionalParameters: cloneWaterParameters(
      location.parameters,
      "port-param"
    ),
  };
};

const convertLegacyPortToLocationData = (
  port?: WaterPortData
): LocationData => {
  const location = createEmptyLocationData();
  if (!port) {
    location.parameters = [];
    return location;
  }
  location.locationInput = sanitizeString(port.portName);
  location.parameter = sanitizeString(port.parameter);
  location.resultType = sanitizeString(port.resultType) || "Month";
  location.tssCurrent = sanitizeString(port.tssCurrent);
  location.tssPrevious = sanitizeString(port.tssPrevious);
  location.mmtCurrent = sanitizeString(port.mmtCurrent);
  location.mmtPrevious = sanitizeString(port.mmtPrevious);
  location.isMMTNA = !!port.isMMTNA;
  location.eqplRedFlag = sanitizeString(port.eqplRedFlag);
  location.action = sanitizeString(port.action);
  location.limit = sanitizeString(port.limit);
  location.remarks = sanitizeString(port.remarks);
  location.dateTime = sanitizeString(port.dateTime);
  location.weatherWind = sanitizeString(port.weatherWind);
  location.explanation = sanitizeString(port.explanation);
  location.isExplanationNA = !!port.isExplanationNA;
  location.overallCompliance = "";
  location.parameters = cloneWaterParameters(
    port.additionalParameters,
    "legacy-port-param"
  );
  return location;
};

const convertLegacySectionToStore = (payload: {
  selectedLocations: { quarry: boolean; plant: boolean; quarryPlant: boolean };
  data: WaterQualityData;
  parameters: WaterParameter[];
  ports: WaterPortData[];
}) => {
  const quarry = sanitizeString(payload.data.quarryInput);
  const plant = sanitizeString(payload.data.plantInput);
  const quarryPlant = sanitizeString(payload.data.quarryPlantInput);

  const waterLocation = createEmptyLocationData();
  waterLocation.locationInput = quarry || plant || quarryPlant;
  waterLocation.parameter = sanitizeString(payload.data.parameter);
  waterLocation.resultType = sanitizeString(payload.data.resultType) || "Month";
  waterLocation.tssCurrent = sanitizeString(payload.data.tssCurrent);
  waterLocation.tssPrevious = sanitizeString(payload.data.tssPrevious);
  waterLocation.mmtCurrent = sanitizeString(payload.data.mmtCurrent);
  waterLocation.mmtPrevious = sanitizeString(payload.data.mmtPrevious);
  waterLocation.isMMTNA = !!payload.data.isMMTNA;
  waterLocation.eqplRedFlag = sanitizeString(payload.data.eqplRedFlag);
  waterLocation.action = sanitizeString(payload.data.action);
  waterLocation.limit = sanitizeString(payload.data.limit);
  waterLocation.remarks = sanitizeString(payload.data.remarks);
  waterLocation.dateTime = sanitizeString(payload.data.dateTime);
  waterLocation.weatherWind = sanitizeString(payload.data.weatherWind);
  waterLocation.explanation = sanitizeString(payload.data.explanation);
  waterLocation.isExplanationNA = !!payload.data.isExplanationNA;
  waterLocation.overallCompliance = sanitizeString(
    payload.data.overallCompliance
  );
  waterLocation.parameters = cloneWaterParameters(
    payload.parameters,
    "legacy-water-param"
  );

  const portLocation = convertLegacyPortToLocationData(payload.ports[0]);

  return {
    quarry,
    plant,
    quarryPlant,
    quarryEnabled: payload.selectedLocations.quarry,
    plantEnabled: payload.selectedLocations.plant,
    quarryPlantEnabled: payload.selectedLocations.quarryPlant,
    waterQuality: waterLocation,
    port: portLocation,
    data: payload.data,
    parameters: payload.parameters,
    ports: payload.ports,
  };
};

const normalizeWaterQualityFromApi = (
  raw: any
):
  | {
      quarry: string;
      plant: string;
      quarryPlant: string;
      quarryEnabled: boolean;
      plantEnabled: boolean;
      quarryPlantEnabled: boolean;
      waterQuality: LocationData;
      port: LocationData;
      data: WaterQualityData;
      parameters: WaterParameter[];
      ports: WaterPortData[];
    }
  | undefined => {
  if (!raw || typeof raw !== "object") {
    return undefined;
  }

  // Already in the new store shape
  if (
    raw.waterQuality &&
    raw.port &&
    raw.data &&
    Array.isArray(raw.parameters) &&
    Array.isArray(raw.ports)
  ) {
    return raw;
  }

  const hasNewStructure =
    raw.waterQuality ||
    raw.port ||
    raw.quarry ||
    raw.plant ||
    raw.quarryPlant ||
    raw.quarryAndPlant ||
    raw.quarryEnabled !== undefined ||
    raw.plantEnabled !== undefined ||
    raw.quarryPlantEnabled !== undefined;

  if (hasNewStructure) {
    const quarry = sanitizeString(raw.quarry);
    const plant = sanitizeString(raw.plant);
    const quarryPlant = sanitizeString(raw.quarryPlant ?? raw.quarryAndPlant);

    const waterLocation = buildLocationDataFromPayload(
      raw.waterQuality || raw.data || {},
      "water-quality"
    );
    const portLocation = buildLocationDataFromPayload(raw.port, "water-port");

    const legacyData = buildLegacyDataFromLocation(waterLocation, {
      quarry,
      plant,
      quarryPlant,
    });
    const legacyPort = buildLegacyPortFromLocation(portLocation, 0);

    return {
      quarry,
      plant,
      quarryPlant,
      quarryEnabled: raw.quarryEnabled ?? !!quarry,
      plantEnabled: raw.plantEnabled ?? !!plant,
      quarryPlantEnabled: raw.quarryPlantEnabled ?? !!quarryPlant,
      waterQuality: {
        ...waterLocation,
        parameters: cloneWaterParameters(
          waterLocation.parameters,
          "water-extra-param"
        ),
      },
      port: {
        ...portLocation,
        parameters: cloneWaterParameters(
          portLocation.parameters,
          "water-port-extra"
        ),
      },
      data: legacyData,
      parameters: cloneWaterParameters(
        waterLocation.parameters,
        "water-legacy-param"
      ),
      ports: legacyPort ? [legacyPort] : [],
    };
  }

  const data = createEmptyWaterQualityData();
  const extras: WaterParameter[] = [];
  const ports: WaterPortData[] = [];

  // Determine which locations are selected based on new structure
  const selectedLocations = {
    quarry: !!raw.quarry,
    plant: !!raw.plant,
    quarryPlant: !!raw.quarryAndPlant,
  };

  // Helper function to extract parameters from a location object
  const extractLocationData = (location: any) => {
    if (!location || typeof location !== "object") return null;

    const parameters = Array.isArray(location.parameters)
      ? location.parameters
      : [];
    const mappedParams = parameters.map((param: any, index: number) =>
      convertWaterBackendParam(param, "water-location", index)
    );

    return {
      parameters: mappedParams,
      samplingDate: sanitizeString(location.samplingDate),
      weatherAndWind: sanitizeString(location.weatherAndWind),
      explanationForConfirmatorySampling: sanitizeString(
        location.explanationForConfirmatorySampling
      ),
      overallAssessment: sanitizeString(location.overallAssessment),
    };
  };

  // Try to load from quarry first, then plant, then quarryAndPlant
  let primaryLocation = null;
  if (raw.quarry) {
    primaryLocation = extractLocationData(raw.quarry);
    data.quarryInput = "Quarry data present";
  } else if (raw.plant) {
    primaryLocation = extractLocationData(raw.plant);
    data.plantInput = "Plant data present";
  } else if (raw.quarryAndPlant) {
    primaryLocation = extractLocationData(raw.quarryAndPlant);
    data.quarryPlantInput = "Quarry and Plant data present";
  }

  // Populate main data from primary location
  if (primaryLocation) {
    const params = primaryLocation.parameters;
    if (params.length > 0) {
      const main = params[0];
      data.parameter = main.parameter;
      data.resultType = main.resultType;
      data.tssCurrent = main.tssCurrent;
      data.tssPrevious = main.tssPrevious;
      data.mmtCurrent = main.mmtCurrent ?? "";
      data.mmtPrevious = main.mmtPrevious ?? "";
      data.eqplRedFlag = main.eqplRedFlag;
      data.action = main.action;
      data.limit = main.limit;
      data.remarks = main.remarks;

      // Add additional parameters
      params.slice(1).forEach((param: any) => {
        extras.push(param);
      });
    }

    data.dateTime = primaryLocation.samplingDate;
    data.weatherWind = primaryLocation.weatherAndWind;
    data.explanation = primaryLocation.explanationForConfirmatorySampling;
    data.overallCompliance = primaryLocation.overallAssessment;
  }

  // Handle port data
  if (raw.port) {
    const portData = extractLocationData(raw.port);
    if (portData) {
      const portParams = portData.parameters;
      if (portParams.length > 0) {
        const [mainPortParam, ...additionalPortParams] = portParams;
        ports.push({
          id: createHydrationId("port", 0),
          portName: "Port",
          parameter: mainPortParam.parameter,
          resultType: mainPortParam.resultType,
          tssCurrent: mainPortParam.tssCurrent,
          tssPrevious: mainPortParam.tssPrevious,
          mmtCurrent: mainPortParam.mmtCurrent ?? "",
          mmtPrevious: mainPortParam.mmtPrevious ?? "",
          isMMTNA: false,
          eqplRedFlag: mainPortParam.eqplRedFlag,
          action: mainPortParam.action,
          limit: mainPortParam.limit,
          remarks: mainPortParam.remarks,
          dateTime: portData.samplingDate,
          weatherWind: portData.weatherAndWind,
          explanation: portData.explanationForConfirmatorySampling,
          isExplanationNA: !portData.explanationForConfirmatorySampling,
          additionalParameters: additionalPortParams,
        });
      }
    }
  }

  return convertLegacySectionToStore({
    selectedLocations,
    data,
    parameters: extras,
    ports,
  });
};

const normalizeNoiseQualityFromApi = (raw: any) => {
  if (!raw || typeof raw !== "object") {
    return undefined;
  }
  if (
    Array.isArray(raw.parameters) &&
    raw.parameters.every((param: any) => param?.id)
  ) {
    return raw;
  }
  const parametersSource = Array.isArray(raw.parameters) ? raw.parameters : [];
  const parameters: NoiseParameter[] =
    parametersSource.length > 0
      ? parametersSource.map((param: any, index: number) => ({
          id: param?.id || createHydrationId("noise-param", index),
          parameter: sanitizeString(param?.name ?? param?.parameter),
          isParameterNA: !!param?.isParameterNA,
          currentInSMR: sanitizeString(
            param?.results?.inSMR?.current ?? param?.currentInSMR
          ),
          previousInSMR: sanitizeString(
            param?.results?.inSMR?.previous ?? param?.previousInSMR
          ),
          mmtCurrent: sanitizeString(
            param?.results?.mmtConfirmatorySampling?.current ??
              param?.mmtCurrent
          ),
          mmtPrevious: sanitizeString(
            param?.results?.mmtConfirmatorySampling?.previous ??
              param?.mmtPrevious
          ),
          redFlag: sanitizeString(param?.eqpl?.redFlag ?? param?.redFlag),
          isRedFlagChecked: !!(param?.eqpl?.redFlag ?? param?.isRedFlagChecked),
          action: sanitizeString(param?.eqpl?.action ?? param?.action),
          isActionChecked: !!(param?.eqpl?.action ?? param?.isActionChecked),
          limit: sanitizeString(param?.eqpl?.denrStandard ?? param?.limit),
          isLimitChecked: !!(
            param?.eqpl?.denrStandard ?? param?.isLimitChecked
          ),
        }))
      : [
          {
            id: createHydrationId("noise-param", 0),
            parameter: "",
            isParameterNA: false,
            currentInSMR: "",
            previousInSMR: "",
            mmtCurrent: "",
            mmtPrevious: "",
            redFlag: "",
            isRedFlagChecked: false,
            action: "",
            isActionChecked: false,
            limit: "",
            isLimitChecked: false,
          },
        ];
  const overall = raw.overallAssessment || {};
  const quarters: QuarterData = {
    first: sanitizeString(overall.firstQuarter?.assessment),
    isFirstChecked: !!overall.firstQuarter?.assessment,
    second: sanitizeString(overall.secondQuarter?.assessment),
    isSecondChecked: !!overall.secondQuarter?.assessment,
    third: sanitizeString(overall.thirdQuarter?.assessment),
    isThirdChecked: !!overall.thirdQuarter?.assessment,
    fourth: sanitizeString(overall.fourthQuarter?.assessment),
    isFourthChecked: !!overall.fourthQuarter?.assessment,
  };
  return {
    hasInternalNoise: !!raw.hasInternalNoise,
    uploadedFiles: Array.isArray(raw.uploadedFiles) ? raw.uploadedFiles : [],
    parameters,
    remarks: sanitizeString(raw.remarks),
    dateTime: sanitizeString(raw.samplingDate ?? raw.dateTime),
    weatherWind: sanitizeString(raw.weatherAndWind),
    explanation: sanitizeString(raw.explanationForConfirmatorySampling),
    explanationNA: !!raw.explanationNA,
    quarters,
  };
};

const createEmptyWasteSection = (prefix: string): PlantPortSectionData => ({
  eccEpepCommitments: [
    {
      id: createHydrationId(`${prefix}-waste`, 0),
      typeOfWaste: "",
      handling: "",
      storage: "",
      disposal: "",
    },
  ],
  isAdequate: null,
  previousRecord: "",
  currentQuarterWaste: "",
});

const normalizeWasteManagementFromApi = (
  raw: any
):
  | {
      selectedQuarter: string;
      quarryData: QuarrySectionData;
      quarryPlantData: PlantPortSectionData;
      plantSimpleData: PlantSectionData;
      plantData: PlantPortSectionData;
      portData: PortSectionData;
      portPlantData: PlantPortSectionData;
    }
  | undefined => {
  if (!raw || typeof raw !== "object") {
    return undefined;
  }
  if (
    raw.quarryData ||
    raw.quarryPlantData ||
    raw.plantData ||
    raw.portPlantData
  ) {
    return {
      selectedQuarter: raw.selectedQuarter ?? "Q2",
      quarryData: raw.quarryData ?? {
        noSignificantImpact: false,
        generateTable: false,
        N_A: false,
      },
      quarryPlantData: raw.quarryPlantData ?? createEmptyWasteSection("quarry"),
      plantSimpleData: raw.plantSimpleData ?? {
        noSignificantImpact: false,
        generateTable: false,
        N_A: false,
      },
      plantData: raw.plantData ?? createEmptyWasteSection("plant"),
      portData: raw.portData ?? {
        noSignificantImpact: false,
        generateTable: false,
        N_A: false,
      },
      portPlantData: raw.portPlantData ?? createEmptyWasteSection("port"),
    };
  }
  const result = {
    selectedQuarter: raw.selectedQuarter ?? "Q2",
    quarryData: {
      noSignificantImpact: false,
      generateTable: false,
      N_A: false,
    },
    quarryPlantData: createEmptyWasteSection("quarry"),
    plantSimpleData: {
      noSignificantImpact: false,
      generateTable: false,
      N_A: false,
    },
    plantData: createEmptyWasteSection("plant"),
    portData: { noSignificantImpact: false, generateTable: false, N_A: false },
    portPlantData: createEmptyWasteSection("port"),
  };
  const assignFlags = (
    source: any,
    target: {
      noSignificantImpact: boolean;
      generateTable: boolean;
      N_A: boolean;
    },
    sectionTarget: PlantPortSectionData,
    sectionKey: "quarry" | "plant" | "port"
  ) => {
    if (!source) {
      return;
    }
    if (Array.isArray(source)) {
      target.noSignificantImpact = false;
      target.N_A = false;
      target.generateTable = true;
      if (!source.length) {
        return;
      }
      const formatted: WasteEntry[] = source.map(
        (entry: any, index: number) => ({
          id: createHydrationId(`${sectionKey}-entry`, index),
          typeOfWaste: sanitizeString(entry?.typeOfWaste ?? ""),
          handling: sanitizeString(
            entry?.eccEpepCommitments?.handling ?? entry?.handling
          ),
          storage: sanitizeString(
            entry?.eccEpepCommitments?.storage ?? entry?.storage
          ),
          disposal: sanitizeString(
            entry?.eccEpepCommitments?.disposal == null
              ? ""
              : entry.eccEpepCommitments.disposal
                ? "Yes"
                : "No"
          ),
        })
      );
      const adequate = source[0]?.adequate;
      sectionTarget.isAdequate = adequate?.y
        ? "YES"
        : adequate?.n
          ? "NO"
          : sectionTarget.isAdequate;
      sectionTarget.previousRecord = sanitizeString(
        source[0]?.previousRecord ?? sectionTarget.previousRecord
      );
      sectionTarget.currentQuarterWaste = sanitizeString(
        source[0]?.q2_2025_Generated_HW ??
          source[0]?.currentQuarterWaste ??
          sectionTarget.currentQuarterWaste
      );
      sectionTarget.eccEpepCommitments = formatted;
    } else if (typeof source === "string") {
      const normalized = source.toLowerCase();
      if (normalized.includes("n/a") || normalized === "na") {
        target.N_A = true;
        target.noSignificantImpact = false;
        target.generateTable = false;
      } else if (normalized.includes("no significant")) {
        target.noSignificantImpact = true;
        target.N_A = false;
        target.generateTable = false;
      }
    }
  };
  assignFlags(raw.quarry, result.quarryData, result.quarryPlantData, "quarry");
  assignFlags(raw.plant, result.plantSimpleData, result.plantData, "plant");
  assignFlags(raw.port, result.portData, result.portPlantData, "port");
  return result;
};

const toChemicalYesNo = (value: any): ChemicalYesNoNull => {
  if (typeof value === "string") {
    const normalized = value.trim().toUpperCase();
    if (normalized === "YES" || normalized === "Y" || normalized === "TRUE") {
      return "YES";
    }
    if (normalized === "NO" || normalized === "N" || normalized === "FALSE") {
      return "NO";
    }
  }
  if (value === true) {
    return "YES";
  }
  if (value === false) {
    return "NO";
  }
  return null;
};

const normalizeChemicalSafetyFromApi = (
  raw: any
):
  | {
      chemicalSafety: ChemicalSafetyData;
      healthSafetyChecked: boolean;
      socialDevChecked: boolean;
    }
  | undefined => {
  if (!raw || typeof raw !== "object") {
    return undefined;
  }
  if (raw.chemicalSafety) {
    return {
      chemicalSafety: {
        ...raw.chemicalSafety,
      },
      healthSafetyChecked: !!raw.healthSafetyChecked,
      socialDevChecked: !!raw.socialDevChecked,
    };
  }
  const chemicalSafetySource = raw || {};
  const chemicalSafety: ChemicalSafetyData = {
    isNA: !!chemicalSafetySource.isNA,
    riskManagement: toChemicalYesNo(chemicalSafetySource.riskManagement),
    training: toChemicalYesNo(chemicalSafetySource.training),
    handling: toChemicalYesNo(chemicalSafetySource.handling),
    emergencyPreparedness: toChemicalYesNo(
      chemicalSafetySource.emergencyPreparedness
    ),
    remarks: sanitizeString(chemicalSafetySource.remarks),
    chemicalCategory: (sanitizeString(chemicalSafetySource.chemicalCategory) ||
      null) as ChemicalCategory,
    othersSpecify: sanitizeString(chemicalSafetySource.othersSpecify),
  };
  return {
    chemicalSafety,
    healthSafetyChecked: !!raw.healthSafetyChecked,
    socialDevChecked: !!raw.socialDevChecked,
  };
};

const normalizeComplaintsListFromApi = (raw: any): Complaint[] | undefined => {
  if (!Array.isArray(raw)) {
    return undefined;
  }
  return raw.map((item: any, index: number) => ({
    id: item?.id || createHydrationId("complaint", index),
    isNA: !!item?.isNA,
    dateFiled: sanitizeString(item?.dateFiled),
    filedLocation: (item?.filedLocation as Complaint["filedLocation"]) || null,
    othersSpecify: sanitizeString(item?.othersSpecify),
    nature: sanitizeString(item?.nature),
    resolutions: sanitizeString(item?.resolutions),
  }));
};

const normalizeComplianceMonitoringReportFromApi = (
  raw: any
): Partial<DraftSnapshot> => {
  if (!raw || typeof raw !== "object") {
    return {};
  }
  const result: Partial<DraftSnapshot> = {};
  if (raw.complianceToProjectLocationAndCoverageLimits?.formData) {
    result.complianceToProjectLocationAndCoverageLimits =
      raw.complianceToProjectLocationAndCoverageLimits;
  } else {
    const plcl = normalizeProjectLocationFromApi(
      raw.complianceToProjectLocationAndCoverageLimits
    );
    if (plcl) {
      result.complianceToProjectLocationAndCoverageLimits = plcl;
    }
  }
  if (raw.complianceToImpactManagementCommitments?.quarryOperation) {
    result.complianceToImpactManagementCommitments =
      raw.complianceToImpactManagementCommitments;
  } else {
    const impact = normalizeImpactCommitmentsFromApi(
      raw.complianceToImpactManagementCommitments
    );
    if (impact) {
      result.complianceToImpactManagementCommitments = impact;
    }
  }
  const air = normalizeAirQualityFromApi(raw.airQualityImpactAssessment);
  if (air) {
    result.airQualityImpactAssessment = air;
  }
  const water = normalizeWaterQualityFromApi(raw.waterQualityImpactAssessment);
  if (water) {
    result.waterQualityImpactAssessment = water;
  }
  const noise = normalizeNoiseQualityFromApi(raw.noiseQualityImpactAssessment);
  if (noise) {
    result.noiseQualityImpactAssessment = noise;
  }
  const waste = normalizeWasteManagementFromApi(
    raw.complianceWithGoodPracticeInSolidAndHazardousWasteManagement
  );
  if (waste) {
    result.complianceWithGoodPracticeInSolidAndHazardousWasteManagement = waste;
  }
  const chemical = normalizeChemicalSafetyFromApi(
    raw.complianceWithGoodPracticeInChemicalSafetyManagement
  );
  if (chemical) {
    result.complianceWithGoodPracticeInChemicalSafetyManagement = chemical;
  }
  const complaints = normalizeComplaintsListFromApi(
    raw.complaintsVerificationAndManagement
  );
  if (complaints) {
    result.complaintsVerificationAndManagement = complaints;
  }
  if (raw.recommendationFromPrevQuarter) {
    result.recommendationFromPrevQuarter = raw.recommendationFromPrevQuarter;
  }
  if (raw.recommendationForNextQuarter) {
    result.recommendationForNextQuarter = raw.recommendationForNextQuarter;
  }
  if (raw.recommendationsData) {
    result.recommendationsData = raw.recommendationsData;
  }
  return result;
};

const buildCreateCMVRPayload = (
  snapshot: DraftSnapshot,
  options: {
    recommendationsData?: RecommendationsData;
    attendanceId?: string;
    attachments?: Array<{ path: string; caption?: string }>;
  } = {},
  userId?: string
): CreateCMVRDto => {
  const norm: DraftSnapshot = snapshot.complianceMonitoringReport
    ? ({
        ...snapshot,
        ...(snapshot.complianceMonitoringReport as any),
      } as DraftSnapshot)
    : snapshot;
  const generalInfo = norm.generalInfo ?? defaultGeneralInfo;
  const eccEntries = buildEccEntries(
    norm.eccInfo ?? defaultEccInfo,
    norm.eccAdditionalForms ?? []
  );
  const isagEntries = buildIsagEntries(
    norm.isagInfo ?? defaultIsagInfo,
    norm.isagAdditionalForms ?? []
  );
  const epepEntries = buildEpepEntries(
    norm.epepInfo ?? defaultEpepInfo,
    norm.epepAdditionalForms ?? []
  );
  const rcfEntries = buildFundEntries(
    norm.rcfInfo ?? defaultFundInfo,
    norm.rcfAdditionalForms ?? []
  );
  const mtfEntries = buildFundEntries(
    norm.mtfInfo ?? defaultFundInfo,
    norm.mtfAdditionalForms ?? []
  );
  const fmrdfEntries = buildFundEntries(
    norm.fmrdfInfo ?? defaultFundInfo,
    norm.fmrdfAdditionalForms ?? []
  );
  const proponentInfo = norm.isagInfo ?? defaultIsagInfo;
  const mmtInfo = norm.mmtInfo ?? defaultMmtInfo;
  const payload: CreateCMVRDto = {
    companyName: sanitizeString(generalInfo.companyName) || "Untitled Company",
    location: buildLocationString(generalInfo),
    quarter: sanitizeString(generalInfo.quarter) || "1st",
    year: toNumberOrYear(generalInfo.year),
    dateOfComplianceMonitoringAndValidation: sanitizeString(
      generalInfo.dateOfCompliance
    ),
    monitoringPeriodCovered: sanitizeString(generalInfo.monitoringPeriod),
    dateOfCmrSubmission: sanitizeString(generalInfo.dateOfCMRSubmission),
    ecc: eccEntries,
    isagMpp: isagEntries,
    projectCurrentName:
      sanitizeString(proponentInfo.currentName) ||
      sanitizeString(generalInfo.projectName),
    projectNameInEcc:
      sanitizeString(proponentInfo.nameInECC) ||
      sanitizeString(generalInfo.projectName),
    projectStatus: sanitizeString(proponentInfo.projectStatus),
    projectGeographicalCoordinates: buildCoordinatesString(proponentInfo),
    proponent: {
      contactPersonAndPosition:
        sanitizeString(proponentInfo.proponentContact) ||
        sanitizeString(proponentInfo.proponentName),
      mailingAddress: sanitizeString(proponentInfo.proponentAddress),
      telephoneFax: sanitizeString(proponentInfo.proponentPhone),
      emailAddress: sanitizeString(proponentInfo.proponentEmail),
    },
    mmt: {
      contactPersonAndPosition: sanitizeString(mmtInfo.contactPerson),
      mailingAddress: sanitizeString(mmtInfo.mailingAddress),
      telephoneFax: sanitizeString(mmtInfo.phoneNumber),
      emailAddress: sanitizeString(mmtInfo.emailAddress),
    },
    epepFmrdpStatus: (norm.epepInfo?.isNA ?? false) ? "N/A" : "Approved",
    epep: epepEntries,
    rehabilitationCashFund: rcfEntries,
    monitoringTrustFundUnified: mtfEntries,
    finalMineRehabilitationAndDecommissioningFund: fmrdfEntries,
  };
  if (Array.isArray(norm.permitHolderList)) {
    const cleaned = norm.permitHolderList
      .map((holder) => sanitizeString(holder))
      .filter((holder) => holder.length > 0);
    if (cleaned.length > 0) {
      payload.permitHolderList = cleaned;
    }
  }
  if (userId) {
    payload.createdById = userId;
  }
  if (norm.executiveSummaryOfCompliance) {
    payload.executiveSummaryOfCompliance = transformExecutiveSummaryForPayload(
      norm.executiveSummaryOfCompliance
    );
  }
  // ✅ FIX: Add Compliance Monitoring Report Discussion to payload
  if (norm.complianceMonitoringReportDiscussion) {
    payload.complianceMonitoringReportDiscussion = norm.complianceMonitoringReportDiscussion;
  }
  if (norm.processDocumentationOfActivitiesUndertaken) {
    payload.processDocumentationOfActivitiesUndertaken =
      transformProcessDocumentationForPayload(
        norm.processDocumentationOfActivitiesUndertaken
      );
  }
  const complianceMonitoringReport: any = {};
  let hasComplianceData = false;
  let hasPLCL = false;
  let hasImpact = false;
  let hasAir = false;
  let hasWater = false;

  if (norm.complianceToProjectLocationAndCoverageLimits) {
    const transformedPLCL = transformProjectLocationCoverageForPayload(
      norm.complianceToProjectLocationAndCoverageLimits
    );

    // Backfill uploadedImages if transformer didn't capture them
    if (
      transformedPLCL &&
      !transformedPLCL.uploadedImages &&
      norm.complianceToProjectLocationAndCoverageLimits.uploadedImages
    ) {
      transformedPLCL.uploadedImages = Object.fromEntries(
        Object.entries(
          norm.complianceToProjectLocationAndCoverageLimits
            .uploadedImages as Record<string, string | undefined>
        )
          .map(([k, v]) => [k.trim(), (v ?? "").trim()])
          .filter(([, v]) => v)
      );
    }

    complianceMonitoringReport.complianceToProjectLocationAndCoverageLimits =
      transformedPLCL;
    hasComplianceData = true;
    hasPLCL = true;
  }

  if (norm.complianceToImpactManagementCommitments) {
    complianceMonitoringReport.complianceToImpactManagementCommitments =
      transformImpactCommitmentsForPayload(
        norm.complianceToImpactManagementCommitments
      );
    hasComplianceData = true;
    hasImpact = true;
  }
  if (norm.airQualityImpactAssessment) {
    complianceMonitoringReport.airQualityImpactAssessment =
      transformAirQualityForPayload(norm.airQualityImpactAssessment);
    hasComplianceData = true;
    hasAir = true;
  }
  if (norm.waterQualityImpactAssessment) {
    complianceMonitoringReport.waterQualityImpactAssessment =
      transformWaterQualityForPayload(norm.waterQualityImpactAssessment);
    hasComplianceData = true;
    hasWater = true;
  }

  if (norm.noiseQualityImpactAssessment) {
    const transformedNoise = transformNoiseQualityForPayload(
      norm.noiseQualityImpactAssessment
    );

    // Backfill uploadedFiles if transformer didn't capture them
    if (
      transformedNoise &&
      (!transformedNoise.uploadedFiles ||
        transformedNoise.uploadedFiles.length === 0) &&
      Array.isArray(norm.noiseQualityImpactAssessment.uploadedFiles)
    ) {
      transformedNoise.uploadedFiles =
        norm.noiseQualityImpactAssessment.uploadedFiles
          .map((file: any) => {
            const storagePath =
              typeof file?.storagePath === "string"
                ? file.storagePath.trim()
                : undefined;
            const uri =
              typeof file?.uri === "string" ? file.uri.trim() : undefined;
            if (!storagePath && !uri) return null;

            const name =
              typeof file?.name === "string" && file.name.trim()
                ? file.name.trim()
                : storagePath?.split("/").pop();

            const size =
              typeof file?.size === "number"
                ? file.size
                : Number.isFinite(Number(file?.size))
                  ? Number(file.size)
                  : undefined;

            const mimeType =
              typeof file?.mimeType === "string" && file.mimeType.trim()
                ? file.mimeType.trim()
                : undefined;

            return { uri, name, size, mimeType, storagePath };
          })
          .filter(Boolean);
    }

    complianceMonitoringReport.noiseQualityImpactAssessment = transformedNoise;
    hasComplianceData = true;
  }
  if (norm.complianceWithGoodPracticeInSolidAndHazardousWasteManagement) {
    complianceMonitoringReport.complianceWithGoodPracticeInSolidAndHazardousWasteManagement =
      transformWasteManagementForPayload(
        norm.complianceWithGoodPracticeInSolidAndHazardousWasteManagement
      );
    hasComplianceData = true;
  }
  if (norm.complianceWithGoodPracticeInChemicalSafetyManagement) {
    complianceMonitoringReport.complianceWithGoodPracticeInChemicalSafetyManagement =
      transformChemicalSafetyForPayload(
        norm.complianceWithGoodPracticeInChemicalSafetyManagement
      );
    hasComplianceData = true;
  }
  if (norm.complaintsVerificationAndManagement) {
    complianceMonitoringReport.complaintsVerificationAndManagement =
      transformComplaintsForPayload(norm.complaintsVerificationAndManagement);
    hasComplianceData = true;
  }
  // Prioritize recommendationsData from store (frontend format) over backend format
  if (
    options.recommendationsData?.previousRecommendations ||
    norm.recommendationFromPrevQuarter
  ) {
    const transformedPrevRecommendations = transformRecommendationsForPayload(
      options.recommendationsData?.previousRecommendations,
      options.recommendationsData?.prevQuarter,
      options.recommendationsData?.prevYear
    );
    
    // Clean up norm.recommendationFromPrevQuarter to remove empty items
    let cleanedPrevRecommendations = norm.recommendationFromPrevQuarter;
    if (cleanedPrevRecommendations && typeof cleanedPrevRecommendations === 'object') {
      const cleaned: any = { ...cleanedPrevRecommendations };
      // Filter out empty items from each section (plant, quarry, port)
      ['plant', 'quarry', 'port'].forEach((section) => {
        if (Array.isArray(cleaned[section])) {
          cleaned[section] = cleaned[section].filter((item: any) => {
            if (!item || typeof item !== 'object') return false;
            // Keep item if at least one field has content
            return (
              (item.recommendation && String(item.recommendation).trim()) ||
              (item.commitment && String(item.commitment).trim()) ||
              (item.status && String(item.status).trim())
            );
          });
          // Remove section if it's now empty
          if (cleaned[section].length === 0) {
            delete cleaned[section];
          }
        }
      });
      // Only use cleaned if it has at least one non-empty section
      const hasData = Object.keys(cleaned).some(
        (key) => key !== 'quarter' && key !== 'year' && Array.isArray(cleaned[key]) && cleaned[key].length > 0
      );
      cleanedPrevRecommendations = hasData ? cleaned : undefined;
    }
    
    // Prioritize transformed data from store (recommendationsData) over backend format
    complianceMonitoringReport.recommendationFromPrevQuarter =
      transformedPrevRecommendations || cleanedPrevRecommendations;
    if (complianceMonitoringReport.recommendationFromPrevQuarter) {
      hasComplianceData = true;
    }
  }
  // Prioritize recommendationsData from store (frontend format) over backend format
  if (
    options.recommendationsData?.currentRecommendations ||
    norm.recommendationForNextQuarter
  ) {
    const transformedRecommendations = transformRecommendationsForPayload(
      options.recommendationsData?.currentRecommendations,
      generalInfo.quarter,
      generalInfo.year
    );
    
    // Clean up norm.recommendationForNextQuarter to remove empty items
    let cleanedNextRecommendations = norm.recommendationForNextQuarter;
    if (cleanedNextRecommendations && typeof cleanedNextRecommendations === 'object') {
      const cleaned: any = { ...cleanedNextRecommendations };
      // Filter out empty items from each section (plant, quarry, port)
      ['plant', 'quarry', 'port'].forEach((section) => {
        if (Array.isArray(cleaned[section])) {
          cleaned[section] = cleaned[section].filter((item: any) => {
            if (!item || typeof item !== 'object') return false;
            // Keep item if at least one field has content
            return (
              (item.recommendation && String(item.recommendation).trim()) ||
              (item.commitment && String(item.commitment).trim()) ||
              (item.status && String(item.status).trim())
            );
          });
          // Remove section if it's now empty
          if (cleaned[section].length === 0) {
            delete cleaned[section];
          }
        }
      });
      // Only use cleaned if it has at least one non-empty section
      const hasData = Object.keys(cleaned).some(
        (key) => key !== 'quarter' && key !== 'year' && Array.isArray(cleaned[key]) && cleaned[key].length > 0
      );
      cleanedNextRecommendations = hasData ? cleaned : undefined;
    }
    
    // Prioritize transformed data from store (recommendationsData) over backend format
    complianceMonitoringReport.recommendationForNextQuarter =
      transformedRecommendations || cleanedNextRecommendations;
    if (complianceMonitoringReport.recommendationForNextQuarter) {
      hasComplianceData = true;
    }
  }
  // Relax gating: allow payload to include complianceMonitoringReport with any populated section
  if (hasComplianceData) {
    payload.complianceMonitoringReport = complianceMonitoringReport;
  }
  const payloadAttendanceId =
    options.attendanceId ??
    (typeof norm.attendanceId === "string" && norm.attendanceId
      ? norm.attendanceId
      : typeof norm.attendanceUrl === "string"
        ? norm.attendanceUrl
        : undefined);
  if (payloadAttendanceId) {
    payload.attendanceId = payloadAttendanceId;
  }

  // ✅ FIX: Add ECC Conditions attachment from separate field (not air quality)
  if (norm.eccConditionsAttachment?.uploadedEccFile) {
    const eccFile = norm.eccConditionsAttachment.uploadedEccFile;
    payload.eccConditionsAttachment = {
      fileName: eccFile.name || "ECC Conditions Document",
      fileUrl: eccFile.publicUrl || eccFile.uri || null,
      mimeType: eccFile.mimeType || null,
      storagePath: eccFile.storagePath || null,
    };
  }

  // Add attachments if provided
  if (options.attachments && options.attachments.length > 0) {
    const formattedAttachments = options.attachments
      .filter((a) => !!a.path)
      .map((a) => ({ path: a.path, caption: a.caption || undefined }));
    payload.attachments = formattedAttachments;
  }

  return payload;
};

type CMVRDocumentExportScreenNavigationProp = NativeStackNavigationProp<
  Record<string, object | undefined>,
  string
>;

type CMVRDocumentExportScreenRouteProp = RouteProp<
  RootStackParamList,
  "CMVRDocumentExport"
>;

const CMVRDocumentExportScreen = () => {
  const navigation = useNavigation<CMVRDocumentExportScreenNavigationProp>();
  const route = useRoute<CMVRDocumentExportScreenRouteProp>();
  const { user } = useAuth();
  const { fileName: contextFileName } = useFileName();

  // **ZUSTAND STORE** - Single source of truth for CMVR data
  const {
    currentReport,
    fileName: storeFileName,
    submissionId: storeSubmissionId,
    projectId: storeProjectId,
    editedSections = [],
    submitReport,
    updateSubmittedReport,
    deleteDraft,
    loadDraft,
    loadReport,
    markAsClean,
    saveDraft,
    updateMetadata,
    setCreatedById,
    updateMultipleSections,
    fillAllTestData,
  } = useCmvrStore();

  const routeParams = route.params ?? {};
  const {
    cmvrReportId: routeReportId,
    fileName: routeFileName,
    selectedAttendanceId: routeSelectedAttendanceId,
    selectedAttendanceTitle: routeSelectedAttendanceTitle,
    projectId: routeProjectId,
    projectName: routeProjectName,
  } = routeParams;
  const routeDraftUpdate = useMemo(
    () =>
      ((routeParams as any)?.draftData &&
      typeof (routeParams as any).draftData === "object"
        ? ((routeParams as any).draftData as Partial<DraftSnapshot>)
        : {}) ?? {},
    [routeParams]
  );

  // Extract attachments safely
  const routeAttachments = (routeParams as any).attachments;
  const routeNewlyUploadedPaths = (routeParams as any).newlyUploadedPaths;

  const editedSectionSet = useMemo(
    () => new Set(editedSections ?? []),
    [editedSections]
  );

  const isSectionEdited = useCallback(
    (sections?: string | string[]) => {
      if (!sections || editedSectionSet.size === 0) {
        return false;
      }

      const sectionList = Array.isArray(sections) ? sections : [sections];
      return sectionList.some(
        (section) => section && editedSectionSet.has(section)
      );
    },
    [editedSectionSet]
  );

  const resolvedFileName = useMemo(
    () =>
      storeFileName ||
      routeFileName?.trim() ||
      contextFileName?.trim() ||
      "CMVR_Report",
    [storeFileName, routeFileName, contextFileName]
  );

  // Local UI state only (not data state)
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(!!storeSubmissionId);
  const [submittedReportId, setSubmittedReportId] = useState<string | null>(
    storeSubmissionId
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [attachments, setAttachments] = useState<
    { uri: string; path?: string; uploading?: boolean; caption?: string }[]
  >([]);
  const [newlyUploadedPaths, setNewlyUploadedPaths] = useState<string[]>([]);
  const [draftSnapshot, setDraftSnapshot] = useState<DraftSnapshot | null>(
    null
  );
  const [attendanceRecordInfo, setAttendanceRecordInfo] = useState<{
    id: string;
    label?: string;
  } | null>(() =>
    routeSelectedAttendanceId
      ? {
          id: routeSelectedAttendanceId,
          label: routeSelectedAttendanceTitle ?? undefined,
        }
      : null
  );

  // Detect if there are changes between currentReport and draftSnapshot
  const hasChanges = useMemo(() => {
    if (!currentReport || !draftSnapshot) return false;

    // Deep compare currentReport with draftSnapshot
    return JSON.stringify(currentReport) !== JSON.stringify(draftSnapshot);
  }, [currentReport, draftSnapshot]);

  const attendanceIdFromStore = currentReport?.attendanceId ?? null;
  const legacyAttendanceId = currentReport?.attendanceUrl ?? null;
  const storedAttendanceId =
    attendanceIdFromStore ?? legacyAttendanceId ?? null;
  const resolvedAttendanceId =
    routeSelectedAttendanceId ?? storedAttendanceId ?? null;

  const loadStoredDraft =
    useCallback(async (): Promise<DraftSnapshot | null> => {
      try {
        const stored = await AsyncStorage.getItem(DRAFT_KEY);
        return stored ? (JSON.parse(stored) as DraftSnapshot) : null;
      } catch (error) {
        console.warn("Failed to load CMVR draft snapshot:", error);
        return null;
      }
    }, []);

  // Handle loadDraft parameter from dashboard
  useEffect(() => {
    const shouldLoadDraft = (routeParams as any)?.loadDraft === true;
    if (shouldLoadDraft) {
      console.log("Loading CMVR draft from store...");
      loadDraft();
    }
  }, [routeParams, loadDraft]);

  // Handle incoming attachments from CMVRAttachmentsScreen
  useEffect(() => {
    if (routeAttachments && Array.isArray(routeAttachments)) {
      console.log("Loading attachments from route:", routeAttachments);
      const formattedAttachments = routeAttachments.map((att: any) => ({
        uri: att.path || "",
        path: att.path || "",
        caption: att.caption || "",
        uploading: false,
      }));
      setAttachments(formattedAttachments);
    }
    if (routeNewlyUploadedPaths && Array.isArray(routeNewlyUploadedPaths)) {
      setNewlyUploadedPaths(routeNewlyUploadedPaths);
    }
  }, [routeAttachments, routeNewlyUploadedPaths]);

  // ✅ FIX: Load attachments from store when reopening draft/submitted report
  useEffect(() => {
    if (currentReport?.attachments && Array.isArray(currentReport.attachments) && currentReport.attachments.length > 0) {
      // Only load if we don't already have attachments from route params
      if (!routeAttachments || !Array.isArray(routeAttachments) || routeAttachments.length === 0) {
        console.log("Loading attachments from store:", currentReport.attachments);
        const formattedAttachments = currentReport.attachments.map((att: any) => ({
          uri: att.path || att.uri || "",
          path: att.path || att.uri || "",
          caption: att.caption || "",
          uploading: false,
        }));
        setAttachments(formattedAttachments);
      }
    }
  }, [currentReport?.attachments, routeAttachments]);

  // ✅ FIX: Sync attachments to store whenever they change
  useEffect(() => {
    if (attachments.length > 0 || (currentReport?.attachments && currentReport.attachments.length > 0)) {
      // Convert local attachments format to store format
      const storeAttachments = attachments.map((att) => ({
        path: att.path || att.uri || "",
        caption: att.caption || "",
      }));
      
      // Only update if different from current store value
      const currentStoreAttachments = currentReport?.attachments || [];
      const isDifferent = JSON.stringify(storeAttachments) !== JSON.stringify(currentStoreAttachments);
      
      if (isDifferent) {
        console.log("Syncing attachments to store:", storeAttachments.length, "items");
        updateMultipleSections({ attachments: storeAttachments });
      }
    }
  }, [attachments, updateMultipleSections]);

  // Keep attendance metadata in sync with latest selection routed back from AttendanceList
  useEffect(() => {
    if (!routeSelectedAttendanceId) {
      return;
    }
    setAttendanceRecordInfo({
      id: routeSelectedAttendanceId,
      label: routeSelectedAttendanceTitle ?? undefined,
    });
  }, [routeSelectedAttendanceId, routeSelectedAttendanceTitle]);

  // Reset local attendance metadata if selection is cleared
  useEffect(() => {
    if (!resolvedAttendanceId) {
      setAttendanceRecordInfo(null);
    }
  }, [resolvedAttendanceId]);

  // Hydrate attendance metadata when loading an existing report
  useEffect(() => {
    if (!resolvedAttendanceId) {
      return;
    }

    const alreadyHasLabel =
      attendanceRecordInfo &&
      attendanceRecordInfo.id === resolvedAttendanceId &&
      attendanceRecordInfo.label;

    if (alreadyHasLabel) {
      return;
    }

    if (
      routeSelectedAttendanceId &&
      routeSelectedAttendanceId === resolvedAttendanceId &&
      routeSelectedAttendanceTitle
    ) {
      return;
    }

    let isMounted = true;
    const fetchAttendanceDetails = async () => {
      try {
        const record = await apiGet<AttendanceRecordSummary>(
          `/attendance/${resolvedAttendanceId}`
        );
        if (!isMounted || !record) {
          return;
        }
        setAttendanceRecordInfo({
          id: resolvedAttendanceId,
          label:
            record.title ||
            record.fileName ||
            record.meetingDate ||
            `Attendance ${resolvedAttendanceId.slice(0, 8)}`,
        });
      } catch (error) {
        console.warn("Failed to fetch attendance record metadata:", error);
      }
    };

    fetchAttendanceDetails();

    return () => {
      isMounted = false;
    };
  }, [
    resolvedAttendanceId,
    routeSelectedAttendanceId,
    routeSelectedAttendanceTitle,
    attendanceRecordInfo,
  ]);

  // Persist any newly selected attendance record into the CMVR store state
  useEffect(() => {
    if (!routeSelectedAttendanceId) {
      return;
    }
    if (routeSelectedAttendanceId === storedAttendanceId) {
      return;
    }

    updateMultipleSections({ attendanceId: routeSelectedAttendanceId });
    setDraftSnapshot((prev) =>
      prev
        ? {
            ...prev,
            attendanceId: routeSelectedAttendanceId,
            attendanceUrl: routeSelectedAttendanceId,
          }
        : prev
    );
  }, [routeSelectedAttendanceId, storedAttendanceId, updateMultipleSections]);

  useEffect(() => {
    let isActive = true;
    const hydrateDraft = async () => {
      let updates: Partial<DraftSnapshot> = {};
      if (routeReportId) {
        try {
          console.log("Fetching CMVR report from API:", routeReportId);
          const { getCMVRReportById } = await import("../../lib/cmvr");
          const reportData = await getCMVRReportById(routeReportId);
          if (reportData && isActive) {
            const sourceGeneralInfo =
              reportData.generalInfo &&
              typeof reportData.generalInfo === "object"
                ? (reportData.generalInfo as Record<string, unknown>)
                : undefined;
            const locationSource =
              typeof reportData.location === "string"
                ? reportData.location
                : (reportData.location?.barangay as string) || "";
            const locationFields = parseLocationComponents(
              (sourceGeneralInfo?.location as string) || locationSource
            );
            const { primary: eccPrimary, additional: eccAdditional } =
              mapEccEntriesToForm(reportData.ecc);
            const { primary: isagPrimaryBase, additional: isagAdditional } =
              mapIsagEntriesToForm(
                reportData.isagMpp,
                reportData.projectCurrentName || reportData.projectNameInEcc
              );
            const { primary: epepPrimary, additional: epepAdditional } =
              mapEpepEntriesToForm(reportData.epep);
            const { primary: rcfPrimary, additional: rcfAdditional } =
              mapFundEntriesToForm(reportData.rehabilitationCashFund);
            const { primary: mtfPrimary, additional: mtfAdditional } =
              mapFundEntriesToForm(reportData.monitoringTrustFundUnified);
            const { primary: fmrdfPrimary, additional: fmrdfAdditional } =
              mapFundEntriesToForm(
                reportData.finalMineRehabilitationAndDecommissioningFund
              );
            const coords = parseCoordinateFields(
              sanitizeString(reportData.projectGeographicalCoordinates)
            );
            const proponentInfoSource = reportData.proponent || {};
            const mmtSource = reportData.mmt || {};
            const isagPrimary: ISAGInfo = {
              ...isagPrimaryBase,
              isNA: isagPrimaryBase.isNA,
              currentName:
                sanitizeString(reportData.projectCurrentName) ||
                isagPrimaryBase.currentName,
              nameInECC:
                sanitizeString(reportData.projectNameInEcc) ||
                isagPrimaryBase.nameInECC,
              projectStatus: sanitizeString(reportData.projectStatus),
              gpsX: coords.gpsX,
              gpsY: coords.gpsY,
              proponentName: sanitizeString(
                proponentInfoSource.contactPersonAndPosition
              ),
              proponentContact: sanitizeString(
                proponentInfoSource.contactPersonAndPosition
              ),
              proponentAddress: sanitizeString(
                proponentInfoSource.mailingAddress
              ),
              proponentPhone: sanitizeString(proponentInfoSource.telephoneFax),
              proponentEmail: sanitizeString(proponentInfoSource.emailAddress),
            };
            const computedLocation = sourceGeneralInfo
              ? {
                  region: String(sourceGeneralInfo.region ?? ""),
                  province: String(sourceGeneralInfo.province ?? ""),
                  municipality: String(sourceGeneralInfo.municipality ?? ""),
                  barangay: String(sourceGeneralInfo.location ?? ""),
                }
              : undefined;
            const location = computedLocation
              ? computedLocation
              : typeof reportData.location === "string"
                ? {
                    region: "",
                    province: "",
                    municipality: "",
                    barangay: reportData.location,
                  }
                : reportData.location || {};
            const normalizedUpdate: Partial<DraftSnapshot> = {
              generalInfo: {
                companyName:
                  (sourceGeneralInfo?.companyName as string) ||
                  reportData.companyName ||
                  "",
                projectName:
                  (sourceGeneralInfo?.projectName as string) ||
                  reportData.projectCurrentName ||
                  reportData.projectNameInEcc ||
                  "",
                quarter:
                  (sourceGeneralInfo?.quarter as string) ||
                  reportData.quarter ||
                  "",
                year:
                  (sourceGeneralInfo?.year as string) ||
                  reportData.year?.toString() ||
                  "",
                dateOfCompliance:
                  (sourceGeneralInfo?.dateOfCompliance as string) ||
                  reportData.dateOfComplianceMonitoringAndValidation ||
                  "",
                monitoringPeriod:
                  (sourceGeneralInfo?.monitoringPeriod as string) ||
                  reportData.monitoringPeriodCovered ||
                  "",
                dateOfCMRSubmission:
                  (sourceGeneralInfo?.dateOfCMRSubmission as string) ||
                  reportData.dateOfCmrSubmission ||
                  "",
                region:
                  (sourceGeneralInfo?.region as string) ||
                  locationFields.region ||
                  (location.region as string) ||
                  "",
                province:
                  (sourceGeneralInfo?.province as string) ||
                  locationFields.province ||
                  (location.province as string) ||
                  "",
                municipality:
                  (sourceGeneralInfo?.municipality as string) ||
                  locationFields.municipality ||
                  (location.municipality as string) ||
                  "",
                location:
                  locationFields.location ||
                  (sourceGeneralInfo?.location as string) ||
                  (location.barangay as string) ||
                  "",
              },
              eccInfo: eccPrimary,
              eccAdditionalForms: eccAdditional,
              isagInfo: isagPrimary,
              isagAdditionalForms: isagAdditional,
              epepInfo: epepPrimary,
              epepAdditionalForms: epepAdditional,
              rcfInfo: rcfPrimary,
              rcfAdditionalForms: rcfAdditional,
              mtfInfo: mtfPrimary,
              mtfAdditionalForms: mtfAdditional,
              fmrdfInfo: fmrdfPrimary,
              fmrdfAdditionalForms: fmrdfAdditional,
              mmtInfo: {
                ...defaultMmtInfo,
                isNA: false,
                contactPerson: sanitizeString(
                  mmtSource.contactPersonAndPosition
                ),
                mailingAddress: sanitizeString(mmtSource.mailingAddress),
                phoneNumber: sanitizeString(mmtSource.telephoneFax),
                emailAddress: sanitizeString(mmtSource.emailAddress),
              },
            };

            const normalizedExecutiveSummary = normalizeExecutiveSummaryFromApi(
              reportData.executiveSummaryOfCompliance ??
                reportData.cmvrData?.executiveSummaryOfCompliance
            );
            if (normalizedExecutiveSummary) {
              normalizedUpdate.executiveSummaryOfCompliance =
                normalizedExecutiveSummary;
            }

            const normalizedProcessDoc = normalizeProcessDocumentationFromApi(
              reportData.processDocumentationOfActivitiesUndertaken ??
                reportData.cmvrData?.processDocumentationOfActivitiesUndertaken
            );
            if (normalizedProcessDoc) {
              normalizedUpdate.processDocumentationOfActivitiesUndertaken =
                normalizedProcessDoc;
            }

            const normalizedComplianceSections =
              normalizeComplianceMonitoringReportFromApi(
                reportData.complianceMonitoringReport
              );
            if (normalizedComplianceSections) {
              Object.assign(normalizedUpdate, normalizedComplianceSections);
            }

            // ✅ FIX: Include permitHolderList in normalized update
            if (reportData.permitHolderList && Array.isArray(reportData.permitHolderList)) {
              normalizedUpdate.permitHolderList = reportData.permitHolderList;
              console.log("Loading permit holder list:", reportData.permitHolderList.length, "items");
            }

            // ✅ FIX: Include attendanceId in normalized update
            if (reportData.attendanceId) {
              normalizedUpdate.attendanceId = reportData.attendanceId;
              console.log("Loading attendance ID:", reportData.attendanceId);
            }

            // Load attachments if they exist
            if (
              reportData.attachments &&
              Array.isArray(reportData.attachments)
            ) {
              console.log(
                "Loading existing attachments:",
                reportData.attachments
              );
              const loadedAttachments = reportData.attachments.map(
                (att: any) => ({
                  uri: att.path || "", // Use path as uri for display purposes
                  path: att.path || "",
                  caption: att.caption || "",
                  uploading: false,
                })
              );
              setAttachments(loadedAttachments);
              console.log("Attachments loaded into state:", loadedAttachments);
              // ✅ FIX: Also include attachments in normalized update for store
              normalizedUpdate.attachments = reportData.attachments;
            }

            console.log("Successfully loaded report data from API");
            updates = normalizedUpdate;
          }
        } catch (error) {
          console.error("Error fetching CMVR report:", error);
        }
      }
      const stored = await loadStoredDraft();
      if (!isActive) {
        return;
      }
      if (!stored && Object.keys(updates).length === 0) {
        return;
      }
      const merged = mergeDraftData(stored, updates, resolvedFileName);

      if (isActive) {
        const derivedProjectName =
          routeProjectName || merged.generalInfo?.projectName || "";

        const storePayload: StoreHydrationPayload = {
          ...merged,
          id: routeReportId ?? null,
          submissionId: routeReportId ?? null,
          projectId: routeProjectId ?? null,
          projectName: derivedProjectName,
        };

        loadReport(storePayload);
        
        // ✅ FIX: Explicitly set attendanceId in store if present in merged data
        if (merged.attendanceId) {
          updateMultipleSections({ attendanceId: merged.attendanceId });
          console.log("Set attendanceId in store:", merged.attendanceId);
        }
        
        // ✅ FIX: Explicitly set permitHolderList in store if present
        if (merged.permitHolderList && Array.isArray(merged.permitHolderList)) {
          updateMultipleSections({ permitHolderList: merged.permitHolderList });
          console.log("Set permitHolderList in store:", merged.permitHolderList.length, "items");
        }
      }

      setDraftSnapshot(merged);
      if (routeReportId) {
        setSubmittedReportId(routeReportId);
        setHasSubmitted(true);
      }
    };

    hydrateDraft();

    return () => {
      isActive = false;
    };
  }, [
    routeReportId,
    routeProjectId,
    routeProjectName,
    loadStoredDraft,
    resolvedFileName,
    setHasSubmitted,
    setSubmittedReportId,
    loadReport,
  ]);

  // **LEGACY FUNCTION REMOVED** - saveDraftToLocal no longer needed
  // Draft management now handled by store.saveDraft()

  const handleExit = async () => {
    try {
      if (!hasSubmitted) {
        await saveDraft();
      }
    } catch (e) {
      console.warn("Failed to save draft on exit:", e);
    } finally {
      navigation.navigate("Dashboard" as never);
    }
  };

  const handleDeleteFromSupabase = async () => {
    if (!submittedReportId) return;
    Alert.alert(
      "Delete Report",
      "Are you sure you want to delete this CMVR report from the database? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setIsDeleting(true);

              // Collect all uploaded file paths from draftSnapshot
              const filesToDelete: string[] = [];

              // Extract location images from complianceToProjectLocationAndCoverageLimits
              if (
                draftSnapshot?.complianceToProjectLocationAndCoverageLimits
                  ?.uploadedImages
              ) {
                const uploadedImages =
                  draftSnapshot.complianceToProjectLocationAndCoverageLimits
                    .uploadedImages;
                Object.values(uploadedImages).forEach((imagePath: any) => {
                  if (typeof imagePath === "string" && imagePath.trim()) {
                    // Extract storage path from URL or use directly if it's already a path
                    const path = imagePath.includes("location/")
                      ? imagePath.split("location/")[1]?.split("?")[0]
                      : imagePath;
                    if (path && !path.startsWith("http")) {
                      filesToDelete.push(`location/${path}`);
                    } else if (path && path.includes("location/")) {
                      const extractedPath =
                        path.match(/location\/([^?]+)/)?.[0];
                      if (extractedPath) filesToDelete.push(extractedPath);
                    }
                  }
                });
              }

              // Extract noise quality files from noiseQualityImpactAssessment
              if (draftSnapshot?.noiseQualityImpactAssessment?.uploadedFiles) {
                const uploadedFiles =
                  draftSnapshot.noiseQualityImpactAssessment.uploadedFiles;
                if (Array.isArray(uploadedFiles)) {
                  uploadedFiles.forEach((file: any) => {
                    const storagePath = file?.storagePath || file?.path;
                    if (
                      storagePath &&
                      typeof storagePath === "string" &&
                      storagePath.trim()
                    ) {
                      // Clean up the path
                      const cleanPath = storagePath.includes("noise-quality/")
                        ? storagePath.split("noise-quality/")[1]?.split("?")[0]
                        : storagePath;
                      if (cleanPath && !cleanPath.startsWith("http")) {
                        filesToDelete.push(`noise-quality/${cleanPath}`);
                      } else if (
                        cleanPath &&
                        cleanPath.includes("noise-quality/")
                      ) {
                        const extractedPath = cleanPath.match(
                          /noise-quality\/([^?]+)/
                        )?.[0];
                        if (extractedPath) filesToDelete.push(extractedPath);
                      }
                    }
                  });
                }
              }

              console.log("🗑️ Files to delete with CMVR:", filesToDelete);

              // Delete files from storage (non-blocking)
              if (filesToDelete.length > 0) {
                deleteFilesFromStorage(filesToDelete).catch((err) => {
                  console.error("⚠️ Failed to delete some files:", err);
                  // Don't block the CMVR deletion if file deletion fails
                });
              }

              // Delete the CMVR report from database
              await deleteCMVRReport(submittedReportId);
              setHasSubmitted(false);
              setSubmittedReportId(null);
              Alert.alert(
                "Deleted",
                "The CMVR report and associated files were deleted."
              );
            } catch (e: any) {
              console.error("Delete CMVR report failed:", e);
              Alert.alert(
                "Delete Failed",
                e?.message || "Unable to delete the report."
              );
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleSubmitUpdate = async () => {
    if (!submittedReportId) return;
    if (!draftSnapshot) {
      Alert.alert("Nothing to update", "No report data to submit.");
      return;
    }
    try {
      setIsUpdating(true);
      const snapshotForSubmission = mergeDraftData(
        draftSnapshot,
        routeDraftUpdate,
        resolvedFileName
      );
      // Format attachments for payload
      const formattedAttachments =
        attachments.length > 0
          ? attachments
              .filter((a) => !!a.path)
              .map((a) => ({ path: a.path!, caption: a.caption || undefined }))
          : undefined;

      console.log("=== DEBUG UPDATE: Attachments state ===", attachments);
      console.log(
        "=== DEBUG UPDATE: Formatted attachments ===",
        formattedAttachments
      );

      const payload = buildCreateCMVRPayload(
        snapshotForSubmission,
        {
          recommendationsData: snapshotForSubmission.recommendationsData,
          attendanceId: resolvedAttendanceId ?? undefined,
          attachments: formattedAttachments,
        },
        user?.id
      );

      console.log(
        "=== DEBUG UPDATE: Payload attachments ===",
        payload.attachments
      );

      const fileNameForUpdate =
        sanitizeString(snapshotForSubmission.fileName) ||
        sanitizeString(snapshotForSubmission.generalInfo?.projectName) ||
        "CMVR_Report";
      await updateCMVRReport(submittedReportId, payload, fileNameForUpdate);
      await AsyncStorage.removeItem(DRAFT_KEY);
      Alert.alert("Updated", "Your CMVR report has been updated.");
    } catch (e: any) {
      console.error("Update CMVR report failed:", e);
      Alert.alert("Update Failed", e?.message || "Could not update report.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!currentReport) {
      Alert.alert(
        "No Data",
        "Please complete the CMVR report before saving draft.",
        [{ text: "OK" }]
      );
      return;
    }

    try {
      // Use store's saveDraft function
      await saveDraft();
      Alert.alert(
        "Draft Saved",
        "Your CMVR report has been saved as a draft.",
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Error saving CMVR draft:", error);
      Alert.alert("Save Failed", "Failed to save draft. Please try again.", [
        { text: "OK" },
      ]);
    }
  };

  const handleSubmitToSupabase = async () => {
    if (!currentReport) {
      Alert.alert(
        "No Data",
        "Please complete the CMVR report before submitting.",
        [{ text: "OK" }]
      );
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      console.log("=== DEBUG: Submitting from store ===");
      console.log("Current report sections:", Object.keys(currentReport));

      // Sync local generalInfo to store before submission
      updateMultipleSections({
        generalInfo,
        eccInfo,
        eccAdditionalForms,
        isagInfo,
        isagAdditionalForms,
        epepInfo,
        epepAdditionalForms,
        rcfInfo,
        rcfAdditionalForms,
        mtfInfo,
        mtfAdditionalForms,
        fmrdfInfo,
        fmrdfAdditionalForms,
        mmtInfo,
        permitHolderList,
        executiveSummaryOfCompliance: executiveSummary,
        processDocumentationOfActivitiesUndertaken: processDocumentation,
        complianceToProjectLocationAndCoverageLimits: complianceProjectLocation,
        complianceToImpactManagementCommitments: complianceImpactCommitments,
        airQualityImpactAssessment: airQualityAssessment,
        waterQualityImpactAssessment: waterQualityAssessment,
        noiseQualityImpactAssessment: noiseQualityAssessment,
        complianceWithGoodPracticeInSolidAndHazardousWasteManagement:
          wasteManagementData,
        complianceWithGoodPracticeInChemicalSafetyManagement:
          chemicalSafetyData,
        complaintsVerificationAndManagement: complaintsData,
        recommendationsData,
        recommendationFromPrevQuarter: recommendationPrev,
        recommendationForNextQuarter: recommendationNext,
        attendanceId: resolvedAttendanceId,
        documentation,
      });

      // Ensure fileName and createdById are set before submission
      updateMetadata({ fileName: resolvedFileName });
      if (user?.id) {
        setCreatedById(user.id);
      }

      // Format attachments for submission
      const formattedAttachments =
        attachments.length > 0
          ? attachments
              .filter((a) => !!a.path)
              .map((a) => ({ path: a.path!, caption: a.caption || undefined }))
          : undefined;

      console.log("=== DEBUG SUBMIT: Attachments state ===", attachments);
      console.log(
        "=== DEBUG SUBMIT: Formatted attachments ===",
        formattedAttachments
      );
      console.log("=== DEBUG SUBMIT: Using fileName:", resolvedFileName);

      // Pass resolvedFileName to submitReport to ensure correct fileName is used
      const result = await submitReport(undefined, formattedAttachments, resolvedFileName);

      if (!result.success) {
        throw new Error(result.error || "Failed to submit CMVR report");
      }

      if (result.report && result.report.id) {
        const newId = result.report.id;
        setSubmittedReportId(newId);
        setHasSubmitted(true);

        // Delete draft after successful submission
        await deleteDraft();
        markAsClean();

        Alert.alert(
          "Submitted",
          "Your CMVR report has been saved to the database. You can now generate a document.",
          [{ text: "OK" }]
        );

        return;
      }

      throw new Error("Submission failed - no ID returned");
    } catch (error: any) {
      console.error("Error submitting CMVR report:", error);
      const errorMessage =
        error?.message || "Failed to submit CMVR report. Please try again.";
      setSubmitError(errorMessage);
      Alert.alert("Submission Failed", errorMessage, [{ text: "OK" }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateDocument = async () => {
    const reportId = submittedReportId || storeSubmissionId;

    if (!hasSubmitted || !reportId) {
      Alert.alert(
        "Submit Required",
        "Please submit your report to the database first.",
        [{ text: "OK" }]
      );
      return;
    }

    // Check if there are local attachments that need to be saved
    if (attachments.length > 0 && submittedReportId) {
      console.log(
        "=== DEBUG GENERATE: Found local attachments, checking if update needed ===",
        attachments
      );
      
      // Auto-update the report with attachments before generating
      try {
        setIsGenerating(true);
        const snapshotForSubmission = mergeDraftData(
          draftSnapshot || currentReport || {},
          routeDraftUpdate,
          resolvedFileName
        );
        
        const formattedAttachments = attachments
          .filter((a) => !!a.path)
          .map((a) => ({ path: a.path!, caption: a.caption || undefined }));

        const payload = buildCreateCMVRPayload(
          snapshotForSubmission,
          {
            recommendationsData: snapshotForSubmission.recommendationsData,
            attendanceId: resolvedAttendanceId ?? undefined,
            attachments: formattedAttachments,
          },
          user?.id
        );

        console.log(
          "=== DEBUG GENERATE: Auto-updating report with attachments ===",
          formattedAttachments
        );

        // Generate a proper fileName - prefer resolvedFileName, but generate from generalInfo if it's "Untitled"
        let fileNameForUpdate: string | undefined = undefined;
        const resolved = sanitizeString(resolvedFileName);
        const snapshotFileName = sanitizeString(snapshotForSubmission.fileName);
        const generalInfo = snapshotForSubmission.generalInfo || {};
        
        // Try to generate fileName from generalInfo if we don't have a good one
        const generateFileNameFromGeneralInfo = () => {
          const company = sanitizeString(generalInfo.companyName);
          const quarter = sanitizeString(generalInfo.quarter);
          const year = sanitizeString(generalInfo.year);
          const dateOfCompliance = sanitizeString(generalInfo.dateOfCompliance);
          
          // Try to extract date from dateOfCompliance (format: "YYYY-MM-DD" or similar)
          let datePart = "";
          if (dateOfCompliance) {
            const dateMatch = dateOfCompliance.match(/(\d{4})-(\d{2})-(\d{2})/);
            if (dateMatch) {
              datePart = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
            } else {
              // Try other date formats
              const dateObj = new Date(dateOfCompliance);
              if (!isNaN(dateObj.getTime())) {
                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                const day = String(dateObj.getDate()).padStart(2, '0');
                datePart = `${dateObj.getFullYear()}-${month}-${day}`;
              }
            }
          }
          
          // Generate fileName: "CMVR YYYY-MM-DD HHMM" or "CMVR CompanyName Quarter Year"
          if (datePart) {
            const timePart = new Date().toTimeString().slice(0, 5).replace(':', '');
            return `CMVR ${datePart} ${timePart}`;
          } else if (company && quarter && year) {
            return `CMVR ${company} ${quarter} ${year}`;
          } else if (company) {
            return `CMVR ${company}`;
          }
          return undefined;
        };
        
        // Prefer resolvedFileName if it's not "Untitled"
        if (resolved && resolved !== "Untitled" && resolved.trim().length > 0) {
          fileNameForUpdate = resolved;
        } else if (snapshotFileName && snapshotFileName !== "Untitled" && snapshotFileName.trim().length > 0) {
          fileNameForUpdate = snapshotFileName;
        } else {
          // Generate from generalInfo
          const generated = generateFileNameFromGeneralInfo();
          if (generated) {
            fileNameForUpdate = generated;
          }
        }
        
        console.log("=== DEBUG GENERATE: Updating report with fileName:", fileNameForUpdate);
        console.log("=== DEBUG GENERATE: resolvedFileName:", resolvedFileName);
        console.log("=== DEBUG GENERATE: snapshot fileName:", snapshotForSubmission.fileName);
        console.log("=== DEBUG GENERATE: generalInfo:", generalInfo);
        
        await updateCMVRReport(submittedReportId, payload, fileNameForUpdate);
        console.log("=== DEBUG GENERATE: Report updated with attachments successfully ===");
      } catch (updateError: any) {
        console.error("Failed to auto-update report with attachments:", updateError);
        // Continue with document generation even if update fails
        Alert.alert(
          "Warning",
          "Could not save attachments to the report. The document will be generated without the latest attachments.",
          [{ text: "Continue", onPress: () => {} }]
        );
      }
    }

    setIsGenerating(true);
    try {
      await generateCMVRDocx(reportId, resolvedFileName);
      Alert.alert(
        "Download Started",
        "Your browser will open to download the DOCX file.",
        [{ text: "OK" }]
      );
    } catch (err: any) {
      console.error("Generate DOCX failed:", err);
      Alert.alert(
        "Generation Failed",
        err?.message || "Unable to generate document. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const fileName = resolvedFileName;

  // **READ FROM STORE** - All data comes from currentReport
  const generalInfo = currentReport?.generalInfo ?? defaultGeneralInfo;
  const eccInfo = currentReport?.eccInfo ?? defaultEccInfo;
  const eccAdditionalForms =
    currentReport?.eccAdditionalForms ?? ([] as ECCAdditionalForm[]);
  const isagInfo = currentReport?.isagInfo ?? defaultIsagInfo;
  const isagAdditionalForms =
    currentReport?.isagAdditionalForms ?? ([] as ISAGAdditionalForm[]);
  const epepInfo = currentReport?.epepInfo ?? defaultEpepInfo;
  const epepAdditionalForms =
    currentReport?.epepAdditionalForms ?? ([] as EpepAdditionalForm[]);
  const rcfInfo = currentReport?.rcfInfo ?? defaultFundInfo;
  const rcfAdditionalForms =
    currentReport?.rcfAdditionalForms ?? ([] as FundAdditionalForm[]);
  const mtfInfo = currentReport?.mtfInfo ?? defaultFundInfo;
  const mtfAdditionalForms =
    currentReport?.mtfAdditionalForms ?? ([] as FundAdditionalForm[]);
  const fmrdfInfo = currentReport?.fmrdfInfo ?? defaultFundInfo;
  const fmrdfAdditionalForms =
    currentReport?.fmrdfAdditionalForms ?? ([] as FundAdditionalForm[]);
  const mmtInfo = currentReport?.mmtInfo ?? defaultMmtInfo;
  const permitHolderList = currentReport?.permitHolderList || [];
  const executiveSummary = currentReport?.executiveSummaryOfCompliance;
  const complianceDiscussion = currentReport?.complianceMonitoringReportDiscussion;
  const processDocumentation =
    currentReport?.processDocumentationOfActivitiesUndertaken;
  const complianceProjectLocation =
    currentReport?.complianceToProjectLocationAndCoverageLimits;
  const complianceImpactCommitments =
    currentReport?.complianceToImpactManagementCommitments;
  const airQualityAssessment = currentReport?.airQualityImpactAssessment;
  const waterQualityAssessment = currentReport?.waterQualityImpactAssessment;
  const noiseQualityAssessment = currentReport?.noiseQualityImpactAssessment;
  const wasteManagementData =
    currentReport?.complianceWithGoodPracticeInSolidAndHazardousWasteManagement;
  const chemicalSafetyData =
    currentReport?.complianceWithGoodPracticeInChemicalSafetyManagement;
  const complaintsData = currentReport?.complaintsVerificationAndManagement;
  const recommendationsData = currentReport?.recommendationsData;
  const recommendationPrev = currentReport?.recommendationFromPrevQuarter;
  const recommendationNext = currentReport?.recommendationForNextQuarter;
  const documentation = currentReport?.documentation;
  const attendanceTitleFromState =
    routeSelectedAttendanceTitle ??
    (attendanceRecordInfo && attendanceRecordInfo.id === resolvedAttendanceId
      ? attendanceRecordInfo.label
      : undefined);
  const attendanceDisplayValue =
    attendanceTitleFromState ??
    (resolvedAttendanceId ? "Attendance record linked" : "Not selected");

  const baseNavParams = {
    fileName,
    generalInfo,
    eccInfo,
    eccAdditionalForms,
    isagInfo,
    isagAdditionalForms,
    epepInfo,
    epepAdditionalForms,
    rcfInfo,
    rcfAdditionalForms,
    mtfInfo,
    mtfAdditionalForms,
    fmrdfInfo,
    fmrdfAdditionalForms,
    mmtInfo,
    permitHolderList,
    selectedAttendanceId: resolvedAttendanceId,
    attendanceId: resolvedAttendanceId,
    attendanceUrl: resolvedAttendanceId ?? legacyAttendanceId ?? null,
  };

  const draftPayload = {
    ...currentReport,
    fileName,
    permitHolderList,
    isagInfo,
    isagAdditionalForms,
    epepInfo,
    epepAdditionalForms,
    rcfInfo,
    rcfAdditionalForms,
    mtfInfo,
    mtfAdditionalForms,
    fmrdfInfo,
    fmrdfAdditionalForms,
    mmtInfo,
    executiveSummaryOfCompliance: executiveSummary,
    processDocumentationOfActivitiesUndertaken: processDocumentation,
    complianceToProjectLocationAndCoverageLimits: complianceProjectLocation,
    complianceToImpactManagementCommitments: complianceImpactCommitments,
    airQualityImpactAssessment: airQualityAssessment,
    waterQualityImpactAssessment: waterQualityAssessment,
    noiseQualityImpactAssessment: noiseQualityAssessment,
    complianceWithGoodPracticeInSolidAndHazardousWasteManagement:
      wasteManagementData,
    complianceWithGoodPracticeInChemicalSafetyManagement: chemicalSafetyData,
    complaintsVerificationAndManagement: complaintsData,
    recommendationsData,
    recommendationFromPrevQuarter: recommendationPrev,
    recommendationForNextQuarter: recommendationNext,
    attendanceId: resolvedAttendanceId,
    attendanceUrl: resolvedAttendanceId ?? legacyAttendanceId ?? null,
    documentation,
  } as DraftSnapshot;

  // Auto-fill test data intentionally disabled to prevent accidental population

  const navigateToGeneralInfo = () => {
    navigation.navigate("CMVRReport", {
      ...baseNavParams,
      draftData: draftPayload,
      recommendationsData,
      recommendationFromPrevQuarter: recommendationPrev,
      recommendationForNextQuarter: recommendationNext,
    } as any);
  };

  const navigateToPage2 = () => {
    navigation.navigate("CMVRPage2", {
      ...baseNavParams,
      executiveSummaryOfCompliance: executiveSummary,
      processDocumentationOfActivitiesUndertaken: processDocumentation,
      complianceToProjectLocationAndCoverageLimits: complianceProjectLocation,
      complianceToImpactManagementCommitments: complianceImpactCommitments,
      airQualityImpactAssessment: airQualityAssessment,
      draftData: draftPayload,
    } as any);
  };

  const navigateToWaterQuality = () => {
    navigation.navigate("WaterQuality", {
      ...baseNavParams,
      waterQualityImpactAssessment: waterQualityAssessment,
      airQualityImpactAssessment: airQualityAssessment,
      draftData: draftPayload,
    } as any);
  };

  const navigateToNoiseQuality = () => {
    navigation.navigate("NoiseQuality", {
      ...baseNavParams,
      waterQualityImpactAssessment: waterQualityAssessment,
      noiseQualityImpactAssessment: noiseQualityAssessment,
      draftData: draftPayload,
    } as any);
  };

  const navigateToWasteManagement = () => {
    navigation.navigate("WasteManagement", {
      ...baseNavParams,
      complianceWithGoodPracticeInSolidAndHazardousWasteManagement:
        wasteManagementData,
      draftData: draftPayload,
    } as any);
  };

  const navigateToChemicalSafety = () => {
    navigation.navigate("ChemicalSafety", {
      ...baseNavParams,
      complianceWithGoodPracticeInChemicalSafetyManagement: chemicalSafetyData,
      complaintsVerificationAndManagement: complaintsData,
      recommendationsData,
      draftData: draftPayload,
    } as any);
  };

  const navigateToComplianceDiscussion = () => {
    navigation.navigate("ComplianceDiscussionScreen", {
      ...baseNavParams,
      draftData: draftPayload,
    } as any);
  };

  const navigateToAirQuality = () => {
    navigation.navigate("EnvironmentalCompliance", {
      ...baseNavParams,
      airQualityImpactAssessment: airQualityAssessment,
      draftData: draftPayload,
    } as any);
  };

  const navigateToAttendanceSelection = () => {
    navigation.navigate("AttendanceList", {
      fromRecommendations: true,
      ...baseNavParams,
      executiveSummaryOfCompliance: executiveSummary,
      processDocumentationOfActivitiesUndertaken: processDocumentation,
      complianceToProjectLocationAndCoverageLimits: complianceProjectLocation,
      complianceToImpactManagementCommitments: complianceImpactCommitments,
      airQualityImpactAssessment: airQualityAssessment,
      waterQualityImpactAssessment: waterQualityAssessment,
      noiseQualityImpactAssessment: noiseQualityAssessment,
      complianceWithGoodPracticeInSolidAndHazardousWasteManagement:
        wasteManagementData,
      complianceWithGoodPracticeInChemicalSafetyManagement: chemicalSafetyData,
      complaintsVerificationAndManagement: complaintsData,
      recommendationsData,
      recommendationFromPrevQuarter: recommendationPrev,
      recommendationForNextQuarter: recommendationNext,
      selectedAttendanceId: resolvedAttendanceId,
      documentation,
    } as any);
  };

  const getDisplayValue = (
    value: string | undefined | null,
    fallback = "Not provided"
  ) => {
    return value && value.trim() !== "" ? value : fallback;
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 0, backgroundColor: "white" }}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close" size={24} color="#1E293B" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>CMVR Report Export</Text>
            <Text style={styles.headerSubtitle}>
              Generate and download your report
            </Text>
          </View>
          <TouchableOpacity onPress={handleExit}>
            <Text style={styles.exitText}>Exit</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.previewCard}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <Ionicons name="document-text" size={32} color="white" />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {(fileName || "CMVR_Report") + ".docx"}
              </Text>
              <Text style={styles.cardSubtitle} numberOfLines={1}>
                {getDisplayValue(
                  isagInfo?.currentName || generalInfo?.projectName,
                  "Project"
                )}{" "}
                - Compliance Report
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Document Contents Summary</Text>
          <SummaryItem
            icon="📋"
            title="General Information"
            value={`${getDisplayValue(generalInfo?.companyName)} - ${getDisplayValue(isagInfo?.currentName || generalInfo?.projectName)}`}
            onPress={navigateToGeneralInfo}
            isEdited={isSectionEdited("generalInfo")}
          />
          <SummaryItem
            icon="🛡️"
            title="ECC Information"
            value={
              eccInfo.isNA
                ? "Not Applicable"
                : getDisplayValue(eccInfo.eccNumber)
            }
            additional={
              !eccInfo.isNA && eccAdditionalForms.length > 0
                ? `+${eccAdditionalForms.length} additional`
                : undefined
            }
            onPress={navigateToGeneralInfo}
            isEdited={isSectionEdited(["eccInfo", "eccAdditionalForms"])}
          />
          <SummaryItem
            icon="📄"
            title="ISAG/MPP Information"
            value={
              isagInfo.isNA
                ? "Not Applicable"
                : getDisplayValue(isagInfo.isagNumber)
            }
            additional={
              !isagInfo.isNA && isagAdditionalForms.length > 0
                ? `+${isagAdditionalForms.length} additional`
                : undefined
            }
            onPress={navigateToGeneralInfo}
            isEdited={isSectionEdited(["isagInfo", "isagAdditionalForms"])}
          />
          <SummaryItem
            icon="🌿"
            title="EPEP Information"
            value={
              epepInfo.isNA
                ? "Not Applicable"
                : getDisplayValue(epepInfo.epepNumber)
            }
            additional={
              !epepInfo.isNA && epepAdditionalForms.length > 0
                ? `+${epepAdditionalForms.length} additional`
                : undefined
            }
            onPress={navigateToGeneralInfo}
            isEdited={isSectionEdited(["epepInfo", "epepAdditionalForms"])}
          />
          <SummaryItem
            icon="💰"
            title="RCF Status"
            value={
              rcfInfo.isNA
                ? "Not Applicable"
                : `₱${getDisplayValue(rcfInfo.amountDeposited, "0.00")}`
            }
            additional={
              !rcfInfo.isNA && rcfAdditionalForms.length > 0
                ? `+${rcfAdditionalForms.length} additional`
                : undefined
            }
            onPress={navigateToGeneralInfo}
            isEdited={isSectionEdited(["rcfInfo", "rcfAdditionalForms"])}
          />
          <SummaryItem
            icon="🛡️"
            title="MTF Status"
            value={
              mtfInfo.isNA
                ? "Not Applicable"
                : `₱${getDisplayValue(mtfInfo.amountDeposited, "0.00")}`
            }
            additional={
              !mtfInfo.isNA && mtfAdditionalForms.length > 0
                ? `+${mtfAdditionalForms.length} additional`
                : undefined
            }
            onPress={navigateToGeneralInfo}
            isEdited={isSectionEdited(["mtfInfo", "mtfAdditionalForms"])}
          />
          <SummaryItem
            icon="🌱"
            title="FMRDF Status"
            value={
              fmrdfInfo.isNA
                ? "Not Applicable"
                : `₱${getDisplayValue(fmrdfInfo.amountDeposited, "0.00")}`
            }
            additional={
              !fmrdfInfo.isNA && fmrdfAdditionalForms.length > 0
                ? `+${fmrdfAdditionalForms.length} additional`
                : undefined
            }
            onPress={navigateToGeneralInfo}
            isEdited={isSectionEdited(["fmrdfInfo", "fmrdfAdditionalForms"])}
          />
          <SummaryItem
            icon="👥"
            title="Monitoring Team"
            value={
              mmtInfo.contactPerson
                ? getDisplayValue(mmtInfo.contactPerson)
                : "Not provided"
            }
            onPress={navigateToGeneralInfo}
            isEdited={isSectionEdited("mmtInfo")}
          />
          <SummaryItem
            icon="🧾"
            title="Executive Summary"
            value={executiveSummary ? "Available" : "Not provided"}
            onPress={navigateToPage2}
            isEdited={isSectionEdited("executiveSummaryOfCompliance")}
          />
          <SummaryItem
            icon="📝"
            title="Compliance Monitoring Report and Discussion"
            value={complianceDiscussion ? "Available" : "Not provided"}
            onPress={navigateToComplianceDiscussion}
            isEdited={isSectionEdited("complianceMonitoringReportDiscussion")}
          />
          <SummaryItem
            icon="🌬️"
            title="Air Quality Assessment"
            value={airQualityAssessment ? "Available" : "Not provided"}
            onPress={navigateToAirQuality}
            isEdited={isSectionEdited("airQualityImpactAssessment")}
          />
          <SummaryItem
            icon="🗂️"
            title="Process Documentation"
            value={
              processDocumentation?.dateConducted
                ? getDisplayValue(processDocumentation.dateConducted)
                : "Not provided"
            }
            onPress={navigateToPage2}
            isEdited={isSectionEdited(
              "processDocumentationOfActivitiesUndertaken"
            )}
          />
          <SummaryItem
            icon="💧"
            title="Water Quality Assessment"
            value={waterQualityAssessment ? "Available" : "Not provided"}
            onPress={navigateToWaterQuality}
            isEdited={isSectionEdited("waterQualityImpactAssessment")}
          />
          <SummaryItem
            icon="🔊"
            title="Noise Quality Assessment"
            value={noiseQualityAssessment ? "Available" : "Not provided"}
            onPress={navigateToNoiseQuality}
            isEdited={isSectionEdited("noiseQualityImpactAssessment")}
          />
          <SummaryItem
            icon="♻️"
            title="Waste Management"
            value={wasteManagementData ? "Available" : "Not provided"}
            onPress={navigateToWasteManagement}
            isEdited={isSectionEdited(
              "complianceWithGoodPracticeInSolidAndHazardousWasteManagement"
            )}
          />
          <SummaryItem
            icon="🧪"
            title="Chemical Safety & Complaints"
            value={
              chemicalSafetyData || complaintsData
                ? "Available"
                : "Not provided"
            }
            onPress={navigateToChemicalSafety}
            isEdited={isSectionEdited([
              "complianceWithGoodPracticeInChemicalSafetyManagement",
              "complaintsVerificationAndManagement",
            ])}
          />
          <SummaryItem
            icon="📋"
            title="Attendance Record"
            value={attendanceDisplayValue}
            onPress={navigateToAttendanceSelection}
            isEdited={isSectionEdited(["attendanceId", "attendanceUrl"])}
          />
          <SummaryItem
            icon="📎"
            title="Attachments"
            value={
              attachments.length > 0
                ? `${attachments.length} file${attachments.length > 1 ? "s" : ""}`
                : "No attachments"
            }
            onPress={() =>
              navigation.navigate("CMVRAttachments", {
                ...baseNavParams,
                existingAttachments: attachments,
                fileName,
              })
            }
            isEdited={attachments.length > 0}
          />
        </View>
        <View style={styles.actionSection}>
          {!hasSubmitted ? (
            <>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  isSubmitting && styles.buttonDisabled,
                ]}
                onPress={handleSubmitToSupabase}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <ActivityIndicator size="small" color="white" />
                    <Text style={styles.submitButtonText}>Submitting...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="cloud-upload" size={20} color="white" />
                    <Text style={styles.submitButtonText}>
                      Submit to Database
                    </Text>
                  </>
                )}
              </TouchableOpacity>
              <View style={styles.infoBannerContainer}>
                <Ionicons name="information-circle" size={18} color="#1E40AF" />
                <Text style={styles.infoBannerText}>
                  Submit your report to the database first to enable document
                  generation.
                </Text>
              </View>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[
                  styles.generateButton,
                  isGenerating && styles.buttonDisabled,
                ]}
                onPress={handleGenerateDocument}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <ActivityIndicator size="small" color="white" />
                    <Text style={styles.generateButtonText}>
                      Generating Document...
                    </Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="document-text" size={20} color="white" />
                    <Text style={styles.generateButtonText}>Generate Docx</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.updateButton,
                  (isUpdating || !hasChanges) && styles.buttonDisabled,
                ]}
                onPress={handleSubmitUpdate}
                disabled={isUpdating || !hasChanges}
              >
                {isUpdating ? (
                  <>
                    <ActivityIndicator size="small" color="white" />
                    <Text style={styles.updateButtonText}>Updating...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="refresh" size={20} color="white" />
                    <Text style={styles.updateButtonText}>Update</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.deleteButton,
                  isDeleting && styles.buttonDisabled,
                ]}
                onPress={handleDeleteFromSupabase}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <ActivityIndicator size="small" color="white" />
                    <Text style={styles.deleteButtonText}>Deleting...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="trash" size={20} color="white" />
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
          {submitError && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="#DC2626" />
              <Text style={styles.errorText}>{submitError}</Text>
            </View>
          )}
        </View>
        <View style={styles.infoNote}>
          <Ionicons name="information-circle" size={20} color="#2563EB" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Document Information</Text>
            <Text style={styles.infoDescription}>
              Your CMVR report will include all sections with the information
              you've provided.{" "}
              {"DOCX format allows you to make further edits if needed."}
            </Text>
          </View>
        </View>
        <View style={styles.draftNote}>
          <Ionicons name="save-outline" size={20} color="#F59E0B" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.draftNoteTitle}>Draft Auto-Save</Text>
            <Text style={styles.draftNoteDescription}>
              Your report data is automatically saved locally when you open this
              screen. If you exit before submitting, we’ll save it to Drafts
              automatically.
            </Text>
          </View>
        </View>
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
};

const SummaryItem = ({
  icon,
  title,
  value,
  additional,
  onPress,
  isEdited,
}: {
  icon: string;
  title: string;
  value: string;
  additional?: string;
  onPress?: () => void;
  isEdited?: boolean;
}) => {
  const wrapperStyle = [
    styles.summaryItem,
    isEdited && styles.summaryItemEdited,
  ];
  const content = (
    <>
      <Text style={styles.summaryIcon}>{icon}</Text>
      <View style={styles.summaryTextContainer}>
        <View style={styles.summaryTitleRow}>
          <Text style={styles.summaryItemTitle}>{title}</Text>
          {isEdited && (
            <View style={styles.summaryEditedBadge}>
              <Text style={styles.summaryEditedBadgeText}>Edited</Text>
            </View>
          )}
        </View>
        <Text style={styles.summaryItemValue} numberOfLines={1}>
          {value}
        </Text>
        {additional && (
          <Text style={styles.summaryAdditional}>{additional}</Text>
        )}
      </View>
      {onPress && <Ionicons name="chevron-forward" size={20} color="#94A3B8" />}
    </>
  );
  if (onPress) {
    return (
      <TouchableOpacity
        style={wrapperStyle}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {content}
      </TouchableOpacity>
    );
  }
  return <View style={wrapperStyle}>{content}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: isTablet ? 32 : 20,
    paddingTop: Platform.OS === "ios" ? 40 : 20,
    paddingBottom: isTablet ? 24 : 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  backButton: {
    padding: isTablet ? 12 : 8,
    marginRight: isTablet ? 20 : 16,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
  },
  exitText: {
    color: "#1E40AF",
    fontSize: isTablet ? 18 : 16,
    fontWeight: "700",
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: isTablet ? 28 : isSmallPhone ? 20 : 22,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: isTablet ? 16 : 14,
    color: "#64748B",
    marginTop: 4,
    lineHeight: isTablet ? 24 : 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: isTablet ? 32 : 20,
    paddingBottom: isTablet ? 60 : 40,
    maxWidth: isTablet ? 1024 : undefined,
    alignSelf: isTablet ? "center" : undefined,
    width: isTablet ? "100%" : undefined,
  },
  previewCard: {
    backgroundColor: "white",
    borderRadius: isTablet ? 24 : 20,
    shadowColor: "#02217C",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
    marginBottom: isTablet ? 32 : 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardHeader: {
    backgroundColor: "#02217C",
    padding: isTablet ? 32 : 24,
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: isTablet ? 80 : 64,
    height: isTablet ? 80 : 64,
    borderRadius: isTablet ? 20 : 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: isTablet ? 24 : 16,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: isTablet ? 24 : isSmallPhone ? 18 : 20,
    fontWeight: "700",
    color: "white",
    marginBottom: isTablet ? 8 : 6,
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: isTablet ? 16 : 14,
    color: "rgba(255, 255, 255, 0.95)",
    lineHeight: isTablet ? 24 : 20,
  },
  formatSection: {
    padding: isTablet ? 32 : 24,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  sectionLabel: {
    fontSize: isTablet ? 18 : 15,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: isTablet ? 20 : 16,
    letterSpacing: -0.2,
  },
  formatButtons: {
    gap: isTablet ? 20 : 16,
    flexDirection: isTablet ? "row" : "column",
  },
  formatButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: isTablet ? 24 : 20,
    borderRadius: isTablet ? 20 : 16,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    backgroundColor: "white",
    flex: isTablet ? 1 : undefined,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  formatButtonActive: {
    borderColor: "#02217C",
    backgroundColor: "#EFF6FF",
    ...Platform.select({
      ios: {
        shadowColor: "#02217C",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  formatIcon: {
    width: isTablet ? 56 : 48,
    height: isTablet ? 56 : 48,
    borderRadius: isTablet ? 14 : 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: isTablet ? 20 : 16,
  },
  formatTextContainer: {
    flex: 1,
  },
  formatTitle: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  formatDescription: {
    fontSize: isTablet ? 16 : 14,
    color: "#64748B",
    lineHeight: isTablet ? 24 : 20,
  },
  summarySection: {
    padding: isTablet ? 32 : 24,
    backgroundColor: "white",
    borderRadius: isTablet ? 24 : 20,
    marginBottom: isTablet ? 32 : 24,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  summaryTitle: {
    fontSize: isTablet ? 22 : 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: isTablet ? 24 : 20,
    letterSpacing: -0.3,
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F8FAFC",
    borderRadius: isTablet ? 16 : 14,
    padding: isTablet ? 20 : 16,
    marginBottom: isTablet ? 16 : 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  summaryItemEdited: {
    borderColor: "#F59E0B",
    backgroundColor: "#FFFBEB",
  },
  summaryIcon: {
    fontSize: isTablet ? 36 : 28,
    marginRight: isTablet ? 20 : 16,
    marginTop: 2,
  },
  summaryTextContainer: {
    flex: 1,
  },
  summaryTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: isTablet ? 6 : 4,
  },
  summaryItemTitle: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: "700",
    color: "#475569",
    letterSpacing: -0.1,
  },
  summaryEditedBadge: {
    marginLeft: 8,
    backgroundColor: "#FDE68A",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  summaryEditedBadgeText: {
    fontSize: isTablet ? 12 : 11,
    color: "#92400E",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summaryItemValue: {
    fontSize: isTablet ? 17 : 15,
    color: "#0F172A",
    lineHeight: isTablet ? 26 : 22,
  },
  summaryAdditional: {
    fontSize: isTablet ? 14 : 12,
    color: "#02217C",
    marginTop: isTablet ? 8 : 6,
    fontWeight: "600",
  },
  generatedSection: {
    padding: isTablet ? 32 : 24,
    backgroundColor: "white",
    borderRadius: isTablet ? 24 : 20,
    marginBottom: isTablet ? 32 : 24,
  },
  generatedCard: {
    backgroundColor: "#F0FDF4",
    borderRadius: isTablet ? 24 : 20,
    padding: isTablet ? 36 : 28,
    alignItems: "center",
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#86EFAC",
  },
  generatedIconContainer: {
    marginBottom: isTablet ? 20 : 16,
  },
  generatedTitle: {
    fontSize: isTablet ? 24 : 20,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: isTablet ? 8 : 6,
    letterSpacing: -0.3,
  },
  generatedSubtitle: {
    fontSize: isTablet ? 17 : 15,
    color: "#059669",
    marginBottom: 4,
    fontWeight: "600",
  },
  generatedDate: {
    fontSize: isTablet ? 15 : 13,
    color: "#64748B",
    marginTop: 4,
  },
  actionSection: {
    marginBottom: isTablet ? 32 : 20,
    paddingHorizontal: 4,
  },
  generateButton: {
    backgroundColor: "#1E40AF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: isTablet ? 22 : 18,
    borderRadius: isTablet ? 20 : 16,
    gap: isTablet ? 16 : 12,
    shadowColor: "#1E40AF",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
    marginTop: isTablet ? 32 : 24,
  },
  submitButton: {
    backgroundColor: "#10B981",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: isTablet ? 22 : 18,
    borderRadius: isTablet ? 20 : 16,
    gap: isTablet ? 16 : 12,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  submitButtonText: {
    color: "white",
    fontSize: isTablet ? 19 : 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  updateButton: {
    backgroundColor: "#0EA5E9",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: isTablet ? 22 : 18,
    borderRadius: isTablet ? 20 : 16,
    gap: isTablet ? 16 : 12,
    shadowColor: "#0EA5E9",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
    marginTop: isTablet ? 8 : 6,
  },
  updateButtonText: {
    color: "white",
    fontSize: isTablet ? 19 : 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  deleteButton: {
    backgroundColor: "#DC2626",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: isTablet ? 22 : 18,
    borderRadius: isTablet ? 20 : 16,
    gap: isTablet ? 16 : 12,
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
    marginTop: isTablet ? 8 : 6,
  },
  deleteButtonText: {
    color: "white",
    fontSize: isTablet ? 19 : 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  draftButton: {
    backgroundColor: "#F59E0B",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: isTablet ? 22 : 18,
    borderRadius: isTablet ? 20 : 16,
    gap: isTablet ? 16 : 12,
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
    marginTop: isTablet ? 16 : 14,
  },
  draftButtonText: {
    color: "white",
    fontSize: isTablet ? 19 : 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  errorContainer: {
    marginTop: isTablet ? 20 : 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    padding: isTablet ? 20 : 16,
    borderRadius: isTablet ? 16 : 14,
    gap: isTablet ? 16 : 12,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorText: {
    flex: 1,
    fontSize: isTablet ? 16 : 14,
    color: "#DC2626",
    lineHeight: isTablet ? 24 : 20,
    fontWeight: "500",
  },
  infoBannerContainer: {
    marginTop: isTablet ? 16 : 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DBEAFE",
    padding: isTablet ? 16 : 12,
    borderRadius: isTablet ? 14 : 12,
    gap: isTablet ? 12 : 8,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  infoBannerText: {
    flex: 1,
    fontSize: isTablet ? 15 : 13,
    color: "#1E3A8A",
    lineHeight: isTablet ? 22 : 18,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  generateButtonText: {
    color: "white",
    fontSize: isTablet ? 19 : 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  actionButtons: {
    flexDirection: "row",
    gap: isTablet ? 16 : 12,
  },
  previewButton: {
    flex: 1,
    backgroundColor: "#475569",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: isTablet ? 20 : 16,
    borderRadius: isTablet ? 16 : 12,
    gap: isTablet ? 12 : 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  previewButtonText: {
    color: "white",
    fontSize: isTablet ? 18 : 16,
    fontWeight: "700",
  },
  downloadButton: {
    flex: 1,
    backgroundColor: "#10B981",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: isTablet ? 20 : 16,
    borderRadius: isTablet ? 16 : 12,
    gap: isTablet ? 12 : 8,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  downloadButtonText: {
    color: "white",
    fontSize: isTablet ? 19 : 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  infoNote: {
    backgroundColor: "#EFF6FF",
    borderRadius: isTablet ? 20 : 16,
    padding: isTablet ? 24 : 20,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    ...Platform.select({
      ios: {
        shadowColor: "#2563EB",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: isTablet ? 16 : 14,
  },
  infoTitle: {
    fontSize: isTablet ? 17 : 15,
    fontWeight: "700",
    color: "#1E40AF",
    marginBottom: isTablet ? 8 : 6,
    letterSpacing: -0.1,
  },
  infoDescription: {
    fontSize: isTablet ? 16 : 14,
    color: "#1E40AF",
    lineHeight: isTablet ? 24 : 21,
  },
  draftNote: {
    backgroundColor: "#FEF3C7",
    borderRadius: isTablet ? 20 : 16,
    padding: isTablet ? 24 : 20,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#FCD34D",
    marginTop: isTablet ? 20 : 16,
    ...Platform.select({
      ios: {
        shadowColor: "#F59E0B",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  draftNoteTitle: {
    fontSize: isTablet ? 17 : 15,
    fontWeight: "700",
    color: "#D97706",
    marginBottom: isTablet ? 8 : 6,
    letterSpacing: -0.1,
  },
  draftNoteDescription: {
    fontSize: isTablet ? 16 : 14,
    color: "#D97706",
    lineHeight: isTablet ? 24 : 21,
  },
  card: {
    backgroundColor: "white",
    borderRadius: isTablet ? 20 : 16,
    padding: isTablet ? 24 : 20,
    marginBottom: isTablet ? 20 : 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sectionTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: isTablet ? 8 : 6,
  },
  sectionDescription: {
    fontSize: isTablet ? 15 : 14,
    color: "#64748B",
    lineHeight: isTablet ? 22 : 20,
  },
});

export default CMVRDocumentExportScreen;
