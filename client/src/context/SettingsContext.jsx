import { createContext, useState, useContext, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";
import { settingsService } from "@/services/api";
const THEME_STYLE_ID = "global-theme-custom-css";
const defaultThemeSettings = {
  primaryColor: "#2563eb",
  secondaryColor: "#4f46e5",
  colorScheme: "light",
  customCSS: "",
};

const SettingsContext = createContext();

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const adjustHexColor = (hex, delta) => {
  const normalized = hex.replace("#", "");
  const sixDigitHex =
    normalized.length === 3
      ? normalized
          .split("")
          .map((ch) => ch + ch)
          .join("")
      : normalized;

  if (!/^[0-9a-fA-F]{6}$/.test(sixDigitHex)) {
    return hex;
  }

  const rgb = [0, 2, 4].map((index) =>
    parseInt(sixDigitHex.slice(index, index + 2), 16),
  );
  const updated = rgb
    .map((value) => clamp(value + delta, 0, 255))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");

  return `#${updated}`;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const { isAdmin } = useAuth();
  const [settings, setSettings] = useState(null);
  const [publicSettings, setPublicSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(defaultThemeSettings);
  const [featureToggles, setFeatureToggles] = useState({});

  const applyTheme = useCallback((themeSettings = defaultThemeSettings) => {
    if (!themeSettings) return;

    const resolvedTheme = { ...defaultThemeSettings, ...themeSettings };
    const activeTheme = { ...resolvedTheme, colorScheme: "light" };
    const root = document.documentElement;

    root.style.setProperty("--color-primary-500", adjustHexColor(activeTheme.primaryColor, 16));
    root.style.setProperty("--color-primary-600", activeTheme.primaryColor);
    root.style.setProperty("--color-primary-700", adjustHexColor(activeTheme.primaryColor, -16));
    root.style.setProperty("--color-secondary-500", adjustHexColor(activeTheme.secondaryColor, 16));
    root.style.setProperty("--color-secondary-600", activeTheme.secondaryColor);
    root.style.setProperty("--color-secondary-700", adjustHexColor(activeTheme.secondaryColor, -16));

    root.classList.remove("dark");
    root.style.setProperty("--color-background", "#f9fafb");
    root.style.setProperty("--color-surface", "#ffffff");
    root.style.setProperty("--color-border", "#e5e7eb");
    root.style.setProperty("--color-foreground", "#111827");

    const previousStyleTag = document.getElementById(THEME_STYLE_ID);
    if (previousStyleTag) {
      previousStyleTag.remove();
    }

    if (activeTheme.customCSS?.trim()) {
      const styleTag = document.createElement("style");
      styleTag.id = THEME_STYLE_ID;
      styleTag.textContent = activeTheme.customCSS;
      document.head.appendChild(styleTag);
    }

    setTheme(activeTheme);
  }, []);

  const fetchPublicSettings = useCallback(async () => {
    const response = await settingsService.getPublicSettings();
    const publicData = response?.data || {};
    const nextTheme = publicData.themeSettings || defaultThemeSettings;

    setPublicSettings(publicData);
    setFeatureToggles(publicData.featureToggles || {});
    applyTheme(nextTheme);
  }, [applyTheme]);

  const fetchSettings = useCallback(async () => {
    try {
      await fetchPublicSettings();

      if (isAdmin) {
        const response = await settingsService.getSettings();
        setSettings(response.data);
      } else {
        setSettings(null);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  }, [fetchPublicSettings, isAdmin]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (settings?.themeSettings) {
      applyTheme(settings.themeSettings);
    }
  }, [applyTheme, settings]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      fetchPublicSettings().catch(() => null);
    }, 60000);

    const onVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        fetchPublicSettings().catch(() => null);
      }
    };

    window.addEventListener("focus", onVisibilityOrFocus);
    document.addEventListener("visibilitychange", onVisibilityOrFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onVisibilityOrFocus);
      document.removeEventListener("visibilitychange", onVisibilityOrFocus);
    };
  }, [fetchPublicSettings]);

  const updateSettings = async (updates) => {
    try {
      const response = await settingsService.updateSettings(updates);
      const updatedSettings = response.data;
      setSettings(updatedSettings);

      if (updatedSettings?.themeSettings) {
        applyTheme(updatedSettings.themeSettings);
      }

      if (updatedSettings?.featureToggles) {
        setFeatureToggles(updatedSettings.featureToggles);
      }

      setPublicSettings((prev) => ({
        ...(prev || {}),
        company: updatedSettings.company,
        themeSettings: updatedSettings.themeSettings,
        featureToggles: updatedSettings.featureToggles,
        version: updatedSettings.version,
        updatedAt: updatedSettings.updatedAt,
      }));

      toast.success("Settings updated successfully");
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update settings");
      throw error;
    }
  };

  const resetSection = async (section) => {
    try {
      await settingsService.resetSettings(section);
      toast.success(`${section} reset to defaults`);
      await fetchSettings();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reset settings");
    }
  };

  const value = {
    settings,
    publicSettings,
    theme,
    featureToggles,
    loading,
    updateSettings,
    resetSection,
    fetchSettings,
    fetchPublicSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
