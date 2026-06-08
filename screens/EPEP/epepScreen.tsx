import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  RefreshControl,
  Linking,
  Platform,
  Image,
  ActivityIndicator,
  Modal,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { Camera, Upload, Download, Trash2, ClipboardList, X, ChevronLeft, ChevronRight } from "lucide-react-native";
import { CustomHeader } from "../../components/CustomHeader";
import { theme } from "../../theme/theme";
import { epepStyles as styles } from "./styles/epepScreen";
import {
  createSignedDownloadUrl,
  uploadFileFromUri,
  uploadAttachment,
} from "../../lib/storage";
import { deleteFiles } from "../../lib/api";

// Helper: cache signed download URLs in AsyncStorage to avoid frequent API calls
const SIGNED_URL_PREFIX = "@epep_signed_url:";
async function getCachedSignedUrl(path: string, expiresIn = 3600) {
  if (!path) throw new Error("No path");
  const key = `${SIGNED_URL_PREFIX}${path}`;
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.url && parsed?.expiresAt && Date.now() < parsed.expiresAt) {
        return parsed.url as string;
      }
    }
  } catch (e) {
    // ignore
  }

  const dl = await createSignedDownloadUrl(path, expiresIn);
  const expiresAt = Date.now() + expiresIn * 1000 - 30000; // 30s buffer
  try {
    await AsyncStorage.setItem(key, JSON.stringify({ url: dl.url, expiresAt }));
  } catch (e) {
    // ignore
  }
  return dl.url;
}

function FullscreenImageViewer({ images, visible, index, onClose, onIndexChange }: any) {
  const [current, setCurrent] = useState(index || 0);
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    setCurrent(index || 0);
  }, [index, visible]);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const doc = images?.[current];
      if (!doc) return;
      if (doc.url) {
        setImageUrl(doc.url);
        return;
      }
      if (!doc.path) return;
      try {
        setLoading(true);
        const url = await getCachedSignedUrl(doc.path, 3600);
        if (mounted) setImageUrl(url);
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [current, images]);

  const width = Dimensions.get("window").width;
  const height = Dimensions.get("window").height;

  const goto = (i: number) => {
    const clamped = Math.max(0, Math.min((images || []).length - 1, i));
    setCurrent(clamped);
    onIndexChange?.(clamped);
  };

  if (!images || images.length === 0) return null;

  return (
    <Modal visible={!!visible} animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "#000" }}>
        <View style={{ position: "absolute", top: 40, right: 20, zIndex: 3 }}>
          <TouchableOpacity onPress={onClose}>
            <X color="#fff" size={28} />
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          {loading ? (
            <ActivityIndicator size="large" color={theme.colors.primaryDark} />
          ) : imageUrl ? (
            <Image source={{ uri: imageUrl }} style={{ width, height, resizeMode: "contain" }} />
          ) : (
            <Text style={{ color: "#fff" }}>No preview available</Text>
          )}
        </View>

        <View style={{ position: "absolute", left: 10, top: "50%", zIndex: 3 }}>
          <TouchableOpacity disabled={current <= 0} onPress={() => goto(current - 1)}>
            <ChevronLeft color="#fff" size={36} />
          </TouchableOpacity>
        </View>

        <View style={{ position: "absolute", right: 10, top: "50%", zIndex: 3 }}>
          <TouchableOpacity disabled={current >= images.length - 1} onPress={() => goto(current + 1)}>
            <ChevronRight color="#fff" size={36} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

type EpepDoc = {
  id: string;
  fileName: string;
  createdAt?: string | null;
  url?: string;
  path?: string;
  contentType?: string | null;
};

export default function EPEPScreen({ navigation }: any) {
  const STORAGE_KEY = "@epep_docs";

  const [docs, setDocs] = useState<EpepDoc[]>([]);

  const [refreshing, setRefreshing] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  const persistDocs = async (items: EpepDoc[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn("Failed to persist EPEP docs:", e);
    }
  };

  const loadDocs = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: EpepDoc[] = JSON.parse(raw);
        setDocs(parsed || []);
      }
    } catch (e) {
      console.warn("Failed to load EPEP docs:", e);
    }
  };

  React.useEffect(() => {
    loadDocs();
  }, []);

  

  const handleDelete = (id: string) => {
    Alert.alert("Delete Document", "Are you sure you want to delete this document?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const doc = docs.find((d) => d.id === id);
          // Optimistically remove from UI
          const updated = docs.filter((d) => d.id !== id);
          setDocs(updated);
          await persistDocs(updated);

          // Try to delete from storage if we have a stored path
          try {
            if (doc?.path) {
              await deleteFiles([doc.path]);
            }
          } catch (e) {
            console.warn("Failed to delete file from storage:", e);
          }
        },
      },
    ]);
  };

  const handleDownload = (doc: EpepDoc) => {
    // UI-only: just notify the user. Real download will be implemented later.
    (async () => {
      try {
        if (doc.path) {
          const url = await getCachedSignedUrl(doc.path, 60);
          const can = await Linking.canOpenURL(url);
          if (can) {
            await Linking.openURL(url);
          } else {
            Alert.alert("Download", "Unable to open the download URL.");
          }
        } else if (doc.url) {
          const can = await Linking.canOpenURL(doc.url);
          if (can) await Linking.openURL(doc.url);
          else Alert.alert("Download", "Unable to open the file URL.");
        } else {
          Alert.alert("Download", "No download path available for this document.");
        }
      } catch (e: any) {
        Alert.alert("Download failed", e?.message || "Could not start download");
      }
    })();
  };

  const handleOpen = (doc: EpepDoc) => {
    // UI-only: simulate open. If doc.url is present you could open with Linking.openURL
    (async () => {
      try {
        if (doc.path) {
          const url = await getCachedSignedUrl(doc.path, 60);
          const can = await Linking.canOpenURL(url);
          if (can) await Linking.openURL(url);
          else Alert.alert("Open", "Cannot open file URL");
        } else if (doc.url) {
          const can = await Linking.canOpenURL(doc.url);
          if (can) await Linking.openURL(doc.url);
          else Alert.alert("Open", "Cannot open file URL");
        } else {
          Alert.alert("Open", `Opening ${doc.fileName}`);
        }
      } catch (e: any) {
        Alert.alert("Open failed", e?.message || "Could not open file");
      }
    })();
  };

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["*/*"],
        copyToCacheDirectory: true,
      } as any);

      // Support both legacy and new result shapes
      const asset = (result as any).assets ? (result as any).assets[0] : result;
      if (!asset || (result as any).canceled === true || (result as any).type === "cancel") {
        return;
      }

      const uri = asset.uri;
      const fileName = asset.name || uri.split("/").pop() || `file-${Date.now()}`;
      const mimeType = asset.mimeType || asset.type || undefined;

      Alert.alert("Uploading", `Uploading ${fileName}...`);

  const uploadRes = await uploadFileFromUri({ uri, fileName, contentType: mimeType, folder: 'epep/upload' });

      // Try to obtain a signed URL for immediate preview/download
      let signedUrl: string | undefined = undefined;
      try {
        signedUrl = await getCachedSignedUrl(uploadRes.path, 3600);
      } catch (e) {
        // ignore signing error; we'll still store the path
      }

      const newDoc: EpepDoc = {
        id: Date.now().toString(),
        fileName,
        createdAt: new Date().toISOString(),
        path: uploadRes.path,
        url: signedUrl,
        contentType: mimeType || null,
      };

      const updated = [newDoc, ...docs];
      setDocs(updated);
      await persistDocs(updated);

      Alert.alert("Upload complete", `${fileName} uploaded successfully.`);
    } catch (e: any) {
      console.error("Upload failed:", e);
      Alert.alert("Upload failed", e?.message || "Could not upload file");
    }
  };

  const handleScan = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Camera permission is required to scan documents.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      } as any);

      const asset = (result as any).assets ? (result as any).assets[0] : result;
      if (!asset || (result as any).canceled === true) return;

      const uri = asset.uri;
      const fileName = `photo-${Date.now()}.jpg`;

      Alert.alert("Uploading", `Uploading ${fileName}...`);
      // Use uploadAttachment helper for images
  const uploadRes = await uploadAttachment(uri, undefined, 'epep/scan');

      // Get a signed URL for preview
      let signedUrl: string | undefined = undefined;
      try {
        signedUrl = await getCachedSignedUrl(uploadRes.path, 3600);
      } catch (e) {
        // ignore signing error
      }

      const newDoc: EpepDoc = {
        id: Date.now().toString(),
        fileName,
        createdAt: new Date().toISOString(),
        path: uploadRes.path,
        url: signedUrl,
        contentType: "image/jpeg",
      };

      const updated = [newDoc, ...docs];
      setDocs(updated);
      await persistDocs(updated);

      Alert.alert("Upload complete", `${fileName} uploaded successfully.`);
    } catch (e: any) {
      console.error("Scan/upload failed:", e);
      Alert.alert("Scan failed", e?.message || "Could not scan/upload photo");
    }
  };

  // Split docs into images (gallery) and other uploaded documents
  const isImageDoc = (d: EpepDoc) => {
    if (d.contentType && d.contentType.startsWith("image/")) return true;
    return /\.(jpe?g|png|gif|webp|heic)$/i.test(d.fileName || "");
  };

  const imageDocs = docs.filter(isImageDoc);
  const otherDocs = docs.filter((d) => !isImageDoc(d));

  return (
    <SafeAreaView style={styles.safeContainer}>
      <CustomHeader showSave={false} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>AEPEP/EPEP Documents</Text>
          <Text style={styles.headerSubtitle}>Scan, upload or manage your AEPEP/EPEP documents.</Text>
        </View>

        <View style={styles.actionRowTop}>
          <TouchableOpacity style={styles.actionButton} activeOpacity={0.9} onPress={handleScan}> 
            <Camera color={theme.colors.primaryDark} size={18} />
            <Text style={styles.actionButtonText}>SCAN DOCUMENTS</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]} activeOpacity={0.9} onPress={handleUpload}> 
            <Upload color={theme.colors.primaryDark} size={18} />
            <Text style={styles.actionButtonText}>UPLOAD DOCUMENTS</Text>
          </TouchableOpacity>
        </View>

        {/* Gallery for scanned images */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Gallery</Text>
          </View>

          <View style={styles.recordsContainer}>
            {imageDocs.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <View style={styles.emptyState}>
                  <ClipboardList color={theme.colors.textLight} size={48} />
                  <Text style={styles.emptyStateTitle}>No images</Text>
                  <Text style={styles.emptyStateText}>You don't have any scanned images yet.</Text>
                </View>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 8 }}>
                {imageDocs.map((doc, idx) => (
                  <ImageThumbnail
                    key={doc.id}
                    doc={doc}
                    onDelete={() => handleDelete(doc.id)}
                    onOpen={() => {
                      setViewerIndex(idx);
                      setViewerVisible(true);
                    }}
                  />
                ))}
              </ScrollView>
            )}
          </View>
        </View>

        {/* Uploaded documents (non-image) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Uploaded Documents</Text>
          </View>

          <View style={styles.recordsContainer}>
            {otherDocs.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <View style={styles.emptyState}>
                  <ClipboardList color={theme.colors.textLight} size={48} />
                  <Text style={styles.emptyStateTitle}>No uploaded files</Text>
                  <Text style={styles.emptyStateText}>You don't have any uploaded documents yet.</Text>
                </View>
              </View>
            ) : (
              otherDocs.map((doc) => (
                <DocCard
                  key={doc.id}
                  doc={doc}
                  onDelete={() => handleDelete(doc.id)}
                  onDownload={() => handleDownload(doc)}
                  onOpen={() => handleOpen(doc)}
                />
              ))
            )}
          </View>
        </View>
        {/* Fullscreen viewer for gallery images */}
        <FullscreenImageViewer
          images={imageDocs}
          visible={viewerVisible}
          index={viewerIndex}
          onClose={() => setViewerVisible(false)}
          onIndexChange={(i: number) => setViewerIndex(i)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function DocCard({ doc, onDelete, onDownload, onOpen }: any) {
  const [scaleAnim] = useState(new Animated.Value(1));

  const pressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
  };
  const pressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 50, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={[styles.recordCard, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity activeOpacity={0.9} onPressIn={pressIn} onPressOut={pressOut} onPress={onOpen} style={styles.recordInner}>
        <View style={styles.recordInfo}>
          <Text style={styles.recordTitle} numberOfLines={1}>{doc.fileName}</Text>
          <Text style={styles.recordMetaText}>{doc.createdAt}</Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.iconButton, styles.downloadButton]} onPress={onDownload}>
            <Download size={18} color={theme.colors.primaryDark} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.iconButton, styles.deleteButton]} onPress={onDelete}>
            <Trash2 size={18} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function ImageThumbnail({ doc, onOpen, onDelete }: any) {
  const [imageUrl, setImageUrl] = useState<string | undefined>(doc.url);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      if (imageUrl) return;
      if (!doc.path) return;
      try {
        setLoading(true);
        const dlUrl = await getCachedSignedUrl(doc.path, 3600);
        if (mounted) setImageUrl(dlUrl);
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [doc.path]);

  return (
    <View style={{ marginRight: 12, width: 120 }}>
      <TouchableOpacity activeOpacity={0.9} onPress={() => onOpen && onOpen()} style={{ borderRadius: 8, overflow: 'hidden', backgroundColor: '#f3f3f3', height: 160, justifyContent: 'center', alignItems: 'center' }}>
        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.primaryDark} />
        ) : imageUrl ? (
          <Image source={{ uri: imageUrl }} style={{ width: 120, height: 160, resizeMode: 'cover' }} />
        ) : (
          <View style={{ justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: theme.colors.textLight }}>No preview</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
        <TouchableOpacity style={[styles.iconButton, styles.downloadButton]} onPress={() => onOpen && onOpen()}>
          <Download size={16} color={theme.colors.primaryDark} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.iconButton, styles.deleteButton]} onPress={() => onDelete && onDelete(doc.id)}>
          <Trash2 size={16} color={theme.colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
