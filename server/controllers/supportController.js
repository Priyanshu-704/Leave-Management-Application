const Notification = require("../models/Notification");
const User = require("../models/User");

exports.contactAdministrator = async (req, res) => {
  try {
    const { subject, message, priority = "normal" } = req.body;

    const admins = await User.find({
      role: { $in: ["admin", "super_admin"] },
      isActive: true,
    }).select("_id");

    if (!admins.length) {
      return res.status(404).json({ message: "No administrator is currently available" });
    }

    await Promise.all(
      admins.map((admin) =>
        Notification.create({
          user: admin._id,
          type: "info",
          title: `Contact Request: ${subject}`,
          message,
          meta: {
            priority,
            senderId: req.user.id,
            senderName: req.user.name,
            senderEmail: req.user.email,
          },
        }),
      ),
    );

    return res.status(201).json({ success: true, message: "Message sent to administrator" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
