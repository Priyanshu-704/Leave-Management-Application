import { useState, useEffect } from "react";
import { useSettings } from "../context/SettingsContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import {
  FaBuilding,
  FaCalendarAlt,
  FaClock,
  FaBell,
  FaLock,
  FaEnvelope,
  FaPalette,
  FaToggleOn,
  FaPlug,
  FaDatabase,
  FaHistory,
  FaSave,
  FaTimes,
  FaPlus,
  FaTrash,
  FaEye,
  FaEyeSlash,
  FaGlobe,
  FaMapMarkerAlt,
  FaUsers,
  FaShieldAlt,
} from "react-icons/fa";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const Settings = () => {
  const { isAdmin } = useAuth();
  const { settings, loading, updateSettings, resetSection } = useSettings();
  const [activeTab, setActiveTab] = useState("company");
  const [formData, setFormData] = useState({});
  const [editing, setEditing] = useState(false);
  const [showPassword, setShowPassword] = useState({});
  const [auditLog, setAuditLog] = useState([]);
  const [systemStatus, setSystemStatus] = useState(null);
  const [holidayInput, setHolidayInput] = useState({ name: "", date: "" });

  const fetchAuditLog = async () => {
    try {
      const response = await axios.get(`${API_URL}/settings/audit`);
      setAuditLog(response.data.data);
    } catch (error) {
      console.error("Error fetching audit log:", error);
    }
  };

  const fetchSystemStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/settings/status`);
      setSystemStatus(response.data.data);
    } catch (error) {
      console.error("Error fetching system status:", error);
    }
  };

  const handleInputChange = (section, field, value) => {
    setFormData({
      ...formData,
      [section]: {
        ...formData[section],
        [field]: value,
      },
    });
  };

  const handleNestedChange = (section, subsection, field, value) => {
    setFormData({
      ...formData,
      [section]: {
        ...formData[section],
        [subsection]: {
          ...formData[section]?.[subsection],
          [field]: value,
        },
      },
    });
  };

  useEffect(() => {
    if (settings) {
       
      setFormData(settings);
    }
    if (isAdmin) {
      fetchAuditLog();
      fetchSystemStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const handleArrayToggle = (section, field, value) => {
    const currentArray = formData[section]?.[field] || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter((item) => item !== value)
      : [...currentArray, value];

    handleInputChange(section, field, newArray);
  };

  const handleAddHoliday = () => {
    if (!holidayInput.name || !holidayInput.date) {
      toast.error("Please enter both name and date");
      return;
    }

    const newHoliday = {
      name: holidayInput.name,
      date: holidayInput.date,
      recurring: false,
      optional: false,
    };

    const currentHolidays = formData.attendanceSettings?.holidays || [];
    handleInputChange("attendanceSettings", "holidays", [
      ...currentHolidays,
      newHoliday,
    ]);
    setHolidayInput({ name: "", date: "" });
  };

  const handleRemoveHoliday = (index) => {
    const currentHolidays = formData.attendanceSettings?.holidays || [];
    const newHolidays = currentHolidays.filter((_, i) => i !== index);
    handleInputChange("attendanceSettings", "holidays", newHolidays);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateSettings(formData);
      setEditing(false);
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  };

  const handleReset = (section) => {
    if (
      window.confirm(
        `Are you sure you want to reset ${section} settings to defaults?`,
      )
    ) {
      resetSection(section);
    }
  };

  const testEmail = async () => {
    try {
      await axios.post(`${API_URL}/settings/test-email`, {
        testEmail: formData.company?.email,
      });
      toast.success("Test email sent successfully");
    } catch (error) {
      toast.error(error, "Failed to send test email");
    }
  };

  const tabs = [
    { id: "company", name: "Company", icon: FaBuilding },
    { id: "leave", name: "Leave", icon: FaCalendarAlt },
    { id: "attendance", name: "Attendance", icon: FaClock },
    { id: "notifications", name: "Notifications", icon: FaBell },
    { id: "security", name: "Security", icon: FaLock },
    { id: "email", name: "Email", icon: FaEnvelope },
    { id: "theme", name: "Theme", icon: FaPalette },
    { id: "features", name: "Features", icon: FaToggleOn },
    { id: "integrations", name: "Integrations", icon: FaPlug },
    { id: "backup", name: "Backup", icon: FaDatabase },
    { id: "audit", name: "Audit Log", icon: FaHistory },
    { id: "status", name: "System Status", icon: FaShieldAlt },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage application configuration</p>
        </div>
        <div className="flex space-x-2">
          {editing ? (
            <>
              <button
                onClick={() => {
                  setEditing(false);
                  setFormData(settings);
                }}
                className="btn-secondary flex items-center space-x-2"
              >
                <FaTimes />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleSubmit}
                className="btn-primary flex items-center space-x-2"
              >
                <FaSave />
                <span>Save Changes</span>
              </button>
            </>
          ) : (
            <button onClick={() => setEditing(true)} className="btn-primary">
              Edit Settings
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b overflow-x-auto">
        <nav className="flex space-x-8 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.id
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <tab.icon />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="card">
        <form onSubmit={handleSubmit}>
          {/* Company Settings */}
          {activeTab === "company" && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Company Information</h2>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="form-label">Company Name</label>
                  <input
                    type="text"
                    value={formData.company?.name || ""}
                    onChange={(e) =>
                      handleInputChange("company", "name", e.target.value)
                    }
                    disabled={!editing}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="form-label">Tax ID / VAT Number</label>
                  <input
                    type="text"
                    value={formData.company?.taxId || ""}
                    onChange={(e) =>
                      handleInputChange("company", "taxId", e.target.value)
                    }
                    disabled={!editing}
                    className="input-field"
                  />
                </div>
                <div className="col-span-2">
                  <label className="form-label">Address</label>
                  <textarea
                    value={formData.company?.address || ""}
                    onChange={(e) =>
                      handleInputChange("company", "address", e.target.value)
                    }
                    disabled={!editing}
                    rows="3"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="form-label">Phone</label>
                  <input
                    type="tel"
                    value={formData.company?.phone || ""}
                    onChange={(e) =>
                      handleInputChange("company", "phone", e.target.value)
                    }
                    disabled={!editing}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    value={formData.company?.email || ""}
                    onChange={(e) =>
                      handleInputChange("company", "email", e.target.value)
                    }
                    disabled={!editing}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="form-label">Website</label>
                  <input
                    type="url"
                    value={formData.company?.website || ""}
                    onChange={(e) =>
                      handleInputChange("company", "website", e.target.value)
                    }
                    disabled={!editing}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="form-label">Registration Number</label>
                  <input
                    type="text"
                    value={formData.company?.registrationNumber || ""}
                    onChange={(e) =>
                      handleInputChange(
                        "company",
                        "registrationNumber",
                        e.target.value,
                      )
                    }
                    disabled={!editing}
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Leave Settings */}
          {activeTab === "leave" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Leave Configuration</h2>
                <button
                  type="button"
                  onClick={() => handleReset("leaveSettings")}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Reset to Defaults
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="form-label">
                    Default Annual Leave Quota
                  </label>
                  <input
                    type="number"
                    value={formData.leaveSettings?.defaultAnnualQuota || 20}
                    onChange={(e) =>
                      handleInputChange(
                        "leaveSettings",
                        "defaultAnnualQuota",
                        parseInt(e.target.value),
                      )
                    }
                    disabled={!editing}
                    className="input-field"
                    min="0"
                  />
                </div>
                <div>
                  <label className="form-label">Default Sick Leave Quota</label>
                  <input
                    type="number"
                    value={formData.leaveSettings?.defaultSickQuota || 10}
                    onChange={(e) =>
                      handleInputChange(
                        "leaveSettings",
                        "defaultSickQuota",
                        parseInt(e.target.value),
                      )
                    }
                    disabled={!editing}
                    className="input-field"
                    min="0"
                  />
                </div>
                <div>
                  <label className="form-label">
                    Default Personal Leave Quota
                  </label>
                  <input
                    type="number"
                    value={formData.leaveSettings?.defaultPersonalQuota || 5}
                    onChange={(e) =>
                      handleInputChange(
                        "leaveSettings",
                        "defaultPersonalQuota",
                        parseInt(e.target.value),
                      )
                    }
                    disabled={!editing}
                    className="input-field"
                    min="0"
                  />
                </div>
                <div>
                  <label className="form-label">
                    Max Consecutive Leave Days
                  </label>
                  <input
                    type="number"
                    value={
                      formData.leaveSettings?.maxConsecutiveLeaveDays || 30
                    }
                    onChange={(e) =>
                      handleInputChange(
                        "leaveSettings",
                        "maxConsecutiveLeaveDays",
                        parseInt(e.target.value),
                      )
                    }
                    disabled={!editing}
                    className="input-field"
                    min="1"
                  />
                </div>
                <div>
                  <label className="form-label">
                    Minimum Days Before Request
                  </label>
                  <input
                    type="number"
                    value={formData.leaveSettings?.minDaysBeforeRequest || 1}
                    onChange={(e) =>
                      handleInputChange(
                        "leaveSettings",
                        "minDaysBeforeRequest",
                        parseInt(e.target.value),
                      )
                    }
                    disabled={!editing}
                    className="input-field"
                    min="0"
                  />
                </div>
                <div>
                  <label className="form-label">
                    Leave Accrual Rate (days/month)
                  </label>
                  <input
                    type="number"
                    value={formData.leaveSettings?.leaveAccrualRate || 1.5}
                    onChange={(e) =>
                      handleInputChange(
                        "leaveSettings",
                        "leaveAccrualRate",
                        parseFloat(e.target.value),
                      )
                    }
                    disabled={!editing}
                    className="input-field"
                    step="0.5"
                    min="0"
                  />
                </div>
                <div>
                  <label className="form-label">
                    Probation Period (months)
                  </label>
                  <input
                    type="number"
                    value={formData.leaveSettings?.probationPeriod || 6}
                    onChange={(e) =>
                      handleInputChange(
                        "leaveSettings",
                        "probationPeriod",
                        parseInt(e.target.value),
                      )
                    }
                    disabled={!editing}
                    className="input-field"
                    min="0"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.leaveSettings?.allowHalfDay || false}
                    onChange={(e) =>
                      handleInputChange(
                        "leaveSettings",
                        "allowHalfDay",
                        e.target.checked,
                      )
                    }
                    disabled={!editing}
                    className="h-4 w-4 text-primary-600 rounded"
                  />
                  <span>Allow Half-Day Leave</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={
                      formData.leaveSettings?.carryForwardLeaves || false
                    }
                    onChange={(e) =>
                      handleInputChange(
                        "leaveSettings",
                        "carryForwardLeaves",
                        e.target.checked,
                      )
                    }
                    disabled={!editing}
                    className="h-4 w-4 text-primary-600 rounded"
                  />
                  <span>Allow Carry Forward Leaves</span>
                </label>
                {formData.leaveSettings?.carryForwardLeaves && (
                  <div className="ml-6">
                    <label className="form-label">Max Carry Forward Days</label>
                    <input
                      type="number"
                      value={formData.leaveSettings?.maxCarryForwardDays || 5}
                      onChange={(e) =>
                        handleInputChange(
                          "leaveSettings",
                          "maxCarryForwardDays",
                          parseInt(e.target.value),
                        )
                      }
                      disabled={!editing}
                      className="input-field w-48"
                      min="0"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Attendance Settings */}
          {activeTab === "attendance" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Attendance Settings</h2>
                <button
                  type="button"
                  onClick={() => handleReset("attendanceSettings")}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Reset to Defaults
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="form-label">Work Start Time</label>
                  <input
                    type="time"
                    value={
                      formData.attendanceSettings?.workStartTime || "09:00"
                    }
                    onChange={(e) =>
                      handleInputChange(
                        "attendanceSettings",
                        "workStartTime",
                        e.target.value,
                      )
                    }
                    disabled={!editing}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="form-label">Work End Time</label>
                  <input
                    type="time"
                    value={formData.attendanceSettings?.workEndTime || "18:00"}
                    onChange={(e) =>
                      handleInputChange(
                        "attendanceSettings",
                        "workEndTime",
                        e.target.value,
                      )
                    }
                    disabled={!editing}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="form-label">Grace Period (minutes)</label>
                  <input
                    type="number"
                    value={
                      formData.attendanceSettings?.gracePeriodMinutes || 15
                    }
                    onChange={(e) =>
                      handleInputChange(
                        "attendanceSettings",
                        "gracePeriodMinutes",
                        parseInt(e.target.value),
                      )
                    }
                    disabled={!editing}
                    className="input-field"
                    min="0"
                  />
                </div>
                <div>
                  <label className="form-label">
                    Late Penalty After (minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.attendanceSettings?.latePenaltyAfter || 30}
                    onChange={(e) =>
                      handleInputChange(
                        "attendanceSettings",
                        "latePenaltyAfter",
                        parseInt(e.target.value),
                      )
                    }
                    disabled={!editing}
                    className="input-field"
                    min="0"
                  />
                </div>
                <div>
                  <label className="form-label">
                    Half Day Threshold (hours)
                  </label>
                  <input
                    type="number"
                    value={formData.attendanceSettings?.halfDayThreshold || 4}
                    onChange={(e) =>
                      handleInputChange(
                        "attendanceSettings",
                        "halfDayThreshold",
                        parseInt(e.target.value),
                      )
                    }
                    disabled={!editing}
                    className="input-field"
                    min="1"
                    max="8"
                  />
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Work Week Days</h3>
                <div className="flex flex-wrap gap-3">
                  {[
                    "monday",
                    "tuesday",
                    "wednesday",
                    "thursday",
                    "friday",
                    "saturday",
                    "sunday",
                  ].map((day) => (
                    <label key={day} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={
                          formData.attendanceSettings?.workWeekDays?.includes(
                            day,
                          ) || false
                        }
                        onChange={() =>
                          handleArrayToggle(
                            "attendanceSettings",
                            "workWeekDays",
                            day,
                          )
                        }
                        disabled={!editing}
                        className="h-4 w-4 text-primary-600 rounded"
                      />
                      <span className="capitalize">{day}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Holidays</h3>
                <div className="space-y-3">
                  {formData.attendanceSettings?.holidays?.map(
                    (holiday, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{holiday.name}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(holiday.date).toLocaleDateString()}
                          </p>
                        </div>
                        {editing && (
                          <button
                            type="button"
                            onClick={() => handleRemoveHoliday(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    ),
                  )}

                  {editing && (
                    <div className="flex space-x-2 mt-3">
                      <input
                        type="text"
                        placeholder="Holiday name"
                        value={holidayInput.name}
                        onChange={(e) =>
                          setHolidayInput({
                            ...holidayInput,
                            name: e.target.value,
                          })
                        }
                        className="input-field flex-1"
                      />
                      <input
                        type="date"
                        value={holidayInput.date}
                        onChange={(e) =>
                          setHolidayInput({
                            ...holidayInput,
                            date: e.target.value,
                          })
                        }
                        className="input-field"
                      />
                      <button
                        type="button"
                        onClick={handleAddHoliday}
                        className="btn-primary"
                      >
                        <FaPlus />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium">Location Settings</h3>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={
                      formData.attendanceSettings?.requireLocation || false
                    }
                    onChange={(e) =>
                      handleInputChange(
                        "attendanceSettings",
                        "requireLocation",
                        e.target.checked,
                      )
                    }
                    disabled={!editing}
                    className="h-4 w-4 text-primary-600 rounded"
                  />
                  <span>Require Location for Check-in/out</span>
                </label>

                {formData.attendanceSettings?.requireLocation && (
                  <>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={
                          formData.attendanceSettings?.allowGeoFencing || false
                        }
                        onChange={(e) =>
                          handleInputChange(
                            "attendanceSettings",
                            "allowGeoFencing",
                            e.target.checked,
                          )
                        }
                        disabled={!editing}
                        className="h-4 w-4 text-primary-600 rounded"
                      />
                      <span>Enable Geo-fencing</span>
                    </label>

                    {formData.attendanceSettings?.allowGeoFencing && (
                      <div className="ml-6 space-y-3">
                        <div>
                          <label className="form-label">Office Location</label>
                          <div className="flex space-x-2">
                            <input
                              type="number"
                              placeholder="Latitude"
                              value={
                                formData.attendanceSettings?.officeLocation
                                  ?.latitude || ""
                              }
                              onChange={(e) =>
                                handleNestedChange(
                                  "attendanceSettings",
                                  "officeLocation",
                                  "latitude",
                                  parseFloat(e.target.value),
                                )
                              }
                              disabled={!editing}
                              className="input-field"
                              step="any"
                            />
                            <input
                              type="number"
                              placeholder="Longitude"
                              value={
                                formData.attendanceSettings?.officeLocation
                                  ?.longitude || ""
                              }
                              onChange={(e) =>
                                handleNestedChange(
                                  "attendanceSettings",
                                  "officeLocation",
                                  "longitude",
                                  parseFloat(e.target.value),
                                )
                              }
                              disabled={!editing}
                              className="input-field"
                              step="any"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="form-label">
                            Geo-fence Radius (meters)
                          </label>
                          <input
                            type="number"
                            value={
                              formData.attendanceSettings?.geoFenceRadius || 100
                            }
                            onChange={(e) =>
                              handleInputChange(
                                "attendanceSettings",
                                "geoFenceRadius",
                                parseInt(e.target.value),
                              )
                            }
                            disabled={!editing}
                            className="input-field"
                            min="10"
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Security Settings</h2>
                <button
                  type="button"
                  onClick={() => handleReset("securitySettings")}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Reset to Defaults
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="form-label">Password Minimum Length</label>
                  <input
                    type="number"
                    value={formData.securitySettings?.passwordMinLength || 6}
                    onChange={(e) =>
                      handleInputChange(
                        "securitySettings",
                        "passwordMinLength",
                        parseInt(e.target.value),
                      )
                    }
                    disabled={!editing}
                    className="input-field"
                    min="6"
                  />
                </div>
                <div>
                  <label className="form-label">Password Expiry (days)</label>
                  <input
                    type="number"
                    value={formData.securitySettings?.passwordExpiryDays || 90}
                    onChange={(e) =>
                      handleInputChange(
                        "securitySettings",
                        "passwordExpiryDays",
                        parseInt(e.target.value),
                      )
                    }
                    disabled={!editing}
                    className="input-field"
                    min="0"
                  />
                </div>
                <div>
                  <label className="form-label">Max Login Attempts</label>
                  <input
                    type="number"
                    value={formData.securitySettings?.maxLoginAttempts || 5}
                    onChange={(e) =>
                      handleInputChange(
                        "securitySettings",
                        "maxLoginAttempts",
                        parseInt(e.target.value),
                      )
                    }
                    disabled={!editing}
                    className="input-field"
                    min="1"
                  />
                </div>
                <div>
                  <label className="form-label">
                    Session Timeout (minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.securitySettings?.sessionTimeout || 30}
                    onChange={(e) =>
                      handleInputChange(
                        "securitySettings",
                        "sessionTimeout",
                        parseInt(e.target.value),
                      )
                    }
                    disabled={!editing}
                    className="input-field"
                    min="5"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium">Password Requirements</h3>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={
                      formData.securitySettings?.passwordRequireUppercase ||
                      false
                    }
                    onChange={(e) =>
                      handleInputChange(
                        "securitySettings",
                        "passwordRequireUppercase",
                        e.target.checked,
                      )
                    }
                    disabled={!editing}
                    className="h-4 w-4 text-primary-600 rounded"
                  />
                  <span>Require Uppercase Letters</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={
                      formData.securitySettings?.passwordRequireLowercase ||
                      false
                    }
                    onChange={(e) =>
                      handleInputChange(
                        "securitySettings",
                        "passwordRequireLowercase",
                        e.target.checked,
                      )
                    }
                    disabled={!editing}
                    className="h-4 w-4 text-primary-600 rounded"
                  />
                  <span>Require Lowercase Letters</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={
                      formData.securitySettings?.passwordRequireNumbers || false
                    }
                    onChange={(e) =>
                      handleInputChange(
                        "securitySettings",
                        "passwordRequireNumbers",
                        e.target.checked,
                      )
                    }
                    disabled={!editing}
                    className="h-4 w-4 text-primary-600 rounded"
                  />
                  <span>Require Numbers</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={
                      formData.securitySettings?.passwordRequireSpecialChars ||
                      false
                    }
                    onChange={(e) =>
                      handleInputChange(
                        "securitySettings",
                        "passwordRequireSpecialChars",
                        e.target.checked,
                      )
                    }
                    disabled={!editing}
                    className="h-4 w-4 text-primary-600 rounded"
                  />
                  <span>Require Special Characters</span>
                </label>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium">Additional Security</h3>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.securitySettings?.twoFactorAuth || false}
                    onChange={(e) =>
                      handleInputChange(
                        "securitySettings",
                        "twoFactorAuth",
                        e.target.checked,
                      )
                    }
                    disabled={!editing}
                    className="h-4 w-4 text-primary-600 rounded"
                  />
                  <span>Enable Two-Factor Authentication</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={
                      formData.securitySettings?.allowMultipleSessions || false
                    }
                    onChange={(e) =>
                      handleInputChange(
                        "securitySettings",
                        "allowMultipleSessions",
                        e.target.checked,
                      )
                    }
                    disabled={!editing}
                    className="h-4 w-4 text-primary-600 rounded"
                  />
                  <span>Allow Multiple Sessions</span>
                </label>
              </div>
            </div>
          )}

          {/* Email Settings */}
          {activeTab === "email" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Email Configuration</h2>
                <div className="space-x-2">
                  <button
                    type="button"
                    onClick={testEmail}
                    className="btn-secondary text-sm"
                  >
                    Test Email
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReset("emailSettings")}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Reset to Defaults
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="form-label">SMTP Host</label>
                  <input
                    type="text"
                    value={formData.emailSettings?.smtpHost || ""}
                    onChange={(e) =>
                      handleInputChange(
                        "emailSettings",
                        "smtpHost",
                        e.target.value,
                      )
                    }
                    disabled={!editing}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="form-label">SMTP Port</label>
                  <input
                    type="number"
                    value={formData.emailSettings?.smtpPort || ""}
                    onChange={(e) =>
                      handleInputChange(
                        "emailSettings",
                        "smtpPort",
                        parseInt(e.target.value),
                      )
                    }
                    disabled={!editing}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="form-label">SMTP User</label>
                  <input
                    type="text"
                    value={formData.emailSettings?.smtpUser || ""}
                    onChange={(e) =>
                      handleInputChange(
                        "emailSettings",
                        "smtpUser",
                        e.target.value,
                      )
                    }
                    disabled={!editing}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="form-label">SMTP Password</label>
                  <div className="relative">
                    <input
                      type={showPassword.smtp ? "text" : "password"}
                      value={formData.emailSettings?.smtpPassword || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "emailSettings",
                          "smtpPassword",
                          e.target.value,
                        )
                      }
                      disabled={!editing}
                      className="input-field pr-10"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword({
                          ...showPassword,
                          smtp: !showPassword.smtp,
                        })
                      }
                      className="absolute right-3 top-3 text-gray-400"
                    >
                      {showPassword.smtp ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="form-label">From Email</label>
                  <input
                    type="email"
                    value={formData.emailSettings?.fromEmail || ""}
                    onChange={(e) =>
                      handleInputChange(
                        "emailSettings",
                        "fromEmail",
                        e.target.value,
                      )
                    }
                    disabled={!editing}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="form-label">From Name</label>
                  <input
                    type="text"
                    value={formData.emailSettings?.fromName || ""}
                    onChange={(e) =>
                      handleInputChange(
                        "emailSettings",
                        "fromName",
                        e.target.value,
                      )
                    }
                    disabled={!editing}
                    className="input-field"
                  />
                </div>
                <div className="col-span-2">
                  <label className="form-label">Email Signature</label>
                  <textarea
                    value={formData.emailSettings?.emailSignature || ""}
                    onChange={(e) =>
                      handleInputChange(
                        "emailSettings",
                        "emailSignature",
                        e.target.value,
                      )
                    }
                    disabled={!editing}
                    rows="4"
                    className="input-field"
                  />
                </div>
              </div>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.emailSettings?.smtpSecure || false}
                  onChange={(e) =>
                    handleInputChange(
                      "emailSettings",
                      "smtpSecure",
                      e.target.checked,
                    )
                  }
                  disabled={!editing}
                  className="h-4 w-4 text-primary-600 rounded"
                />
                <span>Use Secure Connection (SSL/TLS)</span>
              </label>
            </div>
          )}

          {/* Theme Settings */}
          {activeTab === "theme" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Theme Settings</h2>
                <button
                  type="button"
                  onClick={() => handleReset("themeSettings")}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Reset to Defaults
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="form-label">Primary Color</label>
                  <div className="flex space-x-2">
                    <input
                      type="color"
                      value={formData.themeSettings?.primaryColor || "#2563eb"}
                      onChange={(e) =>
                        handleInputChange(
                          "themeSettings",
                          "primaryColor",
                          e.target.value,
                        )
                      }
                      disabled={!editing}
                      className="w-12 h-10 rounded border"
                    />
                    <input
                      type="text"
                      value={formData.themeSettings?.primaryColor || "#2563eb"}
                      onChange={(e) =>
                        handleInputChange(
                          "themeSettings",
                          "primaryColor",
                          e.target.value,
                        )
                      }
                      disabled={!editing}
                      className="input-field flex-1"
                      placeholder="#2563eb"
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label">Secondary Color</label>
                  <div className="flex space-x-2">
                    <input
                      type="color"
                      value={
                        formData.themeSettings?.secondaryColor || "#4f46e5"
                      }
                      onChange={(e) =>
                        handleInputChange(
                          "themeSettings",
                          "secondaryColor",
                          e.target.value,
                        )
                      }
                      disabled={!editing}
                      className="w-12 h-10 rounded border"
                    />
                    <input
                      type="text"
                      value={
                        formData.themeSettings?.secondaryColor || "#4f46e5"
                      }
                      onChange={(e) =>
                        handleInputChange(
                          "themeSettings",
                          "secondaryColor",
                          e.target.value,
                        )
                      }
                      disabled={!editing}
                      className="input-field flex-1"
                      placeholder="#4f46e5"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium">Logo Upload</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="logo-upload"
                    disabled={!editing}
                  />
                  <label htmlFor="logo-upload" className="cursor-pointer">
                    <FaGlobe className="mx-auto text-3xl text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">
                      Click to upload logo
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="form-label">Custom CSS</label>
                <textarea
                  value={formData.themeSettings?.customCSS || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "themeSettings",
                      "customCSS",
                      e.target.value,
                    )
                  }
                  disabled={!editing}
                  rows="6"
                  className="input-field font-mono text-sm"
                  placeholder="/* Add custom CSS here */"
                />
              </div>
            </div>
          )}

          {/* Feature Toggles */}
          {activeTab === "features" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Feature Toggles</h2>
                <button
                  type="button"
                  onClick={() => handleReset("featureToggles")}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Reset to Defaults
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    checked={
                      formData.featureToggles?.enableLeaveModule || false
                    }
                    onChange={(e) =>
                      handleInputChange(
                        "featureToggles",
                        "enableLeaveModule",
                        e.target.checked,
                      )
                    }
                    disabled={!editing}
                    className="h-5 w-5 text-primary-600 rounded"
                  />
                  <div>
                    <span className="font-medium">Leave Module</span>
                    <p className="text-xs text-gray-500">
                      Enable leave management system
                    </p>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    checked={
                      formData.featureToggles?.enableAttendanceModule || false
                    }
                    onChange={(e) =>
                      handleInputChange(
                        "featureToggles",
                        "enableAttendanceModule",
                        e.target.checked,
                      )
                    }
                    disabled={!editing}
                    className="h-5 w-5 text-primary-600 rounded"
                  />
                  <div>
                    <span className="font-medium">Attendance Module</span>
                    <p className="text-xs text-gray-500">
                      Enable attendance tracking
                    </p>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    checked={
                      formData.featureToggles?.enableAnnouncements || false
                    }
                    onChange={(e) =>
                      handleInputChange(
                        "featureToggles",
                        "enableAnnouncements",
                        e.target.checked,
                      )
                    }
                    disabled={!editing}
                    className="h-5 w-5 text-primary-600 rounded"
                  />
                  <div>
                    <span className="font-medium">Announcements</span>
                    <p className="text-xs text-gray-500">
                      Enable announcement system
                    </p>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    checked={
                      formData.featureToggles?.enableFileManagement || false
                    }
                    onChange={(e) =>
                      handleInputChange(
                        "featureToggles",
                        "enableFileManagement",
                        e.target.checked,
                      )
                    }
                    disabled={!editing}
                    className="h-5 w-5 text-primary-600 rounded"
                  />
                  <div>
                    <span className="font-medium">File Management</span>
                    <p className="text-xs text-gray-500">
                      Enable file uploads and sharing
                    </p>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    checked={
                      formData.featureToggles?.enableDepartmentStructure ||
                      false
                    }
                    onChange={(e) =>
                      handleInputChange(
                        "featureToggles",
                        "enableDepartmentStructure",
                        e.target.checked,
                      )
                    }
                    disabled={!editing}
                    className="h-5 w-5 text-primary-600 rounded"
                  />
                  <div>
                    <span className="font-medium">Departments</span>
                    <p className="text-xs text-gray-500">
                      Enable department management
                    </p>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    checked={formData.featureToggles?.enableReports || false}
                    onChange={(e) =>
                      handleInputChange(
                        "featureToggles",
                        "enableReports",
                        e.target.checked,
                      )
                    }
                    disabled={!editing}
                    className="h-5 w-5 text-primary-600 rounded"
                  />
                  <div>
                    <span className="font-medium">Reports</span>
                    <p className="text-xs text-gray-500">
                      Enable reporting and analytics
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Audit Log */}
          {activeTab === "audit" && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Audit Log</h2>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                        Action
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                        Field
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                        Old Value
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                        New Value
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                        Changed By
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {auditLog.map((entry, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm">{entry.action}</td>
                        <td className="px-4 py-2 text-sm">{entry.field}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          {typeof entry.oldValue === "object"
                            ? JSON.stringify(entry.oldValue)
                            : String(entry.oldValue)}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          {typeof entry.newValue === "object"
                            ? JSON.stringify(entry.newValue)
                            : String(entry.newValue)}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          {entry.changedBy?.name || "Unknown"}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          {new Date(entry.changedAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* System Status */}
          {activeTab === "status" && systemStatus && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">System Status</h2>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Total Users</p>
                  <p className="text-3xl font-bold">{systemStatus.users}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Active Users</p>
                  <p className="text-3xl font-bold">
                    {systemStatus.activeUsers}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Departments</p>
                  <p className="text-3xl font-bold">
                    {systemStatus.departments}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">System Version</p>
                  <p className="text-3xl font-bold">{systemStatus.version}</p>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-medium text-green-700">
                    System Health: {systemStatus.systemHealth}
                  </span>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Database Information</h3>
                <p className="text-sm text-gray-600">
                  MongoDB Connection: Healthy
                </p>
                <p className="text-sm text-gray-600">
                  Last Backup: {systemStatus.lastBackup || "Never"}
                </p>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Settings;
