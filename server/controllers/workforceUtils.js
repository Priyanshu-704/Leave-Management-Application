const WorkforcePolicy = require("../models/WorkforcePolicy");

const escapeCsv = (value) => {
  const stringValue = value === undefined || value === null ? "" : String(value);
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

const sendCsv = (res, filename, headers, rows) => {
  const content = [headers.join(","), ...rows.map((row) => headers.map((key) => escapeCsv(row[key])).join(","))].join("\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename=\"${filename}\"`);
  return res.send(content);
};

const getDefaultPolicy = async () => WorkforcePolicy.findOneAndUpdate(
  { key: "default" },
  { $setOnInsert: { key: "default" } },
  { new: true, upsert: true },
);

const startEndFromMonth = (month) => {
  const [year, mon] = String(month || "").split("-").map(Number);
  if (!year || !mon) return null;
  const start = new Date(Date.UTC(year, mon - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, mon, 0, 23, 59, 59, 999));
  return { start, end };
};

const haversineMeters = (lat1, lon1, lat2, lon2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

module.exports = {
  sendCsv,
  getDefaultPolicy,
  startEndFromMonth,
  haversineMeters,
};
