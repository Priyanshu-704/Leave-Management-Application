/* eslint-disable react-refresh/only-export-components */
/* eslint-disable no-unused-vars */
import {
  createContext,
  useState,
  useContext,
  useEffect,
  useRef,
  useCallback,
} from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "./AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const AttendanceContext = createContext();

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error("useAttendance must be used within an AttendanceProvider");
  }
  return context;
};

export const AttendanceProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [sessionStartTime, setSessionStartTime] = useState(null);

  // Refs to track if data has been fetched
  const hasFetchedToday = useRef(false);
  const fetchInProgress = useRef(false);
  const todayFetchTimeout = useRef(null);

  // Debounced fetch function
  const fetchTodayAttendance = useCallback(
    async (force = false) => {
      // Prevent multiple simultaneous calls
      if (fetchInProgress.current) {
        console.log("Fetch already in progress, skipping...");
        return;
      }

      // If already fetched and not forced, skip
      if (hasFetchedToday.current && !force) {
        console.log("Already fetched today, skipping...");
        return;
      }

      if (!isAuthenticated || !user) {
        console.log("Not authenticated, skipping fetch");
        return;
      }

      // Clear any pending timeout
      if (todayFetchTimeout.current) {
        clearTimeout(todayFetchTimeout.current);
      }

      fetchInProgress.current = true;

      try {
        console.log("Fetching today attendance...");
        const response = await axios.get(`${API_URL}/attendance/today`);
        const attendance = response.data.data;
        setTodayAttendance(attendance);

        if (attendance) {
          saveSessionToLocalStorage(attendance);
          if (attendance.checkIn?.time && !attendance.checkOut?.time) {
            setSessionStartTime(attendance.checkIn.time);
          }
        }

        hasFetchedToday.current = true;
      } catch (error) {
        console.error("Error fetching today attendance:", error);
        if (error.response?.status !== 404) {
          toast.error("Failed to fetch attendance data");
        }
      } finally {
        fetchInProgress.current = false;
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [isAuthenticated, user],
  );

  // Load session from localStorage on mount - only once
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const loadSession = async () => {
      const savedSession = localStorage.getItem(`attendance_${user._id}`);
      if (savedSession) {
        try {
          const sessionData = JSON.parse(savedSession);
          const today = new Date().toDateString();

          // Check if saved session is from today
          if (
            sessionData.date === today &&
            sessionData.isCheckedIn &&
            !sessionData.isCheckedOut
          ) {
            setSessionStartTime(sessionData.startTime);
          }
        } catch (error) {
          console.error("Error parsing saved session:", error);
        }
      }

      // Fetch from backend with a small delay to ensure session is loaded
      todayFetchTimeout.current = setTimeout(() => {
        fetchTodayAttendance(true);
      }, 100);
    };

    loadSession();

    return () => {
      if (todayFetchTimeout.current) {
        clearTimeout(todayFetchTimeout.current);
      }
    };
  }, [isAuthenticated, user, fetchTodayAttendance]);

  // Reset fetch flag when user changes
  useEffect(() => {
    hasFetchedToday.current = false;
    fetchInProgress.current = false;
  }, [user?._id]);

  const saveSessionToLocalStorage = (attendance) => {
    if (!user) return;

    const sessionData = {
      date: new Date().toDateString(),
      isCheckedIn: !!attendance?.checkIn?.time,
      isCheckedOut: !!attendance?.checkOut?.time,
      startTime: attendance?.checkIn?.time,
      attendanceId: attendance?._id,
    };

    localStorage.setItem(`attendance_${user._id}`, JSON.stringify(sessionData));
  };

  const checkIn = async (data = {}) => {
    setLoading(true);
    try {
      const requestData = { ...data };

      // Get user location if available
      if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
              maximumAge: 0,
              enableHighAccuracy: true,
            });
          });

          if (position && position.coords) {
            requestData.location = {
              coordinates: [
                position.coords.longitude,
                position.coords.latitude,
              ],
              address: "",
            };
          }
        } catch (locationError) {
          console.log("Location access denied or unavailable");
        }
      }

      const response = await axios.post(
        `${API_URL}/attendance/checkin`,
        requestData,
      );
      setTodayAttendance(response.data.data);
      saveSessionToLocalStorage(response.data.data);

      if (response.data.data.checkIn?.time) {
        setSessionStartTime(response.data.data.checkIn.time);
      }

      // Reset fetch flag so next fetch will get fresh data
      hasFetchedToday.current = true;

      toast.success("Check-in successful!");
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || "Check-in failed";
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const checkOut = async (data = {}) => {
    setLoading(true);
    try {
      const requestData = { ...data };

      // Get user location if available
      if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
              maximumAge: 0,
              enableHighAccuracy: true,
            });
          });

          if (position && position.coords) {
            requestData.location = {
              coordinates: [
                position.coords.longitude,
                position.coords.latitude,
              ],
              address: "",
            };
          }
        } catch (locationError) {
          console.log("Location access denied or unavailable");
        }
      }

      const response = await axios.put(
        `${API_URL}/attendance/checkout`,
        requestData,
      );
      setTodayAttendance(response.data.data);
      saveSessionToLocalStorage(response.data.data);
      setSessionStartTime(null);

      toast.success("Check-out successful!");
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || "Check-out failed";
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const startBreak = async (type = "other") => {
    try {
      const response = await axios.post(`${API_URL}/attendance/break`, {
        type,
      });
      setTodayAttendance(response.data.data);
      saveSessionToLocalStorage(response.data.data);
      toast.success("Break started");
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || "Failed to start break";
      toast.error(message);
      throw error;
    }
  };

  const endBreak = async () => {
    try {
      const response = await axios.put(`${API_URL}/attendance/break/end`);
      setTodayAttendance(response.data.data);
      saveSessionToLocalStorage(response.data.data);
      toast.success("Break ended");
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || "Failed to end break";
      toast.error(message);
      throw error;
    }
  };

  const refreshAttendance = useCallback(() => {
    hasFetchedToday.current = false;
    fetchTodayAttendance(true);
  }, [fetchTodayAttendance]);

  const value = {
    todayAttendance,
    loading,
    stats,
    sessionStartTime,
    checkIn,
    checkOut,
    startBreak,
    endBreak,
    fetchTodayAttendance,
    refreshAttendance,
    isCheckedIn: !!todayAttendance?.checkIn?.time,
    isCheckedOut: !!todayAttendance?.checkOut?.time,
    isOnBreak: todayAttendance?.breaks?.some((b) => !b.endTime) || false,
  };

  return (
    <AttendanceContext.Provider value={value}>
      {children}
    </AttendanceContext.Provider>
  );
};
