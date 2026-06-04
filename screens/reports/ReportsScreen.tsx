import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FileText, Calendar, Download, Trash2 } from "lucide-react-native";
import { theme } from "../../theme/theme";
import { reportScreenStyles as styles } from "./styles/reportsScreen";
import { CustomHeader } from "../../components/CustomHeader";
import { useAuth } from "../../contexts/AuthContext";
import { apiGet } from "../../lib/api";
import { deleteCMVRReport } from "../../lib/cmvr";

export default function ReportsScreen({ navigation }: any) {
  const { user } = useAuth();
  const [reports, setReports] = useState<
    Array<{ id: string; title: string; date: string; quarter?: string; year?: number }>
  >([]);
  const [selectedQuarter, setSelectedQuarter] = useState<string>("All"); // ✅ NEW: Quarter filter

  useEffect(() => {
    void fetchReports();
  }, [selectedQuarter]); // ✅ Refetch when quarter changes

  async function fetchReports() {
    try {
      if (!user?.id) {
        console.log("[ReportsScreen] No user ID, skipping fetch");
        setReports([]);
        return;
      }
      
      // Add quarter filter to API call
      let url = `/cmvr/user/${user.id}`;
      if (selectedQuarter !== "All") {
        url += `?quarter=${selectedQuarter}`;
      }
      
      const submissions = await apiGet<any[]>(url);
      const mapped = (submissions || []).map((sub) => {
        // Use only fileName, with "Untitled" as fallback
        const title = sub.fileName || "Untitled";
        const dt = new Date(sub.updatedAt || sub.createdAt).toLocaleDateString(
          "en-US",
          { month: "short", day: "numeric", year: "numeric" }
        );
        return { 
          id: sub.id as string, 
          title, 
          date: dt,
          quarter: sub.quarter,
          year: sub.year,
        };
      });
      setReports(mapped);
      console.log(`[ReportsScreen] Loaded ${mapped.length} reports`);
    } catch (e: any) {
      console.error("[ReportsScreen] Failed to load reports:", e);
      setReports([]);
      Alert.alert(
        "Failed to Load Reports",
        e?.message || "Could not load your reports. Please check your connection and try again.",
        [{ text: "OK" }]
      );
    }
  }

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Report",
      "Are you sure you want to delete this report? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              console.log(`[ReportsScreen] Deleting report ${id}`);
              await deleteCMVRReport(id);
              setReports((prev) => prev.filter((r) => r.id !== id));
              console.log(`[ReportsScreen] Report ${id} deleted successfully`);
            } catch (e: any) {
              console.error(`[ReportsScreen] Failed to delete report ${id}:`, e);
              Alert.alert(
                "Delete Failed", 
                e?.message || "Could not delete the report. Please try again.",
                [{ text: "OK" }]
              );
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader showSave={false} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>All Reports</Text>
          <Text style={styles.subtitle}>
            View, download, or manage your compliance reports.
          </Text>
        </View>

        {/* ✅ NEW: Quarter Filter Tabs */}
        <View style={styles.quarterTabs}>
          {["All", "Q1", "Q2", "Q3", "Q4"].map((quarter) => (
            <TouchableOpacity
              key={quarter}
              style={[
                styles.quarterTab,
                selectedQuarter === quarter && styles.quarterTabActive,
              ]}
              onPress={() => setSelectedQuarter(quarter)}
            >
              <Text
                style={[
                  styles.quarterTabText,
                  selectedQuarter === quarter && styles.quarterTabTextActive,
                ]}
              >
                {quarter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {reports.length > 0 ? (
          <View style={styles.reportList}>
            {reports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onOpen={() =>
                  navigation.navigate("CMVRDocumentExport", {
                    cmvrReportId: report.id,
                    fileName: report.title,
                  })
                }
                onDelete={() => handleDelete(report.id)}
              />
            ))}
          </View>
        ) : (
          <EmptyState />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const ReportCard = ({
  report,
  onOpen,
  onDelete,
}: {
  report: any;
  onOpen: () => void;
  onDelete: () => void;
}) => {
  return (
    <View style={styles.reportCard}>
      <View style={styles.cardInner}>
        <View style={styles.reportInfo}>
          <Text style={styles.reportTitle} numberOfLines={2}>
            {report.title}
          </Text>
          <View style={styles.reportMeta}>
            <Calendar size={14} color={theme.colors.textLight} />
            <Text style={styles.reportDate}>{report.date}</Text>
          </View>
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.iconButton, styles.downloadButton]}
            onPress={onOpen}
          >
            <Download size={20} color={theme.colors.primaryDark} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, styles.deleteButton]}
            onPress={onDelete}
          >
            <Trash2 size={20} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const EmptyState = () => {
  return (
    <View style={styles.emptyState}>
      <FileText size={54} color={theme.colors.textLight} strokeWidth={1.5} />
      <Text style={styles.emptyStateTitle}>No Reports Found</Text>
      <Text style={styles.emptyStateText}>
        When you create reports, they will appear here.
      </Text>
    </View>
  );
};
