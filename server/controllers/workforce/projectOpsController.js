const Project = require("../../models/Project");
const ProjectAllocation = require("../../models/ProjectAllocation");
const ProjectTask = require("../../models/ProjectTask");
const TimesheetEntry = require("../../models/TimesheetEntry");
const ProjectBilling = require("../../models/ProjectBilling");
const ResourcePlan = require("../../models/ResourcePlan");
const Milestone = require("../../models/Milestone");
const { sendCsv, startEndFromMonth } = require("../workforceUtils");

exports.listProjects = async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createProject = async (req, res) => {
  try {
    const project = await Project.create(req.body);
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.listProjectAllocations = async (req, res) => {
  try {
    const allocations = await ProjectAllocation.find()
      .populate("project", "code name")
      .populate("employee", "name employeeId department")
      .sort({ createdAt: -1 });
    res.json(allocations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createProjectAllocation = async (req, res) => {
  try {
    const allocation = await ProjectAllocation.create(req.body);
    res.status(201).json(allocation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.listTasks = async (req, res) => {
  try {
    const query = {};
    if (req.query.projectId) {
      query.project = req.query.projectId;
    }
    if (req.query.assignedTo) {
      query.assignedTo = req.query.assignedTo;
    }

    const tasks = await ProjectTask.find(query)
      .populate("project", "code name")
      .populate("assignedTo", "name employeeId department")
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createTask = async (req, res) => {
  try {
    const task = await ProjectTask.create(req.body);
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const task = await ProjectTask.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.listTimesheets = async (req, res) => {
  try {
    const query = {};
    if (req.user.role === "employee") {
      query.employee = req.user.id;
    }
    if (req.query.employeeId) {
      query.employee = req.query.employeeId;
    }
    if (req.query.projectId) {
      query.project = req.query.projectId;
    }

    const rows = await TimesheetEntry.find(query)
      .populate("employee", "name employeeId department")
      .populate("project", "code name")
      .populate("task", "title")
      .sort({ date: -1, createdAt: -1 });

    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createTimesheet = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (req.user.role === "employee") {
      payload.employee = req.user.id;
    }

    const row = await TimesheetEntry.create(payload);
    res.status(201).json(row);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.exportTimesheets = async (req, res) => {
  try {
    const rows = await TimesheetEntry.find()
      .populate("employee", "name employeeId department")
      .populate("project", "code name")
      .populate("task", "title")
      .sort({ date: -1 });

    return sendCsv(
      res,
      `timesheets-${new Date().toISOString().slice(0, 10)}.csv`,
      ["date", "employeeId", "employeeName", "projectCode", "projectName", "task", "hours", "billingStatus", "notes"],
      rows.map((item) => ({
        date: item.date?.toISOString().slice(0, 10),
        employeeId: item.employee?.employeeId,
        employeeName: item.employee?.name,
        projectCode: item.project?.code,
        projectName: item.project?.name,
        task: item.task?.title,
        hours: item.hours,
        billingStatus: item.billingStatus,
        notes: item.notes,
      })),
    );
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.listBillings = async (req, res) => {
  try {
    const rows = await ProjectBilling.find()
      .populate("project", "code name clientName")
      .sort({ month: -1 });
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createBilling = async (req, res) => {
  try {
    const { project, month, ratePerHour = 0, invoiceNumber = "", status = "draft" } = req.body;
    const range = startEndFromMonth(month);

    if (!range) {
      return res.status(400).json({ message: "month must be YYYY-MM" });
    }

    const entries = await TimesheetEntry.find({
      project,
      billingStatus: "billable",
      date: { $gte: range.start, $lte: range.end },
    });

    const billedHours = Number(entries.reduce((sum, item) => sum + (item.hours || 0), 0).toFixed(2));
    const amount = Number((billedHours * Number(ratePerHour || 0)).toFixed(2));

    const billing = await ProjectBilling.create({
      project,
      month,
      billedHours,
      ratePerHour,
      amount,
      invoiceNumber,
      status,
    });

    res.status(201).json(billing);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.exportBillings = async (req, res) => {
  try {
    const rows = await ProjectBilling.find().populate("project", "code name clientName");
    return sendCsv(
      res,
      `project-billing-${new Date().toISOString().slice(0, 10)}.csv`,
      ["month", "projectCode", "projectName", "clientName", "billedHours", "ratePerHour", "amount", "invoiceNumber", "status"],
      rows.map((item) => ({
        month: item.month,
        projectCode: item.project?.code,
        projectName: item.project?.name,
        clientName: item.project?.clientName,
        billedHours: item.billedHours,
        ratePerHour: item.ratePerHour,
        amount: item.amount,
        invoiceNumber: item.invoiceNumber,
        status: item.status,
      })),
    );
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.listResourcePlans = async (req, res) => {
  try {
    const rows = await ResourcePlan.find()
      .populate("project", "code name")
      .populate("employee", "name employeeId department")
      .sort({ month: -1, createdAt: -1 });

    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createResourcePlan = async (req, res) => {
  try {
    const row = await ResourcePlan.create(req.body);
    res.status(201).json(row);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.listMilestones = async (req, res) => {
  try {
    const query = {};
    if (req.query.projectId) {
      query.project = req.query.projectId;
    }

    const rows = await Milestone.find(query)
      .populate("project", "code name")
      .sort({ dueDate: 1, createdAt: -1 });

    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createMilestone = async (req, res) => {
  try {
    const row = await Milestone.create(req.body);
    res.status(201).json(row);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateMilestone = async (req, res) => {
  try {
    const row = await Milestone.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!row) {
      return res.status(404).json({ message: "Milestone not found" });
    }
    res.json(row);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getGanttData = async (req, res) => {
  try {
    const projects = await Project.find();
    const milestones = await Milestone.find().populate("project", "code name");
    const tasks = await ProjectTask.find().populate("project", "code name");

    const data = projects.map((project) => ({
      projectId: project._id,
      projectCode: project.code,
      projectName: project.name,
      startDate: project.startDate,
      endDate: project.endDate,
      milestones: milestones
        .filter((m) => String(m.project?._id) === String(project._id))
        .map((m) => ({
          id: m._id,
          title: m.title,
          startDate: m.startDate,
          dueDate: m.dueDate,
          completionPercent: m.completionPercent,
          status: m.status,
        })),
      tasks: tasks
        .filter((t) => String(t.project?._id) === String(project._id))
        .map((t) => ({
          id: t._id,
          title: t.title,
          dueDate: t.dueDate,
          status: t.status,
          priority: t.priority,
          estimatedHours: t.estimatedHours,
        })),
    }));

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCapacityPlanning = async (req, res) => {
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 7);
    const plans = await ResourcePlan.find({ month }).populate("employee", "name employeeId department");
    const timesheets = await TimesheetEntry.find({
      date: {
        $gte: new Date(`${month}-01T00:00:00.000Z`),
        $lte: new Date(`${month}-31T23:59:59.999Z`),
      },
    }).populate("employee", "name employeeId department");

    const byEmployee = new Map();

    plans.forEach((plan) => {
      const key = String(plan.employee?._id);
      if (!key) return;
      byEmployee.set(key, {
        employeeId: plan.employee.employeeId,
        name: plan.employee.name,
        department: plan.employee.department,
        plannedHours: (byEmployee.get(key)?.plannedHours || 0) + (plan.plannedHours || 0),
        actualHours: byEmployee.get(key)?.actualHours || 0,
      });
    });

    timesheets.forEach((row) => {
      const key = String(row.employee?._id);
      if (!key) return;
      byEmployee.set(key, {
        employeeId: row.employee.employeeId,
        name: row.employee.name,
        department: row.employee.department,
        plannedHours: byEmployee.get(key)?.plannedHours || 0,
        actualHours: (byEmployee.get(key)?.actualHours || 0) + (row.hours || 0),
      });
    });

    const result = Array.from(byEmployee.values()).map((item) => ({
      ...item,
      varianceHours: Number((item.actualHours - item.plannedHours).toFixed(2)),
      utilizationPercent: item.plannedHours > 0 ? Number(((item.actualHours / item.plannedHours) * 100).toFixed(2)) : 0,
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.exportCapacityPlanning = async (req, res) => {
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 7);

    const plans = await ResourcePlan.find({ month }).populate("employee", "name employeeId department");
    const timesheets = await TimesheetEntry.find({
      date: {
        $gte: new Date(`${month}-01T00:00:00.000Z`),
        $lte: new Date(`${month}-31T23:59:59.999Z`),
      },
    }).populate("employee", "name employeeId department");

    const map = new Map();

    plans.forEach((plan) => {
      const key = String(plan.employee?._id);
      if (!key) return;
      map.set(key, {
        employeeId: plan.employee?.employeeId,
        name: plan.employee?.name,
        department: plan.employee?.department,
        plannedHours: (map.get(key)?.plannedHours || 0) + (plan.plannedHours || 0),
        actualHours: map.get(key)?.actualHours || 0,
      });
    });

    timesheets.forEach((row) => {
      const key = String(row.employee?._id);
      if (!key) return;
      map.set(key, {
        employeeId: row.employee?.employeeId,
        name: row.employee?.name,
        department: row.employee?.department,
        plannedHours: map.get(key)?.plannedHours || 0,
        actualHours: (map.get(key)?.actualHours || 0) + (row.hours || 0),
      });
    });

    const rows = Array.from(map.values()).map((item) => ({
      ...item,
      varianceHours: Number((item.actualHours - item.plannedHours).toFixed(2)),
      utilizationPercent: item.plannedHours > 0 ? Number(((item.actualHours / item.plannedHours) * 100).toFixed(2)) : 0,
    }));

    return sendCsv(
      res,
      `capacity-planning-${month}.csv`,
      ["employeeId", "name", "department", "plannedHours", "actualHours", "varianceHours", "utilizationPercent"],
      rows,
    );
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
