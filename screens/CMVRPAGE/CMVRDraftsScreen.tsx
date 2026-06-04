import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  Plus,
  ClipboardList,
  Edit3,
  Trash2,
  Calendar,
} from "lucide-react-native";
import { theme } from "../../theme/theme";
import { CustomHeader } from "../../components/CustomHeader";
import { cmvrDraftStyles as styles } from "./styles/CMVRDraftsScreen.styles";
import {
  getAllDraftMetadata,
  getDraft,
  deleteDraft,
  DraftMetadata,
} from "../../lib/drafts";
import { useFileName } from "../../contexts/FileNameContext";
import { useCmvrStore } from "../../store/cmvrStore";

interface DraftListItem extends DraftMetadata {
  displayName: string;
  displayDate: string;
}

type Navigation = NativeStackNavigationProp<any>;

const CMVRDraftsScreen = () => {
  const navigation = useNavigation<Navigation>();
  const { setFileName } = useFileName();
  const { clearReport, initializeNewReport } = useCmvrStore();

  const [drafts, setDrafts] = useState<DraftListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [createAnim] = useState(new Animated.Value(1));

  const formatDate = (isoString?: string) => {
    if (!isoString) return "";
    try {
      const d = new Date(isoString);
      if (Number.isNaN(d.getTime())) {
        return isoString;
      }
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch (error) {
      return isoString;
    }
  };

  const hydrateDrafts = useCallback(async () => {
    setLoading(true);
    try {
      const metadata = await getAllDraftMetadata();

      // Check for single store draft (legacy/active slot)
      try {
        const singleDraftStr = await AsyncStorage.getItem("@cmvr_draft");
        if (singleDraftStr) {
          const singleDraft = JSON.parse(singleDraftStr);
          // Only add if not already in the list (by filename)
          // This prevents duplicates since we now save to both
          const alreadyExists = metadata.some(
            (m) => m.fileName === singleDraft.fileName
          );

          if (!alreadyExists) {
            metadata.unshift({
              key: "@cmvr_draft",
              fileName: singleDraft.fileName || "Active Draft",
              projectName: singleDraft.projectName || "Untitled Project",
              lastSaved: singleDraft.savedAt || new Date().toISOString(),
              createdAt: singleDraft.createdAt || new Date().toISOString(),
            });
          }
        }
      } catch (e) {
        console.log("Error checking single draft:", e);
      }

      const hydrated = metadata.map((item) => ({
        ...item,
        displayName: item.projectName || item.fileName,
        displayDate: formatDate(item.lastSaved),
      }));
      setDrafts(hydrated);
    } catch (error) {
      Alert.alert("Error", "Unable to load drafts right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    hydrateDrafts();
  }, [hydrateDrafts]);

  useFocusEffect(
    useCallback(() => {
      hydrateDrafts();
    }, [hydrateDrafts])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await hydrateDrafts();
    } finally {
      setRefreshing(false);
    }
  }, [hydrateDrafts]);

  const generateDefaultFileName = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `CMVR ${year}-${month}-${day} ${hours}${minutes}`;
  };

  const handleCreateDraft = async () => {
    Animated.spring(createAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start(() => {
      Animated.spring(createAnim, {
        toValue: 1,
        friction: 4,
        tension: 50,
        useNativeDriver: true,
      }).start();
    });

    try {
      const defaultName = generateDefaultFileName();
      await setFileName(defaultName);
      clearReport();
      initializeNewReport(defaultName);
      navigation.navigate("CMVRReport", {
        submissionId: null,
        projectId: null,
        projectName: "",
        fileName: defaultName,
      });
    } catch (error) {
      Alert.alert("Error", "Unable to start a new draft right now.");
    }
  };

  const handleOpenDraft = async (item: DraftListItem) => {
    try {
      const draftData = await getDraft(item.key);
      if (!draftData) {
        Alert.alert("Missing Draft", "This draft can no longer be found.");
        hydrateDrafts();
        return;
      }

      const resolvedName =
        draftData.fileName ||
        draftData.generalInfo?.projectName ||
        draftData.generalInfo?.projectNameCurrent ||
        item.displayName;

      await setFileName(resolvedName);

      clearReport();

      navigation.navigate("CMVRReport", {
        submissionId: null,
        projectId: null,
        projectName:
          draftData.generalInfo?.projectName ||
          draftData.generalInfo?.projectNameCurrent ||
          item.projectName,
        fileName: resolvedName,
        draftData,
      });
    } catch (error) {
      Alert.alert("Error", "Failed to open draft. Please try again.");
    }
  };

  const handleDeleteDraft = (item: DraftListItem) => {
    Alert.alert(
      "Delete Draft",
      "Are you sure you want to delete this draft? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const success = await deleteDraft(item.key);
              if (success) {
                setDrafts((prev) =>
                  prev.filter((draft) => draft.key !== item.key)
                );
              } else {
                Alert.alert("Error", "Unable to delete draft right now.");
              }
            } catch (error) {
              Alert.alert("Error", "Unable to delete draft right now.");
            }
          },
        },
      ]
    );
  };

  const hasDrafts = drafts.length > 0;

  return (
    <SafeAreaView style={styles.safeContainer}>
      <CustomHeader showSave={false} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>CMVR Drafts</Text>
          <Text style={styles.headerSubtitle}>
            Continue working on saved drafts or start a new CMVR report.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Saved Drafts</Text>
          </View>

          <View style={styles.recordsContainer}>
            {loading ? (
              <View style={styles.emptyStateCard}>
                <View style={styles.emptyState}>
                  <ClipboardList color={theme.colors.textLight} size={48} />
                  <Text style={styles.emptyStateTitle}>Loading…</Text>
                  <Text style={styles.emptyStateText}>
                    Fetching your saved CMVR drafts.
                  </Text>
                </View>
              </View>
            ) : hasDrafts ? (
              drafts.map((item) => (
                <AnimatedDraftCard
                  key={item.key}
                  draft={item}
                  onOpen={handleOpenDraft}
                  onDelete={handleDeleteDraft}
                />
              ))
            ) : (
              <View style={styles.emptyStateCard}>
                <View style={styles.emptyState}>
                  <ClipboardList color={theme.colors.textLight} size={48} />
                  <Text style={styles.emptyStateTitle}>No drafts saved</Text>
                  <Text style={styles.emptyStateText}>
                    Start a new CMVR report and save it as a draft to continue
                    later.
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

interface DraftCardProps {
  draft: DraftListItem;
  onOpen: (draft: DraftListItem) => void;
  onDelete: (draft: DraftListItem) => void;
}

function AnimatedDraftCard({ draft, onOpen, onDelete }: DraftCardProps) {
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

  return (
    <Animated.View
      style={[styles.draftCard, { transform: [{ scale: scaleAnim }] }]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => onOpen(draft)}
        style={styles.draftInner}
      >
        <View style={styles.draftInfo}>
          <Text style={styles.draftTitle} numberOfLines={1}>
            {draft.displayName}
          </Text>
          <View style={styles.draftMeta}>
            <Calendar color={theme.colors.textLight} size={14} />
            <Text style={styles.draftMetaText}>
              Last saved: {draft.displayDate}
            </Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.iconButton, styles.openButton]}
            onPress={() => onOpen(draft)}
          >
            <Edit3 size={18} color={theme.colors.primaryDark} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconButton, styles.deleteButton]}
            onPress={() => onDelete(draft)}
          >
            <Trash2 size={18} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default CMVRDraftsScreen;
