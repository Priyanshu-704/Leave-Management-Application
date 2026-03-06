/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { useAttendance } from "../context/AttendanceContext";
import {
  FaSignInAlt,
  FaSignOutAlt,
  FaCoffee,
  FaClock,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaHistory,
  FaPlay,
  FaPause,
} from "react-icons/fa";
import { format } from "date-fns";
import { Button } from "@/components/ui";

const AttendanceCard = () => {
  const {
    todayAttendance,
    checkIn,
    checkOut,
    startBreak,
    endBreak,
    isCheckedIn,
    isCheckedOut,
    isOnBreak,
    sessionStartTime,
    loading,
  } = useAttendance();

  const [note, setNote] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [elapsedTime, setElapsedTime] = useState("00:00:00");
  const [totalWorkTime, setTotalWorkTime] = useState(0); // in seconds
  const [breakStartTime, setBreakStartTime] = useState(null);
  const [totalBreakTime, setTotalBreakTime] = useState(0); // in seconds

  // Calculate total worked time excluding breaks
  useEffect(() => {
    if (todayAttendance) {
      // Calculate total work time from check-in to now minus breaks
      const calculateWorkTime = () => {
        const checkInTime = new Date(todayAttendance.checkIn?.time).getTime();
        const now = new Date().getTime();

        // Calculate total break time
        let breakTotal = 0;
        if (todayAttendance.breaks?.length > 0) {
          todayAttendance.breaks.forEach((breakItem) => {
            if (breakItem.endTime) {
              // Completed break
              const breakStart = new Date(breakItem.startTime).getTime();
              const breakEnd = new Date(breakItem.endTime).getTime();
              breakTotal += (breakEnd - breakStart) / 1000;
            } else if (breakItem.startTime && !breakItem.endTime) {
              // Ongoing break - don't add to total, but store start time for timer
              setBreakStartTime(new Date(breakItem.startTime).getTime());
            }
          });
        }

        setTotalBreakTime(breakTotal);

        // Calculate work time
        if (!isOnBreak && !isCheckedOut) {
          // Not on break and not checked out - timer should run
          const workSeconds = (now - checkInTime) / 1000 - breakTotal;
          setTotalWorkTime(Math.max(0, workSeconds));
        }
      };

      calculateWorkTime();

      // Update every second
      const timer = setInterval(() => {
        setCurrentTime(new Date());
        if (!isOnBreak && !isCheckedOut) {
          calculateWorkTime();
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [todayAttendance, isOnBreak, isCheckedOut]);

  // Handle break start
  useEffect(() => {
    if (isOnBreak && todayAttendance) {
      // Find the current ongoing break
      const currentBreak = todayAttendance.breaks?.find((b) => !b.endTime);
      if (currentBreak) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setBreakStartTime(new Date(currentBreak.startTime).getTime());
      }
    }
  }, [isOnBreak, todayAttendance]);

  // Format time as HH:MM:SS
  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // Calculate current break duration
  const getCurrentBreakDuration = () => {
    if (isOnBreak && breakStartTime) {
      const now = new Date().getTime();
      const breakSeconds = (now - breakStartTime) / 1000;
      return formatTime(breakSeconds);
    }
    return "00:00:00";
  };

  const formatTimeAMPM = (date) => {
    return date ? format(new Date(date), "hh:mm:ss a") : "--:--:--";
  };

  const handleCheckIn = async () => {
    try {
      await checkIn({ note });
      setNote("");
      setShowNoteInput(false);
    } catch (error) {
      // Error is already handled in context
    }
  };

  const handleCheckOut = async () => {
    try {
      await checkOut({ note });
      setNote("");
      setShowNoteInput(false);
    } catch (error) {
      // Error is already handled in context
    }
  };

  const handleStartBreak = async () => {
    try {
      await startBreak();
    } catch (error) {
      // Error is already handled in context
    }
  };

  const handleEndBreak = async () => {
    try {
      await endBreak();
      setBreakStartTime(null);
    } catch (error) {
      // Error is already handled in context
    }
  };

  // If checked in but page refreshed, show message
  if (isCheckedIn && !todayAttendance) {
    return (
      <div className="card bg-gradient-to-br from-primary-50 to-white">
        <h2 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
          <FaClock className="mr-2 text-primary-600" />
          Today's Attendance
        </h2>
        <div className="text-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Restoring your session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-gradient-to-br from-primary-50 to-white">
      <h2 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
        <FaClock className="mr-2 text-primary-600" />
        Today's Attendance
      </h2>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <p className="text-xs text-gray-500">Check In</p>
          <p className="text-lg font-semibold text-green-600">
            {formatTimeAMPM(todayAttendance?.checkIn?.time)}
          </p>
          {todayAttendance?.checkIn?.location && (
            <p className="mt-1 flex items-center text-xs text-gray-400">
              <FaMapMarkerAlt className="mr-1" /> Location recorded
            </p>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <p className="text-xs text-gray-500">Check Out</p>
          <p className="text-lg font-semibold text-red-600">
            {formatTimeAMPM(todayAttendance?.checkOut?.time)}
          </p>
        </div>
      </div>

      {isCheckedIn && !isCheckedOut && (
        <div className="space-y-3 mb-4">
          {/* Main Work Timer */}
          <div
            className={`rounded-lg p-4 ${isOnBreak ? "bg-gray-100" : "bg-blue-50"}`}
          >
            <div className="flex items-center justify-between mb-1">
              <p
                className={`text-sm font-medium ${isOnBreak ? "text-gray-600" : "text-blue-700"}`}
              >
                {isOnBreak
                  ? "Work paused (on break)"
                  : "Working duration"}
              </p>
              {isOnBreak && (
                <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-700">
                  Break Active
                </span>
              )}
            </div>
            <p
              className={`font-mono text-3xl font-bold ${isOnBreak ? "text-gray-500" : "text-blue-800"}`}
            >
              {formatTime(totalWorkTime)}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Total work time (excluding breaks)
            </p>
          </div>

          {/* Break Timer - Only shown when on break */}
          {isOnBreak && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
              <div className="flex items-center justify-between">
                <p className="flex items-center text-sm font-medium text-yellow-700">
                  <FaCoffee className="mr-2" /> Break duration
                </p>
                <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-700">
                  On Break
                </span>
              </div>
              <p className="mt-1 font-mono text-2xl font-bold text-yellow-600">
                {getCurrentBreakDuration()}
              </p>
            </div>
          )}

          {/* Break Summary */}
          {totalBreakTime > 0 && (
            <div className="flex justify-between text-xs text-gray-500">
              <span>Total break time today:</span>
              <span className="font-medium">{formatTime(totalBreakTime)}</span>
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        {!isCheckedIn && (
          <div>
            {showNoteInput ? (
              <div className="space-y-2">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a note (optional)"
                  className="input-field"
                  rows="2"
                />
                <div className="flex space-x-2">
                  <Button
                    onClick={handleCheckIn}
                    disabled={loading}
                    className="flex-1 btn-primary flex items-center justify-center space-x-2"
                  >
                    <FaSignInAlt />
                    <span>
                      {loading ? "Processing..." : "Confirm Check In"}
                    </span>
                  </Button>
                  <Button
                    onClick={() => setShowNoteInput(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => setShowNoteInput(true)}
                className="w-full btn-primary flex items-center justify-center space-x-2"
              >
                <FaSignInAlt />
                <span>Check In</span>
              </Button>
            )}
          </div>
        )}

        {isCheckedIn && !isCheckedOut && (
          <div className="space-y-2">
            {isOnBreak ? (
              <Button
                onClick={handleEndBreak}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2"
              >
                <FaPlay />
                <span>Resume Work</span>
              </Button>
            ) : (
              <Button
                onClick={handleStartBreak}
                className="w-full bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 flex items-center justify-center space-x-2"
              >
                <FaPause />
                <span>Start Break</span>
              </Button>
            )}

            {showNoteInput ? (
              <div className="space-y-2">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add checkout note (optional)"
                  className="input-field"
                  rows="2"
                />
                <div className="flex space-x-2">
                  <Button
                    onClick={handleCheckOut}
                    disabled={loading}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center justify-center space-x-2"
                  >
                    <FaSignOutAlt />
                    <span>
                      {loading ? "Processing..." : "Confirm Check Out"}
                    </span>
                  </Button>
                  <Button
                    onClick={() => setShowNoteInput(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => setShowNoteInput(true)}
                className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center justify-center space-x-2"
              >
                <FaSignOutAlt />
                <span>Check Out</span>
              </Button>
            )}
          </div>
        )}

        {isCheckedOut && (
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <FaCheckCircle className="mx-auto text-green-500 text-3xl mb-2" />
            <p className="text-gray-700">You have completed your day</p>
            {todayAttendance?.workHours && (
              <div className="mt-2 text-sm">
                <p className="text-gray-600">
                  Total work hours: {todayAttendance.workHours.toFixed(2)} hrs
                </p>
                {totalBreakTime > 0 && (
                  <p className="text-xs text-gray-500">
                    Breaks: {formatTime(totalBreakTime)}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceCard;
