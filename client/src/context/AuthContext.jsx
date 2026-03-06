/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext, useEffect } from 'react';
import toast from 'react-hot-toast';
import { authService } from "@/services/api";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await authService.getMe();
        setUser(response);
      } catch (error) {
        console.error('Error fetching user:', error.response || error);

        if (error.response?.status === 500) {
          toast.error('Server error. Please try again later.');
        }
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = async (email, password, options = {}) => {
    try {
      const response = await authService.login({
        email,
        password,
        takeoverExistingSession: Boolean(options.takeoverExistingSession),
        twoFactorCode: options.twoFactorCode,
      });
      if (response?.requiresTwoFactor) {
        return {
          success: false,
          requiresTwoFactor: true,
          message: response.message,
          deviceName: response.deviceName,
          isNewDevice: response.isNewDevice,
        };
      }
      const userData = response;
      setUser(userData);
      
      if (userData.forcePasswordChange) {
        toast.success('Login successful. Please change your password.');
      } else {
        toast.success('Login successful!');
      }
      return { success: true, forcePasswordChange: !!userData.forcePasswordChange };
    } catch (error) {
      console.error('Login error:', error.response || error);
      if (error.response?.status === 409 && error.response?.data?.code === "ACTIVE_SESSION_EXISTS") {
        return {
          success: false,
          forcePasswordChange: false,
          requiresTakeover: true,
          activeSession: error.response?.data?.activeSession || null,
          message: error.response?.data?.message || "Active session exists",
        };
      }
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, forcePasswordChange: false };
    }
  };

  const updateTwoFactor = async (enabled) => {
    const response = await authService.updateTwoFactor(enabled);
    setUser((prev) => (prev ? { ...prev, twoFactorEnabled: !!enabled } : prev));
    return response;
  };

  const logout = async () => {
    try {
      await authService.logoutSession();
    } catch (error) {
      // Ignore network/logout race errors and clear local session anyway.
    }
    setUser(null);
    toast.success('Logged out successfully');
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
    updateTwoFactor,
    isSuperAdmin: user?.role === 'super_admin',
    isManager: ['manager', 'admin', 'super_admin'].includes(user?.role),
    isAdmin: ['admin', 'super_admin'].includes(user?.role)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
