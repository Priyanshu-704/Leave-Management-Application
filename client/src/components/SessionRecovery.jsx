import { useEffect } from 'react';
import { useAttendance } from '../context/AttendanceContext';

const SessionRecovery = () => {
  const { fetchTodayAttendance } = useAttendance();

  useEffect(() => {
    // Try to restore session when page loads
    const restoreSession = async () => {
      await fetchTodayAttendance();
    };

    // Also try when page becomes visible again (user switches back to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchTodayAttendance();
      }
    };

    restoreSession();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchTodayAttendance]);

  return null; // This component doesn't render anything
};

export default SessionRecovery;