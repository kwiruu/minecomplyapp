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
import { cmvrDraftStyles as styles } from "./styles/ECCDraftsScreen.styles";
import { useFileName } from "../../contexts/FileNameContext";
import { useEccDraftStore } from "../../store/eccDraftStore";
import { useEccStore } from "../../store/eccStore";

type EccDraftMetadata = {
  id: string;
  fileName: string;
  date: string;
  saveAt: string;
};

interface DraftListItem {
  id: string;
  displayName: string;
  displayDate: string;
  updatedAt: string;
  isLocalDraft: boolean;
}

type Navigation = NativeStackNavigationProp<any>;

const CMVRDraftsScreen = () => {
  const { getDraftList, loadDraftById, clearDrafts, deleteDraft } =
    useEccDraftStore();
  const { setSelectedReport } = useEccStore();

  const navigation = useNavigation<Navigation>();
  const { setFileName } = useFileName();

  const [drafts, setDrafts] = useState<DraftListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [createAnim] = useState(new Animated.Value(1));

  const hydrateDrafts = useCallback(async () => {
    setLoading(true);

    try {
      const draftMetadata = (await getDraftList()) as EccDraftMetadata[];
      // console.log("Found drafts:", draftMetadata.length);
      const hydrated = draftMetadata
        .slice(0, 3)
        .map((draft: EccDraftMetadata) => ({
          id: draft.id,
          displayName: draft.fileName,
          displayDate: new Date(draft.saveAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          updatedAt: draft.date ?? draft.saveAt,
          isLocalDraft: true,
        }));
      setDrafts(hydrated);
      console.log("Asdasd", draftMetadata);
    } catch (err) {
      console.log("Error loading local drafts:", err);
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

  const handleOpenDraft = async (id: string) => {
    const data = await loadDraftById(id);
    setSelectedReport(data);
    console.log("asd", data);
    navigation.navigate("ECCMonitoring", { id: id });
  };

  const handleDeleteDraft = (id: string) => {
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
              const success = await deleteDraft(id);
              if (success) {
                await hydrateDrafts();
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
          <Text style={styles.headerTitle}>ECC Drafts</Text>
          <Text style={styles.headerSubtitle}>
            Continue working on saved drafts or start a new ECC report.
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
                  key={item.id}
                  draft={item}
                  onOpen={() => handleOpenDraft(item.id)}
                  onDelete={() => handleDeleteDraft(item.id)}
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
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
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
        onPress={() => onOpen(draft.id)}
        style={styles.draftInner}
      >
        <View style={styles.draftInfo}>
          <Text style={styles.draftTitle} numberOfLines={1}>
            {draft.displayName}
          </Text>
          <View style={styles.draftMeta}>
            <Calendar color={theme.colors.textLight} size={14} />
            <Text style={styles.draftMetaText}>
              Last saved: {draft.updatedAt ? draft.updatedAt : "Unknown Date"}
            </Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.iconButton, styles.openButton]}
            onPress={() => onOpen(draft.id)}
          >
            <Edit3 size={18} color={theme.colors.primaryDark} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconButton, styles.deleteButton]}
            onPress={() => onDelete(draft.id)}
          >
            <Trash2 size={18} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default CMVRDraftsScreen;
