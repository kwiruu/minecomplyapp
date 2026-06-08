import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  Image,
  TextInput,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Feather, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { uploadFileFromUri } from "../../lib/storage";
import { CMSHeader } from "../../components/CMSHeader";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const isTablet = SCREEN_WIDTH >= 768;

export default function CMVRAttachmentsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const params: any = route.params || {};

  const [attachments, setAttachments] = useState<
    { uri: string; path?: string; uploading?: boolean; caption?: string }[]
  >([]);
  const [newlyUploadedPaths, setNewlyUploadedPaths] = useState<string[]>([]);

  // Load existing attachments if coming from update
  useEffect(() => {
    if (
      params.existingAttachments &&
      Array.isArray(params.existingAttachments)
    ) {
      console.log("Loading existing attachments:", params.existingAttachments);
      const loadedAttachments = params.existingAttachments.map((att: any) => ({
        uri: att.path || "",
        path: att.path || "",
        caption: att.caption || "",
        uploading: false,
      }));
      setAttachments(loadedAttachments);
    }
  }, [params.existingAttachments]);

  const processPickedAsset = async (asset: ImagePicker.ImagePickerAsset) => {
    const newItem = { uri: asset.uri, uploading: true, caption: "" };
    setAttachments((prev) => [...prev, newItem]);

    try {
      const nameFromPicker = (
        asset.fileName ??
        asset.uri.split("/").pop() ??
        "image.jpg"
      ).replace(/\?.*$/, "");
      const ext = nameFromPicker.includes(".")
        ? nameFromPicker.split(".").pop()
        : "jpg";
      const baseName = params.fileName
        ? params.fileName.trim().replace(/[^a-zA-Z0-9._-]/g, "_")
        : "cmvr";
      const finalName = `${baseName}_${Date.now()}.${ext}`;
      const contentType = asset.mimeType ?? "image/jpeg";

      const { path } = await uploadFileFromUri({
        uri: asset.uri,
        fileName: finalName,
        contentType,
        upsert: false,
      });

      console.log("=== DEBUG: File uploaded ===", {
        path,
        uri: asset.uri,
        finalName,
      });
      setNewlyUploadedPaths((prev) => [...prev, path]);
      setAttachments((prev) =>
        prev.map((a) =>
          a.uri === newItem.uri ? { ...a, path, uploading: false } : a
        )
      );
    } catch (e: any) {
      setAttachments((prev) => prev.filter((a) => a.uri !== newItem.uri));
      Alert.alert(
        "Upload failed",
        e?.message || "Could not upload the image. Please try again."
      );
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        "We need access to your media library to attach images."
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      await processPickedAsset(asset);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        "We need camera access to take photos."
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      await processPickedAsset(asset);
    }
  };

  const removeAttachment = (uri: string) => {
    setAttachments((prev) => prev.filter((a) => a.uri !== uri));
  };

  const updateAttachmentCaption = (uri: string, caption: string) => {
    setAttachments((prev) =>
      prev.map((a) => (a.uri === uri ? { ...a, caption } : a))
    );
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleSave = () => {
    Alert.alert("Saved", "Attachments saved locally");
  };

  const handleNext = () => {
    // Pass attachments to the next screen (CMVRDocumentExport)
    const formattedAttachments = attachments
      .filter((a) => !!a.path)
      .map((a) => ({ path: a.path!, caption: a.caption || "" }));

    console.log("=== Navigating with attachments ===", formattedAttachments);

    navigation.navigate("CMVRDocumentExport", {
      ...params,
      attachments: formattedAttachments,
      newlyUploadedPaths,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <CMSHeader onBack={handleBack} onSave={handleSave} allowEdit={false} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.iconContainer}>
              <Feather name="paperclip" size={32} color="#02217C" />
            </View>
            <Text style={styles.title}>Attachments</Text>
            <Text style={styles.subtitle}>
              Add images or documents to attach to this CMVR report
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={pickImage}>
              <Feather name="image" size={20} color="#02217C" />
              <Text style={styles.actionButtonText}>Pick from Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={takePhoto}>
              <Feather name="camera" size={20} color="#02217C" />
              <Text style={styles.actionButtonText}>Take Photo</Text>
            </TouchableOpacity>
          </View>

          {/* Attachments Grid */}
          {attachments.length > 0 && (
            <View style={styles.attachmentsGrid}>
              {attachments.map((att) => (
                <View key={att.uri} style={styles.attachmentCard}>
                  <View style={styles.imageContainer}>
                    <Image
                      source={{ uri: att.uri }}
                      style={styles.attachmentImage}
                      resizeMode="cover"
                    />
                    {att.uploading && (
                      <View style={styles.uploadingOverlay}>
                        <Text style={styles.uploadingText}>Uploading...</Text>
                      </View>
                    )}
                    {!att.uploading && (
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => removeAttachment(att.uri)}
                      >
                        <Ionicons
                          name="close-circle"
                          size={24}
                          color="#EF4444"
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                  <TextInput
                    style={styles.captionInput}
                    placeholder="Add a caption..."
                    value={att.caption || ""}
                    onChangeText={(text) =>
                      updateAttachmentCaption(att.uri, text)
                    }
                    editable={!att.uploading}
                  />
                </View>
              ))}
            </View>
          )}

          {attachments.length === 0 && (
            <View style={styles.emptyState}>
              <Feather name="image" size={48} color="#CBD5E1" />
              <Text style={styles.emptyStateText}>No attachments yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Add images to include them in your CMVR report
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Footer with Next Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            attachments.some((a) => a.uploading) && styles.nextButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={attachments.some((a) => a.uploading)}
        >
          <Text style={styles.nextButtonText}>Continue to Export Summary</Text>
          <Feather name="arrow-right" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  content: {
    padding: isTablet ? 32 : 20,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: isTablet ? 28 : 24,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: isTablet ? 16 : 14,
    color: "#64748B",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#02217C",
  },
  attachmentsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  attachmentCard: {
    width: isTablet ? 200 : (SCREEN_WIDTH - 56) / 2,
    backgroundColor: "white",
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: isTablet ? 150 : 120,
  },
  attachmentImage: {
    width: "100%",
    height: "100%",
  },
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadingText: {
    color: "white",
    fontWeight: "600",
  },
  removeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "white",
    borderRadius: 12,
  },
  captionInput: {
    padding: 12,
    fontSize: 13,
    color: "#1E293B",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#94A3B8",
    marginTop: 8,
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    paddingHorizontal: isTablet ? 32 : 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#02217C",
    paddingVertical: 16,
    borderRadius: 8,
  },
  nextButtonDisabled: {
    backgroundColor: "#94A3B8",
  },
  nextButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
