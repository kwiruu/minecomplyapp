import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

interface SupportingDocumentsSectionProps {
  uploadedImages: string[];
  setUploadedImages: (images: string[]) => void;
}

const SupportingDocumentsSection: React.FC<SupportingDocumentsSectionProps> = ({
  uploadedImages,
  setUploadedImages,
}) => {
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert(
        "Permission Required",
        "You need to allow access to your photo library to upload images."
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 10,
    });
    if (!result.canceled && result.assets) {
      const newImages = result.assets.map((asset) => asset.uri);
      setUploadedImages([...uploadedImages, ...newImages]);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert(
        "Permission Required",
        "You need to allow access to your camera to take photos."
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });
    if (!result.canceled && result.assets) {
      setUploadedImages([...uploadedImages, result.assets[0].uri]);
    }
  };

  const removeImage = (index: number) => {
    Alert.alert("Remove Image", "Are you sure you want to remove this image?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          setUploadedImages(uploadedImages.filter((_, i) => i !== index));
        },
      },
    ]);
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Supporting Documents/Photos</Text>
      <Text style={styles.sectionSubtitle}>
        Upload photos or documents as evidence of compliance
      </Text>
      <View style={styles.uploadButtons}>
        <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
          <Ionicons name="images-outline" size={24} color="#007AFF" />
          <Text style={styles.uploadButtonText}>Choose from Gallery</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.uploadButton} onPress={takePhoto}>
          <Ionicons name="camera-outline" size={24} color="#007AFF" />
          <Text style={styles.uploadButtonText}>Take Photo</Text>
        </TouchableOpacity>
      </View>
      {uploadedImages.length > 0 && (
        <View style={styles.imagesGrid}>
          {uploadedImages.map((uri, index) => (
            <View key={index} style={styles.imageContainer}>
              <Image source={{ uri }} style={styles.uploadedImage} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => removeImage(index)}
              >
                <Ionicons name="close-circle" size={24} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
      {uploadedImages.length === 0 && (
        <View style={styles.emptyImages}>
          <Ionicons name="cloud-upload-outline" size={48} color="#ccc" />
          <Text style={styles.emptyImagesText}>No images uploaded yet</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    backgroundColor: "white",
    marginTop: 10,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
  },
  uploadButtons: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 15,
  },
  uploadButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    backgroundColor: "#f0f8ff",
    borderWidth: 1,
    borderColor: "#007AFF",
    borderRadius: 8,
    gap: 8,
  },
  uploadButtonText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "600",
  },
  imagesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  imageContainer: {
    position: "relative",
    width: 100,
    height: 100,
  },
  uploadedImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "white",
    borderRadius: 12,
  },
  emptyImages: {
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderStyle: "dashed",
  },
  emptyImagesText: {
    fontSize: 14,
    color: "#999",
    marginTop: 10,
  },
});

export default SupportingDocumentsSection;
