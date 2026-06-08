import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  Alert,
  Image,
  Modal,
  ActivityIndicator,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SignatureScreen from "react-native-signature-canvas";
// react-native-signature-canvas doesn't ship strong TSX types for JSX usage in some setups.
// Create a loose-typed alias to satisfy TypeScript when rendering the component.
const SignatureScreenAny: any = SignatureScreen;
import DateTimePickerModal from "react-native-modal-datetime-picker";
import * as Location from "expo-location";
import { Feather } from "@expo/vector-icons";
import { theme } from "../../theme/theme";
import { createAttendanceStyles as styles } from "./styles/createAttendanceScreen";
import { CustomHeader } from "../../components/CustomHeader";
import { apiPost, apiGet, apiPatch } from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";
import * as ImagePicker from "expo-image-picker";
import {
  uploadFileFromUri,
  uploadSignature,
  createSignedDownloadUrl,
  getPublicUrl,
} from "../../lib/storage";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as FileSystem from "expo-file-system/legacy";
import useSafeAreaWeb from "../../hooks/useSafeAreaWeb";
import { verticalScale } from "../../utils/responsive";

// RadioButton component (gi tapol ko ug separate gamay rakayo sila bitaw)
const RadioButton = ({
  label,
  value,
  selectedValue,
  onSelect,
  hasError,
  containerStyle,
}: any) => {
  const isSelected = value === selectedValue;
  return (
    <TouchableOpacity
      style={[styles.radioButtonContainer, containerStyle]}
      onPress={() => onSelect(value)}
    >
      <View
        style={[
          styles.radioButton,
          isSelected && styles.radioButtonSelected,
          hasError && styles.radioError,
        ]}
      >
        {isSelected && <View style={styles.radioButtonInner} />}
      </View>
      <Text style={[styles.radioButtonLabel, hasError && styles.labelError]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export default function CreateAttendanceScreen({ navigation, route }: any) {
  const { user } = useAuth();
  const attendanceId = route?.params?.attendanceId;
  const isEditMode = !!attendanceId;

  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [meetingDate, setMeetingDate] = useState<Date | null>(null);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [location, setLocation] = useState("");
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [attendees, setAttendees] = useState([
    {
      id: 1,
      name: "",
      agency: "",
      position: "",
      attendance: "",
      signatureUrl: "",
      signaturePath: "",
      photoUrl: "",
      photoPath: "",
    },
  ]);

  const [signatureModalVisible, setSignatureModalVisible] = useState(false);
  const [currentAttendeeId, setCurrentAttendeeId] = useState<number | null>(
    null
  );
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [newlyUploadedPaths, setNewlyUploadedPaths] = useState<string[]>([]);

  const [isSigning, setIsSigning] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [saving, setSaving] = useState(false);

  const signatureCanvasRef = useRef<any>(null);
  const [scaleAnim] = useState(new Animated.Value(1));

  const [windowSize, setWindowSize] = useState(Dimensions.get("window"));

  useEffect(() => {
    const handler = ({ window }: any) => setWindowSize(window);
    const sub: any = Dimensions.addEventListener
      ? Dimensions.addEventListener("change", handler)
      : null;

    return () => {
      if (sub && typeof sub.remove === "function") sub.remove();
    };
  }, []);

  // For web/PC mode we compute an extra bottom inset in case the OS taskbar
  // or other overlays hide the bottom of the viewport. The hook returns 0
  // on native platforms so this is a no-op there.
  const { bottom: viewportBottom } = useSafeAreaWeb();
  const scrollPaddingBottom = Math.max(
    verticalScale(theme.spacing.xl),
    viewportBottom
      ? viewportBottom + verticalScale(theme.spacing.md)
      : verticalScale(theme.spacing.xl)
  );
  const footerPaddingBottom = viewportBottom
    ? viewportBottom + verticalScale(theme.spacing.md)
    : verticalScale(theme.spacing.md);

  // Load existing attendance record if in edit mode
  useEffect(() => {
    if (isEditMode && attendanceId) {
      loadAttendanceRecord();
    }
  }, [attendanceId, isEditMode]);

  const loadAttendanceRecord = async () => {
    try {
      setLoading(true);
      const record = await apiGet<any>(`/attendance/${attendanceId}`);

      // Populate fields
      setFileName(record.fileName || "");
      setTitle(record.title || "");
      setDescription(record.description || "");
      setLocation(record.location || "");

      if (record.meetingDate) {
        setMeetingDate(new Date(record.meetingDate));
      }

      // Parse attendees
      if (record.attendees) {
        const parsedAttendees = Array.isArray(record.attendees)
          ? record.attendees
          : JSON.parse(record.attendees);

        // Load attendees with signed URLs for signatures
        const attendeesWithSignedUrls = await Promise.all(
          parsedAttendees.map(async (att: any, index: number) => {
            // Map attendanceStatus to the radio button values
            let attendance = "Absent";
            if (att.attendanceStatus === "IN_PERSON") {
              attendance = "In Person";
            } else if (att.attendanceStatus === "ONLINE") {
              attendance = "Online";
            }

            // Get signed URL for signature if it exists
            let signatureUrl = "";
            const signaturePath = att.signatureUrl || "";
            if (signaturePath) {
              try {
                // Use public URL directly (no backend call needed)
                signatureUrl = getPublicUrl(signaturePath);
              } catch (error) {
                console.log("Failed to load signature URL:", error);
              }
            }

            // Get signed URL for photo if it exists
            let photoUrl = "";
            const photoPath = att.photoUrl || "";
            if (photoPath) {
              try {
                const { url } = await createSignedDownloadUrl(photoPath, 60);
                photoUrl = url;
              } catch (error) {
                console.log("Failed to load photo URL:", error);
              }
            }

            return {
              id: index + 1,
              name: att.name || "",
              agency: att.agency || "",
              position: att.position || "",
              attendance: attendance,
              signatureUrl: signatureUrl,
              signaturePath: signaturePath,
              photoUrl: photoUrl,
              photoPath: photoPath,
            };
          })
        );

        setAttendees(attendeesWithSignedUrls);
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        "Failed to load attendance record: " +
          (error.message || "Unknown error")
      );
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  // --- Animation Handlers ---
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

  // --- Attendee List Handlers ---
  const addAttendee = () => {
    setAttendees([
      ...attendees,
      {
        id: Date.now(),
        name: "",
        agency: "",
        position: "",
        attendance: "",
        signatureUrl: "",
        signaturePath: "",
        photoUrl: "",
        photoPath: "",
      },
    ]);
  };

  const removeAttendee = (id: number) => {
    setAttendees(attendees.filter((a) => a.id !== id));
  };

  const handleSetFileName = (text: string) => {
    setFileName(text);
    if (errors.fileName) {
      setErrors((prev: any) => ({ ...prev, fileName: false }));
    }
  };

  const updateField = (id: number, field: string, value: string) => {
    setAttendees((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    );
  };

  // --- Date Picker Handlers ---
  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);
  const handleConfirmDate = (date: Date) => {
    setMeetingDate(date);
    hideDatePicker();
  };

  const formatDateOnly = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // --- Location Handlers ---
  const useCurrentLocation = async () => {
    try {
      setIsFetchingLocation(true);
      console.log("=== Fetching Attendance Location ===");
      
      // ✅ FIX: Check if location services are enabled first
      const isEnabled = await Location.hasServicesEnabledAsync();
      if (!isEnabled) {
        console.warn("Location services disabled");
        Alert.alert(
          "Location Services Disabled",
          "Please enable location services in your device settings."
        );
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log("Location permission:", status);
      
      if (status !== "granted") {
        console.warn("Location permission denied");
        Alert.alert(
          "Permission required",
          "Location permission is needed to use your current location."
        );
        return;
      }

      // ✅ FIX: Add timeout for location request
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Location request timed out")), 10000)
      );

      const locationPromise = Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const pos = (await Promise.race([
        locationPromise,
        timeoutPromise,
      ])) as Location.LocationObject;

      // ✅ FIX: Validate location data
      if (!pos || !pos.coords) {
        throw new Error("Invalid location data received");
      }

      let pretty = `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`;
      console.log(`✅ Location obtained: ${pretty}`);
      
      try {
        const places = await Location.reverseGeocodeAsync({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        if (places && places[0]) {
          const p = places[0] as any;
          const bits = [
            p.name,
            p.street,
            p.city,
            p.region,
            p.postalCode,
            p.country,
          ]
            .filter(Boolean)
            .join(", ");
          if (bits) {
            pretty = bits;
            console.log(`✅ Reverse geocoded: ${pretty}`);
          }
        }
      } catch (geocodeError) {
        console.warn("Reverse geocoding failed, using coordinates:", geocodeError);
      }
      setLocation(pretty);
    } catch (e: any) {
      console.error("❌ Location error:", e);
      const errorMsg = e?.message?.includes?.("timeout")
        ? "Location request timed out. Please try again."
        : e?.message || "Failed to fetch current location";
      Alert.alert("Location error", errorMsg);
    } finally {
      setIsFetchingLocation(false);
    }
  };

  // --- Signature Handlers ---
  const handleAddSignature = (id: number) => {
    setCurrentAttendeeId(id);
    setSignatureModalVisible(true);
  };

  const handleSignatureOK = async (signature: string) => {
    if (currentAttendeeId === null) return;

    // Immediately set a preview (the base64 data uri) and close the modal so UX is snappy.
    try {
      setUploadingSignature(true);

      const dataUri = signature; // signature is already a data URI (data:image/png;base64,...)

      const currentId = currentAttendeeId;

      // Show immediate preview using the data URI while we upload in background
      setAttendees((prev) =>
        prev.map((a) =>
          a.id === currentId ? { ...a, signatureUrl: dataUri } : a
        )
      );

      // Close modal and clear current attendee selection immediately
      setSignatureModalVisible(false);
      setCurrentAttendeeId(null);

      // Background upload: write temp file and upload, then replace preview with signed URL
      (async () => {
        try {
          const base64Data = signature.replace(/^data:image\/\w+;base64,/, "");
          const tempFilePath = `${FileSystem.cacheDirectory}temp-signature-${Date.now()}.png`;

          await FileSystem.writeAsStringAsync(tempFilePath, base64Data, {
            encoding: FileSystem.EncodingType.Base64,
          });

          const manipulatedImage = await manipulateAsync(
            tempFilePath,
            [{ resize: { width: 400 } }],
            { compress: 0.5, format: SaveFormat.PNG }
          );

          const { path, url } = await uploadSignature(manipulatedImage.uri);

          // Track the newly uploaded path for potential cleanup
          setNewlyUploadedPaths((prev) => [...prev, path]);

          // Update the attendee with the signature path and public URL
          setAttendees((prev) =>
            prev.map((a) =>
              a.id === currentId
                ? { ...a, signatureUrl: url, signaturePath: path }
                : a
            )
          );

          await FileSystem.deleteAsync(tempFilePath, { idempotent: true });

          // Optionally notify success (silent is also fine)
          // Alert.alert("Success", "Signature uploaded successfully.");
        } catch (uploadError: any) {
          console.error("Signature upload failed:", uploadError);
          Alert.alert(
            "Error",
            uploadError?.message || "Failed to upload signature."
          );
        } finally {
          setUploadingSignature(false);
          setIsSigning(false);
        }
      })();
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to process signature.");
      setUploadingSignature(false);
      setIsSigning(false);
    }
  };

  const handleTakePhoto = async (id: number) => {
    try {
      setCurrentAttendeeId(id);
      setUploadingPhoto(true);

      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert(
          "Permission required",
          "Permission to access camera is required to take a photo."
        );
        setUploadingPhoto(false);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
      });

      const wasCancelled =
        (result as any).cancelled || (result as any).canceled;
      const pickedUri = (result as any).uri || (result as any).assets?.[0]?.uri;

      if (wasCancelled || !pickedUri) {
        setUploadingPhoto(false);
        setCurrentAttendeeId(null);
        return;
      }

      // Resize/compress for upload
      const manipulated = await manipulateAsync(
        pickedUri,
        [{ resize: { width: 800 } }],
        { compress: 0.7, format: SaveFormat.JPEG }
      );

      // Show immediate preview using local uri while uploading
      setAttendees((prev) =>
        prev.map((a) => (a.id === id ? { ...a, photoUrl: manipulated.uri } : a))
      );

      // Upload to storage (attendance-photos folder)
      try {
        // Ensure the file has a proper extension by creating a new file if needed
        let fileUri = manipulated.uri;
        if (!fileUri.endsWith(".jpg") && !fileUri.endsWith(".jpeg")) {
          const newPath = `${FileSystem.cacheDirectory}attendance-photo-${Date.now()}.jpg`;
          await FileSystem.copyAsync({
            from: manipulated.uri,
            to: newPath,
          });
          fileUri = newPath;
        }

        const { path } = await uploadFileFromUri({
          uri: fileUri,
          fileName: `attendance-${Date.now()}.jpg`,
          contentType: "image/jpeg",
          folder: "attendance-photos",
        });
        // Use public URL directly (no backend call needed)
        const url = getPublicUrl(path);

        setNewlyUploadedPaths((prev) => [...prev, path]);

        setAttendees((prev) =>
          prev.map((a) =>
            a.id === id ? { ...a, photoUrl: url, photoPath: path } : a
          )
        );

        // Clean up temp file if we created one
        if (fileUri !== manipulated.uri) {
          await FileSystem.deleteAsync(fileUri, { idempotent: true });
        }
      } catch (uploadErr: any) {
        console.error("Upload failed:", uploadErr);
        Alert.alert("Error", uploadErr?.message || "Failed to upload photo.");
        // clear preview on failure
        setAttendees((prev) =>
          prev.map((a) =>
            a.id === id ? { ...a, photoUrl: "", photoPath: "" } : a
          )
        );
      }
    } catch (err: any) {
      console.error("handleTakePhoto error:", err);
      Alert.alert("Error", err?.message || "Failed to take photo.");
    } finally {
      setUploadingPhoto(false);
      setCurrentAttendeeId(null);
    }
  };

  const handleUploadPhoto = async (id: number) => {
    try {
      setCurrentAttendeeId(id);
      setUploadingPhoto(true);

      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert(
          "Permission required",
          "Permission to access photos is required to upload a photo."
        );
        setUploadingPhoto(false);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
      });

      const wasCancelled =
        (result as any).cancelled || (result as any).canceled;
      const pickedUri = (result as any).uri || (result as any).assets?.[0]?.uri;

      if (wasCancelled || !pickedUri) {
        setUploadingPhoto(false);
        setCurrentAttendeeId(null);
        return;
      }

      // Resize/compress for upload
      const manipulated = await manipulateAsync(
        pickedUri,
        [{ resize: { width: 800 } }],
        { compress: 0.7, format: SaveFormat.JPEG }
      );

      // Show immediate preview using local uri while uploading
      setAttendees((prev) =>
        prev.map((a) => (a.id === id ? { ...a, photoUrl: manipulated.uri } : a))
      );

      // Upload to storage (attendance-photos folder)
      try {
        // Ensure the file has a proper extension by creating a new file if needed
        let fileUri = manipulated.uri;
        if (!fileUri.endsWith(".jpg") && !fileUri.endsWith(".jpeg")) {
          const newPath = `${FileSystem.cacheDirectory}attendance-photo-${Date.now()}.jpg`;
          await FileSystem.copyAsync({
            from: manipulated.uri,
            to: newPath,
          });
          fileUri = newPath;
        }

        const { path } = await uploadFileFromUri({
          uri: fileUri,
          fileName: `attendance-${Date.now()}.jpg`,
          contentType: "image/jpeg",
          folder: "attendance-photos",
        });
        // Use public URL directly (no backend call needed)
        const url = getPublicUrl(path);

        setNewlyUploadedPaths((prev) => [...prev, path]);

        setAttendees((prev) =>
          prev.map((a) =>
            a.id === id ? { ...a, photoUrl: url, photoPath: path } : a
          )
        );

        // Clean up temp file if we created one
        if (fileUri !== manipulated.uri) {
          await FileSystem.deleteAsync(fileUri, { idempotent: true });
        }
      } catch (uploadErr: any) {
        console.error("Upload failed:", uploadErr);
        Alert.alert("Error", uploadErr?.message || "Failed to upload photo.");
        // clear preview on failure
        setAttendees((prev) =>
          prev.map((a) =>
            a.id === id ? { ...a, photoUrl: "", photoPath: "" } : a
          )
        );
      }
    } catch (err: any) {
      console.error("handleUploadPhoto error:", err);
      Alert.alert("Error", err?.message || "Failed to pick photo.");
    } finally {
      setUploadingPhoto(false);
      setCurrentAttendeeId(null);
    }
  };

  const handleUploadSignature = async (id: number) => {
    try {
      setCurrentAttendeeId(id);
      setUploadingSignature(true);

      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert(
          "Permission required",
          "Permission to access photos is required to upload a signature."
        );
        setUploadingSignature(false);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
      });

      // Handle different ImagePickerResult shapes across SDK versions
      const wasCancelled =
        (result as any).cancelled || (result as any).canceled;
      const pickedUri = (result as any).uri || (result as any).assets?.[0]?.uri;

      if (wasCancelled || !pickedUri) {
        setUploadingSignature(false);
        setCurrentAttendeeId(null);
        return;
      }

      // Resize/compress for upload
      const manipulated = await manipulateAsync(
        pickedUri,
        [{ resize: { width: 800 } }],
        { compress: 0.7, format: SaveFormat.PNG }
      );

      // Show immediate preview using local uri while uploading
      setAttendees((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, signatureUrl: manipulated.uri } : a
        )
      );

      // Upload to storage (signatures folder)
      try {
        const { path, url } = await uploadSignature(manipulated.uri);

        setNewlyUploadedPaths((prev) => [...prev, path]);

        setAttendees((prev) =>
          prev.map((a) =>
            a.id === id ? { ...a, signatureUrl: url, signaturePath: path } : a
          )
        );
      } catch (uploadErr: any) {
        console.error("Upload failed:", uploadErr);
        Alert.alert(
          "Error",
          uploadErr?.message || "Failed to upload signature image."
        );
        // clear preview on failure
        setAttendees((prev) =>
          prev.map((a) =>
            a.id === id ? { ...a, signatureUrl: "", signaturePath: "" } : a
          )
        );
      }
    } catch (err: any) {
      console.error("handleUploadSignature error:", err);
      Alert.alert("Error", err?.message || "Failed to pick signature image.");
    } finally {
      setUploadingSignature(false);
      setCurrentAttendeeId(null);
    }
  };

  const handleRemoveSignature = async (id: number) => {
    const attendee = attendees.find((a) => a.id === id);
    const signaturePath =
      (attendee as any)?.signaturePath || attendee?.signatureUrl;

    if (signaturePath) {
      try {
        // Delete from storage bucket
        await apiPost("/storage/delete-files", {
          paths: [signaturePath],
        });

        // If the signature being removed was just uploaded, untrack it
        setNewlyUploadedPaths((prev) =>
          prev.filter((p) => p !== signaturePath)
        );
      } catch (error) {
        console.error("Failed to delete signature from storage:", error);
        // Continue with removal even if deletion fails
      }
    }

    updateField(id, "signatureUrl", "");
    updateField(id, "signaturePath", "");
  };

  const handleRemovePhoto = async (id: number) => {
    const attendee = attendees.find((a) => a.id === id);
    const photoPath = (attendee as any)?.photoPath || attendee?.photoUrl;

    if (photoPath) {
      try {
        // Delete from storage bucket
        await apiPost("/storage/delete-files", {
          paths: [photoPath],
        });

        // If the photo being removed was just uploaded, untrack it
        setNewlyUploadedPaths((prev) => prev.filter((p) => p !== photoPath));
      } catch (error) {
        console.error("Failed to delete photo from storage:", error);
        // Continue with removal even if deletion fails
      }
    }

    updateField(id, "photoUrl", "");
    updateField(id, "photoPath", "");
  };

  const handleSignatureClear = () => {
    signatureCanvasRef.current?.clearSignature();
  };

  const handleSignatureSave = () => {
    try {
      setIsSigning(true);
      signatureCanvasRef.current?.readSignature();
    } finally {
    }
  };

  // --- Validation and Save ---
  const validate = () => {
    const newErrors: any = { attendees: {} };
    let isValid = true;

    if (!fileName.trim()) {
      newErrors.fileName = true;
      isValid = false;
    }

    attendees.forEach((attendee) => {
      const attendeeErrors: any = {};
      if (!attendee.name.trim()) {
        attendeeErrors.name = true;
        isValid = false;
      }
      if (!attendee.agency.trim()) {
        attendeeErrors.agency = true;
        isValid = false;
      }
      if (!attendee.position.trim()) {
        attendeeErrors.position = true;
        isValid = false;
      }
      if (!attendee.attendance.trim()) {
        attendeeErrors.attendance = true;
        isValid = false;
      }
      if (
        attendee.attendance.toLowerCase() !== "absent" &&
        !attendee.signatureUrl?.trim()
      ) {
        attendeeErrors.signatureUrl = true;
        isValid = false;
      }

      if (Object.keys(attendeeErrors).length > 0) {
        newErrors.attendees[attendee.id] = attendeeErrors;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  // ✅ FIX: Add draft save functionality for attendance
  const handleSaveDraft = async () => {
    try {
      const draftData = {
        fileName,
        title,
        description,
        meetingDate: meetingDate ? meetingDate.toISOString() : null,
        location,
        attendees: JSON.parse(JSON.stringify(attendees)), // Deep clone
        savedAt: new Date().toISOString(),
      };

      console.log("=== Saving Attendance Draft ===");
      console.log("Attendees count:", attendees.length);
      
      const draftKey = `@attendance_draft_${fileName || 'untitled'}`;
      await AsyncStorage.setItem(draftKey, JSON.stringify(draftData));
      
      console.log("✅ Attendance draft saved");
      Alert.alert("Success", "Draft saved successfully!");
    } catch (error) {
      console.error("❌ Failed to save draft:", error);
      Alert.alert("Error", "Failed to save draft. Please try again.");
    }
  };

  const handleSave = () => {
    if (!validate()) {
      Alert.alert(
        "Error",
        "Please fill in all required fields highlighted in red."
      );
      return;
    }
    setSaving(true);
    submitAttendance()
      .catch((e) => {
        console.error("Failed to submit attendance", e);
        Alert.alert("Error", e?.message || "Failed to submit attendance");
      })
      .finally(() => setSaving(false));
  };

  React.useEffect(() => {
    const handleBeforeRemove = (e: any) => {
      if (newlyUploadedPaths.length === 0 || saving) {
        return;
      }

      e.preventDefault();

      Alert.alert(
        "Discard Changes?",
        "You have unsaved uploads. Are you sure you want to leave and discard them?",
        [
          { text: "Don't Leave", style: "cancel", onPress: () => {} },
          {
            text: "Discard",
            style: "destructive",
            onPress: async () => {
              try {
                await apiPost("/storage/delete-files", {
                  paths: newlyUploadedPaths,
                });
              } catch (error) {
                console.error("Failed to delete orphaned files:", error);
              }
              navigation.dispatch(e.data.action);
            },
          },
        ]
      );
    };

    navigation.addListener("beforeRemove", handleBeforeRemove);

    return () => {
      navigation.removeListener("beforeRemove", handleBeforeRemove);
    };
  }, [navigation, newlyUploadedPaths, saving]);

  const mapAttendanceStatus = (
    val: string
  ): "IN_PERSON" | "ONLINE" | "ABSENT" => {
    switch (val?.toLowerCase()) {
      case "in person":
      case "in-person":
      case "in_person":
        return "IN_PERSON";
      case "online":
        return "ONLINE";
      case "absent":
      default:
        return "ABSENT";
    }
  };

  const submitAttendance = async () => {
    // ✅ FIX: Validate attendees before submission
    console.log("=== Submitting Attendance ===");
    console.log("Attendees count:", attendees.length);
    
    // ✅ FIX: Filter out empty attendees (ones with no name)
    const validAttendees = attendees.filter(a => a.name && a.name.trim());
    
    if (validAttendees.length === 0) {
      Alert.alert("Error", "Please add at least one attendee with a name.");
      return;
    }
    
    console.log("Valid attendees:", validAttendees.length);
    
    const payload = {
      createdById: user?.id || undefined,
      fileName: fileName.trim(),
      title: title?.trim() || undefined,
      description: description?.trim() || undefined,
      // Send date-only (YYYY-MM-DD) without time
      meetingDate: meetingDate ? formatDateOnly(meetingDate) : undefined,
      location: location?.trim() || undefined,
      // ✅ FIX: Only include valid attendees with proper validation
      attendees: validAttendees.map((a) => {
        const attendeeData = {
          name: a.name.trim(),
          agency: a.agency?.trim() || undefined,
          office: a.agency?.trim() || undefined,
          position: a.position?.trim() || undefined,
          signatureUrl:
            (a as any).signaturePath?.trim() ||
            a.signatureUrl?.trim() ||
            undefined,
          photoUrl:
            (a as any).photoPath?.trim() || a.photoUrl?.trim() || undefined,
          attendanceStatus: mapAttendanceStatus(a.attendance),
        };
        
        console.log(`  - Attendee: ${attendeeData.name} (${attendeeData.attendanceStatus})`);
        return attendeeData;
      }),
    };

    console.log("Payload prepared with", payload.attendees.length, "attendees");

    try {
      if (isEditMode && attendanceId) {
        // Update existing record
        await apiPatch(`/attendance/${attendanceId}`, payload);
        setNewlyUploadedPaths([]);
        console.log("✅ Attendance record updated");
        Alert.alert("Success", "Attendance record updated!", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } else {
        // Create new record
        const res = await apiPost<{ id: string }>("/attendance", payload);
        setNewlyUploadedPaths([]);
        console.log("✅ Attendance record created:", res.id);
        Alert.alert("Success", "Attendance record saved!", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      console.error("❌ Failed to submit attendance:", error);
      throw error; // Re-throw to be caught by handleSave
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <CustomHeader showSave={false} />
        <View
          style={[
            styles.scrollContent,
            { justifyContent: "center", alignItems: "center" },
          ]}
        >
          <ActivityIndicator size="large" color={theme.colors.primaryDark} />
          <Text style={[styles.headerSubtitle, { marginTop: 16 }]}>
            Loading attendance record...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      <CustomHeader
        showSave={true}
        showFileName={true}
        fileName={fileName}
        onChangeFileName={setFileName}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: scrollPaddingBottom },
        ]}
        scrollEnabled={!isSigning}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {isEditMode ? "Edit Attendance Record" : "Create Attendance Record"}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isEditMode
              ? "Update attendance details below."
              : "Fill out attendance details below."}
          </Text>
        </View>

        {/* File Name */}
        <View style={styles.topInputsContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>File Name</Text>
            <TextInput
              placeholder="Enter file name"
              value={fileName}
              onChangeText={handleSetFileName}
              style={[
                styles.input,
                fileName && styles.inputFilled,
                errors.fileName && styles.inputError,
              ]}
              placeholderTextColor="#C0C0C0"
            />
            {errors.fileName && (
              <Text style={styles.errorText}>File Name is required</Text>
            )}
          </View>

          {/* Title (optional) */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Title (optional)</Text>
            <TextInput
              placeholder="Enter meeting title"
              value={title}
              onChangeText={setTitle}
              style={[styles.input, title && styles.inputFilled]}
              placeholderTextColor="#C0C0C0"
            />
          </View>

          {/* Description (optional) */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description (optional)</Text>
            <TextInput
              placeholder="Enter description"
              value={description}
              onChangeText={setDescription}
              style={[styles.input, description && styles.inputFilled]}
              placeholderTextColor="#C0C0C0"
              multiline
            />
          </View>

          {/* Meeting Date (optional) */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Meeting Date (optional)</Text>
            <TouchableOpacity
              onPress={() => setDatePickerVisibility(true)}
              style={[
                styles.input,
                meetingDate && styles.inputFilled,
                { justifyContent: "center" },
              ]}
              activeOpacity={0.8}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text
                  style={[
                    styles.inputText,
                    { color: meetingDate ? theme.colors.text : "#C0C0C0" },
                  ]}
                >
                  {meetingDate
                    ? meetingDate.toLocaleDateString()
                    : "Select date"}
                </Text>
                <Feather
                  name="calendar"
                  size={18}
                  color={theme.colors.primaryDark}
                />
              </View>
            </TouchableOpacity>
            <DateTimePickerModal
              isVisible={isDatePickerVisible}
              mode="date"
              date={meetingDate ?? new Date()}
              onConfirm={handleConfirmDate}
              onCancel={() => setDatePickerVisibility(false)}
              display={Platform.OS === "ios" ? "spinner" : "default"}
              textColor={Platform.OS === "ios" ? "#000000" : undefined}
              pickerContainerStyleIOS={{
                backgroundColor: "#FFFFFF",
              }}
              modalStyleIOS={{
                backgroundColor: "rgba(0, 0, 0, 0.5)",
              }}
            />
          </View>

          {/* Location (optional) */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Location (optional)</Text>
            <TextInput
              placeholder="Enter location"
              value={location}
              onChangeText={setLocation}
              style={[styles.input, location && styles.inputFilled]}
              placeholderTextColor="#C0C0C0"
            />
            <TouchableOpacity
              onPress={useCurrentLocation}
              disabled={isFetchingLocation}
              style={{
                marginTop: 8,
                alignSelf: "flex-start",
                flexDirection: "row",
                alignItems: "center",
              }}
              activeOpacity={0.8}
            >
              <Feather
                name="navigation"
                size={16}
                color={theme.colors.primaryDark}
              />
              <Text style={{ marginLeft: 6, color: theme.colors.primaryDark }}>
                {isFetchingLocation
                  ? "Getting current location..."
                  : "Use current location"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Attendees Section */}
        <View style={styles.section}>
          {attendees.map((attendee, index) => (
            <View key={attendee.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.sectionTitle}>Attendee {index + 1}</Text>
                {attendees.length > 1 && (
                  <TouchableOpacity
                    onPress={() => removeAttendee(attendee.id)}
                    style={styles.removeIconButton}
                  >
                    <Feather
                      name="trash-2"
                      size={16}
                      color={theme.colors.error}
                    />
                  </TouchableOpacity>
                )}
              </View>

              {/* Name */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  placeholder="Enter full name"
                  value={attendee.name}
                  onChangeText={(val) => updateField(attendee.id, "name", val)}
                  style={[
                    styles.input,
                    attendee.name && styles.inputFilled,
                    errors.attendees?.[attendee.id]?.name && styles.inputError,
                  ]}
                  placeholderTextColor="#C0C0C0"
                />
                {errors.attendees?.[attendee.id]?.name && (
                  <Text style={styles.errorText}>Name is required</Text>
                )}
              </View>

              {/* Agency */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Agency / Office</Text>
                <TextInput
                  placeholder="Enter agency or office"
                  value={attendee.agency}
                  onChangeText={(val) =>
                    updateField(attendee.id, "agency", val)
                  }
                  style={[
                    styles.input,
                    attendee.agency && styles.inputFilled,
                    errors.attendees?.[attendee.id]?.agency &&
                      styles.inputError,
                  ]}
                  placeholderTextColor="#C0C0C0"
                />
                {errors.attendees?.[attendee.id]?.agency && (
                  <Text style={styles.errorText}>
                    Agency/Office is required
                  </Text>
                )}
              </View>

              {/* Position */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Position</Text>
                <TextInput
                  placeholder="Enter position"
                  value={attendee.position}
                  onChangeText={(val) =>
                    updateField(attendee.id, "position", val)
                  }
                  style={[
                    styles.input,
                    attendee.position && styles.inputFilled,
                    errors.attendees?.[attendee.id]?.position &&
                      styles.inputError,
                  ]}
                  placeholderTextColor="#C0C0C0"
                />
                {errors.attendees?.[attendee.id]?.position && (
                  <Text style={styles.errorText}>Position is required</Text>
                )}
              </View>

              {/* Meeting Attendance */}
              <View style={styles.inputContainer}>
                <Text
                  style={[
                    styles.label,
                    errors.attendees?.[attendee.id]?.attendance &&
                      styles.labelError,
                  ]}
                >
                  Meeting Attendance
                </Text>
                <View style={styles.radioGroup}>
                  {["In Person", "Online", "Absent"].map((type, index, arr) => (
                    <RadioButton
                      key={type}
                      label={type}
                      value={type}
                      selectedValue={attendee.attendance}
                      onSelect={(val: string) =>
                        updateField(attendee.id, "attendance", val)
                      }
                      hasError={errors.attendees?.[attendee.id]?.attendance}
                      containerStyle={
                        index === arr.length - 1 ? { marginRight: 0 } : {}
                      }
                    />
                  ))}
                </View>
                {errors.attendees?.[attendee.id]?.attendance && (
                  <Text style={styles.errorText}>
                    Please select an attendance type
                  </Text>
                )}
              </View>

              {/* Signature - Hidden when Absent */}
              {attendee.attendance.toLowerCase() !== "absent" && (
                <View style={styles.inputContainer}>
                  <Text
                    style={[
                      styles.label,
                      errors.attendees?.[attendee.id]?.signatureUrl &&
                        styles.labelError,
                    ]}
                  >
                    Signature
                  </Text>
                  {attendee.signatureUrl ? (
                    <View style={styles.signaturePreviewContainer}>
                      <Image
                        source={{ uri: attendee.signatureUrl }}
                        style={styles.signaturePreview}
                        resizeMode="contain"
                      />
                      <TouchableOpacity
                        style={styles.removeSignatureButton}
                        onPress={() => handleRemoveSignature(attendee.id)}
                      >
                        <Feather
                          name="x"
                          size={16}
                          color={theme.colors.error}
                        />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View
                      style={{
                        flexDirection: "column",
                        alignItems: "flex-start",
                      }}
                    >
                      <TouchableOpacity
                        style={[styles.addSignatureButton, { width: "100%" }]}
                        onPress={() => handleAddSignature(attendee.id)}
                      >
                        <Feather
                          name="edit-3"
                          size={18}
                          color={theme.colors.primaryDark}
                        />
                        <Text style={styles.addSignatureText}>
                          Add Signature
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.addSignatureButton,
                          { marginTop: 10, width: "100%" },
                        ]}
                        onPress={() => handleUploadSignature(attendee.id)}
                        disabled={uploadingSignature}
                      >
                        {uploadingSignature &&
                        currentAttendeeId === attendee.id ? (
                          <ActivityIndicator
                            size="small"
                            color={theme.colors.primaryDark}
                          />
                        ) : (
                          <Feather
                            name="upload"
                            size={18}
                            color={theme.colors.primaryDark}
                          />
                        )}
                        <Text style={styles.addSignatureText}>
                          Upload Signature
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {errors.attendees?.[attendee.id]?.signatureUrl && (
                    <Text style={styles.errorText}>Signature is required</Text>
                  )}
                </View>
              )}

              {/* Attendance Photo - Hidden when Absent */}
              {attendee.attendance.toLowerCase() !== "absent" && (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Attendance Photo (optional)</Text>
                  {attendee.photoUrl ? (
                    <View style={styles.signaturePreviewContainer}>
                      <Image
                        source={{ uri: attendee.photoUrl }}
                        style={styles.signaturePreview}
                        resizeMode="cover"
                      />
                      <TouchableOpacity
                        style={styles.removeSignatureButton}
                        onPress={() => handleRemovePhoto(attendee.id)}
                      >
                        <Feather
                          name="x"
                          size={16}
                          color={theme.colors.error}
                        />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View
                      style={{
                        flexDirection: "column",
                        alignItems: "flex-start",
                      }}
                    >
                      <TouchableOpacity
                        style={[styles.addSignatureButton, { width: "100%" }]}
                        onPress={() => handleTakePhoto(attendee.id)}
                        disabled={uploadingPhoto}
                      >
                        {uploadingPhoto && currentAttendeeId === attendee.id ? (
                          <ActivityIndicator
                            size="small"
                            color={theme.colors.primaryDark}
                          />
                        ) : (
                          <Feather
                            name="camera"
                            size={18}
                            color={theme.colors.primaryDark}
                          />
                        )}
                        <Text style={styles.addSignatureText}>Take Photo</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.addSignatureButton,
                          { marginTop: 10, width: "100%" },
                        ]}
                        onPress={() => handleUploadPhoto(attendee.id)}
                        disabled={uploadingPhoto}
                      >
                        {uploadingPhoto && currentAttendeeId === attendee.id ? (
                          <ActivityIndicator
                            size="small"
                            color={theme.colors.primaryDark}
                          />
                        ) : (
                          <Feather
                            name="upload"
                            size={18}
                            color={theme.colors.primaryDark}
                          />
                        )}
                        <Text style={styles.addSignatureText}>
                          Upload Photo
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Add Person Button */}
        <View
          style={[
            styles.bottomButtonsContainer,
            { paddingBottom: footerPaddingBottom },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={addAttendee}
            style={styles.actionButtonWrapper}
          >
            <Animated.View
              style={[
                styles.actionButton,
                { transform: [{ scale: scaleAnim }] },
              ]}
            >
              <Feather name="plus" size={20} color={theme.colors.primaryDark} />
              <Text style={styles.actionButtonText}>Add Person</Text>
            </Animated.View>
          </TouchableOpacity>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, saving ? { opacity: 0.7 } : undefined]}
            onPress={handleSave}
            disabled={saving}
          >
            <Feather name="save" size={20} color="#fff" />
            <Text style={styles.saveButtonText}>
              {saving ? "Saving…" : "Save Attendance"}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Signature Modal */}
      <Modal
        visible={signatureModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setSignatureModalVisible(false)}
      >
        <SafeAreaView style={styles.signatureModalContainer}>
          <View style={styles.signatureModalHeader}>
            <Text style={styles.signatureModalTitle}>Add Signature</Text>
            <TouchableOpacity onPress={() => setSignatureModalVisible(false)}>
              <Feather name="x" size={24} color={theme.colors.primaryDark} />
            </TouchableOpacity>
          </View>

          {/* Canvas */}
          <View style={styles.signatureCanvasContainer}>
            <SignatureScreenAny
              ref={signatureCanvasRef}
              onOK={handleSignatureOK}
              /* don't auto-read on stroke end; user will press Save to upload */
              webStyle={`.m-signature-pad--body {
                box-shadow: none;
                border: 1px solid #ccc;
                border-radius: 8px;
              }
              .m-signature-pad {
                box-shadow: none;
                border: none;
              }
              /* hide the built-in footer buttons because we provide our own */
              .m-signature-pad--footer { display: none !important; }
              `}
              backgroundColor="rgba(255, 255, 255, 0)"
              penColor="#000000"
              descriptionText=""
              clearText="Clear"
              confirmText="Save"
            />
          </View>

          {/* --- NEW CLEAR BUTTON --- */}
          <View style={styles.clearButtonContainer}>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleSignatureClear}
            >
              <Feather
                name="trash-2"
                size={18}
                color={theme.colors.primaryDark}
              />
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>

          {/* Footer with only Cancel and Save */}
          <View
            style={[
              styles.signatureModalFooter,
              { paddingBottom: footerPaddingBottom },
            ]}
          >
            <View style={styles.signatureModalButtons}>
              <TouchableOpacity
                style={[
                  styles.signatureModalButton,
                  styles.signatureModalCancelButton,
                ]}
                onPress={() => setSignatureModalVisible(false)}
                disabled={uploadingSignature}
              >
                <Text style={styles.signatureModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.signatureModalButton,
                  styles.signatureModalSaveButton,
                ]}
                onPress={handleSignatureSave}
                disabled={uploadingSignature}
              >
                {uploadingSignature ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text
                    style={[
                      styles.signatureModalButtonText,
                      styles.signatureModalSaveText,
                    ]}
                  >
                    Save
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
        <View style={{ height: 40 }} />
      </Modal>
    </SafeAreaView>
  );
}
