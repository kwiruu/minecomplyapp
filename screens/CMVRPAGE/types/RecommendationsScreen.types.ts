// RecommendationsScreen.types.ts
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";

export type RecommendationItem = {
  recommendation: string;
  commitment: string;
  status: string;
};

export type SectionData = {
  isNA: boolean;
  items: RecommendationItem[];
};

export type SectionKey = "plant" | "quarry" | "port";

export type PickerItem = {
  label: string;
  value: string;
};

export type RootStackParamList = {
  AttendanceDetail: {
    record: {
      id: string;
      title: string;
      date: string;
    };
  };
  AttendanceList: {
    fromRecommendations?: boolean;
    [key: string]: any;
  };
  Recommendations: any;
  CMVRDocumentExport: any;
};

export type RecommendationsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Recommendations"
>;

export type RecommendationsScreenRouteProp = RouteProp<
  RootStackParamList,
  "Recommendations"
>;
