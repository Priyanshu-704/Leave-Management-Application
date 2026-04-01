import { useEffect, useState } from "react";
import PageSkeleton from "@/components/PageSkeleton";
import toast from "react-hot-toast";
import { Button } from "@/components/ui";
import { authService } from "@/services/api";

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
};

const LoginHistory = () => {
  const [data, setData] = useState({ activeSessionId: null, records: [] });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const response = await authService.getLoginHistory();
      setData(response || { activeSessionId: null, records: [] });
    } catch (error) {
      toast.error(error.message || "Failed to fetch login history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <PageSkeleton rows={6} />;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div className="page-header-title">
          <h1 className="page-title">Login History & Device Management</h1>
          <p className="page-subtitle">One active session is allowed per user. New login will logout the previous device automatically.</p>
        </div>
        <div className="page-header-actions">
          <Button className="w-full rounded-md border border-gray-300 px-3 py-2 sm:w-auto" onClick={load}>Refresh</Button>
        </div>
      </div>

      <div className="responsive-table-shell rounded-lg border border-gray-200 bg-white">
        <table className="responsive-data-table min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2">Device</th>
              <th className="text-left px-3 py-2">IP</th>
              <th className="text-left px-3 py-2">Login At</th>
              <th className="text-left px-3 py-2">Last Seen</th>
              <th className="text-left px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.records?.length ? data.records.map((row) => {
              const isCurrent = row.sessionId === data.activeSessionId;
              return (
                <tr key={row._id} className="border-t border-gray-100">
                  <td className="px-3 py-2" data-label="Device">{row.deviceName || "Unknown Device"}</td>
                  <td className="px-3 py-2" data-label="IP">{row.ipAddress || "-"}</td>
                  <td className="px-3 py-2" data-label="Login At">{formatDateTime(row.loginAt)}</td>
                  <td className="px-3 py-2" data-label="Last Seen">{formatDateTime(row.lastSeenAt)}</td>
                  <td className="px-3 py-2" data-label="Status">{isCurrent ? <span className="text-green-600 font-medium">Current</span> : <span className="text-gray-500">Logged out</span>}</td>
                </tr>
              );
            }) : (
              <tr>
                <td className="px-3 py-4 text-center text-gray-500" colSpan={5}>No login history found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LoginHistory;
