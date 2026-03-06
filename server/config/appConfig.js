const parseTime = (value, fallback) => {
  const str = String(value || fallback || "09:00");
  const [h, m] = str.split(":").map(Number);
  return {
    hour: Number.isFinite(h) ? h : Number(fallback.split(":")[0]),
    minute: Number.isFinite(m) ? m : Number(fallback.split(":")[1]),
    text: `${String(Number.isFinite(h) ? h : Number(fallback.split(":")[0])).padStart(2, "0")}:${String(Number.isFinite(m) ? m : Number(fallback.split(":")[1])).padStart(2, "0")}`,
  };
};

const SHIFT_START = parseTime(process.env.SHIFT_START_TIME, "09:00");
const SHIFT_END = parseTime(process.env.SHIFT_END_TIME, "18:00");
const CORS_ORIGINS = String(process.env.CORS_ORIGINS || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

module.exports = {
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",
  API_BASE_URL: process.env.API_BASE_URL || "",
  CORS_ORIGINS,
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET,
  ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || "30d",
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || "",
  COOKIE_SECURE: String(process.env.COOKIE_SECURE || "false").toLowerCase() === "true",
  SHIFT_START_TIME: SHIFT_START,
  SHIFT_END_TIME: SHIFT_END,
  CHECKIN_REMINDER_AFTER_MINUTES: Number(process.env.CHECKIN_REMINDER_AFTER_MINUTES || 10),
  CHECKOUT_REMINDER_BEFORE_MINUTES: Number(process.env.CHECKOUT_REMINDER_BEFORE_MINUTES || 10),
};
