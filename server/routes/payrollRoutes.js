const express = require("express");
const { protect, authorizeFeature } = require("../middleware/auth");
const { validate } = require("../middleware/joiValidation");
const { salaryGenerateSchema } = require("../validators/workforceValidators");
const { getPayrollPolicy, updatePayrollPolicy, generateSalary, getSalarySlips, exportSalarySlips } = require("../controllers/workforce/payrollController");

const router = express.Router();

router.use(protect);

router.get("/policy", authorizeFeature("salaryCalculation"), getPayrollPolicy);
router.put("/policy", authorizeFeature("salaryCalculation"), updatePayrollPolicy);
router.get("/salary-slips", authorizeFeature("salarySlips"), getSalarySlips);
router.post("/salary-slips/generate", authorizeFeature("salaryCalculation"), validate(salaryGenerateSchema), generateSalary);
router.get("/salary-slips/export", authorizeFeature("salaryCalculation"), exportSalarySlips);

module.exports = router;
