const Notification = require("../models/Notification");
const User = require("../models/User");
const Attendance = require("../models/Attendance");
const {
  SHIFT_START_TIME,
  SHIFT_END_TIME,
  CHECKIN_REMINDER_AFTER_MINUTES,
  CHECKOUT_REMINDER_BEFORE_MINUTES,
} = require("../config/appConfig");

const toDateKey = (date) => new Date(date).toISOString().slice(0, 10);

const createNotificationIfMissing = async ({ userId, uniqueKey, type, title, message, meta = {} }) => {
  try {
    await Notification.create({
      user: userId,
      uniqueKey,
      type,
      title,
      message,
      meta,
    });
  } catch (error) {
    if (error?.code !== 11000) {
      throw error;
    }
  }
};

const isSameMonthDay = (dateValue, today) => {
  if (!dateValue) return false;
  const date = new Date(dateValue);
  return date.getUTCMonth() === today.getUTCMonth() && date.getUTCDate() === today.getUTCDate();
};

const ensureSystemNotificationsForUser = async (user) => {
  if (!user?._id) return;

  const now = new Date();
  const dateKey = toDateKey(now);

  // Check-in reminder after configured minutes from shift start
  const checkInReminderTime = new Date(now);
  checkInReminderTime.setHours(
    SHIFT_START_TIME.hour,
    SHIFT_START_TIME.minute + CHECKIN_REMINDER_AFTER_MINUTES,
    0,
    0,
  );

  // Check-out reminder before configured minutes to shift end
  const checkOutReminderTime = new Date(now);
  checkOutReminderTime.setHours(
    SHIFT_END_TIME.hour,
    SHIFT_END_TIME.minute - CHECKOUT_REMINDER_BEFORE_MINUTES,
    0,
    0,
  );

  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const todayAttendance = await Attendance.findOne({
    employee: user._id,
    date: { $gte: startOfDay, $lte: endOfDay },
  });

  if (now >= checkInReminderTime && !todayAttendance?.checkIn?.time) {
    await createNotificationIfMissing({
      userId: user._id,
      uniqueKey: `checkin-reminder-${dateKey}`,
      type: "reminder",
      title: "Check-In Reminder",
      message: "You have not checked in yet. Please check in as soon as possible.",
      meta: { category: "attendance" },
    });
  }

  if (now >= checkOutReminderTime && todayAttendance?.checkIn?.time && !todayAttendance?.checkOut?.time) {
    await createNotificationIfMissing({
      userId: user._id,
      uniqueKey: `checkout-reminder-${dateKey}`,
      type: "reminder",
      title: "Check-Out Reminder",
      message: "Shift is closing in 10 minutes. Please complete your check-out.",
      meta: { category: "attendance" },
    });
  }

  // Birthday and anniversary celebrations (team notifications)
  const teamUsers = await User.find({ isActive: true }).select("_id name dateOfBirth joiningDate");
  const birthdayNames = teamUsers.filter((u) => isSameMonthDay(u.dateOfBirth, now)).map((u) => u.name);
  const anniversaryNames = teamUsers.filter((u) => isSameMonthDay(u.joiningDate, now)).map((u) => u.name);

  if (birthdayNames.length) {
    await createNotificationIfMissing({
      userId: user._id,
      uniqueKey: `birthday-${dateKey}`,
      type: "celebration",
      title: "Birthday Celebration",
      message: `Wish happy birthday to: ${birthdayNames.join(", ")}`,
      meta: { category: "celebration", names: birthdayNames },
    });
  }

  if (anniversaryNames.length) {
    await createNotificationIfMissing({
      userId: user._id,
      uniqueKey: `anniversary-${dateKey}`,
      type: "celebration",
      title: "Work Anniversary Celebration",
      message: `Celebrate work anniversaries: ${anniversaryNames.join(", ")}`,
      meta: { category: "celebration", names: anniversaryNames },
    });
  }
};

exports.ensureSystemNotificationsForUser = ensureSystemNotificationsForUser;

exports.getNotifications = async (req, res) => {
  try {
    await ensureSystemNotificationsForUser(req.user);

    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(Number(req.query.limit || 30));

    const unreadCount = await Notification.countDocuments({ user: req.user.id, isRead: false });

    res.json({ notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { isRead: true },
      { new: true },
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markAllNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user.id, isRead: false }, { isRead: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
