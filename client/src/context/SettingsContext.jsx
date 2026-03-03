import { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const SettingsContext = createContext();

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
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState({});

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (settings?.themeSettings) {
      applyTheme(settings.themeSettings);
    }
  }, [settings]);

  const fetchSettings = async () => {
    try {
      // Public settings that don't require auth
      const publicResponse = await axios
        .get(`${API_URL}/settings/public`)
        .catch(() => null);
      if (publicResponse?.data) {
        setTheme(publicResponse.data.themeSettings || {});
      }

      // Admin only settings
      if (isAdmin) {
        const response = await axios.get(`${API_URL}/settings`);
        setSettings(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyTheme = (themeSettings) => {
    if (!themeSettings) return;

    // Apply CSS variables
    const root = document.documentElement;
    if (themeSettings.primaryColor) {
      root.style.setProperty("--color-primary", themeSettings.primaryColor);
    }
    if (themeSettings.secondaryColor) {
      root.style.setProperty("--color-secondary", themeSettings.secondaryColor);
    }

    setTheme(themeSettings);
  };

  const updateSettings = async (updates) => {
    try {
      const response = await axios.put(`${API_URL}/settings`, updates);
      setSettings(response.data.data);
      if (updates.themeSettings) {
        applyTheme(updates.themeSettings);
      }
      toast.success("Settings updated successfully");
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update settings");
      throw error;
    }
  };

  const resetSection = async (section) => {
    try {
      await axios.post(`${API_URL}/settings/reset`, { section });
      toast.success(`${section} reset to defaults`);
      fetchSettings();
    } catch (error) {
      toast.error(error, "Failed to reset settings");
    }
  };

  const value = {
    settings,
    theme,
    loading,
    updateSettings,
    resetSection,
    fetchSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
