import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";
import { DashboardStats } from "../types";
import { getMe, listProjectSubmissions } from "../lib/compliance";

const DashboardScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalSubmissions: 0,
    pendingSubmissions: 0,
    approvedSubmissions: 0,
    rejectedSubmissions: 0,
    overdueSubmissions: 0,
  });
  const [recentSubmissions, setRecentSubmissions] = useState<
    Array<{ id: string; title: string; status: string; createdAt: string }>
  >([]);
  const [firstProjectId, setFirstProjectId] = useState<string | null>(null);
  const [firstProjectName, setFirstProjectName] = useState<string | null>(null);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    void hydrate().finally(() => setRefreshing(false));
  }, []);

  useEffect(() => {
    void hydrate();
  }, []);

  async function hydrate() {
    try {
      const me = await getMe();
      // Compute top-level stats by aggregating first project's submissions if available
      const firstProject = me.projects[0];
      let subs: any[] = [];
      if (firstProject) {
        setFirstProjectId(firstProject.id);
        setFirstProjectName(firstProject.name);
        const { submissions } = await listProjectSubmissions(firstProject.id);
        subs = submissions;
      }

      setRecentSubmissions(
        subs.slice(0, 5).map((s: any) => ({
          id: s.id as string,
          title: (s.title as string) || "Untitled",
          status: String(s.status).toLowerCase(),
          createdAt: String(s.createdAt),
        }))
      );

      const totals = subs.reduce(
        (acc, s: any) => {
          acc.total += 1;
          const status = String(s.status).toLowerCase();
          if (status === "approved") acc.approved += 1;
          else if (status === "rejected" || status === "requires_changes")
            acc.rejected += 1;
          else acc.pending += 1;
          return acc;
        },
        { total: 0, approved: 0, rejected: 0, pending: 0 }
      );

      setStats({
        totalSubmissions: totals.total,
        pendingSubmissions: totals.pending,
        approvedSubmissions: totals.approved,
        rejectedSubmissions: totals.rejected,
        overdueSubmissions: 0,
      });
    } catch (err: any) {
      Alert.alert("Failed to load dashboard", err?.message || String(err));
    }
  }

  const handleNewSubmission = () => {
    Alert.alert(
      "New Submission",
      "What type of report would you like to create?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "CMR (Compliance Monitoring Report)",
          onPress: () =>
            Alert.alert(
              "Coming Soon",
              "CMR creation will be implemented next!"
            ),
        },
        {
          text: "CMVR (Compliance Monitoring Verification Report)",
          onPress: () => {
            // Navigate to CMVR screen - it's in the same stack
            try {
              navigation.push("CMVRReport", {
                submissionId: null,
                projectId: firstProjectId || null,
                projectName: firstProjectName || "New Project",
              });
            } catch (error) {
              console.error("Navigation error:", error);
              Alert.alert("Error", "Could not navigate to CMVR screen");
            }
          },
        },
      ]
    );
  };

  const StatCard = ({
    title,
    value,
    color,
    icon,
  }: {
    title: string;
    value: number;
    color: string;
    icon: keyof typeof Ionicons.glyphMap;
  }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statContent}>
        <View>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
        </View>
        <Ionicons name={icon} size={24} color={color} />
      </View>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>Welcome back!</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <Text style={styles.roleText}>Role: Proponent</Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleNewSubmission}
        >
          <Ionicons name="add-circle" size={24} color="white" />
          <Text style={styles.actionButtonText}>New Submission</Text>
        </TouchableOpacity>
      </View>

      {/* Statistics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Compliance Overview</Text>
        <View style={styles.statsContainer}>
          <StatCard
            title="Total Submissions"
            value={stats.totalSubmissions}
            color="#007AFF"
            icon="document-text"
          />
          <StatCard
            title="Pending Review"
            value={stats.pendingSubmissions}
            color="#FF9500"
            icon="time"
          />
          <StatCard
            title="Approved"
            value={stats.approvedSubmissions}
            color="#34C759"
            icon="checkmark-circle"
          />
          <StatCard
            title="Requires Action"
            value={stats.rejectedSubmissions}
            color="#FF3B30"
            icon="alert-circle"
          />
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {recentSubmissions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No submissions yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Create your first compliance report to get started
            </Text>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {recentSubmissions.map((s) => (
              <View key={s.id} style={styles.recentItem}>
                <View>
                  <Text style={styles.recentTitle}>{s.title}</Text>
                  <Text style={styles.recentDate}>
                    {new Date(s.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </Text>
                </View>
                <View style={styles.recentStatus}>
                  <Text style={styles.recentStatusText}>{s.status}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Compliance Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Compliance Status</Text>
        <View style={styles.complianceStatus}>
          <View
            style={[styles.statusIndicator, { backgroundColor: "#34C759" }]}
          />
          <View>
            <Text style={styles.statusText}>System Status: Active</Text>
            <Text style={styles.statusSubtext}>All systems operational</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  welcomeSection: {
    backgroundColor: "#007AFF",
    padding: 20,
    paddingTop: 10,
  },
  welcomeText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
  },
  userEmail: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 16,
    marginBottom: 5,
  },
  roleText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
  },
  section: {
    backgroundColor: "white",
    marginTop: 10,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  actionButton: {
    backgroundColor: "#007AFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 8,
    gap: 10,
  },
  actionButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  statsContainer: {
    gap: 10,
  },
  statCard: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 15,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  statTitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#666",
    marginTop: 10,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginTop: 5,
  },
  complianceStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  statusSubtext: {
    fontSize: 14,
    color: "#666",
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  recentDate: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  recentStatus: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  recentStatusText: {
    fontSize: 12,
    color: "#555",
    textTransform: "capitalize",
  },
});

export default DashboardScreen;