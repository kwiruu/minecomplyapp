import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SubmissionStatus } from "../types";
import {
  listProjects,
  listProjectSubmissions,
  createSubmission,
  type ProjectList,
} from "../lib/compliance";

const SubmissionsScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | SubmissionStatus>("all");
  const [projects, setProjects] = useState<ProjectList["projects"]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<
    Array<{
      id: string;
      title: string;
      status: SubmissionStatus;
      summary?: string | null;
      createdAt: string;
      evidenceCount: number;
    }>
  >([]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Re-fetch projects and submissions
    void fetchProjects(true);
  }, []);

  useEffect(() => {
    void fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      void fetchSubmissions(selectedProjectId);
    }
  }, [selectedProjectId]);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) || null,
    [projects, selectedProjectId]
  );

  async function fetchProjects(isRefresh = false) {
    try {
      if (!isRefresh) setLoading(true);
      const { projects: data } = await listProjects();
      setProjects(data);
      if (!selectedProjectId && data.length > 0) {
        setSelectedProjectId(data[0].id);
      }
      if (isRefresh) {
        // If refreshing and we already have a selection, refresh submissions too
        if (selectedProjectId) await fetchSubmissions(selectedProjectId);
      }
    } catch (err: any) {
      Alert.alert("Failed to load projects", err?.message || String(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function fetchSubmissions(projectId: string) {
    try {
      setLoading(true);
      const { submissions: data } = await listProjectSubmissions(projectId);
      const mapped = data.map((s: any) => ({
        id: s.id as string,
        title: (s.title as string) || "Untitled Submission",
        status: (String(s.status).toLowerCase() as SubmissionStatus) || "draft",
        summary: (s.summary as string | null) ?? null,
        createdAt: String(s.createdAt),
        evidenceCount: Number(s._count?.evidences ?? 0),
      }));
      setSubmissions(mapped);
    } catch (err: any) {
      Alert.alert("Failed to load submissions", err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status: SubmissionStatus) => {
    switch (status) {
      case "draft":
        return "#999";
      case "submitted":
        return "#007AFF";
      case "under_review":
        return "#FF9500";
      case "approved":
        return "#34C759";
      case "rejected":
        return "#FF3B30";
      case "requires_changes":
        return "#FF9500";
      default:
        return "#999";
    }
  };

  const getStatusIcon = (
    status: SubmissionStatus
  ): keyof typeof Ionicons.glyphMap => {
    switch (status) {
      case "draft":
        return "create-outline";
      case "submitted":
        return "arrow-up-circle-outline";
      case "under_review":
        return "time-outline";
      case "approved":
        return "checkmark-circle-outline";
      case "rejected":
        return "close-circle-outline";
      case "requires_changes":
        return "warning-outline";
      default:
        return "document-outline";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleSubmissionPress = (submission: (typeof submissions)[number]) => {
    Alert.alert(
      "Submission Details",
      `Title: ${submission.title}\nStatus: ${submission.status}`,
      [{ text: "OK" }]
    );
  };

  const handleNewSubmission = () => {
    if (!selectedProjectId) {
      Alert.alert("No project selected", "Please select a project first.");
      return;
    }
    if (!Alert.prompt) {
      // Fallback (Android): create with a default title
      (async () => {
        try {
          await createSubmission(selectedProjectId, {
            title: "New Submission",
          });
          Alert.alert("Created", "Your submission has been created.");
          await fetchSubmissions(selectedProjectId);
        } catch (err: any) {
          Alert.alert(
            "Failed to create submission",
            err?.message || String(err)
          );
        }
      })();
      return;
    }
    Alert.prompt?.(
      "New Submission",
      "Enter a title for your submission",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Create",
          onPress: async (text?: string) => {
            try {
              const title =
                text && text.trim().length > 0 ? text : "New Submission";
              await createSubmission(selectedProjectId, { title });
              Alert.alert("Created", "Your submission has been created.");
              await fetchSubmissions(selectedProjectId);
            } catch (err: any) {
              Alert.alert(
                "Failed to create submission",
                err?.message || String(err)
              );
            }
          },
        },
      ],
      "plain-text"
    );
  };

  const FilterButton = ({
    label,
    value,
    isActive,
    onPress,
  }: {
    label: string;
    value: "all" | SubmissionStatus;
    isActive: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[styles.filterButton, isActive && styles.filterButtonActive]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.filterButtonText,
          isActive && styles.filterButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const SubmissionItem = ({ item }: { item: (typeof submissions)[number] }) => (
    <TouchableOpacity
      style={styles.submissionCard}
      onPress={() => handleSubmissionPress(item)}
    >
      <View style={styles.submissionHeader}>
        <View style={styles.submissionTitleContainer}>
          <Text style={styles.submissionTitle}>{item.title}</Text>
          {selectedProject?.name ? (
            <Text style={styles.submissionType}>{selectedProject.name}</Text>
          ) : null}
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Ionicons name={getStatusIcon(item.status)} size={16} color="white" />
          <Text style={styles.statusText}>
            {String(item.status).replace("_", " ")}
          </Text>
        </View>
      </View>

      <Text style={styles.submissionDescription} numberOfLines={2}>
        {item.summary || "No description provided"}
      </Text>

      <View style={styles.submissionFooter}>
        <Text style={styles.submissionDate}>
          Created: {formatDate(item.createdAt)}
        </Text>
        <Text style={styles.evidenceCount}>
          {item.evidenceCount} attachments
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Project Picker */}
      <View style={styles.projectPicker}>
        <FlatList
          data={projects}
          keyExtractor={(p) => p.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 10 }}
          renderItem={({ item: p }) => {
            const active = p.id === selectedProjectId;
            return (
              <TouchableOpacity
                style={[styles.projectChip, active && styles.projectChipActive]}
                onPress={() => setSelectedProjectId(p.id)}
              >
                <Text
                  style={[
                    styles.projectChipText,
                    active && styles.projectChipTextActive,
                  ]}
                >
                  {p.name}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Filter Bar */}
      <View style={styles.filterContainer}>
        <FilterButton
          label="All"
          value="all"
          isActive={filter === "all"}
          onPress={() => setFilter("all")}
        />
        <FilterButton
          label="Draft"
          value="draft"
          isActive={filter === "draft"}
          onPress={() => setFilter("draft")}
        />
        <FilterButton
          label="Submitted"
          value="submitted"
          isActive={filter === "submitted"}
          onPress={() => setFilter("submitted")}
        />
        <FilterButton
          label="Approved"
          value="approved"
          isActive={filter === "approved"}
          onPress={() => setFilter("approved")}
        />
      </View>

      {loading ? (
        <View style={styles.emptyState}>
          <Ionicons name="refresh" size={32} color="#ccc" />
          <Text style={styles.emptyStateText}>Loading…</Text>
        </View>
      ) : submissions.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={64} color="#ccc" />
          <Text style={styles.emptyStateTitle}>No Submissions Yet</Text>
          <Text style={styles.emptyStateText}>
            Create your first compliance report to start tracking your mining
            operations
          </Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleNewSubmission}
          >
            <Ionicons name="add" size={24} color="white" />
            <Text style={styles.createButtonText}>Create First Submission</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={submissions.filter((s) =>
            filter === "all" ? true : s.status === filter
          )}
          renderItem={SubmissionItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Floating Action Button */}
      {submissions.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={handleNewSubmission}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  projectPicker: {
    backgroundColor: "white",
    paddingVertical: 8,
  },
  projectChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
    marginHorizontal: 6,
  },
  projectChipActive: {
    backgroundColor: "#007AFF",
  },
  projectChipText: {
    color: "#666",
    fontWeight: "500",
  },
  projectChipTextActive: {
    color: "white",
  },
  filterContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    paddingHorizontal: 15,
    paddingVertical: 10,
    gap: 10,
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  filterButtonActive: {
    backgroundColor: "#007AFF",
  },
  filterButtonText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  filterButtonTextActive: {
    color: "white",
  },
  listContainer: {
    padding: 15,
  },
  submissionCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submissionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  submissionTitleContainer: {
    flex: 1,
    marginRight: 10,
  },
  submissionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 2,
  },
  submissionType: {
    fontSize: 12,
    color: "#007AFF",
    fontWeight: "500",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    color: "white",
    fontWeight: "500",
    textTransform: "capitalize",
  },
  submissionDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 10,
  },
  submissionFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  submissionDate: {
    fontSize: 12,
    color: "#999",
  },
  evidenceCount: {
    fontSize: 12,
    color: "#666",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
    marginBottom: 10,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  createButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
});

export default SubmissionsScreen;
