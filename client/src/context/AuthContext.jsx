/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import instance from '../services/axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Configure axios defaults when token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Fetch user on initial load if token exists
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching user with token:', token); // Debug log
        const response = await instance.get(`${API_URL}/auth/me`);
        console.log('User fetched:', response.data); // Debug log
        setUser(response.data);
      } catch (error) {
        console.error('Error fetching user:', error.response || error);
        
        // If token is invalid, clear it
        if (error.response?.status === 401 || error.response?.status === 500) {
          console.log('Token invalid, clearing...');
          localStorage.removeItem('token');
          setToken(null);
          delete axios.defaults.headers.common['Authorization'];
        }
        
        // Show error message
        if (error.response?.status === 500) {
          toast.error('Server error. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  const login = async (email, password) => {
    try {
      console.log('Attempting login with:', { email }); // Debug log
      
      const response = await axios.post(`${API_URL}/auth/login`, { 
        email, 
        password 
      });
      
      console.log('Login response:', response.data); // Debug log
      
      const { token, ...userData } = response.data;
      
      // Save token
      localStorage.setItem('token', token);
      setToken(token);
      setUser(userData);
      
      // Set axios header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      toast.success('Login successful!');
      return true;
    } catch (error) {
      console.error('Login error:', error.response || error);
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
    toast.success('Logged out successfully');
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
    isManager: user?.role === 'manager' || user?.role === 'admin',
    isAdmin: user?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};