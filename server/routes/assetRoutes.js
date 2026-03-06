const express = require("express");
const { protect, authorizeFeature } = require("../middleware/auth");
const { listAssets, createAsset, allocateAsset, returnAsset, listAssetAllocations, exportAssetAllocations } = require("../controllers/workforce/assetController");

const router = express.Router();

router.use(protect);

router.get("/", authorizeFeature("companyAssets"), listAssets);
router.post("/", authorizeFeature("companyAssets"), createAsset);
router.get("/allocations", authorizeFeature("assetTracking"), listAssetAllocations);
router.post("/allocate", authorizeFeature("assetTracking"), allocateAsset);
router.put("/allocations/:id/return", authorizeFeature("assetReturnExit"), returnAsset);
router.get("/allocations/export", authorizeFeature("assetTracking"), exportAssetAllocations);

module.exports = router;
