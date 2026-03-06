const Holiday = require("../../models/Holiday");
const { getDefaultPolicy } = require("../workforceUtils");

exports.getHolidayWeekend = async (req, res) => {
  try {
    const policy = await getDefaultPolicy();
    const holidays = await Holiday.find().sort({ date: 1 });
    res.json({
      weekendDays: policy.holidayWeekend?.weekendDays || [0, 6],
      holidays,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateWeekendDays = async (req, res) => {
  try {
    const { weekendDays } = req.body;
    if (!Array.isArray(weekendDays)) {
      return res.status(400).json({ message: "weekendDays must be an array" });
    }

    const policy = await getDefaultPolicy();
    policy.holidayWeekend.weekendDays = weekendDays.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
    await policy.save();

    res.json({ success: true, data: policy.holidayWeekend });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createHoliday = async (req, res) => {
  try {
    const holiday = await Holiday.create(req.body);
    res.status(201).json(holiday);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateHoliday = async (req, res) => {
  try {
    const holiday = await Holiday.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!holiday) {
      return res.status(404).json({ message: "Holiday not found" });
    }
    res.json(holiday);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteHoliday = async (req, res) => {
  try {
    const holiday = await Holiday.findByIdAndDelete(req.params.id);
    if (!holiday) {
      return res.status(404).json({ message: "Holiday not found" });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
