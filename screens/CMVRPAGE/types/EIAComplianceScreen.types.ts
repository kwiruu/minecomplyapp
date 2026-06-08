// EIAComplianceScreen.types.ts
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";

export type RootStackParamList = {
  EIACompliance: undefined;
  EnvironmentalCompliance: undefined;
};

export type EIAComplianceScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "EIACompliance"
>;

export type YesNoNull = "yes" | "no" | null;

export type MitigatingMeasure = {
  id: string;
  planned: string;
  actualObservation: string;
  isEffective: "yes" | "no" | null;
  recommendations: string;
};

export type OperationSection = {
  title: string;
  isNA: boolean;
  measures: MitigatingMeasure[];
};
