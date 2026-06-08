import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { CommonActions } from "@react-navigation/native";
import { CMSHeader } from "../../../components/CMSHeader";
import { Checkbox } from "../../../components/CheckBox";
import { useCmvrStore } from "../../../store/cmvrStore";
import { LocationSection } from "./components/LocationSection";
import { ParameterForm } from "./components/ParameterForm";
import { SamplingDetailsSection } from "./components/SamplingDetailsSection";
import { OverallComplianceSection } from "./components/OverallComplianceSection";
import { LocationMonitoringSection } from "./components/LocationMonitoringSection";
import {
  Parameter,
  LocationState,
  WaterQualityData,
  PortData,
  LocationData,
  createEmptyLocationData,
} from "../types/WaterQualityScreen.types";
import { styles } from "../styles/WaterQualityScreen.styles";

export default function WaterQualityScreen({ navigation, route }: any) {
  // **ZUSTAND STORE** - Single source of truth
  const {
    currentReport,
    updateSection,
    saveDraft,
    fileName: storeFileName,
    submissionId: storeSubmissionId,
    projectId: storeProjectId,
    projectName: storeProjectName,
  } = useCmvrStore();

  const storedWaterQuality = currentReport?.waterQualityImpactAssessment;

  // Get current water quality data from store
  const waterQualitySection = storedWaterQuality || {
    quarry: "",
    plant: "",
    quarryPlant: "",
    port: "", // ✅ FIX: Port description as string (like quarry, plant, quarryPlant)
    quarryEnabled: false,
    plantEnabled: false,
    quarryPlantEnabled: false,
    portEnabled: false,
    waterQuality: createEmptyLocationData(),
    portData: createEmptyLocationData(), // ✅ FIX: Port monitoring data stored separately
    data: {
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
    },
    parameters: [],
  };

  // Local state for UI (derived from store)
  const [quarryEnabled, setQuarryEnabled] = useState<boolean>(
    waterQualitySection.quarryEnabled
  );
  const [plantEnabled, setPlantEnabled] = useState<boolean>(
    waterQualitySection.plantEnabled
  );
  const [quarryPlantEnabled, setQuarryPlantEnabled] = useState<boolean>(
    waterQualitySection.quarryPlantEnabled
  );

  const [portEnabled, setPortEnabled] = useState<boolean>(
    waterQualitySection.portEnabled ?? false
  );

  const [quarryInput, setQuarryInput] = useState<string>(
    waterQualitySection.quarry
  );
  const [plantInput, setPlantInput] = useState<string>(
    waterQualitySection.plant
  );
  const [quarryPlantInput, setQuarryPlantInput] = useState<string>(
    waterQualitySection.quarryPlant
  );
  const [portInput, setPortInput] = useState<string>(
    typeof waterQualitySection.port === 'string' 
      ? waterQualitySection.port 
      : ""
  );

  const [waterQualityData, setWaterQualityData] = useState<LocationData>(
    waterQualitySection.waterQuality || createEmptyLocationData()
  );

  const [portData, setPortData] = useState<LocationData>(
    waterQualitySection.portData || 
    (typeof waterQualitySection.port === 'object' && waterQualitySection.port !== null
      ? waterQualitySection.port
      : createEmptyLocationData())
  );

  const [data, setData] = useState<WaterQualityData>(waterQualitySection.data);
  const [parameters, setParameters] = useState<Parameter[]>(
    waterQualitySection.parameters
  );
  const [hasHydratedFromStore, setHasHydratedFromStore] = useState(false);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (hasHydratedFromStore || !currentReport) return;

    if (storedWaterQuality) {
      setQuarryEnabled(storedWaterQuality.quarryEnabled ?? false);
      setPlantEnabled(storedWaterQuality.plantEnabled ?? false);
      setQuarryPlantEnabled(storedWaterQuality.quarryPlantEnabled ?? false);
      setPortEnabled(storedWaterQuality.portEnabled ?? false);
      setQuarryInput(storedWaterQuality.quarry || "");
      setPlantInput(storedWaterQuality.plant || "");
      setQuarryPlantInput(storedWaterQuality.quarryPlant || "");
      setPortInput(
        typeof storedWaterQuality.port === 'string'
          ? storedWaterQuality.port
          : ""
      );

      const waterQualityRestoredData = storedWaterQuality.waterQuality || createEmptyLocationData();
      const portRestoredData = storedWaterQuality.portData ||
        (typeof storedWaterQuality.port === 'object' && storedWaterQuality.port !== null
          ? storedWaterQuality.port
          : createEmptyLocationData());

      // ✅ FIX: Add logging to track parameter restoration
      console.log(`[Water Quality] Hydrating from store. Water Quality parameters: ${waterQualityRestoredData.parameters.length}, Port parameters: ${portRestoredData.parameters.length}`);
      if (waterQualityRestoredData.parameters.length > 0) {
        console.log("[Water Quality] Restored Water Quality parameter IDs:", waterQualityRestoredData.parameters.map(p => ({ id: p.id, param: p.parameter })));
      }
      if (portRestoredData.parameters.length > 0) {
        console.log("[Water Quality] Restored Port parameter IDs:", portRestoredData.parameters.map(p => ({ id: p.id, param: p.parameter })));
      }

      setWaterQualityData(waterQualityRestoredData);
      setPortData(portRestoredData);
      setData(storedWaterQuality.data || waterQualitySection.data);
      setParameters(storedWaterQuality.parameters || []);
    }

    setHasHydratedFromStore(true);
  }, [
    currentReport,
    storedWaterQuality,
    hasHydratedFromStore,
    waterQualitySection.data,
  ]);

  // **SYNC TO STORE** - Debounced update to prevent excessive store updates
  useEffect(() => {
    // Skip sync during initial hydration
    if (!hasHydratedFromStore) return;

    // Clear existing timeout
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    // Debounce store updates by 300ms
    syncTimeoutRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;

      const currentData = {
        quarry: quarryInput,
        plant: plantInput,
        quarryPlant: quarryPlantInput,
        port: portInput, // Store port description as string
        quarryEnabled,
        plantEnabled,
        quarryPlantEnabled,
        portEnabled,
        waterQuality: waterQualityData,
        portData: portData, // Store port monitoring data separately
        data,
        parameters,
      };

      // ✅ FIX: Add logging to track parameter persistence
      console.log(`[Water Quality] Syncing to store. Water Quality parameters: ${waterQualityData.parameters.length}, Port parameters: ${portData.parameters.length}`);
      if (waterQualityData.parameters.length > 0) {
        console.log("[Water Quality] Water Quality parameter IDs:", waterQualityData.parameters.map(p => ({ id: p.id, param: p.parameter })));
      }
      if (portData.parameters.length > 0) {
        console.log("[Water Quality] Port parameter IDs:", portData.parameters.map(p => ({ id: p.id, param: p.parameter })));
      }

      updateSection("waterQualityImpactAssessment", currentData);
    }, 300);

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [
    quarryInput,
    plantInput,
    quarryPlantInput,
    portInput,
    quarryEnabled,
    plantEnabled,
    quarryPlantEnabled,
    portEnabled,
    waterQualityData,
    portData,
    data,
    parameters,
    hasHydratedFromStore,
    updateSection,
  ]);

  // Note: Data hydration now handled by store initialization in CMVRReportScreen
  // No need for complex route.params hydration logic

  const handleSave = async () => {
    // Data already in store via useEffect above
    // No need to do anything - store has the current data
    console.log("Water quality data already synced to store");
  };

  const handleStay = () => {
    console.log("User chose to stay");
  };

  const handleSaveToDraft = async (): Promise<void> => {
    try {
      // Save entire report to AsyncStorage using store
      await saveDraft();

      Alert.alert("Success", "Draft saved successfully");
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "Dashboard" }],
        })
      );
    } catch (error) {
      console.error("Error saving draft:", error);
      Alert.alert("Error", "Failed to save draft. Please try again.");
    }
  };

  const handleDiscard = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "Dashboard" }],
      })
    );
  };

  const handleGoToSummary = () => {
    const params: any = route?.params || {};

    navigation.navigate("CMVRDocumentExport", {
      cmvrReportId: params.submissionId || storeSubmissionId || undefined,
      fileName: storeFileName || params.fileName || "Untitled",
      projectId: params.projectId || storeProjectId || undefined,
      projectName:
        params.projectName ||
        storeProjectName ||
        currentReport?.generalInfo?.projectName ||
        "",
    });
  };

  // ============ UNIFIED WATER QUALITY HANDLERS ============
  const handleWaterQualityMainParameterUpdate = useCallback((
    field: keyof Omit<Parameter, "id">,
    value: string | boolean
  ) => {
    setWaterQualityData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleWaterQualityMMTInputChange = useCallback((field: string, value: string) => {
    setWaterQualityData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleWaterQualityMMTNAToggle = useCallback(() => {
    setWaterQualityData((prev) => ({ ...prev, isMMTNA: !prev.isMMTNA }));
  }, []);

  const addWaterQualityParameter = useCallback(() => {
    const newId = `water-quality-param-${Date.now()}`;
    setWaterQualityData((prev) => {
      const newParameters = [
        ...prev.parameters,
        {
          id: newId,
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
        },
      ];
      console.log(`[Water Quality] Added parameter with ID: ${newId}. Total parameters: ${newParameters.length}`);
      return {
        ...prev,
        parameters: newParameters,
      };
    });
  }, []);

  const updateWaterQualityParameter = useCallback((
    id: string,
    field: keyof Omit<Parameter, "id">,
    value: string | boolean
  ) => {
    setWaterQualityData((prev) => ({
      ...prev,
      parameters: prev.parameters.map((param) =>
        param.id === id ? { ...param, [field]: value } : param
      ),
    }));
  }, []);

  const deleteWaterQualityParameter = useCallback((id: string) => {
    Alert.alert(
      "Remove Parameter",
      "Are you sure you want to remove this parameter?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            setWaterQualityData((prev) => {
              const paramToRemove = prev.parameters.find((p) => p.id === id);
              const newParameters = prev.parameters.filter((param) => param.id !== id);
              console.log(`[Water Quality] Removed parameter "${paramToRemove?.parameter}" (ID: ${id}). Remaining: ${newParameters.length}`);
              return {
                ...prev,
                parameters: newParameters,
              };
            });
          },
        },
      ]
    );
  }, []);

  const handleWaterQualitySamplingDetailsChange = useCallback((
    field: string,
    value: string | boolean
  ) => {
    setWaterQualityData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleWaterQualityExplanationNAToggle = useCallback(() => {
    setWaterQualityData((prev) => ({
      ...prev,
      isExplanationNA: !prev.isExplanationNA,
    }));
  }, []);

  // ============ PORT HANDLERS ============
  const handlePortMainParameterUpdate = useCallback((
    field: keyof Omit<Parameter, "id">,
    value: string | boolean
  ) => {
    setPortData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handlePortMMTInputChange = useCallback((field: string, value: string) => {
    setPortData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handlePortMMTNAToggle = useCallback(() => {
    setPortData((prev) => ({ ...prev, isMMTNA: !prev.isMMTNA }));
  }, []);

  const addPortParameter = useCallback(() => {
    const newId = `port-param-${Date.now()}`;
    setPortData((prev) => {
      const newParameters = [
        ...prev.parameters,
        {
          id: newId,
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
        },
      ];
      console.log(`[Port Monitoring] Added parameter with ID: ${newId}. Total parameters: ${newParameters.length}`);
      return {
        ...prev,
        parameters: newParameters,
      };
    });
  }, []);

  const updatePortParameter = useCallback((
    id: string,
    field: keyof Omit<Parameter, "id">,
    value: string | boolean
  ) => {
    setPortData((prev) => ({
      ...prev,
      parameters: prev.parameters.map((param) =>
        param.id === id ? { ...param, [field]: value } : param
      ),
    }));
  }, []);

  const deletePortParameter = useCallback((id: string) => {
    Alert.alert(
      "Remove Parameter",
      "Are you sure you want to remove this parameter?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            setPortData((prev) => {
              const paramToRemove = prev.parameters.find((p) => p.id === id);
              const newParameters = prev.parameters.filter((param) => param.id !== id);
              console.log(`[Port Monitoring] Removed parameter "${paramToRemove?.parameter}" (ID: ${id}). Remaining: ${newParameters.length}`);
              return {
                ...prev,
                parameters: newParameters,
              };
            });
          },
        },
      ]
    );
  }, []);

  const handlePortSamplingDetailsChange = useCallback((
    field: string,
    value: string | boolean
  ) => {
    setPortData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handlePortExplanationNAToggle = useCallback(() => {
    setPortData((prev) => ({
      ...prev,
      isExplanationNA: !prev.isExplanationNA,
    }));
  }, []);

  // Empty handler for location input (not used but required by component)
  const emptyLocationInputHandler = useCallback(() => {}, []);

  // Handler for Port location input change
  const handlePortLocationInputChange = useCallback((value: string) => {
    setPortInput(value);
  }, []);

  // ============ LEGACY HANDLERS (for backward compatibility) ============
  const handleInputChange = (
    field: keyof WaterQualityData,
    value: string | boolean
  ) => {
    setData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLocationInputChange = (field: string, value: string) => {
    handleInputChange(field as keyof WaterQualityData, value);
  };

  const handleMMTInputChange = (field: string, value: string) => {
    handleInputChange(field as keyof WaterQualityData, value);
  };

  const addParameter = () => {
    const newId = (parameters.length + 1).toString();
    setParameters((prev) => [
      ...prev,
      {
        id: newId,
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
      },
    ]);
  };

  const updateParameter = (
    id: string,
    field: keyof Omit<Parameter, "id">,
    value: string | boolean
  ) => {
    setParameters(
      parameters.map((param) =>
        param.id === id ? { ...param, [field]: value } : param
      )
    );
  };

  const handleParameterMMTInputChange = (
    id: string,
    field: string,
    value: string
  ) => {
    setParameters(
      parameters.map((param) =>
        param.id === id ? { ...param, [field]: value } : param
      )
    );
  };

  const removeParameter = (id: string) => {
    Alert.alert(
      "Remove Parameter",
      "Are you sure you want to remove this parameter?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            setParameters(parameters.filter((param) => param.id !== id));
          },
        },
      ]
    );
  };

  const mainParameter: Parameter = {
    id: "main",
    parameter: data.parameter,
    resultType: data.resultType,
    tssCurrent: data.tssCurrent,
    tssPrevious: data.tssPrevious,
    eqplRedFlag: data.eqplRedFlag,
    action: data.action,
    limit: data.limit,
    remarks: data.remarks,
    mmtCurrent: data.mmtCurrent,
    mmtPrevious: data.mmtPrevious,
    isMMTNA: data.isMMTNA,
  };

  const handleMainParameterUpdate = (
    field: keyof Omit<Parameter, "id">,
    value: string | boolean
  ) => {
    handleInputChange(field as keyof WaterQualityData, value);
  };

  const fillTestData = () => {
    // Enable all checkboxes
    setQuarryEnabled(true);
    setPlantEnabled(true);
    setQuarryPlantEnabled(true);
    setPortEnabled(true);

    // Fill location descriptions
    setQuarryInput("Station WQ-01 (Quarry settling pond effluent)");
    setPlantInput("Station WQ-02 (Plant wastewater treatment outlet)");
    setQuarryPlantInput(
      "Mobile crusher operations with temporary water management"
    );
    setPortInput("Port Loading Area - North Pier"); // ✅ FIX: Add port description

    // Fill Water Quality Data (unified table)
    setWaterQualityData({
      locationInput: "",
      parameter: "TSS",
      resultType: "Month",
      tssCurrent: "18",
      tssPrevious: "6.2",
      mmtCurrent: "-",
      mmtPrevious: "-",
      isMMTNA: true,
      eqplRedFlag: "-",
      action: "-",
      limit: "150",
      remarks: "All monitoring stations within acceptable limits",
      dateTime: "June 27, 2025",
      weatherWind: "Sunny, light breeze from Northeast",
      explanation:
        "Confirmatory sampling conducted for validation of internal monitoring results",
      isExplanationNA: false,
      overallCompliance:
        "All water quality parameters are within DENR Class C standards",
      parameters: [
        {
          id: "wq-1",
          parameter: "pH",
          resultType: "Month",
          tssCurrent: "7.2",
          tssPrevious: "7.1",
          mmtCurrent: "7.25",
          mmtPrevious: "7.15",
          isMMTNA: false,
          eqplRedFlag: "-",
          action: "-",
          limit: "6.5-8.5",
          remarks: "pH levels stable and within range",
        },
      ],
    });

    // Fill Port Data
    setPortData({
      locationInput: "",
      parameter: "Turbidity",
      resultType: "Month",
      tssCurrent: "12",
      tssPrevious: "14",
      mmtCurrent: "13",
      mmtPrevious: "15",
      isMMTNA: false,
      eqplRedFlag: "No",
      action: "Maintain dust suppression during loading",
      limit: "20",
      remarks: "Below threshold",
      dateTime: "June 29, 2025",
      weatherWind: "Clear, Light breeze",
      explanation: "Minor turbidity from loading activities",
      isExplanationNA: false,
      overallCompliance:
        "All port water quality parameters are within DENR standards",
      parameters: [],
    });

    Alert.alert(
      "Test Data Loaded",
      "Water Quality filled with test data:\n• All location descriptions enabled\n• Water Quality: TSS + pH parameter\n• Port: Turbidity data"
    );
  };

  // Memoize mainParameter objects to prevent unnecessary re-renders
  const waterQualityMainParameter = useMemo(() => ({
    id: "water-quality-main",
    parameter: waterQualityData.parameter,
    resultType: waterQualityData.resultType,
    tssCurrent: waterQualityData.tssCurrent,
    tssPrevious: waterQualityData.tssPrevious,
    eqplRedFlag: waterQualityData.eqplRedFlag,
    action: waterQualityData.action,
    limit: waterQualityData.limit,
    remarks: waterQualityData.remarks,
    mmtCurrent: waterQualityData.mmtCurrent,
    mmtPrevious: waterQualityData.mmtPrevious,
    isMMTNA: waterQualityData.isMMTNA,
  }), [
    waterQualityData.parameter,
    waterQualityData.resultType,
    waterQualityData.tssCurrent,
    waterQualityData.tssPrevious,
    waterQualityData.eqplRedFlag,
    waterQualityData.action,
    waterQualityData.limit,
    waterQualityData.remarks,
    waterQualityData.mmtCurrent,
    waterQualityData.mmtPrevious,
    waterQualityData.isMMTNA,
  ]);

  const portMainParameter = useMemo(() => ({
    id: "port-main",
    parameter: portData.parameter,
    resultType: portData.resultType,
    tssCurrent: portData.tssCurrent,
    tssPrevious: portData.tssPrevious,
    eqplRedFlag: portData.eqplRedFlag,
    action: portData.action,
    limit: portData.limit,
    remarks: portData.remarks,
    mmtCurrent: portData.mmtCurrent,
    mmtPrevious: portData.mmtPrevious,
    isMMTNA: portData.isMMTNA,
  }), [
    portData.parameter,
    portData.resultType,
    portData.tssCurrent,
    portData.tssPrevious,
    portData.eqplRedFlag,
    portData.action,
    portData.limit,
    portData.remarks,
    portData.mmtCurrent,
    portData.mmtPrevious,
    portData.isMMTNA,
  ]);

  /* Old fillTestData - kept for reference
  const fillTestDataOld = () => {
    // Set locations
    setSelectedLocations({
      quarry: true,
      plant: true,
      quarryPlant: false,
    });

    // Fill Quarry Data
    setQuarryData({
      locationInput: "Station WQ-01 (Quarry settling pond effluent)",
      parameter: "pH",
      resultType: "Month",
      tssCurrent: "7.2",
      tssPrevious: "7.1",
      mmtCurrent: "7.3",
      mmtPrevious: "7.2",
      isMMTNA: false,
      eqplRedFlag: "No",
      action: "Within acceptable range, continue monitoring",
      limit: "6.0 - 9.0",
      remarks: "Compliant with DENR standards",
      dateTime: "March 15, 2025, 09:00 AM",
      weatherWind: "Partly cloudy, Wind 2-4 m/s",
      explanation:
        "Water sampling conducted at quarry settling pond using standard protocols",
      isExplanationNA: false,
      overallCompliance:
        "All quarry water quality parameters are within DENR Class C standards",
      parameters: [
        {
          id: "quarry-1",
          parameter: "TSS (Total Suspended Solids)",
          resultType: "Month",
          tssCurrent: "42 mg/L",
          tssPrevious: "45 mg/L",
          mmtCurrent: "43 mg/L",
          mmtPrevious: "46 mg/L",
          isMMTNA: false,
          eqplRedFlag: "No",
          action: "Maintain sediment pond efficiency",
          limit: "50 mg/L",
          remarks: "Below threshold",
        },
        {
          id: "quarry-2",
          parameter: "Iron (Fe)",
          resultType: "Month",
          tssCurrent: "4.8 mg/L",
          tssPrevious: "5.2 mg/L",
          mmtCurrent: "4.9 mg/L",
          mmtPrevious: "5.3 mg/L",
          isMMTNA: false,
          eqplRedFlag: "No",
          action: "Continue monitoring",
          limit: "7.0 mg/L",
          remarks: "Within limits",
        },
      ],
    });

    // Fill Plant Data
    setPlantData({
      locationInput: "Station WQ-02 (Plant wastewater treatment outlet)",
      parameter: "BOD (Biochemical Oxygen Demand)",
      resultType: "Month",
      tssCurrent: "18 mg/L",
      tssPrevious: "20 mg/L",
      mmtCurrent: "19 mg/L",
      mmtPrevious: "21 mg/L",
      isMMTNA: false,
      eqplRedFlag: "No",
      action: "No action required",
      limit: "30 mg/L",
      remarks: "Compliant",
      dateTime: "March 15, 2025, 10:30 AM",
      weatherWind: "Clear skies, Calm winds",
      explanation:
        "Plant wastewater sampling at treatment facility outlet point",
      isExplanationNA: false,
      overallCompliance:
        "Plant discharge meets all regulatory requirements for water quality",
      parameters: [
        {
          id: "plant-1",
          parameter: "Oil and Grease",
          resultType: "Month",
          tssCurrent: "3.2 mg/L",
          tssPrevious: "3.5 mg/L",
          mmtCurrent: "3.3 mg/L",
          mmtPrevious: "3.6 mg/L",
          isMMTNA: false,
          eqplRedFlag: "No",
          action: "Continue oil-water separator maintenance",
          limit: "5 mg/L",
          remarks: "Well below limit",
        },
        {
          id: "plant-2",
          parameter: "Chromium (Cr)",
          resultType: "Month",
          tssCurrent: "0.08 mg/L",
          tssPrevious: "0.09 mg/L",
          mmtCurrent: "0.09 mg/L",
          mmtPrevious: "0.10 mg/L",
          isMMTNA: false,
          eqplRedFlag: "No",
          action: "No action needed",
          limit: "0.5 mg/L",
          remarks: "Trace amounts only",
        },
      ],
    });

    // Add 2 ports with parameters
    setPorts([
      {
        id: "port-1",
        portName: "Port Loading Area - North Pier",
        parameter: "pH",
        resultType: "Month",
        tssCurrent: "8.1",
        tssPrevious: "8.0",
        mmtCurrent: "8.2",
        mmtPrevious: "8.1",
        isMMTNA: false,
        eqplRedFlag: "No",
        action: "Continue monitoring",
        limit: "6.5 - 8.5",
        remarks: "Within marine water standards",
        dateTime: "March 16, 2025, 08:00 AM",
        weatherWind: "Clear, Calm sea",
        explanation: "Marine water quality sampling at port vicinity",
        isExplanationNA: false,
        additionalParameters: [
          {
            id: "param-1",
            parameter: "Dissolved Oxygen",
            resultType: "Month",
            tssCurrent: "6.8 mg/L",
            tssPrevious: "6.5 mg/L",
            mmtCurrent: "6.7 mg/L",
            mmtPrevious: "6.6 mg/L",
            isMMTNA: false,
            eqplRedFlag: "No",
            action: "No action needed",
            limit: ">5 mg/L",
            remarks: "Adequate oxygen levels",
          },
        ],
      },
      {
        id: "port-2",
        portName: "Port Loading Area - South Pier",
        parameter: "Turbidity",
        resultType: "Month",
        tssCurrent: "12 NTU",
        tssPrevious: "14 NTU",
        mmtCurrent: "13 NTU",
        mmtPrevious: "15 NTU",
        isMMTNA: false,
        eqplRedFlag: "No",
        action: "Maintain dust suppression during loading",
        limit: "20 NTU",
        remarks: "Below threshold",
        dateTime: "March 16, 2025, 09:00 AM",
        weatherWind: "Clear, Light breeze",
        explanation: "Minor turbidity from loading activities",
        isExplanationNA: false,
        additionalParameters: [],
      },
    ]);

    Alert.alert(
      "Test Data",
      "Water Quality filled with test data:\n• Quarry: pH + 2 parameters\n• Plant: BOD + 2 parameters\n• 2 Ports with sampling details"
    );
  };
  */

  return (
    <SafeAreaView style={styles.container}>
      <CMSHeader
        onBack={() => navigation.goBack()}
        onSave={handleSave}
        onStay={handleStay}
        onSaveToDraft={handleSaveToDraft}
        onDiscard={handleDiscard}
        onGoToSummary={handleGoToSummary}
      />
      <View style={styles.sectionHeader}>
        <View style={styles.sectionNumberBadge}>
          <Text style={styles.sectionNumber}>B.4.</Text>
        </View>
        <Text style={styles.sectionTitle}>Water Quality Impact Assessment</Text>
      </View>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Location Description Text Inputs */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Location Descriptions</Text>

          <View style={styles.inputGroup}>
            <View style={styles.checkboxRow}>
              <Checkbox
                value={quarryEnabled}
                onToggle={() => setQuarryEnabled(!quarryEnabled)}
                label="Quarry"
              />
            </View>
            <TextInput
              style={[
                styles.textInput,
                !quarryEnabled && styles.textInputDisabled,
              ]}
              value={quarryInput}
              onChangeText={setQuarryInput}
              placeholder="Enter quarry location description"
              multiline
              editable={quarryEnabled}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.checkboxRow}>
              <Checkbox
                value={plantEnabled}
                onToggle={() => setPlantEnabled(!plantEnabled)}
                label="Plant"
              />
            </View>
            <TextInput
              style={[
                styles.textInput,
                !plantEnabled && styles.textInputDisabled,
              ]}
              value={plantInput}
              onChangeText={setPlantInput}
              placeholder="Enter plant location description"
              multiline
              editable={plantEnabled}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.checkboxRow}>
              <Checkbox
                value={quarryPlantEnabled}
                onToggle={() => setQuarryPlantEnabled(!quarryPlantEnabled)}
                label="Quarry / Plant"
              />
            </View>
            <TextInput
              style={[
                styles.textInput,
                !quarryPlantEnabled && styles.textInputDisabled,
              ]}
              value={quarryPlantInput}
              onChangeText={setQuarryPlantInput}
              placeholder="Enter quarry / plant location description"
              multiline
              editable={quarryPlantEnabled}
            />
          </View>

        </View>

        {/* Water Quality Monitoring Section */}
        <LocationMonitoringSection
          locationName="Water Quality"
          showLocationInput={false}
          locationInput=""
          mainParameter={waterQualityMainParameter}
          parameters={waterQualityData.parameters}
          mmtCurrent={waterQualityData.mmtCurrent}
          mmtPrevious={waterQualityData.mmtPrevious}
          isMMTNA={waterQualityData.isMMTNA}
          dateTime={waterQualityData.dateTime}
          weatherWind={waterQualityData.weatherWind}
          explanation={waterQualityData.explanation}
          isExplanationNA={waterQualityData.isExplanationNA}
          overallCompliance={waterQualityData.overallCompliance}
          onLocationInputChange={emptyLocationInputHandler}
          onMainParameterUpdate={handleWaterQualityMainParameterUpdate}
          onMMTInputChange={handleWaterQualityMMTInputChange}
          onMMTNAToggle={handleWaterQualityMMTNAToggle}
          onAddParameter={addWaterQualityParameter}
          onUpdateParameter={updateWaterQualityParameter}
          onDeleteParameter={deleteWaterQualityParameter}
          onSamplingDetailsChange={handleWaterQualitySamplingDetailsChange}
          onExplanationNAToggle={handleWaterQualityExplanationNAToggle}
        />

        {/* Port Section - Optional */}
        {!portEnabled ? (
          <TouchableOpacity
            style={[styles.addButton, { marginTop: 16 }]}
            onPress={() => setPortEnabled(true)}
          >
            <Ionicons name="add-circle-outline" size={24} color="#2196F3" />
            <Text style={styles.addButtonText}>Add Port Monitoring</Text>
          </TouchableOpacity>
        ) : (
          <>
            {/* Port Section Header */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionNumberBadge}>
                <Text style={styles.sectionNumber}>PORT</Text>
              </View>
              <Text style={styles.sectionTitle}>Port Monitoring</Text>
              <TouchableOpacity
                onPress={() => {
                  Alert.alert(
                    "Remove Port Monitoring",
                    "Are you sure you want to remove the port monitoring section?",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Remove",
                        style: "destructive",
                        onPress: () => {
                          setPortEnabled(false);
                          setPortData(createEmptyLocationData());
                          setPortInput(""); // Clear port description when removing
                        },
                      },
                    ]
                  );
                }}
                style={{ marginLeft: "auto" }}
              >
                <Ionicons name="trash-outline" size={20} color="#ff3b30" />
              </TouchableOpacity>
            </View>

            {/* Port Monitoring Section */}
            <LocationMonitoringSection
              locationName="Port"
              showLocationInput={true}
              locationInput={portInput}
              mainParameter={portMainParameter}
              parameters={portData.parameters}
              mmtCurrent={portData.mmtCurrent}
              mmtPrevious={portData.mmtPrevious}
              isMMTNA={portData.isMMTNA}
              dateTime={portData.dateTime}
              weatherWind={portData.weatherWind}
              explanation={portData.explanation}
              isExplanationNA={portData.isExplanationNA}
              overallCompliance={portData.overallCompliance}
              onLocationInputChange={handlePortLocationInputChange}
              onMainParameterUpdate={handlePortMainParameterUpdate}
              onMMTInputChange={handlePortMMTInputChange}
              onMMTNAToggle={handlePortMMTNAToggle}
              onAddParameter={addPortParameter}
              onUpdateParameter={updatePortParameter}
              onDeleteParameter={deletePortParameter}
              onSamplingDetailsChange={handlePortSamplingDetailsChange}
              onExplanationNAToggle={handlePortExplanationNAToggle}
            />
          </>
        )}

        {/* Fill Test Data Button (Dev Only) */}
        {__DEV__ && (
          <TouchableOpacity
            style={[
              styles.saveNextButton,
              { backgroundColor: "#ff8c00", marginTop: 12 },
            ]}
            onPress={fillTestData}
          >
            <Text style={styles.saveNextText}>🧪 Fill Test Data</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.saveNextButton}
          onPress={async () => {
            const updatedParams = await handleSave();
            navigation.navigate("NoiseQuality", updatedParams);
          }}
        >
          <Text style={styles.saveNextText}>Save & Next</Text>
          <Ionicons name="arrow-forward" size={20} color="white" />
        </TouchableOpacity>
        {/* filler gap ts not advisable tbh*/}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
