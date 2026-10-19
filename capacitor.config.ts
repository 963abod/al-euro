import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.eurocars.app",
  appName: "EURO",
  webDir: "public",
  server: {
    // The app loads the deployed web frontend; Supabase data remains shared.
    url: "https://al-euro-cdzo.onrender.com",
    cleartext: false,
    androidScheme: "https",
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
