const { getDefaultPolicy, haversineMeters } = require("../workforceUtils");

exports.getAttendancePolicy = async (req, res) => {
  try {
    const policy = await getDefaultPolicy();
    res.json({
      checkInEnabled: policy.attendance?.checkInEnabled,
      officeGeoFence: policy.attendance?.officeGeoFence,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateAttendancePolicy = async (req, res) => {
  try {
    const { checkInEnabled, officeGeoFence } = req.body;
    const policy = await getDefaultPolicy();

    if (typeof checkInEnabled === "boolean") {
      policy.attendance.checkInEnabled = checkInEnabled;
    }

    if (officeGeoFence) {
      policy.attendance.officeGeoFence.latitude = officeGeoFence.latitude ?? policy.attendance.officeGeoFence.latitude;
      policy.attendance.officeGeoFence.longitude = officeGeoFence.longitude ?? policy.attendance.officeGeoFence.longitude;
      policy.attendance.officeGeoFence.radiusMeters = officeGeoFence.radiusMeters ?? policy.attendance.officeGeoFence.radiusMeters;
    }

    await policy.save();
    res.json({ success: true, data: policy.attendance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.validateGeoFenceForCheckIn = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const policy = await getDefaultPolicy();
    const fence = policy.attendance?.officeGeoFence || {};

    if (fence.latitude === null || fence.longitude === null) {
      return res.json({
        success: true,
        inRange: true,
        message: "Geo-fence is not configured",
        distanceMeters: null,
        radiusMeters: fence.radiusMeters || null,
      });
    }

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return res.status(400).json({ message: "Latitude and longitude are required" });
    }

    const distanceMeters = haversineMeters(latitude, longitude, fence.latitude, fence.longitude);
    const inRange = distanceMeters <= (fence.radiusMeters || 200);

    return res.json({
      success: true,
      inRange,
      distanceMeters: Math.round(distanceMeters),
      radiusMeters: fence.radiusMeters,
      message: inRange ? "Within office geo-fence" : "Outside office geo-fence",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
