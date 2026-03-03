import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FaUserCircle,
  FaEdit,
  FaSave,
  FaTimes,
  FaCamera,
  FaEnvelope,
  FaIdCard,
  FaBuilding,
  FaUserTag,
  FaCalendarAlt,
  FaPhone,
  FaMapMarkerAlt,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaHistory,
  FaFileAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaClock
} from 'react-icons/fa';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import instance from '../services/axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Profile = () => {
  const { user,  } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    bio: '',
    department: '',
    employeeId: '',
    role: '',
    joinDate: '',
    leaveBalance: {
      annual: 0,
      sick: 0,
      personal: 0
    }
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [stats, setStats] = useState({
    totalLeaves: 0,
    pendingLeaves: 0,
    approvedLeaves: 0,
    rejectedLeaves: 0
  });

  useEffect(() => {
    if (user) {
      fetchProfileDetails();
      fetchRecentActivities();
      fetchLeaveStats();
    }
  }, [user]);

  const fetchProfileDetails = async () => {
    try {
      const response = await instance.get('/users/profile');
      const userData = response.data;
      setProfileData({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        address: userData.address || '',
        bio: userData.bio || '',
        department: userData.department || '',
        employeeId: userData.employeeId || '',
        role: userData.role || '',
        joinDate: userData.createdAt || '',
        leaveBalance: userData.leaveBalance || {
          annual: 0,
          sick: 0,
          personal: 0
        }
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const response = await instance.get('/leaves/my-leaves?limit=5');
      setRecentActivities(response.data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const fetchLeaveStats = async () => {
    try {
      const response = await instance.get('/leaves/summary');
      const data = response.data;
      setStats({
        totalLeaves: (data.used?.annual || 0) + (data.used?.sick || 0) + (data.used?.personal || 0),
        pendingLeaves: 0, // You'll need to calculate this from leaves
        approvedLeaves: (data.used?.annual || 0) + (data.used?.sick || 0) + (data.used?.personal || 0),
        rejectedLeaves: 0
      });
    } catch (error) {
      console.error('Error fetching leave stats:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword({ ...showPassword, [field]: !showPassword[field] });
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await instance.put('/users/profile', {
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        address: profileData.address,
        bio: profileData.bio
      });
      toast.success('Profile updated successfully');
      setEditMode(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await instance.put('/users/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      toast.success('Password changed successfully');
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profilePicture', file);

    try {
      await instance.post('/users/profile/picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Profile picture updated');
      fetchProfileDetails();
    } catch (error) {
      toast.error(error, 'Failed to upload picture');
    }
  };

  const getRoleBadgeColor = (role) => {
    switch(role) {
      case 'admin': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'manager': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'approved': return <FaCheckCircle className="text-green-500" />;
      case 'rejected': return <FaTimesCircle className="text-red-500" />;
      case 'pending': return <FaClock className="text-yellow-500" />;
      default: return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg p-8 text-white relative">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-6">
            {/* Profile Picture */}
            <div className="relative">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-4xl text-primary-600 border-4 border-white shadow-lg">
                {user?.name?.charAt(0).toUpperCase() || <FaUserCircle />}
              </div>
              <label
                htmlFor="profile-picture"
                className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-100"
              >
                <FaCamera className="text-primary-600 text-sm" />
                <input
                  type="file"
                  id="profile-picture"
                  className="hidden"
                  accept="image/*"
                  onChange={handleProfilePictureUpload}
                />
              </label>
            </div>

            {/* Basic Info */}
            <div>
              <h1 className="text-3xl font-bold">{profileData.name || user?.name}</h1>
              <p className="text-white/80 flex items-center mt-1">
                <FaEnvelope className="mr-2" />
                {profileData.email || user?.email}
              </p>
              <div className="flex items-center space-x-3 mt-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(profileData.role || user?.role)}`}>
                  {profileData.role || user?.role}
                </span>
                <span className="bg-white/20 px-3 py-1 rounded-full text-xs">
                  ID: {profileData.employeeId || user?.employeeId}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            {!editMode ? (
              <button
                onClick={() => setEditMode(true)}
                className="bg-white text-primary-600 px-4 py-2 rounded-lg hover:bg-gray-100 flex items-center space-x-2"
              >
                <FaEdit />
                <span>Edit Profile</span>
              </button>
            ) : (
              <button
                onClick={() => setEditMode(false)}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 flex items-center space-x-2"
              >
                <FaTimes />
                <span>Cancel</span>
              </button>
            )}
            <button
              onClick={() => setShowPasswordModal(true)}
              className="bg-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/30 flex items-center space-x-2"
            >
              <FaLock />
              <span>Change Password</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm">Leave Balance</p>
              <p className="text-2xl font-bold text-blue-700">
                {profileData.leaveBalance?.annual || 0} days
              </p>
            </div>
            <FaCalendarAlt className="text-blue-500 text-3xl" />
          </div>
        </div>

        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm">Taken Leaves</p>
              <p className="text-2xl font-bold text-green-700">
                {stats.totalLeaves} days
              </p>
            </div>
            <FaCheckCircle className="text-green-500 text-3xl" />
          </div>
        </div>

        <div className="card bg-yellow-50 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 text-sm">Pending</p>
              <p className="text-2xl font-bold text-yellow-700">
                {recentActivities.filter(a => a.status === 'pending').length}
              </p>
            </div>
            <FaClock className="text-yellow-500 text-3xl" />
          </div>
        </div>

        <div className="card bg-purple-50 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm">Member Since</p>
              <p className="text-2xl font-bold text-purple-700">
                {profileData.joinDate ? format(new Date(profileData.joinDate), 'MMM yyyy') : 'N/A'}
              </p>
            </div>
            <FaHistory className="text-purple-500 text-3xl" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-6">
        {/* Profile Details */}
        <div className="col-span-2">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Profile Information</h2>
            
            {editMode ? (
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={profileData.name}
                      onChange={handleInputChange}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={profileData.email}
                      onChange={handleInputChange}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                  <div>
                    <label className="form-label">Address</label>
                    <input
                      type="text"
                      name="address"
                      value={profileData.address}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="Your address"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="form-label">Bio</label>
                    <textarea
                      name="bio"
                      value={profileData.bio}
                      onChange={handleInputChange}
                      rows="3"
                      className="input-field"
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setEditMode(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <FaSave />
                    <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <FaIdCard className="text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Employee ID</p>
                      <p className="font-medium">{profileData.employeeId}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <FaBuilding className="text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Department</p>
                      <p className="font-medium">{profileData.department}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <FaUserTag className="text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Role</p>
                      <p className="font-medium capitalize">{profileData.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <FaCalendarAlt className="text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Join Date</p>
                      <p className="font-medium">
                        {profileData.joinDate ? format(new Date(profileData.joinDate), 'MMMM dd, yyyy') : 'N/A'}
                      </p>
                    </div>
                  </div>
                  {profileData.phone && (
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <FaPhone className="text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Phone</p>
                        <p className="font-medium">{profileData.phone}</p>
                      </div>
                    </div>
                  )}
                  {profileData.address && (
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg col-span-2">
                      <FaMapMarkerAlt className="text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Address</p>
                        <p className="font-medium">{profileData.address}</p>
                      </div>
                    </div>
                  )}
                  {profileData.bio && (
                    <div className="col-span-2 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Bio</p>
                      <p className="text-sm">{profileData.bio}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="card mt-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <FaHistory className="mr-2 text-primary-600" />
              Recent Activity
            </h2>
            <div className="space-y-3">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity) => (
                  <div key={activity._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(activity.status)}
                      <div>
                        <p className="font-medium capitalize">{activity.leaveType} Leave</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(activity.startDate), 'MMM dd')} - {format(new Date(activity.endDate), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        activity.status === 'approved' ? 'bg-green-100 text-green-700' :
                        activity.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {activity.status}
                      </span>
                      <p className="text-xs text-gray-400 mt-1">
                        {format(new Date(activity.appliedOn), 'MMM dd')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">No recent activity</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Leave Balance & Quick Actions */}
        <div className="space-y-6">
          {/* Leave Balance Card */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Leave Balance</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Annual Leave</span>
                  <span className="font-medium">{profileData.leaveBalance?.annual || 0} days</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${Math.min((stats.approvedLeaves / (profileData.leaveBalance?.annual || 1)) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Sick Leave</span>
                  <span className="font-medium">{profileData.leaveBalance?.sick || 0} days</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '0%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Personal Leave</span>
                  <span className="font-medium">{profileData.leaveBalance?.personal || 0} days</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: '0%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <button
                onClick={() => window.location.href = '/apply-leave'}
                className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg flex items-center space-x-3"
              >
                <FaCalendarAlt className="text-primary-600" />
                <span>Apply for Leave</span>
              </button>
              <button
                onClick={() => window.location.href = '/leave-history'}
                className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg flex items-center space-x-3"
              >
                <FaHistory className="text-primary-600" />
                <span>View Leave History</span>
              </button>
              <button
                onClick={() => window.location.href = '/attendance'}
                className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg flex items-center space-x-3"
              >
                <FaClock className="text-primary-600" />
                <span>Attendance</span>
              </button>
            </div>
          </div>

          {/* Account Info */}
          <div className="card bg-gray-50">
            <h2 className="text-lg font-semibold mb-2">Account Information</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Member since:</span>
                <span className="font-medium">
                  {profileData.joinDate ? format(new Date(profileData.joinDate), 'MMM dd, yyyy') : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last updated:</span>
                <span className="font-medium">
                  {profileData.joinDate ? format(new Date(profileData.joinDate), 'MMM dd, yyyy') : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Account status:</span>
                <span className="text-green-600 font-medium">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-lg bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <FaLock className="mr-2 text-primary-600" />
                Change Password
              </h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="form-label">Current Password</label>
                <div className="relative">
                  <input
                    type={showPassword.current ? 'text' : 'password'}
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className="input-field pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('current')}
                    className="absolute right-3 top-3 text-gray-400"
                  >
                    {showPassword.current ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div>
                <label className="form-label">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword.new ? 'text' : 'password'}
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className="input-field pr-10"
                    required
                    minLength="6"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('new')}
                    className="absolute right-3 top-3 text-gray-400"
                  >
                    {showPassword.new ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div>
                <label className="form-label">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showPassword.confirm ? 'text' : 'password'}
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className="input-field pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="absolute right-3 top-3 text-gray-400"
                  >
                    {showPassword.confirm ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;