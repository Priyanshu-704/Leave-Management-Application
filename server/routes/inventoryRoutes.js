const express = require("express");
const { protect, authorizeFeature } = require("../middleware/auth");
const { listInventory, createInventoryItem, updateInventoryItem, exportInventory } = require("../controllers/workforce/inventoryController");

const router = express.Router();

router.use(protect);

router.get("/", authorizeFeature("inventoryManagement"), listInventory);
router.post("/", authorizeFeature("inventoryManagement"), createInventoryItem);
router.put("/:id", authorizeFeature("inventoryManagement"), updateInventoryItem);
router.get("/export", authorizeFeature("inventoryManagement"), exportInventory);

module.exports = router;
