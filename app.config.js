try {
  require("dotenv").config();
} catch {}

export default {
  expo: {
    name: "MineComply",
    slug: "minecomplyapp",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      permissions: [
        "WRITE_EXTERNAL_STORAGE",
        "READ_EXTERNAL_STORAGE",
        "CAMERA",
        "RECORD_AUDIO",
      ],
    },
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSCameraUsageDescription:
          "This app needs access to camera to upload photos.",
        NSMicrophoneUsageDescription:
          "This app needs access to microphone for video recording.",
        NSPhotoLibraryUsageDescription:
          "This app needs access to photo library to upload images.",
      },
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: ["expo-font"],
    extra: {
      supabaseUrl:
        process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
      supabaseAnonKey:
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.SUPABASE_ANON_KEY,
      apiBaseUrl:
        process.env.EXPO_PUBLIC_API_BASE_URL ??
        process.env.API_BASE_URL ??
        null,
    },
  },
};
