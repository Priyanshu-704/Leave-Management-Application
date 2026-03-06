const express = require("express");
const { protect } = require("../middleware/auth");
const { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } = require("../controllers/notificationController");

const router = express.Router();

router.use(protect);

router.get("/", getNotifications);
router.put("/:id/read", markNotificationAsRead);
router.put("/read-all", markAllNotificationsAsRead);

module.exports = router;
