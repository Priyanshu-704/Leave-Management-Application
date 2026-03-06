const express = require("express");
const { protect, authorizeFeature } = require("../middleware/auth");
const { validate } = require("../middleware/joiValidation");
const { wfhCreateSchema, wfhStatusSchema } = require("../validators/workforceValidators");
const { requestWfh, getWfhRequests, updateWfhStatus, exportWfh } = require("../controllers/workforce/wfhController");

const router = express.Router();

router.use(protect);

router.post("/", authorizeFeature("requestWfh"), validate(wfhCreateSchema), requestWfh);
router.get("/", authorizeFeature("requestWfh"), getWfhRequests);
router.put("/:id/status", authorizeFeature("requestWfh"), validate(wfhStatusSchema), updateWfhStatus);
router.get("/export", authorizeFeature("requestWfh"), exportWfh);

module.exports = router;
