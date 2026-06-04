import React, { useState, useEffect, useRef } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  Alert,
  Platform,
} from "react-native";
import {
  useNavigation,
  useRoute,
  CommonActions,
} from "@react-navigation/native";
import { CMSHeader } from "../../../components/CMSHeader";
import GeneralInfoSection from "./components/GeneralInfoSection";
import CombinedECCISAGSection from "./components/CombinedECCISAGSection";
import EPEPSection from "./components/EPEPSection";
import RCFSection from "./components/RCFSection";
import MMTSection from "./components/MMTSection";
import type { MMTInfo } from "./types/mmt.types";
import { Ionicons } from "@expo/vector-icons";
import { useFileName } from "../../../contexts/FileNameContext";
import { useCmvrStore } from "../../../store/cmvrStore";
import { keyboardShouldPersistTapsForFabric } from "../../../utils/nativeRuntimeProps";
import { createCMVRReport } from "../../../lib/cmvr";

import {
  CMVRReportScreenNavigationProp,
  CMVRReportScreenRouteProp,
  GeneralInfo,
  ECCInfo,
  ECCAdditionalForm,
  ISAGInfo,
  ISAGAdditionalForm,
  EPEPInfo,
  RCFInfo,
  CreateCMVRDto,
} from "../types/CMVRReportScreen.types";
import { styles } from "../styles/CMVRReportScreen.styles";
import ConfirmationDialog from "../components/ConfirmationDialog";
import { PermitHolderTypeSelection, PermitHolderType } from "./components/PermitHolderTypeSelection";

const transformToBackendDTO = (
  generalInfo: GeneralInfo,
  eccInfo: ECCInfo,
  eccAdditionalForms: ECCAdditionalForm[],
  isagInfo: ISAGInfo,
  isagAdditionalForms: ISAGAdditionalForm[],
  epepInfo: EPEPInfo,
  epepAdditionalForms: Array<Omit<EPEPInfo, "isNA">>,
  rcfInfo: RCFInfo,
  rcfAdditionalForms: Array<Omit<RCFInfo, "isNA">>,
  mtfInfo: RCFInfo,
  mtfAdditionalForms: Array<Omit<RCFInfo, "isNA">>,
  fmrdfInfo: RCFInfo,
  fmrdfAdditionalForms: Array<Omit<RCFInfo, "isNA">>,
  mmtInfo: MMTInfo
): CreateCMVRDto => {
  return {
    companyName: generalInfo.companyName,
    location: [
      generalInfo.location,
      generalInfo.municipality,
      generalInfo.province,
      generalInfo.region,
    ]
      .filter(Boolean)
      .join(", "),
    quarter: generalInfo.quarter,
    year: parseInt(generalInfo.year) || new Date().getFullYear(),
    dateOfComplianceMonitoringAndValidation: generalInfo.dateOfCompliance,
    monitoringPeriodCovered: generalInfo.monitoringPeriod,
    dateOfCmrSubmission: generalInfo.dateOfCMRSubmission,
    ecc: [
      ...(eccInfo.isNA
        ? []
        : [
            {
              permitHolderName: eccInfo.permitHolder,
              eccNumber: eccInfo.eccNumber,
              dateOfIssuance: eccInfo.dateOfIssuance,
            },
          ]),
      ...eccAdditionalForms.map((form) => ({
        permitHolderName: form.permitHolder,
        eccNumber: form.eccNumber,
        dateOfIssuance: form.dateOfIssuance,
      })),
    ],
    isagMpp: [
      ...(isagInfo.isNA
        ? []
        : [
            {
              permitHolderName: isagInfo.permitHolder,
              isagPermitNumber: isagInfo.isagNumber,
              dateOfIssuance: isagInfo.dateOfIssuance,
            },
          ]),
      ...isagAdditionalForms.map((form) => ({
        permitHolderName: form.permitHolder,
        isagPermitNumber: form.isagNumber,
        dateOfIssuance: form.dateOfIssuance,
      })),
    ],
    projectCurrentName: isagInfo.currentName || generalInfo.projectName,
    projectNameInEcc: isagInfo.nameInECC || generalInfo.projectName,
    projectStatus: isagInfo.projectStatus,
    projectGeographicalCoordinates:
      isagInfo.gpsX && isagInfo.gpsY
        ? `X: ${isagInfo.gpsX}, Y: ${isagInfo.gpsY}`
        : "",
    proponent: {
      contactPersonAndPosition: isagInfo.proponentContact,
      mailingAddress: isagInfo.proponentAddress,
      telephoneFax: isagInfo.proponentPhone,
      emailAddress: isagInfo.proponentEmail,
    },
    mmt: {
      contactPersonAndPosition: mmtInfo.contactPerson,
      mailingAddress: mmtInfo.mailingAddress,
      telephoneFax: mmtInfo.phoneNumber,
      emailAddress: mmtInfo.emailAddress,
    },
    epepFmrdpStatus: epepInfo.isNA ? "N/A" : "Approved",
    epep: [
      ...(epepInfo.isNA
        ? []
        : [
            {
              permitHolderName: epepInfo.permitHolder,
              epepNumber: epepInfo.epepNumber,
              dateOfApproval: epepInfo.dateOfApproval,
            },
          ]),
      ...epepAdditionalForms.map((form) => ({
        permitHolderName: form.permitHolder,
        epepNumber: form.epepNumber,
        dateOfApproval: form.dateOfApproval,
      })),
    ],
    rehabilitationCashFund: [
      ...(rcfInfo.isNA
        ? []
        : [
            {
              permitHolderName: rcfInfo.permitHolder,
              savingsAccountNumber: rcfInfo.savingsAccount,
              amountDeposited: rcfInfo.amountDeposited,
              dateUpdated: rcfInfo.dateUpdated,
            },
          ]),
      ...rcfAdditionalForms.map((form) => ({
        permitHolderName: form.permitHolder,
        savingsAccountNumber: form.savingsAccount,
        amountDeposited: form.amountDeposited,
        dateUpdated: form.dateUpdated,
      })),
    ],
    monitoringTrustFundUnified: [
      ...(mtfInfo.isNA
        ? []
        : [
            {
              permitHolderName: mtfInfo.permitHolder,
              savingsAccountNumber: mtfInfo.savingsAccount,
              amountDeposited: mtfInfo.amountDeposited,
              dateUpdated: mtfInfo.dateUpdated,
            },
          ]),
      ...mtfAdditionalForms.map((form) => ({
        permitHolderName: form.permitHolder,
        savingsAccountNumber: form.savingsAccount,
        amountDeposited: form.amountDeposited,
        dateUpdated: form.dateUpdated,
      })),
    ],
    finalMineRehabilitationAndDecommissioningFund: [
      ...(fmrdfInfo.isNA
        ? []
        : [
            {
              permitHolderName: fmrdfInfo.permitHolder,
              savingsAccountNumber: fmrdfInfo.savingsAccount,
              amountDeposited: fmrdfInfo.amountDeposited,
              dateUpdated: fmrdfInfo.dateUpdated,
            },
          ]),
      ...fmrdfAdditionalForms.map((form) => ({
        permitHolderName: form.permitHolder,
        savingsAccountNumber: form.savingsAccount,
        amountDeposited: form.amountDeposited,
        dateUpdated: form.dateUpdated,
      })),
    ],
  };
};

const CMVRReportScreen: React.FC = () => {
  const navigation = useNavigation<CMVRReportScreenNavigationProp>();
  const route = useRoute<CMVRReportScreenRouteProp>();
  const routeParams = route.params || {};
  const routeDraftData =
    routeParams.draftData && typeof routeParams.draftData === "object"
      ? routeParams.draftData
      : null;

  useEffect(() => {
    if (routeParams.submissionId) {
      console.warn(
        `[CMVR] Opening existing submission ${routeParams.submissionId} on CMVRReportScreen`
      );
    }
  }, [routeParams.submissionId]);

  // **ZUSTAND STORE** - Single source of truth
  const {
    currentReport,
    fileName: storeFileName,
    submissionId: storeSubmissionId,
    projectId: storeProjectId,
    projectName: storeProjectName,
    isDirty,
    updateSection,
    updateMultipleSections,
    updateMetadata,
    saveDraft,
    loadDraft,
    initializeNewReport,
    loadReport,
    clearReport,
  } = useCmvrStore();

  // Local UI state
  const [isSaving, setIsSaving] = useState(false);
  const [showBackDialog, setShowBackDialog] = useState(false);
  // ✅ NEW: Permit holder type selection
  const [showPermitHolderTypeSelection, setShowPermitHolderTypeSelection] = useState(false);
  const permitHolderType = currentReport?.permitHolderType || "single";

  // Legacy fileName context (keep for compatibility with other screens)
  const { fileName: contextFileName, setFileName: setContextFileName } =
    useFileName();

  const initialSnapshotRef = useRef<{
    report: any;
    metadata: {
      fileName: string;
      submissionId: string | null;
      projectId: string | null;
      projectName: string;
    };
  } | null>(null);

  // **INITIALIZATION** - Load from draft or route params on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        // Priority: route draft payload > submission params > stored draft > new report
        if (routeDraftData) {
          loadReport(routeDraftData);

          const derivedFileName =
            routeParams.fileName ||
            routeDraftData.fileName ||
            contextFileName ||
            "Untitled";

          updateMetadata({
            fileName: derivedFileName,
            submissionId:
              routeParams.submissionId ?? routeDraftData.submissionId ?? null,
            projectId: routeParams.projectId ?? routeDraftData.projectId ?? null,
            projectName:
              routeParams.projectName ||
              routeDraftData.projectName ||
              routeDraftData.generalInfo?.projectName ||
              "",
          });

          setContextFileName(derivedFileName);
          return;
        }

        if (routeParams.submissionId) {
          // Loading existing submission or draft from route
          // ✅ FIX: If we have a submissionId but no draftData, fetch from API
          if (!routeDraftData && routeParams.submissionId) {
            try {
              const { getCMVRReportById } = await import("../../../lib/cmvr");
              const apiReportData = await getCMVRReportById(routeParams.submissionId);
              if (apiReportData) {
                loadReport(apiReportData);
                const fileName = apiReportData.fileName || routeParams.fileName || "Untitled";
                const projectName = apiReportData.projectName || apiReportData.generalInfo?.projectName || "";
                updateMetadata({
                  fileName,
                  submissionId: routeParams.submissionId,
                  projectId: routeParams.projectId || apiReportData.projectId || null,
                  projectName,
                });
                setContextFileName(fileName);
                return;
              }
            } catch (apiError) {
              console.error("[CMVR] Failed to fetch report from API:", apiError);
              // Fall through to use route params as fallback
            }
          }
          
          // Loading from route params or draft data
          const reportData = {
            generalInfo:
              routeParams.draftData?.generalInfo || currentReport?.generalInfo,
            eccInfo: routeParams.draftData?.eccInfo || currentReport?.eccInfo,
            eccAdditionalForms:
              routeParams.draftData?.eccAdditionalForms ||
              currentReport?.eccAdditionalForms,
            isagInfo: routeParams.draftData?.isagInfo || currentReport?.isagInfo,
            isagAdditionalForms:
              routeParams.draftData?.isagAdditionalForms ||
              currentReport?.isagAdditionalForms,
            epepInfo: routeParams.draftData?.epepInfo || currentReport?.epepInfo,
            epepAdditionalForms:
              routeParams.draftData?.epepAdditionalForms ||
              currentReport?.epepAdditionalForms,
            rcfInfo: routeParams.draftData?.rcfInfo || currentReport?.rcfInfo,
            rcfAdditionalForms:
              routeParams.draftData?.rcfAdditionalForms ||
              currentReport?.rcfAdditionalForms,
            mtfInfo: routeParams.draftData?.mtfInfo || currentReport?.mtfInfo,
            mtfAdditionalForms:
              routeParams.draftData?.mtfAdditionalForms ||
              currentReport?.mtfAdditionalForms,
            fmrdfInfo:
              routeParams.draftData?.fmrdfInfo || currentReport?.fmrdfInfo,
            fmrdfAdditionalForms:
              routeParams.draftData?.fmrdfAdditionalForms ||
              currentReport?.fmrdfAdditionalForms,
            mmtInfo: routeParams.draftData?.mmtInfo || currentReport?.mmtInfo,
            // ✅ FIX: Include permitHolderList and attendanceId
            permitHolderList:
              routeParams.draftData?.permitHolderList ||
              currentReport?.permitHolderList ||
              [],
            attendanceId:
              routeParams.draftData?.attendanceId ||
              currentReport?.attendanceId ||
              null,
          };

          loadReport(reportData);

          const fileName =
            routeParams.fileName || routeParams.draftData?.fileName || "Untitled";
          const projectName =
            routeParams.projectName ||
            routeParams.draftData?.generalInfo?.projectName ||
            "";

          updateMetadata({
            fileName,
            submissionId: routeParams.submissionId ?? null,
            projectId: routeParams.projectId ?? null,
            projectName,
          });

          setContextFileName(fileName);
        } else {
          // Always start fresh for new CMVR entries
          const newFileName = contextFileName || "Untitled";
          initializeNewReport(newFileName);
          setContextFileName(newFileName);
          // ✅ NEW: Show permit holder type selection for new reports
          if (!currentReport?.permitHolderType) {
            setShowPermitHolderTypeSelection(true);
          }
        }
      } catch (error) {
        console.error("[ERROR] CMVR initialization failed:", error);
        Alert.alert(
          "Initialization Error",
          "Failed to initialize CMVR report. Please try again."
        );
        // Fallback: Try to create new report
        try {
          const newFileName = contextFileName || "Untitled";
          initializeNewReport(newFileName);
          setContextFileName(newFileName);
        } catch (fallbackError) {
          console.error("[ERROR] Fallback initialization failed:", fallbackError);
          // If everything fails, navigate back
          setTimeout(() => navigation.goBack(), 1000);
        }
      }
    };

    initialize();
  }, []); // Run once on mount

  useEffect(() => {
    if (initialSnapshotRef.current || !currentReport) {
      return;
    }

    initialSnapshotRef.current = {
      report: JSON.parse(JSON.stringify(currentReport)),
      metadata: {
        fileName: storeFileName || contextFileName || "Untitled",
        submissionId: storeSubmissionId ?? null,
        projectId: storeProjectId ?? null,
        projectName:
          storeProjectName || currentReport?.generalInfo?.projectName || "",
      },
    };
  }, [
    currentReport,
    storeFileName,
    contextFileName,
    storeSubmissionId,
    storeProjectId,
    storeProjectName,
  ]);

  // **DERIVED STATE** - Get current values from store
  const generalInfo = currentReport?.generalInfo || {
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

  const eccInfo = currentReport?.eccInfo || {
    isNA: false,
    permitHolder: "",
    eccNumber: "",
    dateOfIssuance: "",
  };
  // Ensure isNA is properly read from store
  if (
    currentReport?.eccInfo &&
    typeof currentReport.eccInfo.isNA === "boolean"
  ) {
    eccInfo.isNA = currentReport.eccInfo.isNA;
  }

  const eccAdditionalForms = currentReport?.eccAdditionalForms || [];
  const isagInfo = currentReport?.isagInfo || {
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
  // Ensure isNA is properly read from store
  if (
    currentReport?.isagInfo &&
    typeof currentReport.isagInfo.isNA === "boolean"
  ) {
    isagInfo.isNA = currentReport.isagInfo.isNA;
  }

  const isagAdditionalForms = currentReport?.isagAdditionalForms || [];
  const epepInfo = currentReport?.epepInfo || {
    isNA: false,
    permitHolder: "",
    epepNumber: "",
    dateOfApproval: "",
  };
  if (
    currentReport?.epepInfo &&
    typeof currentReport.epepInfo.isNA === "boolean"
  ) {
    epepInfo.isNA = currentReport.epepInfo.isNA;
  }

  const epepAdditionalForms = currentReport?.epepAdditionalForms || [];
  const rcfInfo = currentReport?.rcfInfo || {
    isNA: false,
    permitHolder: "",
    savingsAccount: "",
    amountDeposited: "",
    dateUpdated: "",
  };
  if (
    currentReport?.rcfInfo &&
    typeof currentReport.rcfInfo.isNA === "boolean"
  ) {
    rcfInfo.isNA = currentReport.rcfInfo.isNA;
  }

  const rcfAdditionalForms = currentReport?.rcfAdditionalForms || [];
  const mtfInfo = currentReport?.mtfInfo || {
    isNA: false,
    permitHolder: "",
    savingsAccount: "",
    amountDeposited: "",
    dateUpdated: "",
  };
  if (
    currentReport?.mtfInfo &&
    typeof currentReport.mtfInfo.isNA === "boolean"
  ) {
    mtfInfo.isNA = currentReport.mtfInfo.isNA;
  }

  const mtfAdditionalForms = currentReport?.mtfAdditionalForms || [];
  const fmrdfInfo = currentReport?.fmrdfInfo || {
    isNA: false,
    permitHolder: "",
    savingsAccount: "",
    amountDeposited: "",
    dateUpdated: "",
  };
  if (
    currentReport?.fmrdfInfo &&
    typeof currentReport.fmrdfInfo.isNA === "boolean"
  ) {
    fmrdfInfo.isNA = currentReport.fmrdfInfo.isNA;
  }

  const fmrdfAdditionalForms = currentReport?.fmrdfAdditionalForms || [];
  const mmtInfo = currentReport?.mmtInfo || {
    isNA: false,
    contactPerson: "",
    mailingAddress: "",
    phoneNumber: "",
    emailAddress: "",
  };

  const permitHolderList = currentReport?.permitHolderList || [];

  const isExistingSubmission = Boolean(
    routeParams.submissionId ?? storeSubmissionId
  );
  // ✅ FIX: Ensure statusLabel and statusSubtext are always strings
  const statusLabel = isExistingSubmission
    ? "Editing Submitted CMVR"
    : "New CMVR Report";
  const statusSubtext = isExistingSubmission
    ? `Submission ID: ${routeParams.submissionId || storeSubmissionId || "Unknown"}`
    : "All sections start blank without previous data.";

  // **HANDLERS** - Update store instead of local state
  const handleGeneralInfoChange = (field: string, value: string) => {
    if (field === "fileName") {
      updateMetadata({ fileName: value });
      setContextFileName(value);
    } else {
      updateSection("generalInfo", { ...generalInfo, [field]: value });
    }
  };

  // **SETTER FUNCTIONS** - Wrappers to update store sections
  const setEccInfo = (value: ECCInfo | ((prev: ECCInfo) => ECCInfo)) => {
    // ✅ FIX: Add null/undefined safety check
    const defaultEccInfo: ECCInfo = { isNA: false, permitHolder: "", eccNumber: "", dateOfIssuance: "" };
    const newValue = typeof value === "function" ? value(eccInfo || defaultEccInfo) : value;
    updateSection("eccInfo", newValue);
  };

  const setEccAdditionalForms = (
    value:
      | ECCAdditionalForm[]
      | ((prev: ECCAdditionalForm[]) => ECCAdditionalForm[])
  ) => {
    const newValue =
      typeof value === "function" ? value(eccAdditionalForms) : value;
    updateSection("eccAdditionalForms", newValue);
  };

  const setIsagInfo = (value: ISAGInfo | ((prev: ISAGInfo) => ISAGInfo)) => {
    // ✅ FIX: Add null/undefined safety check
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
    const newValue = typeof value === "function" ? value(isagInfo || defaultIsagInfo) : value;
    updateSection("isagInfo", newValue);
  };

  const setIsagAdditionalForms = (
    value:
      | ISAGAdditionalForm[]
      | ((prev: ISAGAdditionalForm[]) => ISAGAdditionalForm[])
  ) => {
    const newValue =
      typeof value === "function" ? value(isagAdditionalForms) : value;
    updateSection("isagAdditionalForms", newValue);
  };

  const setEpepInfo = (value: EPEPInfo | ((prev: EPEPInfo) => EPEPInfo)) => {
    // ✅ FIX: Add null/undefined safety check
    const defaultEpepInfo: EPEPInfo = { isNA: false, permitHolder: "", epepNumber: "", dateOfApproval: "" };
    const newValue = typeof value === "function" ? value(epepInfo || defaultEpepInfo) : value;
    updateSection("epepInfo", newValue);
  };

  const setEpepAdditionalForms = (
    value:
      | Array<Omit<EPEPInfo, "isNA">>
      | ((prev: Array<Omit<EPEPInfo, "isNA">>) => Array<Omit<EPEPInfo, "isNA">>)
  ) => {
    const newValue =
      typeof value === "function" ? value(epepAdditionalForms) : value;
    updateSection("epepAdditionalForms", newValue);
  };

  const setRcfInfo = (value: RCFInfo | ((prev: RCFInfo) => RCFInfo)) => {
    // ✅ FIX: Add null/undefined safety check
    const defaultRcfInfo: RCFInfo = { isNA: false, permitHolder: "", savingsAccount: "", amountDeposited: "", dateUpdated: "" };
    const newValue = typeof value === "function" ? value(rcfInfo || defaultRcfInfo) : value;
    updateSection("rcfInfo", newValue);
  };

  const setRcfAdditionalForms = (
    value:
      | Array<Omit<RCFInfo, "isNA">>
      | ((prev: Array<Omit<RCFInfo, "isNA">>) => Array<Omit<RCFInfo, "isNA">>)
  ) => {
    const newValue =
      typeof value === "function" ? value(rcfAdditionalForms) : value;
    updateSection("rcfAdditionalForms", newValue);
  };

  const setMtfInfo = (value: RCFInfo | ((prev: RCFInfo) => RCFInfo)) => {
    // ✅ FIX: Add null/undefined safety check
    const defaultMtfInfo: RCFInfo = { isNA: false, permitHolder: "", savingsAccount: "", amountDeposited: "", dateUpdated: "" };
    const newValue = typeof value === "function" ? value(mtfInfo || defaultMtfInfo) : value;
    updateSection("mtfInfo", newValue);
  };

  const setMtfAdditionalForms = (
    value:
      | Array<Omit<RCFInfo, "isNA">>
      | ((prev: Array<Omit<RCFInfo, "isNA">>) => Array<Omit<RCFInfo, "isNA">>)
  ) => {
    const newValue =
      typeof value === "function" ? value(mtfAdditionalForms) : value;
    updateSection("mtfAdditionalForms", newValue);
  };

  const setFmrdfInfo = (value: RCFInfo | ((prev: RCFInfo) => RCFInfo)) => {
    // ✅ FIX: Add null/undefined safety check
    const defaultFmrdfInfo: RCFInfo = { isNA: false, permitHolder: "", savingsAccount: "", amountDeposited: "", dateUpdated: "" };
    const newValue = typeof value === "function" ? value(fmrdfInfo || defaultFmrdfInfo) : value;
    updateSection("fmrdfInfo", newValue);
  };

  const setFmrdfAdditionalForms = (
    value:
      | Array<Omit<RCFInfo, "isNA">>
      | ((prev: Array<Omit<RCFInfo, "isNA">>) => Array<Omit<RCFInfo, "isNA">>)
  ) => {
    const newValue =
      typeof value === "function" ? value(fmrdfAdditionalForms) : value;
    updateSection("fmrdfAdditionalForms", newValue);
  };

  const setMmtInfo = (value: MMTInfo | ((prev: MMTInfo) => MMTInfo)) => {
    // ✅ FIX: Add null/undefined safety check
    const defaultMmtInfo: MMTInfo = { isNA: false, contactPerson: "", mailingAddress: "", phoneNumber: "", emailAddress: "" };
    const newValue = typeof value === "function" ? value(mmtInfo || defaultMmtInfo) : value;
    updateSection("mmtInfo", newValue);
  };

  const setPermitHolderList = (
    value: string[] | ((prev: string[]) => string[])
  ) => {
    const newValue =
      typeof value === "function" ? value(permitHolderList) : value;
    updateSection("permitHolderList", newValue);
  };

  const setGeneralInfo = (
    value: GeneralInfo | ((prev: GeneralInfo) => GeneralInfo)
  ) => {
    // ✅ FIX: Add null/undefined safety check
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
    const newValue = typeof value === "function" ? value(generalInfo || defaultGeneralInfo) : value;
    updateSection("generalInfo", newValue);
  };

  // Note: isDirty is automatically tracked by the store, no need for local hasUnsavedChanges

  const fillTestData = () => {
    // ✅ FIX: Use consistent permit holder names that match between permitHolderList and all form fields
    const testPermitHolders = [
      "First Permit Holder Corp.",
      "Second Mining Company Ltd.",
      "Third Resources Inc.",
      "Fourth Development Corp.",
    ];
    
    setPermitHolderList(testPermitHolders);
    
    // ✅ FIX: Set permitHolderType (default to "single" for test data)
    updateMultipleSections({ permitHolderType: "single" });
    
    setGeneralInfo({
      companyName: "Test Mining Company",
      projectName:
        storeProjectName || generalInfo?.projectName || "Test Project",
      location: "123 Mining Street",
      region: "Region 1",
      province: "Test Province",
      municipality: "Test Municipality",
      quarter: "1st",
      year: "2025",
      dateOfCompliance: "2025-03-31",
      monitoringPeriod: "2025-01-01 to 2025-03-31",
      dateOfCMRSubmission: "2025-04-15",
    });
    
    // ✅ FIX: Use permit holder names from the list
    setEccInfo({
      isNA: false,
      permitHolder: testPermitHolders[0], // "First Permit Holder Corp."
      eccNumber: "ECC-2025-001",
      dateOfIssuance: "2025-01-15",
    });
    setEccAdditionalForms([
      {
        permitHolder: testPermitHolders[1], // "Second Mining Company Ltd."
        eccNumber: "ECC-2025-002",
        dateOfIssuance: "2025-01-20",
      },
      {
        permitHolder: testPermitHolders[2], // "Third Resources Inc."
        eccNumber: "ECC-2025-003",
        dateOfIssuance: "2025-01-25",
      },
    ]);
    setIsagInfo({
      isNA: false,
      permitHolder: testPermitHolders[0], // "First Permit Holder Corp."
      isagNumber: "ISAG-2025-001",
      dateOfIssuance: "2025-01-20",
      currentName: "Current Test Project",
      nameInECC: "Test Project in ECC",
      projectStatus: "Active",
      gpsX: "120.5678",
      gpsY: "14.1234",
      proponentName: "Test Proponent",
      proponentContact: "John Doe, CEO",
      proponentAddress: "456 Business Ave",
      proponentPhone: "+63-912-345-6789",
      proponentEmail: "test@mining.com",
    });
    setIsagAdditionalForms([
      {
        permitHolder: testPermitHolders[1], // "Second Mining Company Ltd."
        isagNumber: "ISAG-2025-002",
        dateOfIssuance: "2025-01-25",
      },
      {
        permitHolder: testPermitHolders[2], // "Third Resources Inc."
        isagNumber: "ISAG-2025-003",
        dateOfIssuance: "2025-01-30",
      },
    ]);
    setEpepInfo({
      isNA: false,
      permitHolder: testPermitHolders[0], // "First Permit Holder Corp."
      epepNumber: "EPEP-2025-001",
      dateOfApproval: "2025-02-01",
    });
    setEpepAdditionalForms([
      {
        permitHolder: testPermitHolders[1], // "Second Mining Company Ltd."
        epepNumber: "EPEP-2025-002",
        dateOfApproval: "2025-02-05",
      },
      {
        permitHolder: testPermitHolders[2], // "Third Resources Inc."
        epepNumber: "EPEP-2025-003",
        dateOfApproval: "2025-02-10",
      },
    ]);
    setRcfInfo({
      isNA: false,
      permitHolder: testPermitHolders[0], // "First Permit Holder Corp."
      savingsAccount: "RCF-1234-5678-90",
      amountDeposited: "500,000.00",
      dateUpdated: "2025-03-01",
    });
    setRcfAdditionalForms([
      {
        permitHolder: testPermitHolders[1], // "Second Mining Company Ltd."
        savingsAccount: "RCF-2345-6789-01",
        amountDeposited: "750,000.00",
        dateUpdated: "2025-03-05",
      },
      {
        permitHolder: testPermitHolders[2], // "Third Resources Inc."
        savingsAccount: "RCF-3456-7890-12",
        amountDeposited: "1,000,000.00",
        dateUpdated: "2025-03-10",
      },
    ]);
    setMtfInfo({
      isNA: false,
      permitHolder: testPermitHolders[0], // "First Permit Holder Corp."
      savingsAccount: "MTF-1234-5678-90",
      amountDeposited: "2,500,000.00",
      dateUpdated: "2025-03-01",
    });
    setMtfAdditionalForms([
      {
        permitHolder: testPermitHolders[1], // "Second Mining Company Ltd."
        savingsAccount: "MTF-2345-6789-01",
        amountDeposited: "3,000,000.00",
        dateUpdated: "2025-03-05",
      },
      {
        permitHolder: testPermitHolders[2], // "Third Resources Inc."
        savingsAccount: "MTF-3456-7890-12",
        amountDeposited: "3,500,000.00",
        dateUpdated: "2025-03-10",
      },
    ]);
    setFmrdfInfo({
      isNA: false,
      permitHolder: testPermitHolders[0], // "First Permit Holder Corp."
      savingsAccount: "FMRDF-1234-5678-90",
      amountDeposited: "1,500,000.00",
      dateUpdated: "2025-03-01",
    });
    setFmrdfAdditionalForms([
      {
        permitHolder: testPermitHolders[1], // "Second Mining Company Ltd."
        savingsAccount: "FMRDF-2345-6789-01",
        amountDeposited: "2,000,000.00",
        dateUpdated: "2025-03-05",
      },
      {
        permitHolder: testPermitHolders[2], // "Third Resources Inc."
        savingsAccount: "FMRDF-3456-7890-12",
        amountDeposited: "2,500,000.00",
        dateUpdated: "2025-03-10",
      },
    ]);
    setMmtInfo({
      isNA: false,
      contactPerson: "Jane Smith, MMT Head",
      mailingAddress: "789 Government St",
      phoneNumber: "+63-912-987-6543",
      emailAddress: "mmt@denr.gov",
    });
    Alert.alert(
      "Test Data",
      "Form filled with test data! (3 entries per array)"
    );
  };

  const handleSave = async () => {
    if (isSaving) {
      console.log("Save already in progress...");
      return;
    }
    try {
      setIsSaving(true);

      // Save to AsyncStorage using store
      await saveDraft();

      Alert.alert("Success", "Draft saved successfully");
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "Dashboard" }],
        })
      );
      clearReport();
      return true;
    } catch (error: any) {
      console.error("Error saving draft:", error);
      Alert.alert("Error", "Failed to save draft. Please try again.", [
        { text: "OK" },
      ]);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleStay = () => {
    // Do nothing, just close the modal
    console.log("User chose to stay");
  };

  const handleSaveToDraft = async (): Promise<void> => {
    // Same as handleSave (using store's saveDraft)
    await handleSave();
  };

  const handleDiscard = () => {
    clearReport();
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "Dashboard" }],
      })
    );
  };

  const handleSaveAndContinue = async () => {
    const currentFileName = storeFileName || contextFileName || "Untitled";

    if (!currentFileName || currentFileName.trim() === "") {
      Alert.alert(
        "File Name Required",
        "Please enter a file name before continuing.",
        [{ text: "OK" }]
      );
      return;
    }

    try {
      console.log("[CMVR Page 1] Continuing to next page...");
      console.log("[CMVR Page 1] Current report state:", currentReport ? "exists" : "null");

      // Ensure current report exists before navigating
      if (!currentReport) {
        console.error("[CMVR Page 1 ERROR] No current report in store!");
        Alert.alert(
          "Error",
          "Failed to initialize report. Please try again.",
          [{ text: "OK" }]
        );
        return;
      }

      // Store already has all the data - just navigate
      // No need to pass data via params anymore!
      navigation.navigate("CMVRPage2", {
        // Only pass metadata (not the actual form data)
        submissionId: storeSubmissionId,
        projectId: storeProjectId,
        projectName: storeProjectName,
        fileName: currentFileName,
      } as any);
    } catch (error) {
      console.error("[CMVR Page 1 ERROR] Error navigating:", error);
      Alert.alert(
        "Navigation Error",
        "Failed to navigate to next page. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  const handleBack = () => {
    // Always show the dialog to confirm discard or stay
    setShowBackDialog(true);
  };

  const confirmBack = () => {
    // Discard: Navigate back without saving to drafts
    setShowBackDialog(false);

    const snapshot = initialSnapshotRef.current;
    if (snapshot?.report) {
      loadReport({
        ...snapshot.report,
        fileName: snapshot.metadata.fileName,
        submissionId: snapshot.metadata.submissionId ?? undefined,
        projectId: snapshot.metadata.projectId ?? undefined,
        projectName: snapshot.metadata.projectName,
      });
    } else if (routeDraftData) {
      loadReport({
        ...routeDraftData,
        fileName:
          routeDraftData.fileName ||
          storeFileName ||
          contextFileName ||
          "Untitled",
      });
    }
    navigation.goBack();
  };

  const handleGoToSummary = () => {
    (navigation as any).navigate("CMVRDocumentExport", {
      cmvrReportId: routeParams.submissionId || storeSubmissionId || undefined,
      fileName: storeFileName || contextFileName || "Untitled",
      projectId: routeParams.projectId || storeProjectId || undefined,
      projectName:
        routeParams.projectName ||
        storeProjectName ||
        generalInfo.projectName ||
        "",
    });
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <CMSHeader
          onBack={handleBack}
          onSave={handleSave}
          onStay={handleStay}
          onSaveToDraft={handleSaveToDraft}
          onDiscard={handleDiscard}
          onGoToSummary={handleGoToSummary}
          allowEdit={true}
        />
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps={keyboardShouldPersistTapsForFabric}
      >
        <View
          style={[
            styles.statusBanner,
            isExistingSubmission
              ? styles.statusBannerExisting
              : styles.statusBannerNew,
          ]}
        >
          <Text style={styles.statusBannerLabel}>{statusLabel}</Text>
          <Text style={styles.statusBannerSubtext}>{statusSubtext}</Text>
        </View>
        {__DEV__ && (
          <TouchableOpacity
            style={{
              backgroundColor: "#FFA500",
              padding: 12,
              borderRadius: 8,
              marginBottom: 16,
              alignItems: "center",
            }}
            onPress={fillTestData}
          >
            <Text style={{ color: "white", fontWeight: "bold" }}>
              🧪 Fill Test Data
            </Text>
          </TouchableOpacity>
        )}
        <GeneralInfoSection
          fileName={storeFileName || contextFileName || "Untitled"}
          {...generalInfo}
          onChange={handleGeneralInfoChange}
        />
        <View style={styles.divider} />
        <CombinedECCISAGSection
          eccInfo={eccInfo}
          setEccInfo={setEccInfo}
          eccAdditionalForms={eccAdditionalForms}
          setEccAdditionalForms={setEccAdditionalForms}
          isagInfo={isagInfo}
          setIsagInfo={setIsagInfo}
          isagAdditionalForms={isagAdditionalForms}
          setIsagAdditionalForms={setIsagAdditionalForms}
          permitHolderList={permitHolderList}
          setPermitHolderList={setPermitHolderList}
        />
        <View style={styles.divider} />
        <EPEPSection
          epepInfo={epepInfo}
          setEpepInfo={setEpepInfo}
          epepAdditionalForms={epepAdditionalForms}
          setEpepAdditionalForms={setEpepAdditionalForms}
          permitHolderList={permitHolderList}
          setPermitHolderList={setPermitHolderList}
        />
        <View style={styles.divider} />
        <RCFSection
          rcfInfo={rcfInfo}
          setRcfInfo={setRcfInfo}
          rcfAdditionalForms={rcfAdditionalForms}
          setRcfAdditionalForms={setRcfAdditionalForms}
          mtfInfo={mtfInfo}
          setMtfInfo={setMtfInfo}
          mtfAdditionalForms={mtfAdditionalForms}
          setMtfAdditionalForms={setMtfAdditionalForms}
          fmrdfInfo={fmrdfInfo}
          setFmrdfInfo={setFmrdfInfo}
          fmrdfAdditionalForms={fmrdfAdditionalForms}
          setFmrdfAdditionalForms={setFmrdfAdditionalForms}
          permitHolderList={permitHolderList}
        />
        <View style={styles.divider} />
        <MMTSection mmtInfo={mmtInfo} setMmtInfo={setMmtInfo} />
        <TouchableOpacity
          style={styles.saveNextButton}
          onPress={handleSaveAndContinue}
        >
          <Text style={styles.saveNextButtonText}>Save & Next</Text>
          <Ionicons name="arrow-forward" size={20} color="white" />
        </TouchableOpacity>
        {/* filler gap ts not advisable tbh*/}
        <View style={{ height: 40 }} />
      </ScrollView>
      <ConfirmationDialog
        visible={showBackDialog}
        title="Go Back"
        message="Are you sure you want to go back? Any unsaved data will be lost."
        confirmText="Discard"
        cancelText="Stay"
        onConfirm={confirmBack}
        onCancel={() => setShowBackDialog(false)}
        type="warning"
      />
      {/* ✅ NEW: Permit Holder Type Selection Modal */}
      <PermitHolderTypeSelection
        visible={showPermitHolderTypeSelection}
        currentType={(permitHolderType || "single") as PermitHolderType}
        onSelect={(type) => {
          updateMultipleSections({ permitHolderType: type });
          setShowPermitHolderTypeSelection(false);
        }}
        onCancel={() => {
          // Default to "single" if cancelled
          if (!currentReport?.permitHolderType) {
            updateMultipleSections({ permitHolderType: "single" });
          }
          setShowPermitHolderTypeSelection(false);
        }}
      />
    </View>
  );
};

export default CMVRReportScreen;
