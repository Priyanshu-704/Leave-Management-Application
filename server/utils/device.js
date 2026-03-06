const parseDeviceName = (userAgent = "") => {
  const ua = String(userAgent || "").toLowerCase();

  const browser = ua.includes("edg")
    ? "Edge"
    : ua.includes("chrome")
      ? "Chrome"
      : ua.includes("firefox")
        ? "Firefox"
        : ua.includes("safari")
          ? "Safari"
          : "Browser";

  const os = ua.includes("windows")
    ? "Windows"
    : ua.includes("mac os")
      ? "macOS"
      : ua.includes("android")
        ? "Android"
        : ua.includes("iphone") || ua.includes("ipad")
          ? "iOS"
          : ua.includes("linux")
            ? "Linux"
            : "OS";

  return `${browser} on ${os}`;
};

const buildDeviceFingerprint = ({ userAgent = "", ipAddress = "" }) => {
  const normalized = `${String(userAgent || "").trim()}|${String(ipAddress || "").trim()}`;
  return require("crypto").createHash("sha256").update(normalized).digest("hex");
};

module.exports = { parseDeviceName, buildDeviceFingerprint };
