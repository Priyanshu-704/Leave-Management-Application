const InventoryItem = require("../../models/InventoryItem");
const { sendCsv } = require("../workforceUtils");

exports.listInventory = async (req, res) => {
  try {
    const inventory = await InventoryItem.find().sort({ createdAt: -1 });
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createInventoryItem = async (req, res) => {
  try {
    const item = await InventoryItem.create(req.body);
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateInventoryItem = async (req, res) => {
  try {
    const item = await InventoryItem.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) {
      return res.status(404).json({ message: "Inventory item not found" });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.exportInventory = async (req, res) => {
  try {
    const items = await InventoryItem.find().sort({ name: 1 });
    return sendCsv(
      res,
      `inventory-${new Date().toISOString().slice(0, 10)}.csv`,
      ["sku", "name", "category", "quantity", "reorderLevel", "unitCost"],
      items,
    );
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
