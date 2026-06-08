import React, { useCallback, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  RefreshControl,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Calendar,
  ClipboardList,
  Plus,
  Trash2,
  Download,
  Edit,
  FileText,
} from "lucide-react-native";
import { theme } from "../../theme/theme";
import { attendanceRecordStyles as styles } from "../attendance/styles/attendanceRecordScreen";
import { CMSHeader } from "../../components/CMSHeader";
import { apiGet, apiDelete, getApiBaseUrl, getJwt } from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";
import { useFocusEffect } from "@react-navigation/native";

type AttendanceRecordItem = {
  id: string;
  fileName: string;
  title?: string | null;
  meetingDate?: string | null;
  createdAt?: string | null;
};

export default function AttendanceListScreen({ navigation, route }: any) {
  const { user } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecordItem[]
  >([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const hasRecords = attendanceRecords.length > 0;
  const [scaleAnim] = useState(new Animated.Value(1));

  // Check if we're in selection mode (came from recommendations screen)
  const isSelectionMode = route.params?.fromRecommendations || false;
  const previousParams = route.params || {};

  // Selected attendance state - initialize from route params if available
  const [selectedAttendanceId, setSelectedAttendanceId] = useState<
    string | null
  >(route.params?.selectedAttendanceId || null);

  // Hydrate selection from route params when they change
  useEffect(() => {
    if (route.params?.selectedAttendanceId) {
      setSelectedAttendanceId(route.params.selectedAttendanceId);
    }
  }, [route.params?.selectedAttendanceId]);

  const fmtDate = (d?: string | null): string => {
    if (!d) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    try {
      const dt = new Date(d);
      if (!isNaN(dt.getTime())) {
        const yyyy = dt.getFullYear();
        const mm = String(dt.getMonth() + 1).padStart(2, "0");
        const dd = String(dt.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
      }
    } catch {}
    return String(d);
  };

  const fetchRecords = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await apiGet<AttendanceRecordItem[]>(
        `/attendance/creator/${user.id}`
      );
      console.log("Fetched attendance records:", JSON.stringify(data, null, 2));
      setAttendanceRecords(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error("[Attendance] Failed to fetch records:", e);
      const errorMessage = e?.message || "Failed to load attendance records.";
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchRecords();
    }
  }, [user?.id, fetchRecords]);

  useFocusEffect(
    useCallback(() => {
      fetchRecords();
    }, [fetchRecords])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchRecords();
    } finally {
      setRefreshing(false);
    }
  }, [fetchRecords]);

  const handleDelete = (id: number | string) => {
    Alert.alert(
      "Delete Record",
      "Are you sure you want to delete this attendance record?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await apiDelete(`/attendance/${id}`);
              setAttendanceRecords((prev) =>
                prev.filter((r) => r.id !== String(id))
              );
              Alert.alert("Deleted", "Attendance record has been deleted.");
            } catch (e: any) {
              Alert.alert("Delete failed", e?.message || "Unable to delete");
            }
          },
        },
      ]
    );
  };

  const handleDownload = async (id: string, format: "pdf" | "docx" = "pdf") => {
    try {
      const base = getApiBaseUrl();

      // Use direct endpoint without token in URL (like CMVR downloads)
      // The backend will handle authentication if needed
      const url = `${base}/attendance/${id}/${format}`;

      console.log("Download URL:", url);
      console.log("Record ID:", id);

      const canOpen = await Linking.canOpenURL(url);

      if (canOpen) {
        await Linking.openURL(url);
        Alert.alert(
          "Download Started",
          `The ${format.toUpperCase()} will be downloaded by your browser. Check your Downloads folder or notification bar.`
        );
      } else {
        Alert.alert("Error", "Unable to open browser for download");
      }
    } catch (e: any) {
      console.error("Download error:", e);
      Alert.alert(
        "Download failed",
        e?.message || "Could not open download URL"
      );
    }
  };
  const handleDownloadOptions = (record: AttendanceRecordItem) => {
    Alert.alert(
      "Download Format",
      `Choose format for: ${record.fileName || record.title || "Attendance"}`,
      [
        {
          text: "PDF",
          onPress: () => handleDownload(record.id, "pdf"),
        },
        {
          text: "DOCX (Word)",
          onPress: () => handleDownload(record.id, "docx"),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const handleSelectRecord = (record: AttendanceRecordItem) => {
    if (isSelectionMode) {
      // Toggle selection
      setSelectedAttendanceId((prev) =>
        prev === record.id ? null : record.id
      );
    }
  };

  const handleConfirmSelection = () => {
    if (!selectedAttendanceId) {
      Alert.alert("No Selection", "Please select an attendance record first.");
      return;
    }

    const selectedRecord = attendanceRecords.find(
      (r) => r.id === selectedAttendanceId
    );
    if (!selectedRecord) {
      Alert.alert("Error", "Selected record not found.");
      return;
    }

    // Navigate to attachments screen with selected attendance
    navigation.navigate("CMVRAttachments", {
      ...previousParams,
      selectedAttendanceId: selectedRecord.id,
      selectedAttendanceTitle: selectedRecord.title || selectedRecord.fileName,
    });
  };

  const handleOpenRecord = (
    record: AttendanceRecordItem & { date?: string }
  ) => {
    if (isSelectionMode) {
      // In selection mode, toggle selection instead of opening detail
      handleSelectRecord(record);
    } else {
      // Normal mode - open detail screen
      try {
        navigation.navigate("AttendanceDetail", {
          record: {
            id: record.id,
            title: record.title || record.fileName,
            date: record.date,
          },
        });
      } catch {
        Alert.alert(
          "Open Record",
          `Opening ${record.title || record.fileName}...`
        );
      }
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleSave = () => {
    if (isSelectionMode) {
      // Confirm selection and navigate
      handleConfirmSelection();
    } else {
      // Normal mode - just go back
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <CMSHeader
        fileName={isSelectionMode ? "Select Attendance" : "Attendance Records"}
        onBack={handleBack}
        onSave={isSelectionMode ? handleSave : handleBack}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>
            {isSelectionMode
              ? "Select Attendance Record"
              : "Attendance Records"}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isSelectionMode
              ? "Choose an attendance record to attach to your CMVR report"
              : "Manage, create, and download attendance reports."}
          </Text>
        </View>

        {/* Create New Attendance Record */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPressIn={() => {
            Animated.spring(scaleAnim, {
              toValue: 0.97,
              useNativeDriver: true,
            }).start();
          }}
          onPressOut={() => {
            Animated.spring(scaleAnim, {
              toValue: 1,
              friction: 4,
              tension: 50,
              useNativeDriver: true,
            }).start();
          }}
          onPress={() => {
            if (isSelectionMode) {
              // Navigate to create, but pass params so we can return here
              navigation.navigate("CreateAttendance", {
                returnToSelection: true,
                returnParams: previousParams,
              });
            } else {
              navigation.navigate("CreateAttendance");
            }
          }}
          style={styles.actionButtonWrapper}
        >
          <Animated.View
            style={[styles.actionButton, { transform: [{ scale: scaleAnim }] }]}
          >
            <Plus
              color={theme.colors.primaryDark}
              size={20}
              strokeWidth={2.5}
            />
            <Text style={styles.actionButtonText}>Create New Record</Text>
          </Animated.View>
        </TouchableOpacity>

        {/* Saved Records Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {isSelectionMode ? "Available Records" : "Saved Records"}
            </Text>
          </View>

          <View style={styles.recordsContainer}>
            {loading ? (
              <View style={styles.emptyStateCard}>
                <View style={styles.emptyState}>
                  <ClipboardList color={theme.colors.textLight} size={48} />
                  <Text style={styles.emptyStateTitle}>Loading…</Text>
                  <Text style={styles.emptyStateText}>
                    Fetching your attendance records.
                  </Text>
                </View>
              </View>
            ) : hasRecords ? (
              attendanceRecords.map((record) => (
                <AnimatedRecordCard
                  key={record.id}
                  record={{
                    ...record,
                    title: record.title || record.fileName,
                    date: fmtDate(
                      record.meetingDate || record.createdAt || null
                    ),
                  }}
                  onDelete={(id: string) => handleDelete(id)}
                  onDownload={() => handleDownloadOptions(record)}
                  onOpen={handleOpenRecord}
                  isSelectionMode={isSelectionMode}
                  isSelected={
                    isSelectionMode && selectedAttendanceId === record.id
                  }
                />
              ))
            ) : (
              <View style={styles.emptyStateCard}>
                <View style={styles.emptyState}>
                  <ClipboardList color={theme.colors.textLight} size={48} />
                  <Text style={styles.emptyStateTitle}>No attendance yet</Text>
                  <Text style={styles.emptyStateText}>
                    Create your first attendance record to get started
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Select Button for Selection Mode */}
        {isSelectionMode && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              { marginTop: 20, marginBottom: 20 },
              !selectedAttendanceId && { opacity: 0.5 },
            ]}
            onPress={handleConfirmSelection}
            disabled={!selectedAttendanceId}
          >
            <Text style={styles.actionButtonText}>
              {selectedAttendanceId ? "Select Attendance" : "No Selection"}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------- Animated Record Card ---------- */
function AnimatedRecordCard({
  record,
  onDelete,
  onDownload,
  onOpen,
  isSelectionMode,
  isSelected = false,
}: any) {
  const [scaleAnim] = useState(new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 50,
      useNativeDriver: true,
    }).start();
  };

  const handleEdit = (e: any) => {
    e.stopPropagation();
    // Navigate to edit screen - you'll need to implement this
    Alert.alert("Edit", `Edit ${record.title} - Feature coming soon!`);
  };

  return (
    <Animated.View
      style={[
        styles.recordCard,
        { transform: [{ scale: scaleAnim }] },
        isSelected && {
          borderWidth: 3,
          borderColor: theme.colors.primaryDark,
          backgroundColor: "#EFF6FF",
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => onOpen(record)}
        style={styles.recordInner}
      >
        <View style={styles.recordInfo}>
          <Text style={styles.recordTitle} numberOfLines={1}>
            {record.title}
          </Text>
          <View style={styles.recordMeta}>
            <Calendar color={theme.colors.textLight} size={14} />
            <Text style={styles.recordMetaText}>{record.date}</Text>
          </View>
        </View>

        {!isSelectionMode && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.iconButton, styles.downloadButton]}
              onPress={(e) => {
                e.stopPropagation();
                onDownload();
              }}
            >
              <Download size={18} color={theme.colors.primaryDark} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.iconButton, styles.editButton]}
              onPress={(e) => {
                e.stopPropagation();
                handleEdit(e);
              }}
            >
              <Edit size={18} color="#F59E0B" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.iconButton, styles.deleteButton]}
              onPress={(e) => {
                e.stopPropagation();
                onDelete(record.id);
              }}
            >
              <Trash2 size={18} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        )}

        {isSelectionMode && isSelected && (
          <View style={styles.selectedIndicator}>
            <View
              style={{
                backgroundColor: theme.colors.primaryDark,
                borderRadius: 12,
                padding: 6,
              }}
            >
              <Text style={{ color: "white", fontSize: 10, fontWeight: "600" }}>
                SELECTED
              </Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}
