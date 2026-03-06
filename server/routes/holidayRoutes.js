const express = require("express");
const { protect, authorizeFeature } = require("../middleware/auth");
const { getHolidayWeekend, updateWeekendDays, createHoliday, updateHoliday, deleteHoliday } = require("../controllers/workforce/holidayController");

const router = express.Router();

router.use(protect);

router.get("/", authorizeFeature("weekendHoliday"), getHolidayWeekend);
router.put("/weekends", authorizeFeature("weekendHoliday"), updateWeekendDays);
router.post("/", authorizeFeature("weekendHoliday"), createHoliday);
router.put("/:id", authorizeFeature("weekendHoliday"), updateHoliday);
router.delete("/:id", authorizeFeature("weekendHoliday"), deleteHoliday);

module.exports = router;
