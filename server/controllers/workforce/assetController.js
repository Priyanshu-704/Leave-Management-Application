const Asset = require("../../models/Asset");
const AssetAllocation = require("../../models/AssetAllocation");
const { sendCsv } = require("../workforceUtils");

exports.listAssets = async (req, res) => {
  try {
    const assets = await Asset.find().sort({ createdAt: -1 });
    res.json(assets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createAsset = async (req, res) => {
  try {
    const asset = await Asset.create(req.body);
    res.status(201).json(asset);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.allocateAsset = async (req, res) => {
  try {
    const { assetId, employeeId, expectedReturnDate } = req.body;
    const asset = await Asset.findById(assetId);

    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }
    if (asset.status === "allocated") {
      return res.status(400).json({ message: "Asset already allocated" });
    }

    const allocation = await AssetAllocation.create({
      asset: assetId,
      employee: employeeId,
      expectedReturnDate,
      status: "allocated",
    });

    asset.status = "allocated";
    await asset.save();

    res.status(201).json(allocation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.returnAsset = async (req, res) => {
  try {
    const allocation = await AssetAllocation.findById(req.params.id).populate("asset");

    if (!allocation) {
      return res.status(404).json({ message: "Asset allocation not found" });
    }

    if (allocation.status === "returned") {
      return res.status(400).json({ message: "Asset already returned" });
    }

    allocation.status = "returned";
    allocation.returnedOn = new Date();
    allocation.returnReason = req.body.returnReason || "Returned";
    await allocation.save();

    if (allocation.asset) {
      allocation.asset.status = "available";
      await allocation.asset.save();
    }

    res.json(allocation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.listAssetAllocations = async (req, res) => {
  try {
    const query = {};
    if (req.query.status && req.query.status !== "all") {
      query.status = req.query.status;
    }

    const allocations = await AssetAllocation.find(query)
      .populate("asset", "assetCode name category status")
      .populate("employee", "name employeeId department")
      .sort({ createdAt: -1 });

    res.json(allocations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.exportAssetAllocations = async (req, res) => {
  try {
    const allocations = await AssetAllocation.find()
      .populate("asset", "assetCode name category")
      .populate("employee", "name employeeId department")
      .sort({ createdAt: -1 });

    return sendCsv(
      res,
      `asset-allocations-${new Date().toISOString().slice(0, 10)}.csv`,
      ["assetCode", "assetName", "employeeId", "employeeName", "department", "allocatedOn", "status", "returnedOn"],
      allocations.map((item) => ({
        assetCode: item.asset?.assetCode,
        assetName: item.asset?.name,
        employeeId: item.employee?.employeeId,
        employeeName: item.employee?.name,
        department: item.employee?.department,
        allocatedOn: item.allocatedOn?.toISOString().slice(0, 10),
        status: item.status,
        returnedOn: item.returnedOn ? item.returnedOn.toISOString().slice(0, 10) : "",
      })),
    );
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
