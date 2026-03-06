import { useState, useEffect } from 'react';
import { Button, Input } from "@/components/ui";
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
  FaCheckCircle,
  FaTimesCircle,
  FaClock
} from 'react-icons/fa';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import useBodyScrollLock from '../hooks/useBodyScrollLock';
import { authService, leaveService, supportService, userService } from "@/services/api";
import { contactAdminSchema, mapZodErrors } from "@/lib/validation";
import { getErrorMessage } from "@/lib/error";
import PageErrorState from "@/components/PageErrorState";

const Profile = () => {
  const { user, updateTwoFactor } = useAuth();
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
  useBodyScrollLock(showPasswordModal);
  const [recentActivities, setRecentActivities] = useState([]);
  const [stats, setStats] = useState({
    totalLeaves: 0,
    pendingLeaves: 0,
    approvedLeaves: 0,
    rejectedLeaves: 0
  });
  const [loginHistory, setLoginHistory] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [pageError, setPageError] = useState("");
  const [contactErrors, setContactErrors] = useState({});
  const [contactLoading, setContactLoading] = useState(false);
  const [contactForm, setContactForm] = useState({
    subject: "",
    message: "",
    priority: "normal",
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorSaving, setTwoFactorSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfileDetails();
      fetchRecentActivities();
      fetchLeaveStats();
      fetchLoginHistory();
    }
  }, [user]);

  const fetchProfileDetails = async () => {
    try {
      setPageError("");
      const userData = await userService.getProfile();
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
      setTwoFactorEnabled(!!userData.twoFactorEnabled);
    } catch (error) {
      console.error('Error fetching profile:', error);
      const message = getErrorMessage(error, "Failed to load profile");
      setPageError(message);
      toast.error(message);
    }
  };

  const handleToggleTwoFactor = async () => {
    setTwoFactorSaving(true);
    try {
      const next = !twoFactorEnabled;
      await updateTwoFactor(next);
      setTwoFactorEnabled(next);
      toast.success(`Two-factor authentication ${next ? "enabled" : "disabled"}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update two-factor setting");
    } finally {
      setTwoFactorSaving(false);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const response = await leaveService.getMyLeaves({ limit: 5 });
      setRecentActivities(response || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const fetchLeaveStats = async () => {
    try {
      const data = await leaveService.getSummary();
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

  const fetchLoginHistory = async () => {
    try {
      const response = await authService.getLoginHistory();
      setActiveSessionId(response.activeSessionId || null);
      setLoginHistory(response.records || []);
    } catch (error) {
      console.error("Error fetching login history:", error);
      toast.error(getErrorMessage(error, "Failed to load login history"));
    }
  };

  const handleLogoutDevice = async (sessionId) => {
    try {
      await authService.logoutDeviceSession(sessionId);
      toast.success("Device session logged out");
      await fetchLoginHistory();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to logout device"));
    }
  };

  const handleContactAdminSubmit = async (e) => {
    e.preventDefault();
    const parsed = contactAdminSchema.safeParse(contactForm);
    if (!parsed.success) {
      setContactErrors(mapZodErrors(parsed.error));
      return;
    }

    setContactErrors({});
    setContactLoading(true);
    try {
      await supportService.contactAdministrator(parsed.data);
      toast.success("Administrator notified");
      setContactForm({ subject: "", message: "", priority: "normal" });
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to contact administrator"));
    } finally {
      setContactLoading(false);
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
      await userService.updateProfile({
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
      await userService.changePassword({
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
      await userService.uploadProfilePicture(formData);
      toast.success('Profile picture updated');
      fetchProfileDetails();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to upload picture"));
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
      {pageError ? (
        <PageErrorState
          title="Profile load failed"
          message={pageError}
          onRetry={fetchProfileDetails}
        />
      ) : null}

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
                <Input
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
              <Button
                onClick={() => setEditMode(true)}
                className="bg-white text-primary-600 px-4 py-2 rounded-lg hover:bg-gray-100 flex items-center space-x-2"
              >
                <FaEdit />
                <span>Edit Profile</span>
              </Button>
            ) : (
              <Button
                onClick={() => setEditMode(false)}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 flex items-center space-x-2"
              >
                <FaTimes />
                <span>Cancel</span>
              </Button>
            )}
            <Button
              onClick={() => setShowPasswordModal(true)}
              className="bg-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/30 flex items-center space-x-2"
            >
              <FaLock />
              <span>Change Password</span>
            </Button>
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
                    <label className="form-label required-label">Full Name</label>
                    <Input
                      type="text"
                      name="name"
                      value={profileData.name}
                      onChange={handleInputChange}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label required-label">Email</label>
                    <Input
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
                    <Input
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
                    <Input
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
                  <Button
                    type="button"
                    onClick={() => setEditMode(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <FaSave />
                    <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                  </Button>
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

          {/* Login History & Device Management */}
          <div className="card mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center">
                <FaHistory className="mr-2 text-primary-600" />
                Login History & Devices
              </h2>
              <Button onClick={fetchLoginHistory} className="btn-secondary text-sm">
                Refresh
              </Button>
            </div>
            <div className="space-y-3">
              {loginHistory.length > 0 ? (
                loginHistory.map((session) => {
                  const isCurrent = session.sessionId === activeSessionId;
                  const canLogout = session.isActive && !isCurrent;
                  return (
                    <div key={session._id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium">{session.deviceName || "Unknown Device"}</p>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${isCurrent ? "bg-green-100 text-green-700" : session.isActive ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                            {isCurrent ? "Current" : session.isActive ? "Active" : "Logged out"}
                          </span>
                          {canLogout ? (
                            <Button
                              className="text-xs px-2 py-1 bg-red-100 text-red-700 hover:bg-red-200"
                              onClick={() => handleLogoutDevice(session.sessionId)}
                            >
                              Logout Device
                            </Button>
                          ) : null}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">IP: {session.ipAddress || "N/A"}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Login: {session.loginAt ? format(new Date(session.loginAt), "MMM dd, yyyy HH:mm") : "N/A"}
                      </p>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-gray-500 py-4">No login history found</p>
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
              <Button
                onClick={() => window.location.href = '/apply-leave'}
                className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg flex items-center space-x-3"
              >
                <FaCalendarAlt className="text-primary-600" />
                <span>Apply for Leave</span>
              </Button>
              <Button
                onClick={() => window.location.href = '/leave-history'}
                className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg flex items-center space-x-3"
              >
                <FaHistory className="text-primary-600" />
                <span>View Leave History</span>
              </Button>
              <Button
                onClick={() => window.location.href = '/attendance'}
                className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg flex items-center space-x-3"
              >
                <FaClock className="text-primary-600" />
                <span>Attendance</span>
              </Button>
            </div>
          </div>

          {/* Contact Administrator */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Contact Administrator</h2>
            <form className="space-y-3" onSubmit={handleContactAdminSubmit}>
              <div>
                <label className="required-label block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <Input
                  value={contactForm.subject}
                  onChange={(e) => setContactForm((prev) => ({ ...prev, subject: e.target.value }))}
                  placeholder="Login issue on device"
                  required
                />
                {contactErrors.subject ? (
                  <p className="text-xs text-red-600 mt-1">{contactErrors.subject}</p>
                ) : null}
              </div>
              <div>
                <label className="required-label block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={contactForm.priority}
                  onChange={(e) => setContactForm((prev) => ({ ...prev, priority: e.target.value }))}
                  className="input-field rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 w-full"
                  required
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
                {contactErrors.priority ? (
                  <p className="text-xs text-red-600 mt-1">{contactErrors.priority}</p>
                ) : null}
              </div>
              <div>
                <label className="required-label block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={contactForm.message}
                  onChange={(e) => setContactForm((prev) => ({ ...prev, message: e.target.value }))}
                  className="input-field rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 w-full"
                  placeholder="Describe your issue in detail"
                  rows={4}
                  required
                />
                {contactErrors.message ? (
                  <p className="text-xs text-red-600 mt-1">{contactErrors.message}</p>
                ) : null}
              </div>
              <Button type="submit" disabled={contactLoading} className="btn-primary w-full">
                {contactLoading ? "Sending..." : "Send to Admin"}
              </Button>
            </form>
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
              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Two-factor authentication:</span>
                  <Button
                    type="button"
                    onClick={handleToggleTwoFactor}
                    disabled={twoFactorSaving}
                    className={twoFactorEnabled ? "btn-secondary" : "btn-primary"}
                  >
                    {twoFactorSaving
                      ? "Saving..."
                      : twoFactorEnabled
                        ? "Disable 2FA"
                        : "Enable 2FA"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div
          className="fixed inset-0 z-50 bg-white/40 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowPasswordModal(false);
          }}
        >
          <div className="relative my-6 mx-auto p-5 border w-full max-w-md shadow-lg rounded-lg bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <FaLock className="mr-2 text-primary-600" />
                Change Password
              </h3>
              <Button
                onClick={() => setShowPasswordModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </Button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="form-label required-label">Current Password</label>
                <div className="relative">
                  <Input
                    type={showPassword.current ? 'text' : 'password'}
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className="input-field pr-10"
                    required
                  />
                  <Button
                    type="button"
                    onClick={() => togglePasswordVisibility('current')}
                    className="absolute right-3 top-3 text-gray-400"
                  >
                    {showPassword.current ? <FaEyeSlash /> : <FaEye />}
                  </Button>
                </div>
              </div>

              <div>
                <label className="form-label required-label">New Password</label>
                <div className="relative">
                  <Input
                    type={showPassword.new ? 'text' : 'password'}
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className="input-field pr-10"
                    required
                    minLength="6"
                  />
                  <Button
                    type="button"
                    onClick={() => togglePasswordVisibility('new')}
                    className="absolute right-3 top-3 text-gray-400"
                  >
                    {showPassword.new ? <FaEyeSlash /> : <FaEye />}
                  </Button>
                </div>
              </div>

              <div>
                <label className="form-label required-label">Confirm New Password</label>
                <div className="relative">
                  <Input
                    type={showPassword.confirm ? 'text' : 'password'}
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className="input-field pr-10"
                    required
                  />
                  <Button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="absolute right-3 top-3 text-gray-400"
                  >
                    {showPassword.confirm ? <FaEyeSlash /> : <FaEye />}
                  </Button>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? 'Changing...' : 'Change Password'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
