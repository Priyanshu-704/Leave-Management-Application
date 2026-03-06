import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Button, Input, Select, Option } from "@/components/ui";
import PageSkeleton from "@/components/PageSkeleton";
import { useAuth } from "@/context/AuthContext";
import { leaveService, userService, workforceService } from "@/services/api";
import { z } from "zod";
import useBodyScrollLock from "@/hooks/useBodyScrollLock";

const triggerDownload = (response, fallbackName) => {
  const blob = new Blob([response.data], { type: response.headers?.["content-type"] || "application/octet-stream" });
  const link = document.createElement("a");
  const url = window.URL.createObjectURL(blob);
  const contentDisposition = response.headers?.["content-disposition"] || "";
  const match = contentDisposition.match(/filename="?([^";]+)"?/i);
  link.href = url;
  link.download = match?.[1] || fallbackName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const Section = ({ title, children, actions }) => (
  <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      {actions}
    </div>
    {children}
  </div>
);

const Dialog = ({ isOpen, title, onClose, children }) => {
  useBodyScrollLock(isOpen);
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-gray-200 bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <Button className="px-2 py-1 text-sm text-gray-500" onClick={onClose}>Close</Button>
        </div>
        {children}
      </div>
    </div>
  );
};

const DataTable = ({ columns, rows }) => (
  <div className="overflow-x-auto rounded-lg border border-gray-200">
    <table className="min-w-full text-sm">
      <thead className="bg-gray-50 text-gray-700">
        <tr>
          {columns.map((col) => (
            <th key={col.key} className="text-left px-3 py-2 font-semibold">{col.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length ? rows.map((row, index) => (
          <tr key={row._id || index} className="border-t border-gray-100">
            {columns.map((col) => (
              <td key={`${row._id || index}-${col.key}`} className="px-3 py-2 text-gray-700">
                {col.render ? col.render(row[col.key], row) : row[col.key] ?? "-"}
              </td>
            ))}
          </tr>
        )) : (
          <tr>
            <td colSpan={columns.length} className="px-3 py-5 text-center text-gray-500">No records found.</td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toISOString().slice(0, 10);
};

const wfhRequestSchema = z.object({
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  reason: z.string().trim().min(3, "Reason is required"),
});

const salaryGenerateSchema = z.object({
  userId: z.string().min(1, "Employee is required"),
  month: z.string().min(1, "Month is required"),
  baseSalary: z.number().nonnegative("Base salary must be positive"),
});

const featureMeta = {
  geofencedCheckIn: {
    title: "GeoFenced Check-In (Office Location)",
    description: "Configure office geo-fence and validate location range before check-in.",
  },
  weekendHoliday: {
    title: "Weekend and Holiday Maintain",
    description: "Manage weekend rules and holiday calendar used across attendance and leave calculations.",
  },
  checkInControl: {
    title: "Control Checked-In",
    description: "Enable or disable check-in system for all employees.",
  },
  requestWfh: {
    title: "Request Work from Home",
    description: "Submit and approve WFH requests with status tracking and export.",
  },
  salarySlips: {
    title: "View Salary Slips",
    description: "View and export salary slips. Managers can generate monthly salary slips.",
  },
  automaticLeaveApproval: {
    title: "Automatic Leave Approval",
    description: "Set auto-approval policy by leave type and max days.",
  },
  leaveDeduction: {
    title: "Leave Deduction Calculation",
    description: "Review deducted leave days after excluding weekends and holidays.",
  },
  salaryCalculation: {
    title: "Salary Calculation (Attendance + Overtime + Short Time)",
    description: "Set payroll multipliers and generate salary based on attendance metrics.",
  },
  companyAssets: {
    title: "Company Assets",
    description: "Maintain company-owned assets inventory.",
  },
  assetTracking: {
    title: "Assets Allocation Tracking",
    description: "Allocate assets to employees and export allocation reports.",
  },
  assetReturnExit: {
    title: "Assets Return on Exit",
    description: "Track and process asset returns during offboarding.",
  },
  inventoryManagement: {
    title: "Inventory Management",
    description: "Manage stock quantities and export inventory reports.",
  },
  projectAllocation: {
    title: "Project Allocation",
    description: "Allocate employees to projects with allocation percentages.",
  },
  taskAssignment: {
    title: "Task Assignment",
    description: "Create tasks and assign to project resources.",
  },
  timesheetEntry: {
    title: "Timesheet Entry",
    description: "Log effort per project/task and export timesheet report.",
  },
  projectBilling: {
    title: "Project Billing",
    description: "Generate billing based on billable timesheet hours and export reports.",
  },
  resourcePlanning: {
    title: "Resource Planning",
    description: "Plan monthly effort allocation for resources.",
  },
  milestoneTracking: {
    title: "Milestone Tracking",
    description: "Create milestones and monitor progress per project.",
  },
  ganttChart: {
    title: "Gantt Chart",
    description: "View project timelines from project, milestone, and task data.",
  },
  capacityPlanning: {
    title: "Capacity Planning",
    description: "Compare planned vs actual capacity and export utilization report.",
  },
};

const WorkforceModulePage = ({ featureKey }) => {
  const meta = featureMeta[featureKey] || { title: "Workforce Module", description: "" };
  const { isAdmin, isManager, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [state, setState] = useState({
    policy: null,
    leavePolicy: null,
    payrollPolicy: null,
    holidayWeekend: null,
    wfh: [],
    salarySlips: [],
    leaves: [],
    assets: [],
    allocations: [],
    inventory: [],
    projectAllocations: [],
    timesheets: [],
    billings: [],
    resourcePlans: [],
    milestones: [],
    gantt: [],
    capacity: [],
  });

  const [form, setForm] = useState({
    geoLatitude: "",
    geoLongitude: "",
    geoRadius: "200",
    validateLatitude: "",
    validateLongitude: "",
    holidayName: "",
    holidayDate: "",
    weekendDays: [0, 6],
    checkInEnabled: true,
    wfhStartDate: "",
    wfhEndDate: "",
    wfhReason: "",
    wfhStatus: "approved",
    salaryEmployee: "",
    salaryMonth: new Date().toISOString().slice(0, 7),
    salaryBase: "0",
    leaveAutoApproveEnabled: true,
    maxAutoApproveDays: "2",
    leaveTypes: ["sick", "personal"],
    monthlyWorkingHours: "176",
    overtimeRateMultiplier: "1.5",
    shortTimePenaltyMultiplier: "1",
    assetCode: "",
    assetName: "",
    assetCategory: "general",
    assetValue: "0",
    allocateAssetId: "",
    allocateEmployeeId: "",
    allocationReturnDate: "",
    inventorySku: "",
    inventoryName: "",
    inventoryCategory: "general",
    inventoryQuantity: "0",
    inventoryReorder: "5",
    inventoryUnitCost: "0",
    projectCode: "",
    projectName: "",
    projectClient: "",
    projectAllocationProject: "",
    projectAllocationEmployee: "",
    projectAllocationPercent: "100",
    taskProject: "",
    taskTitle: "",
    taskAssignedTo: "",
    taskDueDate: "",
    taskHours: "0",
    timesheetProject: "",
    timesheetTask: "",
    timesheetDate: new Date().toISOString().slice(0, 10),
    timesheetHours: "8",
    timesheetNotes: "",
    billingProject: "",
    billingMonth: new Date().toISOString().slice(0, 7),
    billingRate: "0",
    billingInvoice: "",
    planningProject: "",
    planningEmployee: "",
    planningMonth: new Date().toISOString().slice(0, 7),
    planningHours: "0",
    planningPercent: "100",
    milestoneProject: "",
    milestoneTitle: "",
    milestoneStartDate: "",
    milestoneDueDate: "",
    milestoneCompletion: "0",
    capacityMonth: new Date().toISOString().slice(0, 7),
  });
  const [activeDialog, setActiveDialog] = useState("");
  const [selectedRow, setSelectedRow] = useState(null);
  const [returnReason, setReturnReason] = useState("Exit process");
  const openDialog = (key, row = null) => {
    setSelectedRow(row);
    setActiveDialog(key);
  };
  const closeDialog = () => {
    setActiveDialog("");
    setSelectedRow(null);
    setReturnReason("Exit process");
  };

  const canManage = isManager || isAdmin;

  const loadCommon = async () => {
    const results = await Promise.allSettled([
      userService.getUsers({ limit: 300 }),
      workforceService.getProjects(),
      workforceService.getTasks(),
    ]);

    const usersRes = results[0].status === "fulfilled" ? results[0].value : null;
    const projectsRes = results[1].status === "fulfilled" ? results[1].value : [];
    const tasksRes = results[2].status === "fulfilled" ? results[2].value : [];

    setEmployees(usersRes?.users || []);
    setProjects(projectsRes || []);
    setTasks(tasksRes || []);
  };

  const loadModule = async () => {
    const nextState = {};

    if (["geofencedCheckIn", "checkInControl"].includes(featureKey)) {
      nextState.policy = await workforceService.getAttendancePolicy();
    }
    if (featureKey === "weekendHoliday") {
      nextState.holidayWeekend = await workforceService.getHolidayWeekend();
    }
    if (featureKey === "requestWfh") {
      nextState.wfh = await workforceService.getWfh();
    }
    if (["salarySlips", "salaryCalculation"].includes(featureKey)) {
      nextState.salarySlips = await workforceService.getSalarySlips();
      nextState.payrollPolicy = await workforceService.getPayrollPolicy();
    }
    if (featureKey === "automaticLeaveApproval") {
      nextState.leavePolicy = await workforceService.getLeavePolicy();
    }
    if (featureKey === "leaveDeduction") {
      nextState.leaves = await leaveService.getMyLeaves();
    }
    if (featureKey === "companyAssets") {
      nextState.assets = await workforceService.getAssets();
    }
    if (["assetTracking", "assetReturnExit"].includes(featureKey)) {
      nextState.assets = await workforceService.getAssets();
      nextState.allocations = await workforceService.getAssetAllocations();
    }
    if (featureKey === "inventoryManagement") {
      nextState.inventory = await workforceService.getInventory();
    }
    if (featureKey === "projectAllocation") {
      nextState.projectAllocations = await workforceService.getProjectAllocations();
    }
    if (featureKey === "taskAssignment") {
      nextState.tasks = await workforceService.getTasks();
    }
    if (featureKey === "timesheetEntry") {
      nextState.timesheets = await workforceService.getTimesheets();
    }
    if (featureKey === "projectBilling") {
      nextState.billings = await workforceService.getBillings();
    }
    if (featureKey === "resourcePlanning") {
      nextState.resourcePlans = await workforceService.getResourcePlans();
    }
    if (featureKey === "milestoneTracking") {
      nextState.milestones = await workforceService.getMilestones();
    }
    if (featureKey === "ganttChart") {
      nextState.gantt = await workforceService.getGantt();
    }
    if (featureKey === "capacityPlanning") {
      nextState.capacity = await workforceService.getCapacity({ month: form.capacityMonth });
    }

    setState((prev) => ({ ...prev, ...nextState }));

    if (nextState.policy) {
      setForm((prev) => ({
        ...prev,
        checkInEnabled: nextState.policy.checkInEnabled,
        geoLatitude: nextState.policy.officeGeoFence?.latitude ?? "",
        geoLongitude: nextState.policy.officeGeoFence?.longitude ?? "",
        geoRadius: nextState.policy.officeGeoFence?.radiusMeters ?? "200",
      }));
    }

    if (nextState.holidayWeekend) {
      setForm((prev) => ({
        ...prev,
        weekendDays: nextState.holidayWeekend.weekendDays || [0, 6],
      }));
    }

    if (nextState.leavePolicy) {
      setForm((prev) => ({
        ...prev,
        leaveAutoApproveEnabled: nextState.leavePolicy.autoApproveEnabled,
        maxAutoApproveDays: nextState.leavePolicy.maxAutoApproveDays,
        leaveTypes: nextState.leavePolicy.autoApproveTypes || ["sick", "personal"],
      }));
    }

    if (nextState.payrollPolicy) {
      setForm((prev) => ({
        ...prev,
        monthlyWorkingHours: nextState.payrollPolicy.monthlyWorkingHours,
        overtimeRateMultiplier: nextState.payrollPolicy.overtimeRateMultiplier,
        shortTimePenaltyMultiplier: nextState.payrollPolicy.shortTimePenaltyMultiplier,
      }));
    }
  };

  const refresh = async () => {
    setLoading(true);
    try {
      await loadCommon();
      await loadModule();
    } catch (error) {
      toast.error(error.message || "Failed to load module");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [featureKey]);

  const employeeOptions = useMemo(() => employees.map((item) => ({
    id: item._id,
    label: `${item.name} (${item.employeeId || "N/A"})`,
  })), [employees]);

  const projectOptions = useMemo(() => projects.map((item) => ({
    id: item._id,
    label: `${item.code} - ${item.name}`,
  })), [projects]);

  if (loading) {
    return <PageSkeleton rows={6} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{meta.title}</h1>
        <p className="text-gray-600">{meta.description}</p>
      </div>

      {featureKey === "geofencedCheckIn" && (
        <Section
          title="Office Geo-Fence Setup"
          actions={
            <div className="flex gap-2">
              {canManage ? (
                <Button className="px-3 py-2 rounded-md bg-primary-600 text-white" onClick={() => openDialog("updateGeoFence")}>
                  Configure Geo-Fence
                </Button>
              ) : null}
              <Button className="px-3 py-2 rounded-md border border-gray-300" onClick={() => openDialog("validateGeoFence")}>
                Validate Coordinates
              </Button>
            </div>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-700">
            <div className="rounded-md border border-gray-200 px-3 py-2">Latitude: {form.geoLatitude || "-"}</div>
            <div className="rounded-md border border-gray-200 px-3 py-2">Longitude: {form.geoLongitude || "-"}</div>
            <div className="rounded-md border border-gray-200 px-3 py-2">Radius: {form.geoRadius || "-"} m</div>
          </div>
        </Section>
      )}

      {featureKey === "weekendHoliday" && (
        <>
          <Section title="Weekend Days">
            <div className="flex flex-wrap gap-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label, index) => (
                <label key={label} className="inline-flex items-center gap-2 text-sm text-gray-700 border border-gray-200 rounded-md px-3 py-2">
                  <Input
                    type="checkbox"
                    checked={form.weekendDays.includes(index)}
                    onChange={(e) => {
                      setForm((prev) => {
                        const set = new Set(prev.weekendDays);
                        if (e.target.checked) set.add(index);
                        else set.delete(index);
                        return { ...prev, weekendDays: Array.from(set).sort((a, b) => a - b) };
                      });
                    }}
                  />
                  {label}
                </label>
              ))}
            </div>
            {isAdmin && (
              <Button
                className="px-4 py-2 rounded-md bg-primary-600 text-white"
                onClick={async () => {
                  try {
                    await workforceService.updateWeekendDays({ weekendDays: form.weekendDays });
                    toast.success("Weekend days updated");
                    refresh();
                  } catch (error) {
                    toast.error(error.message || "Failed to update weekend days");
                  }
                }}
              >
                Save Weekend Rules
              </Button>
            )}
          </Section>

          <Section
            title="Holiday Calendar"
            actions={isAdmin ? (
              <Button className="px-3 py-2 rounded-md bg-primary-600 text-white" onClick={() => openDialog("createHoliday")}>
                Add Holiday
              </Button>
            ) : null}
          >
            <DataTable
              columns={[
                { key: "name", label: "Holiday" },
                { key: "date", label: "Date", render: (value) => formatDate(value) },
                {
                  key: "actions",
                  label: "Actions",
                  render: (_, row) => isAdmin ? (
                    <Button
                      className="text-red-600"
                      onClick={async () => {
                        try {
                          await workforceService.deleteHoliday(row._id);
                          toast.success("Holiday removed");
                          refresh();
                        } catch (error) {
                          toast.error(error.message || "Failed to remove holiday");
                        }
                      }}
                    >
                      Delete
                    </Button>
                  ) : "-",
                },
              ]}
              rows={state.holidayWeekend?.holidays || []}
            />
          </Section>
        </>
      )}

      {featureKey === "checkInControl" && (
        <Section
          title="Global Check-In Control"
          actions={isAdmin ? (
            <Button className="px-3 py-2 rounded-md bg-primary-600 text-white" onClick={() => openDialog("updateCheckInControl")}>
              Update Control
            </Button>
          ) : null}
        >
          <p className="text-sm text-gray-700">
            Status: <span className={form.checkInEnabled ? "font-semibold text-green-700" : "font-semibold text-red-700"}>{form.checkInEnabled ? "Enabled" : "Disabled"}</span>
          </p>
        </Section>
      )}

      {featureKey === "requestWfh" && (
        <>
          <Section
            title="WFH Request"
            actions={(
              <Button className="px-3 py-2 rounded-md bg-primary-600 text-white" onClick={() => openDialog("createWfhRequest")}>
                Submit WFH Request
              </Button>
            )}
          >
            <p className="text-sm text-gray-600">Use dialog to submit new WFH requests and manage pending approvals.</p>
          </Section>

          <Section
            title="WFH Requests"
            actions={canManage ? (
              <Button
                className="px-3 py-2 rounded-md border border-gray-300"
                onClick={async () => {
                  try {
                    const response = await workforceService.exportWfh();
                    triggerDownload(response, "wfh-report.csv");
                  } catch (error) {
                    toast.error(error.message || "Failed to export WFH");
                  }
                }}
              >
                Export Report
              </Button>
            ) : null}
          >
            <DataTable
              columns={[
                { key: "employee", label: "Employee", render: (_, row) => row.employee?.name || user?.name },
                { key: "startDate", label: "Start", render: (value) => formatDate(value) },
                { key: "endDate", label: "End", render: (value) => formatDate(value) },
                { key: "status", label: "Status" },
                { key: "reason", label: "Reason" },
                {
                  key: "actions",
                  label: "Actions",
                  render: (_, row) => canManage && row.status === "pending" ? (
                    <Button className="text-primary-600" onClick={() => {
                      setForm((prev) => ({ ...prev, wfhStatus: "approved" }));
                      openDialog("manageWfhRequest", row);
                    }}>Manage</Button>
                  ) : "-",
                },
              ]}
              rows={state.wfh}
            />
          </Section>
        </>
      )}

      {featureKey === "salarySlips" && (
        <Section
          title="Salary Slips"
          actions={canManage ? (
            <div className="flex gap-2">
              <Button className="px-3 py-2 rounded-md bg-primary-600 text-white" onClick={() => openDialog("generateSalarySlip")}>
                Generate
              </Button>
              <Button className="px-3 py-2 rounded-md border border-gray-300" onClick={async () => {
                const response = await workforceService.exportSalarySlips();
                triggerDownload(response, "salary-slips.csv");
              }}>
                Export Report
              </Button>
            </div>
          ) : null}
        >
          <DataTable
            columns={[
              { key: "month", label: "Month" },
              { key: "employee", label: "Employee", render: (_, row) => row.employee?.name || "-" },
              { key: "attendanceDays", label: "Attendance Days" },
              { key: "overtimeHours", label: "Overtime" },
              { key: "shortTimeHours", label: "Short Time" },
              { key: "netSalary", label: "Net Salary" },
            ]}
            rows={state.salarySlips}
          />
        </Section>
      )}

      {featureKey === "automaticLeaveApproval" && (
        <Section
          title="Auto Leave Approval Rules"
          actions={isAdmin ? (
            <Button className="px-3 py-2 rounded-md bg-primary-600 text-white" onClick={() => openDialog("updateLeavePolicy")}>
              Update Policy
            </Button>
          ) : null}
        >
          <div className="space-y-1 text-sm text-gray-700">
            <p>Auto approval: <span className="font-semibold">{form.leaveAutoApproveEnabled ? "Enabled" : "Disabled"}</span></p>
            <p>Max auto-approve days: <span className="font-semibold">{form.maxAutoApproveDays}</span></p>
            <p>Types: <span className="font-semibold">{form.leaveTypes.join(", ")}</span></p>
          </div>
        </Section>
      )}

      {featureKey === "leaveDeduction" && (
        <Section title="Leave Deduction Result">
          <DataTable
            columns={[
              { key: "leaveType", label: "Leave Type" },
              { key: "startDate", label: "Start", render: (value) => formatDate(value) },
              { key: "endDate", label: "End", render: (value) => formatDate(value) },
              { key: "days", label: "Applied Days" },
              { key: "deductedDays", label: "Deducted Days" },
              { key: "status", label: "Status" },
            ]}
            rows={state.leaves}
          />
        </Section>
      )}

      {featureKey === "salaryCalculation" && (
        <>
          <Section
            title="Payroll Formula Settings"
            actions={isAdmin ? (
              <Button className="px-3 py-2 rounded-md bg-primary-600 text-white" onClick={() => openDialog("updatePayrollPolicy")}>
                Update Payroll Policy
              </Button>
            ) : null}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-700">
              <div className="rounded-md border border-gray-200 px-3 py-2">Monthly hours: {form.monthlyWorkingHours}</div>
              <div className="rounded-md border border-gray-200 px-3 py-2">Overtime multiplier: {form.overtimeRateMultiplier}</div>
              <div className="rounded-md border border-gray-200 px-3 py-2">Short-time penalty: {form.shortTimePenaltyMultiplier}</div>
            </div>
          </Section>

          <Section
            title="Generate Salary from Attendance + Overtime + Short Time"
            actions={canManage ? (
              <Button className="px-3 py-2 rounded-md bg-primary-600 text-white" onClick={() => openDialog("runSalaryCalculation")}>
                Run Calculation
              </Button>
            ) : null}
          >
            <p className="text-sm text-gray-600">Run salary generation from the dialog using employee, month, and base salary inputs.</p>
          </Section>
        </>
      )}

      {featureKey === "companyAssets" && (
        <Section
          title="Company Assets List"
          actions={canManage ? (
            <Button className="px-3 py-2 rounded-md bg-primary-600 text-white" onClick={() => openDialog("createAsset")}>
              Create Asset
            </Button>
          ) : null}
        >
          <DataTable
            columns={[
              { key: "assetCode", label: "Code" },
              { key: "name", label: "Asset" },
              { key: "category", label: "Category" },
              { key: "status", label: "Status" },
              { key: "value", label: "Value" },
            ]}
            rows={state.assets}
          />
        </Section>
      )}

      {featureKey === "assetTracking" && (
        <Section
          title="Asset Allocation Tracking"
          actions={canManage ? (
            <div className="flex gap-2">
              <Button className="px-3 py-2 rounded-md bg-primary-600 text-white" onClick={() => openDialog("allocateAsset")}>
                Allocate Asset
              </Button>
              <Button className="px-3 py-2 rounded-md border border-gray-300" onClick={async () => triggerDownload(await workforceService.exportAssetAllocations(), "asset-allocations.csv")}>
                Export Report
              </Button>
            </div>
          ) : null}
        >
          <DataTable
            columns={[
              { key: "asset", label: "Asset", render: (_, row) => row.asset?.name || "-" },
              { key: "employee", label: "Employee", render: (_, row) => row.employee?.name || "-" },
              { key: "allocatedOn", label: "Allocated On", render: (value) => formatDate(value) },
              { key: "status", label: "Status" },
            ]}
            rows={state.allocations}
          />
        </Section>
      )}

      {featureKey === "assetReturnExit" && (
        <Section title="Asset Return on Exit">
          <DataTable
            columns={[
              { key: "asset", label: "Asset", render: (_, row) => row.asset?.name || "-" },
              { key: "employee", label: "Employee", render: (_, row) => row.employee?.name || "-" },
              { key: "status", label: "Status" },
              {
                key: "actions",
                label: "Action",
                render: (_, row) => row.status === "allocated" && canManage ? (
                  <Button className="text-primary-600" onClick={() => openDialog("returnAsset", row)}>Manage Return</Button>
                ) : "-",
              },
            ]}
            rows={state.allocations}
          />
        </Section>
      )}

      {featureKey === "inventoryManagement" && (
        <Section
          title="Inventory"
          actions={canManage ? (
            <div className="flex gap-2">
              <Button className="px-3 py-2 rounded-md bg-primary-600 text-white" onClick={() => openDialog("createInventory")}>
                Add Item
              </Button>
              <Button className="px-3 py-2 rounded-md border border-gray-300" onClick={async () => triggerDownload(await workforceService.exportInventory(), "inventory.csv")}>
                Export Report
              </Button>
            </div>
          ) : null}
        >
          <DataTable
            columns={[
              { key: "sku", label: "SKU" },
              { key: "name", label: "Item" },
              { key: "category", label: "Category" },
              { key: "quantity", label: "Quantity" },
              { key: "reorderLevel", label: "Reorder" },
              { key: "unitCost", label: "Unit Cost" },
              {
                key: "actions",
                label: "Actions",
                render: (_, row) => canManage ? (
                  <Button
                    className="text-primary-600"
                    onClick={() => {
                      setForm((prev) => ({
                        ...prev,
                        inventorySku: row.sku || "",
                        inventoryName: row.name || "",
                        inventoryCategory: row.category || "general",
                        inventoryQuantity: String(row.quantity ?? 0),
                        inventoryReorder: String(row.reorderLevel ?? 0),
                        inventoryUnitCost: String(row.unitCost ?? 0),
                      }));
                      openDialog("updateInventory", row);
                    }}
                  >
                    Manage
                  </Button>
                ) : "-",
              },
            ]}
            rows={state.inventory}
          />
        </Section>
      )}

      {featureKey === "projectAllocation" && (
        <Section
          title="Project Allocation"
          actions={canManage ? (
            <div className="flex gap-2">
              <Button className="px-3 py-2 rounded-md bg-primary-600 text-white" onClick={() => openDialog("createProject")}>
                Create Project
              </Button>
              <Button className="px-3 py-2 rounded-md border border-gray-300" onClick={() => openDialog("allocateProjectResource")}>
                Allocate Employee
              </Button>
            </div>
          ) : null}
        >
          <DataTable
            columns={[
              { key: "project", label: "Project", render: (_, row) => row.project?.name || "-" },
              { key: "employee", label: "Employee", render: (_, row) => row.employee?.name || "-" },
              { key: "allocationPercent", label: "Allocation %" },
              { key: "status", label: "Status" },
            ]}
            rows={state.projectAllocations}
          />
        </Section>
      )}

      {featureKey === "taskAssignment" && (
        <Section
          title="Task Assignment"
          actions={canManage ? (
            <Button className="px-3 py-2 rounded-md bg-primary-600 text-white" onClick={() => openDialog("createTask")}>
              Create Task
            </Button>
          ) : null}
        >
          <DataTable
            columns={[
              { key: "project", label: "Project", render: (_, row) => row.project?.name || "-" },
              { key: "title", label: "Task" },
              { key: "assignedTo", label: "Assigned To", render: (_, row) => row.assignedTo?.name || "-" },
              { key: "dueDate", label: "Due", render: (value) => formatDate(value) },
              { key: "status", label: "Status" },
              {
                key: "actions",
                label: "Actions",
                render: (_, row) => canManage ? (
                  <Button
                    className="text-primary-600"
                    onClick={() => {
                      setForm((prev) => ({
                        ...prev,
                        taskProject: row.project?._id || "",
                        taskTitle: row.title || "",
                        taskAssignedTo: row.assignedTo?._id || "",
                        taskDueDate: row.dueDate ? new Date(row.dueDate).toISOString().slice(0, 10) : "",
                        taskHours: String(row.estimatedHours ?? 0),
                      }));
                      openDialog("updateTask", row);
                    }}
                  >
                    Manage
                  </Button>
                ) : "-",
              },
            ]}
            rows={state.tasks}
          />
        </Section>
      )}

      {featureKey === "timesheetEntry" && (
        <Section
          title="Timesheet Entry"
          actions={canManage ? <Button className="px-3 py-2 rounded-md border border-gray-300" onClick={async () => triggerDownload(await workforceService.exportTimesheets(), "timesheets.csv")}>Export Report</Button> : null}
        >
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <Select value={form.timesheetProject} onChange={(e) => setForm((prev) => ({ ...prev, timesheetProject: e.target.value }))}>
              <Option value="">Select Project</Option>
              {projectOptions.map((item) => <Option key={item.id} value={item.id}>{item.label}</Option>)}
            </Select>
            <Select value={form.timesheetTask} onChange={(e) => setForm((prev) => ({ ...prev, timesheetTask: e.target.value }))}>
              <Option value="">Select Task (Optional)</Option>
              {tasks.map((task) => <Option key={task._id} value={task._id}>{task.title}</Option>)}
            </Select>
            <Input type="date" value={form.timesheetDate} onChange={(e) => setForm((prev) => ({ ...prev, timesheetDate: e.target.value }))} />
            <Input type="number" placeholder="Hours" value={form.timesheetHours} onChange={(e) => setForm((prev) => ({ ...prev, timesheetHours: e.target.value }))} />
            <Input placeholder="Notes" value={form.timesheetNotes} onChange={(e) => setForm((prev) => ({ ...prev, timesheetNotes: e.target.value }))} />
            <Button className="px-4 py-2 rounded-md bg-primary-600 text-white md:col-span-5" onClick={async () => {
              const payload = {
                project: form.timesheetProject,
                task: form.timesheetTask || null,
                date: form.timesheetDate,
                hours: Number(form.timesheetHours),
                notes: form.timesheetNotes,
              };
              if (canManage && form.salaryEmployee) payload.employee = form.salaryEmployee;
              await workforceService.createTimesheet(payload);
              toast.success("Timesheet saved");
              refresh();
            }}>Save Timesheet</Button>
          </div>

          <DataTable
            columns={[
              { key: "date", label: "Date", render: (value) => formatDate(value) },
              { key: "employee", label: "Employee", render: (_, row) => row.employee?.name || user?.name },
              { key: "project", label: "Project", render: (_, row) => row.project?.name || "-" },
              { key: "task", label: "Task", render: (_, row) => row.task?.title || "-" },
              { key: "hours", label: "Hours" },
            ]}
            rows={state.timesheets}
          />
        </Section>
      )}

      {featureKey === "projectBilling" && (
        <Section
          title="Project Billing"
          actions={canManage ? (
            <div className="flex gap-2">
              <Button className="px-3 py-2 rounded-md bg-primary-600 text-white" onClick={() => openDialog("createBilling")}>
                Generate Billing
              </Button>
              <Button className="px-3 py-2 rounded-md border border-gray-300" onClick={async () => triggerDownload(await workforceService.exportBillings(), "project-billing.csv")}>
                Export Report
              </Button>
            </div>
          ) : null}
        >
          <DataTable
            columns={[
              { key: "month", label: "Month" },
              { key: "project", label: "Project", render: (_, row) => row.project?.name || "-" },
              { key: "billedHours", label: "Billed Hours" },
              { key: "ratePerHour", label: "Rate" },
              { key: "amount", label: "Amount" },
              { key: "status", label: "Status" },
            ]}
            rows={state.billings}
          />
        </Section>
      )}

      {featureKey === "resourcePlanning" && (
        <Section
          title="Resource Planning"
          actions={canManage ? (
            <Button className="px-3 py-2 rounded-md bg-primary-600 text-white" onClick={() => openDialog("createResourcePlan")}>
              Create Resource Plan
            </Button>
          ) : null}
        >
          <DataTable
            columns={[
              { key: "month", label: "Month" },
              { key: "project", label: "Project", render: (_, row) => row.project?.name || "-" },
              { key: "employee", label: "Employee", render: (_, row) => row.employee?.name || "-" },
              { key: "plannedHours", label: "Planned Hours" },
              { key: "allocatedPercent", label: "Allocated %" },
            ]}
            rows={state.resourcePlans}
          />
        </Section>
      )}

      {featureKey === "milestoneTracking" && (
        <Section
          title="Milestone Tracking"
          actions={canManage ? (
            <Button className="px-3 py-2 rounded-md bg-primary-600 text-white" onClick={() => openDialog("createMilestone")}>
              Create Milestone
            </Button>
          ) : null}
        >
          <DataTable
            columns={[
              { key: "project", label: "Project", render: (_, row) => row.project?.name || "-" },
              { key: "title", label: "Milestone" },
              { key: "startDate", label: "Start", render: (value) => formatDate(value) },
              { key: "dueDate", label: "Due", render: (value) => formatDate(value) },
              { key: "completionPercent", label: "Completion %" },
              { key: "status", label: "Status" },
              {
                key: "actions",
                label: "Actions",
                render: (_, row) => canManage ? (
                  <Button
                    className="text-primary-600"
                    onClick={() => {
                      setForm((prev) => ({
                        ...prev,
                        milestoneProject: row.project?._id || "",
                        milestoneTitle: row.title || "",
                        milestoneStartDate: row.startDate ? new Date(row.startDate).toISOString().slice(0, 10) : "",
                        milestoneDueDate: row.dueDate ? new Date(row.dueDate).toISOString().slice(0, 10) : "",
                        milestoneCompletion: String(row.completionPercent ?? 0),
                      }));
                      openDialog("updateMilestone", row);
                    }}
                  >
                    Manage
                  </Button>
                ) : "-",
              },
            ]}
            rows={state.milestones}
          />
        </Section>
      )}

      {featureKey === "ganttChart" && (
        <Section title="Gantt View">
          <div className="space-y-3">
            {(state.gantt || []).map((project) => (
              <div key={project.projectId} className="border border-gray-200 rounded-lg p-3">
                <p className="font-semibold text-gray-900">{project.projectCode} - {project.projectName}</p>
                <p className="text-xs text-gray-600">{formatDate(project.startDate)} to {formatDate(project.endDate)}</p>
                <div className="mt-2 space-y-1">
                  {(project.milestones || []).map((item) => (
                    <div key={item.id} className="flex items-center gap-2 text-xs">
                      <span className="w-28 text-gray-600">Milestone</span>
                      <div className="flex-1 bg-gray-100 rounded h-4 relative">
                        <div className="absolute left-0 top-0 h-4 bg-primary-500 rounded" style={{ width: `${Math.max(2, Number(item.completionPercent || 0))}%` }} />
                      </div>
                      <span className="text-gray-700">{item.title} ({item.completionPercent}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {!state.gantt?.length && <p className="text-sm text-gray-500">No gantt data available.</p>}
          </div>
        </Section>
      )}

      {featureKey === "capacityPlanning" && (
        <Section
          title="Capacity Planning"
          actions={canManage ? <Button className="px-3 py-2 rounded-md border border-gray-300" onClick={async () => triggerDownload(await workforceService.exportCapacity({ month: form.capacityMonth }), `capacity-${form.capacityMonth}.csv`)}>Export Report</Button> : null}
        >
          <div className="flex gap-3">
            <Input type="month" value={form.capacityMonth} onChange={(e) => setForm((prev) => ({ ...prev, capacityMonth: e.target.value }))} />
            <Button className="px-4 py-2 rounded-md bg-gray-900 text-white" onClick={async () => {
              const capacity = await workforceService.getCapacity({ month: form.capacityMonth });
              setState((prev) => ({ ...prev, capacity }));
            }}>Load Month</Button>
          </div>

          <DataTable
            columns={[
              { key: "employeeId", label: "Employee ID" },
              { key: "name", label: "Employee" },
              { key: "department", label: "Department" },
              { key: "plannedHours", label: "Planned" },
              { key: "actualHours", label: "Actual" },
              { key: "varianceHours", label: "Variance" },
              { key: "utilizationPercent", label: "Utilization %" },
            ]}
            rows={state.capacity}
          />
        </Section>
      )}

      <Dialog isOpen={activeDialog === "updateGeoFence"} title="Configure Geo-Fence" onClose={closeDialog}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input placeholder="Latitude" value={form.geoLatitude} onChange={(e) => setForm((prev) => ({ ...prev, geoLatitude: e.target.value }))} />
          <Input placeholder="Longitude" value={form.geoLongitude} onChange={(e) => setForm((prev) => ({ ...prev, geoLongitude: e.target.value }))} />
          <Input placeholder="Radius (meters)" value={form.geoRadius} onChange={(e) => setForm((prev) => ({ ...prev, geoRadius: e.target.value }))} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button className="px-4 py-2 border border-gray-300 rounded-md" onClick={closeDialog}>Cancel</Button>
          <Button className="px-4 py-2 rounded-md bg-primary-600 text-white" onClick={async () => {
            try {
              await workforceService.updateAttendancePolicy({
                officeGeoFence: {
                  latitude: Number(form.geoLatitude),
                  longitude: Number(form.geoLongitude),
                  radiusMeters: Number(form.geoRadius),
                },
              });
              toast.success("Geo-fence updated");
              closeDialog();
              refresh();
            } catch (error) {
              toast.error(error.message || "Failed to save geo-fence");
            }
          }}>
            Save
          </Button>
        </div>
      </Dialog>

      <Dialog isOpen={activeDialog === "validateGeoFence"} title="Validate Check-In Coordinates" onClose={closeDialog}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input placeholder="Your Latitude" value={form.validateLatitude} onChange={(e) => setForm((prev) => ({ ...prev, validateLatitude: e.target.value }))} />
          <Input placeholder="Your Longitude" value={form.validateLongitude} onChange={(e) => setForm((prev) => ({ ...prev, validateLongitude: e.target.value }))} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button className="px-4 py-2 border border-gray-300 rounded-md" onClick={closeDialog}>Cancel</Button>
          <Button className="px-4 py-2 rounded-md bg-gray-900 text-white" onClick={async () => {
            try {
              const result = await workforceService.validateGeoFence({
                latitude: Number(form.validateLatitude),
                longitude: Number(form.validateLongitude),
              });
              toast.success(result.message || "Validated");
              closeDialog();
            } catch (error) {
              toast.error(error.message || "Validation failed");
            }
          }}>
            Validate
          </Button>
        </div>
      </Dialog>

      <Dialog isOpen={activeDialog === "updateCheckInControl"} title="Update Check-In Control" onClose={closeDialog}>
        <div className="space-y-3">
          <label className="inline-flex items-center gap-2 text-gray-700">
            <Input
              type="checkbox"
              checked={Boolean(form.checkInEnabled)}
              onChange={(e) => setForm((prev) => ({ ...prev, checkInEnabled: e.target.checked }))}
            />
            Allow employee check-in
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button className="px-4 py-2 border border-gray-300 rounded-md" onClick={closeDialog}>Cancel</Button>
          <Button className="px-4 py-2 rounded-md bg-primary-600 text-white" onClick={async () => {
            try {
              await workforceService.updateAttendancePolicy({ checkInEnabled: form.checkInEnabled });
              toast.success("Check-in control updated");
              closeDialog();
              refresh();
            } catch (error) {
              toast.error(error.message || "Failed to update check-in control");
            }
          }}>
            Save
          </Button>
        </div>
      </Dialog>

      <Dialog isOpen={activeDialog === "createWfhRequest"} title="Submit WFH Request" onClose={closeDialog}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input type="date" value={form.wfhStartDate} onChange={(e) => setForm((prev) => ({ ...prev, wfhStartDate: e.target.value }))} />
          <Input type="date" value={form.wfhEndDate} onChange={(e) => setForm((prev) => ({ ...prev, wfhEndDate: e.target.value }))} />
          <Input className="md:col-span-2" placeholder="Reason" value={form.wfhReason} onChange={(e) => setForm((prev) => ({ ...prev, wfhReason: e.target.value }))} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button className="px-4 py-2 border border-gray-300 rounded-md" onClick={closeDialog}>Cancel</Button>
          <Button className="px-4 py-2 rounded-md bg-primary-600 text-white" onClick={async () => {
            try {
              const parsed = wfhRequestSchema.safeParse({
                startDate: form.wfhStartDate,
                endDate: form.wfhEndDate,
                reason: form.wfhReason,
              });
              if (!parsed.success) {
                toast.error(parsed.error.issues[0]?.message || "Invalid WFH request");
                return;
              }
              await workforceService.createWfh({
                startDate: form.wfhStartDate,
                endDate: form.wfhEndDate,
                reason: form.wfhReason,
              });
              toast.success("WFH request submitted");
              setForm((prev) => ({ ...prev, wfhStartDate: "", wfhEndDate: "", wfhReason: "" }));
              closeDialog();
              refresh();
            } catch (error) {
              toast.error(error.message || "Failed to submit WFH request");
            }
          }}>
            Submit
          </Button>
        </div>
      </Dialog>

      <Dialog isOpen={activeDialog === "manageWfhRequest"} title="Manage WFH Request" onClose={closeDialog}>
        <div className="space-y-3 text-sm">
          <p className="text-gray-700">
            {selectedRow?.employee?.name || user?.name} - {formatDate(selectedRow?.startDate)} to {formatDate(selectedRow?.endDate)}
          </p>
          <Select value={form.wfhStatus} onChange={(e) => setForm((prev) => ({ ...prev, wfhStatus: e.target.value }))}>
            <Option value="approved">Approve</Option>
            <Option value="rejected">Reject</Option>
          </Select>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button className="px-4 py-2 border border-gray-300 rounded-md" onClick={closeDialog}>Cancel</Button>
          <Button className="px-4 py-2 rounded-md bg-primary-600 text-white" onClick={async () => {
            await workforceService.updateWfhStatus(selectedRow?._id, { status: form.wfhStatus });
            toast.success(`WFH ${form.wfhStatus}`);
            closeDialog();
            refresh();
          }}>
            Save
          </Button>
        </div>
      </Dialog>

      <Dialog isOpen={activeDialog === "generateSalarySlip"} title="Generate Salary Slip" onClose={closeDialog}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Select value={form.salaryEmployee} onChange={(e) => setForm((prev) => ({ ...prev, salaryEmployee: e.target.value }))}>
            <Option value="">Select Employee</Option>
            {employeeOptions.map((item) => <Option key={item.id} value={item.id}>{item.label}</Option>)}
          </Select>
          <Input type="month" value={form.salaryMonth} onChange={(e) => setForm((prev) => ({ ...prev, salaryMonth: e.target.value }))} />
          <Input className="md:col-span-2" type="number" placeholder="Base Salary" value={form.salaryBase} onChange={(e) => setForm((prev) => ({ ...prev, salaryBase: e.target.value }))} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button className="px-4 py-2 border border-gray-300 rounded-md" onClick={closeDialog}>Cancel</Button>
          <Button className="px-4 py-2 rounded-md bg-primary-600 text-white" onClick={async () => {
            const parsed = salaryGenerateSchema.safeParse({
              userId: form.salaryEmployee,
              month: form.salaryMonth,
              baseSalary: Number(form.salaryBase),
            });
            if (!parsed.success) {
              toast.error(parsed.error.issues[0]?.message || "Invalid salary input");
              return;
            }
            await workforceService.generateSalary({
              userId: form.salaryEmployee,
              month: form.salaryMonth,
              baseSalary: Number(form.salaryBase),
            });
            toast.success("Salary generated");
            closeDialog();
            refresh();
          }}>
            Generate
          </Button>
        </div>
      </Dialog>

      <Dialog isOpen={activeDialog === "updateLeavePolicy"} title="Update Leave Auto-Approval Policy" onClose={closeDialog}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="inline-flex items-center gap-2 text-gray-700 border border-gray-200 rounded-md px-3 py-2">
            <Input type="checkbox" checked={form.leaveAutoApproveEnabled} onChange={(e) => setForm((prev) => ({ ...prev, leaveAutoApproveEnabled: e.target.checked }))} />
            Auto Approve Enabled
          </label>
          <Input type="number" placeholder="Max Auto Approve Days" value={form.maxAutoApproveDays} onChange={(e) => setForm((prev) => ({ ...prev, maxAutoApproveDays: e.target.value }))} />
          <Select value={form.leaveTypes.join(",")} onChange={(e) => setForm((prev) => ({ ...prev, leaveTypes: e.target.value.split(",") }))}>
            <Option value="sick,personal">Sick + Personal</Option>
            <Option value="annual,sick,personal">All Paid Types</Option>
            <Option value="sick">Only Sick</Option>
          </Select>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button className="px-4 py-2 border border-gray-300 rounded-md" onClick={closeDialog}>Cancel</Button>
          <Button className="px-4 py-2 rounded-md bg-primary-600 text-white" onClick={async () => {
            await workforceService.updateLeavePolicy({
              autoApproveEnabled: form.leaveAutoApproveEnabled,
              maxAutoApproveDays: Number(form.maxAutoApproveDays),
              autoApproveTypes: form.leaveTypes,
            });
            toast.success("Leave auto-approval policy updated");
            closeDialog();
            refresh();
          }}>
            Save Policy
          </Button>
        </div>
      </Dialog>

      <Dialog isOpen={activeDialog === "updatePayrollPolicy"} title="Update Payroll Formula Settings" onClose={closeDialog}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input type="number" placeholder="Monthly Working Hours" value={form.monthlyWorkingHours} onChange={(e) => setForm((prev) => ({ ...prev, monthlyWorkingHours: e.target.value }))} />
          <Input type="number" step="0.1" placeholder="Overtime Multiplier" value={form.overtimeRateMultiplier} onChange={(e) => setForm((prev) => ({ ...prev, overtimeRateMultiplier: e.target.value }))} />
          <Input type="number" step="0.1" placeholder="Short Time Penalty Multiplier" value={form.shortTimePenaltyMultiplier} onChange={(e) => setForm((prev) => ({ ...prev, shortTimePenaltyMultiplier: e.target.value }))} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button className="px-4 py-2 border border-gray-300 rounded-md" onClick={closeDialog}>Cancel</Button>
          <Button className="px-4 py-2 rounded-md bg-primary-600 text-white" onClick={async () => {
            await workforceService.updatePayrollPolicy({
              monthlyWorkingHours: Number(form.monthlyWorkingHours),
              overtimeRateMultiplier: Number(form.overtimeRateMultiplier),
              shortTimePenaltyMultiplier: Number(form.shortTimePenaltyMultiplier),
            });
            toast.success("Payroll policy updated");
            closeDialog();
            refresh();
          }}>
            Save
          </Button>
        </div>
      </Dialog>

      <Dialog isOpen={activeDialog === "runSalaryCalculation"} title="Run Salary Calculation" onClose={closeDialog}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Select value={form.salaryEmployee} onChange={(e) => setForm((prev) => ({ ...prev, salaryEmployee: e.target.value }))}>
            <Option value="">Select Employee</Option>
            {employeeOptions.map((item) => <Option key={item.id} value={item.id}>{item.label}</Option>)}
          </Select>
          <Input type="month" value={form.salaryMonth} onChange={(e) => setForm((prev) => ({ ...prev, salaryMonth: e.target.value }))} />
          <Input className="md:col-span-2" type="number" placeholder="Base Salary" value={form.salaryBase} onChange={(e) => setForm((prev) => ({ ...prev, salaryBase: e.target.value }))} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button className="px-4 py-2 border border-gray-300 rounded-md" onClick={closeDialog}>Cancel</Button>
          <Button className="px-4 py-2 rounded-md bg-primary-600 text-white" onClick={async () => {
            const parsed = salaryGenerateSchema.safeParse({
              userId: form.salaryEmployee,
              month: form.salaryMonth,
              baseSalary: Number(form.salaryBase),
            });
            if (!parsed.success) {
              toast.error(parsed.error.issues[0]?.message || "Invalid salary input");
              return;
            }
            await workforceService.generateSalary({
              userId: form.salaryEmployee,
              month: form.salaryMonth,
              baseSalary: Number(form.salaryBase),
            });
            toast.success("Salary generated with attendance formula");
            closeDialog();
            refresh();
          }}>
            Run Calculation
          </Button>
        </div>
      </Dialog>

      <Dialog isOpen={activeDialog === "createHoliday"} title="Add Holiday" onClose={closeDialog}>
        <div className="space-y-3">
          <Input placeholder="Holiday Name" value={form.holidayName} onChange={(e) => setForm((prev) => ({ ...prev, holidayName: e.target.value }))} />
          <Input type="date" value={form.holidayDate} onChange={(e) => setForm((prev) => ({ ...prev, holidayDate: e.target.value }))} />
          <div className="flex justify-end gap-2">
            <Button className="px-4 py-2 border border-gray-300 rounded-md" onClick={closeDialog}>Cancel</Button>
            <Button className="px-4 py-2 rounded-md bg-primary-600 text-white" onClick={async () => {
              try {
                await workforceService.createHoliday({ name: form.holidayName, date: form.holidayDate });
                toast.success("Holiday added");
                setForm((prev) => ({ ...prev, holidayName: "", holidayDate: "" }));
                closeDialog();
                refresh();
              } catch (error) {
                toast.error(error.message || "Failed to add holiday");
              }
            }}>
              Save
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog isOpen={activeDialog === "createAsset"} title="Create Asset" onClose={closeDialog}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input placeholder="Asset Code" value={form.assetCode} onChange={(e) => setForm((prev) => ({ ...prev, assetCode: e.target.value }))} />
          <Input placeholder="Asset Name" value={form.assetName} onChange={(e) => setForm((prev) => ({ ...prev, assetName: e.target.value }))} />
          <Input placeholder="Category" value={form.assetCategory} onChange={(e) => setForm((prev) => ({ ...prev, assetCategory: e.target.value }))} />
          <Input type="number" placeholder="Value" value={form.assetValue} onChange={(e) => setForm((prev) => ({ ...prev, assetValue: e.target.value }))} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button className="px-4 py-2 border border-gray-300 rounded-md" onClick={closeDialog}>Cancel</Button>
          <Button className="px-4 py-2 rounded-md bg-primary-600 text-white" onClick={async () => {
            await workforceService.createAsset({
              assetCode: form.assetCode,
              name: form.assetName,
              category: form.assetCategory,
              value: Number(form.assetValue),
            });
            toast.success("Asset created");
            setForm((prev) => ({ ...prev, assetCode: "", assetName: "", assetValue: "0" }));
            closeDialog();
            refresh();
          }}>
            Create Asset
          </Button>
        </div>
      </Dialog>

      <Dialog isOpen={activeDialog === "allocateAsset"} title="Allocate Asset" onClose={closeDialog}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Select value={form.allocateAssetId} onChange={(e) => setForm((prev) => ({ ...prev, allocateAssetId: e.target.value }))}>
            <Option value="">Select Asset</Option>
            {state.assets.map((asset) => <Option key={asset._id} value={asset._id}>{asset.assetCode} - {asset.name}</Option>)}
          </Select>
          <Select value={form.allocateEmployeeId} onChange={(e) => setForm((prev) => ({ ...prev, allocateEmployeeId: e.target.value }))}>
            <Option value="">Select Employee</Option>
            {employeeOptions.map((item) => <Option key={item.id} value={item.id}>{item.label}</Option>)}
          </Select>
          <Input type="date" value={form.allocationReturnDate} onChange={(e) => setForm((prev) => ({ ...prev, allocationReturnDate: e.target.value }))} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button className="px-4 py-2 border border-gray-300 rounded-md" onClick={closeDialog}>Cancel</Button>
          <Button className="px-4 py-2 rounded-md bg-primary-600 text-white" onClick={async () => {
            await workforceService.allocateAsset({
              assetId: form.allocateAssetId,
              employeeId: form.allocateEmployeeId,
              expectedReturnDate: form.allocationReturnDate || null,
            });
            toast.success("Asset allocated");
            closeDialog();
            refresh();
          }}>
            Allocate
          </Button>
        </div>
      </Dialog>

      <Dialog isOpen={activeDialog === "returnAsset"} title="Manage Asset Return" onClose={closeDialog}>
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            {selectedRow?.asset?.name || "Asset"} for {selectedRow?.employee?.name || "employee"}
          </p>
          <Input placeholder="Return reason" value={returnReason} onChange={(e) => setReturnReason(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button className="px-4 py-2 border border-gray-300 rounded-md" onClick={closeDialog}>Cancel</Button>
            <Button className="px-4 py-2 rounded-md bg-primary-600 text-white" onClick={async () => {
              await workforceService.returnAsset(selectedRow?._id, { returnReason: returnReason || "Exit process" });
              toast.success("Asset returned");
              closeDialog();
              refresh();
            }}>
              Mark Returned
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog isOpen={activeDialog === "createInventory"} title="Add Inventory Item" onClose={closeDialog}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input placeholder="SKU" value={form.inventorySku} onChange={(e) => setForm((prev) => ({ ...prev, inventorySku: e.target.value }))} />
          <Input placeholder="Name" value={form.inventoryName} onChange={(e) => setForm((prev) => ({ ...prev, inventoryName: e.target.value }))} />
          <Input placeholder="Category" value={form.inventoryCategory} onChange={(e) => setForm((prev) => ({ ...prev, inventoryCategory: e.target.value }))} />
          <Input type="number" placeholder="Quantity" value={form.inventoryQuantity} onChange={(e) => setForm((prev) => ({ ...prev, inventoryQuantity: e.target.value }))} />
          <Input type="number" placeholder="Reorder Level" value={form.inventoryReorder} onChange={(e) => setForm((prev) => ({ ...prev, inventoryReorder: e.target.value }))} />
          <Input type="number" placeholder="Unit Cost" value={form.inventoryUnitCost} onChange={(e) => setForm((prev) => ({ ...prev, inventoryUnitCost: e.target.value }))} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button className="px-4 py-2 border border-gray-300 rounded-md" onClick={closeDialog}>Cancel</Button>
          <Button className="px-4 py-2 rounded-md bg-primary-600 text-white" onClick={async () => {
            await workforceService.createInventory({
              sku: form.inventorySku,
              name: form.inventoryName,
              category: form.inventoryCategory,
              quantity: Number(form.inventoryQuantity),
              reorderLevel: Number(form.inventoryReorder),
              unitCost: Number(form.inventoryUnitCost),
            });
            toast.success("Inventory item created");
            closeDialog();
            refresh();
          }}>
            Save
          </Button>
        </div>
      </Dialog>

      <Dialog isOpen={activeDialog === "updateInventory"} title="Update Inventory Item" onClose={closeDialog}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input placeholder="SKU" value={form.inventorySku} onChange={(e) => setForm((prev) => ({ ...prev, inventorySku: e.target.value }))} />
          <Input placeholder="Name" value={form.inventoryName} onChange={(e) => setForm((prev) => ({ ...prev, inventoryName: e.target.value }))} />
          <Input placeholder="Category" value={form.inventoryCategory} onChange={(e) => setForm((prev) => ({ ...prev, inventoryCategory: e.target.value }))} />
          <Input type="number" placeholder="Quantity" value={form.inventoryQuantity} onChange={(e) => setForm((prev) => ({ ...prev, inventoryQuantity: e.target.value }))} />
          <Input type="number" placeholder="Reorder Level" value={form.inventoryReorder} onChange={(e) => setForm((prev) => ({ ...prev, inventoryReorder: e.target.value }))} />
          <Input type="number" placeholder="Unit Cost" value={form.inventoryUnitCost} onChange={(e) => setForm((prev) => ({ ...prev, inventoryUnitCost: e.target.value }))} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button className="px-4 py-2 border border-gray-300 rounded-md" onClick={closeDialog}>Cancel</Button>
          <Button className="px-4 py-2 rounded-md bg-primary-600 text-white" onClick={async () => {
            await workforceService.updateInventory(selectedRow?._id, {
              sku: form.inventorySku,
              name: form.inventoryName,
              category: form.inventoryCategory,
              quantity: Number(form.inventoryQuantity),
              reorderLevel: Number(form.inventoryReorder),
              unitCost: Number(form.inventoryUnitCost),
            });
            toast.success("Inventory item updated");
            closeDialog();
            refresh();
          }}>
            Update
          </Button>
        </div>
      </Dialog>

      <Dialog isOpen={activeDialog === "createProject"} title="Create Project" onClose={closeDialog}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input placeholder="Project Code" value={form.projectCode} onChange={(e) => setForm((prev) => ({ ...prev, projectCode: e.target.value }))} />
          <Input placeholder="Project Name" value={form.projectName} onChange={(e) => setForm((prev) => ({ ...prev, projectName: e.target.value }))} />
          <Input className="md:col-span-2" placeholder="Client" value={form.projectClient} onChange={(e) => setForm((prev) => ({ ...prev, projectClient: e.target.value }))} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button className="px-4 py-2 border border-gray-300 rounded-md" onClick={closeDialog}>Cancel</Button>
          <Button className="px-4 py-2 rounded-md bg-primary-600 text-white" onClick={async () => {
            await workforceService.createProject({ code: form.projectCode, name: form.projectName, clientName: form.projectClient, status: "active" });
            toast.success("Project created");
            closeDialog();
            refresh();
          }}>
            Create
          </Button>
        </div>
      </Dialog>

      <Dialog isOpen={activeDialog === "allocateProjectResource"} title="Allocate Employee to Project" onClose={closeDialog}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Select value={form.projectAllocationProject} onChange={(e) => setForm((prev) => ({ ...prev, projectAllocationProject: e.target.value }))}>
            <Option value="">Select Project</Option>
            {projectOptions.map((item) => <Option key={item.id} value={item.id}>{item.label}</Option>)}
          </Select>
          <Select value={form.projectAllocationEmployee} onChange={(e) => setForm((prev) => ({ ...prev, projectAllocationEmployee: e.target.value }))}>
            <Option value="">Select Employee</Option>
            {employeeOptions.map((item) => <Option key={item.id} value={item.id}>{item.label}</Option>)}
          </Select>
          <Input type="number" value={form.projectAllocationPercent} onChange={(e) => setForm((prev) => ({ ...prev, projectAllocationPercent: e.target.value }))} placeholder="Allocation %" />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button className="px-4 py-2 border border-gray-300 rounded-md" onClick={closeDialog}>Cancel</Button>
          <Button className="px-4 py-2 rounded-md bg-primary-600 text-white" onClick={async () => {
            await workforceService.createProjectAllocation({
              project: form.projectAllocationProject,
              employee: form.projectAllocationEmployee,
              allocationPercent: Number(form.projectAllocationPercent),
              status: "active",
            });
            toast.success("Project allocation created");
            closeDialog();
            refresh();
          }}>
            Allocate
          </Button>
        </div>
      </Dialog>

      <Dialog isOpen={activeDialog === "createTask"} title="Create Task" onClose={closeDialog}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Select value={form.taskProject} onChange={(e) => setForm((prev) => ({ ...prev, taskProject: e.target.value }))}>
            <Option value="">Select Project</Option>
            {projectOptions.map((item) => <Option key={item.id} value={item.id}>{item.label}</Option>)}
          </Select>
          <Input placeholder="Task Title" value={form.taskTitle} onChange={(e) => setForm((prev) => ({ ...prev, taskTitle: e.target.value }))} />
          <Select value={form.taskAssignedTo} onChange={(e) => setForm((prev) => ({ ...prev, taskAssignedTo: e.target.value }))}>
            <Option value="">Assign To</Option>
            {employeeOptions.map((item) => <Option key={item.id} value={item.id}>{item.label}</Option>)}
          </Select>
          <Input type="date" value={form.taskDueDate} onChange={(e) => setForm((prev) => ({ ...prev, taskDueDate: e.target.value }))} />
          <Input type="number" placeholder="Estimated Hours" value={form.taskHours} onChange={(e) => setForm((prev) => ({ ...prev, taskHours: e.target.value }))} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button className="px-4 py-2 border border-gray-300 rounded-md" onClick={closeDialog}>Cancel</Button>
          <Button className="px-4 py-2 rounded-md bg-primary-600 text-white" onClick={async () => {
            await workforceService.createTask({
              project: form.taskProject,
              title: form.taskTitle,
              assignedTo: form.taskAssignedTo,
              dueDate: form.taskDueDate || null,
              estimatedHours: Number(form.taskHours),
            });
            toast.success("Task created");
            closeDialog();
            refresh();
          }}>
            Create
          </Button>
        </div>
      </Dialog>

      <Dialog isOpen={activeDialog === "updateTask"} title="Update Task" onClose={closeDialog}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input placeholder="Task Title" value={form.taskTitle} onChange={(e) => setForm((prev) => ({ ...prev, taskTitle: e.target.value }))} />
          <Select value={form.taskAssignedTo} onChange={(e) => setForm((prev) => ({ ...prev, taskAssignedTo: e.target.value }))}>
            <Option value="">Assign To</Option>
            {employeeOptions.map((item) => <Option key={item.id} value={item.id}>{item.label}</Option>)}
          </Select>
          <Input type="date" value={form.taskDueDate} onChange={(e) => setForm((prev) => ({ ...prev, taskDueDate: e.target.value }))} />
          <Input type="number" placeholder="Estimated Hours" value={form.taskHours} onChange={(e) => setForm((prev) => ({ ...prev, taskHours: e.target.value }))} />
          <Select value={selectedRow?.status || "pending"} onChange={(e) => setSelectedRow((prev) => ({ ...(prev || {}), status: e.target.value }))}>
            <Option value="pending">Pending</Option>
            <Option value="in_progress">In Progress</Option>
            <Option value="completed">Completed</Option>
            <Option value="blocked">Blocked</Option>
          </Select>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button className="px-4 py-2 border border-gray-300 rounded-md" onClick={closeDialog}>Cancel</Button>
          <Button className="px-4 py-2 rounded-md bg-primary-600 text-white" onClick={async () => {
            await workforceService.updateTask(selectedRow?._id, {
              title: form.taskTitle,
              assignedTo: form.taskAssignedTo,
              dueDate: form.taskDueDate || null,
              estimatedHours: Number(form.taskHours),
              status: selectedRow?.status || "pending",
            });
            toast.success("Task updated");
            closeDialog();
            refresh();
          }}>
            Update
          </Button>
        </div>
      </Dialog>

      <Dialog isOpen={activeDialog === "createBilling"} title="Generate Billing" onClose={closeDialog}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Select value={form.billingProject} onChange={(e) => setForm((prev) => ({ ...prev, billingProject: e.target.value }))}>
            <Option value="">Select Project</Option>
            {projectOptions.map((item) => <Option key={item.id} value={item.id}>{item.label}</Option>)}
          </Select>
          <Input type="month" value={form.billingMonth} onChange={(e) => setForm((prev) => ({ ...prev, billingMonth: e.target.value }))} />
          <Input type="number" placeholder="Rate Per Hour" value={form.billingRate} onChange={(e) => setForm((prev) => ({ ...prev, billingRate: e.target.value }))} />
          <Input placeholder="Invoice #" value={form.billingInvoice} onChange={(e) => setForm((prev) => ({ ...prev, billingInvoice: e.target.value }))} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button className="px-4 py-2 border border-gray-300 rounded-md" onClick={closeDialog}>Cancel</Button>
          <Button className="px-4 py-2 rounded-md bg-primary-600 text-white" onClick={async () => {
            await workforceService.createBilling({
              project: form.billingProject,
              month: form.billingMonth,
              ratePerHour: Number(form.billingRate),
              invoiceNumber: form.billingInvoice,
              status: "raised",
            });
            toast.success("Billing generated");
            closeDialog();
            refresh();
          }}>
            Generate
          </Button>
        </div>
      </Dialog>

      <Dialog isOpen={activeDialog === "createResourcePlan"} title="Create Resource Plan" onClose={closeDialog}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Select value={form.planningProject} onChange={(e) => setForm((prev) => ({ ...prev, planningProject: e.target.value }))}>
            <Option value="">Select Project</Option>
            {projectOptions.map((item) => <Option key={item.id} value={item.id}>{item.label}</Option>)}
          </Select>
          <Select value={form.planningEmployee} onChange={(e) => setForm((prev) => ({ ...prev, planningEmployee: e.target.value }))}>
            <Option value="">Select Employee</Option>
            {employeeOptions.map((item) => <Option key={item.id} value={item.id}>{item.label}</Option>)}
          </Select>
          <Input type="month" value={form.planningMonth} onChange={(e) => setForm((prev) => ({ ...prev, planningMonth: e.target.value }))} />
          <Input type="number" placeholder="Planned Hours" value={form.planningHours} onChange={(e) => setForm((prev) => ({ ...prev, planningHours: e.target.value }))} />
          <Input type="number" placeholder="Allocated %" value={form.planningPercent} onChange={(e) => setForm((prev) => ({ ...prev, planningPercent: e.target.value }))} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button className="px-4 py-2 border border-gray-300 rounded-md" onClick={closeDialog}>Cancel</Button>
          <Button className="px-4 py-2 rounded-md bg-primary-600 text-white" onClick={async () => {
            await workforceService.createResourcePlan({
              project: form.planningProject,
              employee: form.planningEmployee,
              month: form.planningMonth,
              plannedHours: Number(form.planningHours),
              allocatedPercent: Number(form.planningPercent),
            });
            toast.success("Resource plan saved");
            closeDialog();
            refresh();
          }}>
            Save
          </Button>
        </div>
      </Dialog>

      <Dialog isOpen={activeDialog === "createMilestone"} title="Create Milestone" onClose={closeDialog}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Select value={form.milestoneProject} onChange={(e) => setForm((prev) => ({ ...prev, milestoneProject: e.target.value }))}>
            <Option value="">Select Project</Option>
            {projectOptions.map((item) => <Option key={item.id} value={item.id}>{item.label}</Option>)}
          </Select>
          <Input placeholder="Milestone Title" value={form.milestoneTitle} onChange={(e) => setForm((prev) => ({ ...prev, milestoneTitle: e.target.value }))} />
          <Input type="date" value={form.milestoneStartDate} onChange={(e) => setForm((prev) => ({ ...prev, milestoneStartDate: e.target.value }))} />
          <Input type="date" value={form.milestoneDueDate} onChange={(e) => setForm((prev) => ({ ...prev, milestoneDueDate: e.target.value }))} />
          <Input type="number" value={form.milestoneCompletion} onChange={(e) => setForm((prev) => ({ ...prev, milestoneCompletion: e.target.value }))} placeholder="Completion %" />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button className="px-4 py-2 border border-gray-300 rounded-md" onClick={closeDialog}>Cancel</Button>
          <Button className="px-4 py-2 rounded-md bg-primary-600 text-white" onClick={async () => {
            await workforceService.createMilestone({
              project: form.milestoneProject,
              title: form.milestoneTitle,
              startDate: form.milestoneStartDate,
              dueDate: form.milestoneDueDate,
              completionPercent: Number(form.milestoneCompletion),
              status: Number(form.milestoneCompletion) >= 100 ? "completed" : "active",
            });
            toast.success("Milestone created");
            closeDialog();
            refresh();
          }}>
            Create
          </Button>
        </div>
      </Dialog>

      <Dialog isOpen={activeDialog === "updateMilestone"} title="Update Milestone" onClose={closeDialog}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input placeholder="Milestone Title" value={form.milestoneTitle} onChange={(e) => setForm((prev) => ({ ...prev, milestoneTitle: e.target.value }))} />
          <Input type="date" value={form.milestoneStartDate} onChange={(e) => setForm((prev) => ({ ...prev, milestoneStartDate: e.target.value }))} />
          <Input type="date" value={form.milestoneDueDate} onChange={(e) => setForm((prev) => ({ ...prev, milestoneDueDate: e.target.value }))} />
          <Input type="number" value={form.milestoneCompletion} onChange={(e) => setForm((prev) => ({ ...prev, milestoneCompletion: e.target.value }))} placeholder="Completion %" />
          <Select value={selectedRow?.status || "active"} onChange={(e) => setSelectedRow((prev) => ({ ...(prev || {}), status: e.target.value }))}>
            <Option value="active">Active</Option>
            <Option value="completed">Completed</Option>
            <Option value="blocked">Blocked</Option>
          </Select>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button className="px-4 py-2 border border-gray-300 rounded-md" onClick={closeDialog}>Cancel</Button>
          <Button className="px-4 py-2 rounded-md bg-primary-600 text-white" onClick={async () => {
            await workforceService.updateMilestone(selectedRow?._id, {
              title: form.milestoneTitle,
              startDate: form.milestoneStartDate,
              dueDate: form.milestoneDueDate,
              completionPercent: Number(form.milestoneCompletion),
              status: selectedRow?.status || "active",
            });
            toast.success("Milestone updated");
            closeDialog();
            refresh();
          }}>
            Update
          </Button>
        </div>
      </Dialog>
    </div>
  );
};

export default WorkforceModulePage;
