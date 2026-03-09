const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const { WebSocketServer } = require("ws");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./docs/swagger");
dotenv.config();
const {
  FRONTEND_URL,
  API_BASE_URL,
  CORS_ORIGINS,
} = require("./config/appConfig");

const app = express();

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server requests and CLI tooling with no Origin header
      if (!origin) return callback(null, true);
      if (!CORS_ORIGINS.length) return callback(null, true);
      if (CORS_ORIGINS.includes(origin)) return callback(null, true);
      return callback(new Error("CORS origin not allowed"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (req, res) => {
  const dbState = mongoose.connection.readyState;

  const dbStatus = {
    0: "Disconnected",
    1: "Connected",
    2: "Connecting",
    3: "Disconnecting",
  };

  res.status(200).json({
    status: "OK",
    server: "Running",
    database: dbStatus[dbState],
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Database connection
require("./config/db")();
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/leaves", require("./routes/leaveRoutes"));
app.use("/api/departments", require("./routes/departmentRoutes"));
app.use("/api/attendance", require("./routes/attendanceRoutes"));
app.use("/api/announcements", require("./routes/announcementRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/files", require("./routes/fileRoutes"));
app.use("/api/settings", require("./routes/settingsRoutes"));
app.use("/api/shifts", require("./routes/shiftRoutes"));
app.use("/api/recruitment", require("./routes/recruitmentRoutes"));
app.use("/api/learning", require("./routes/learningRoutes"));
app.use("/api/candidate-portal", require("./routes/candidatePortalRoutes"));
app.use("/api/ai", require("./routes/aiRoutes"));
app.use("/api/attendance-policy", require("./routes/attendancePolicyRoutes"));
app.use("/api/leave-policy", require("./routes/leavePolicyRoutes"));
app.use("/api/holidays", require("./routes/holidayRoutes"));
app.use("/api/wfh", require("./routes/wfhRoutes"));
app.use("/api/payroll", require("./routes/payrollRoutes"));
app.use("/api/assets", require("./routes/assetRoutes"));
app.use("/api/inventory", require("./routes/inventoryRoutes"));
app.use("/api/project-ops", require("./routes/projectOpsRoutes"));
app.use("/api/support", require("./routes/supportRoutes"));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  const apiBase = API_BASE_URL || `http://localhost:${PORT}`;
  const frontendBase = FRONTEND_URL;

  const mainUrls = [
    `API Base: ${apiBase}/api`,
    `Employee Portal Login: ${frontendBase}/login`,
    `Employee Portal Dashboard: ${frontendBase}/dashboard`,
    `Employee Alias Login: ${frontendBase}/portal/employee/login`,
    `HR Portal: ${frontendBase}/portal/hr`,
    `Learning Portal: ${frontendBase}/portal/lnd`,
    `Candidate Careers: ${frontendBase}/careers`,
    `Candidate Login: ${frontendBase}/candidate/login`,
    `Candidate Register: ${frontendBase}/candidate/register`,
    `Candidate Portal Dashboard: ${frontendBase}/candidate/dashboard`,
    `Candidate Alias Portal: ${frontendBase}/portal/candidate`,
    `Candidate API Auth: ${apiBase}/api/candidate-portal/login`,
    `AI APIs Base: ${apiBase}/api/ai`,
    `Swagger API Docs: ${apiBase}/api-docs`,
    `Live Chat WebSocket: ws://localhost:${PORT}/ws/chat`,
  ];

  console.log(`Server running on port ${PORT}`);
  console.log("Main URLs:");
  mainUrls.forEach((line) => console.log(`- ${line}`));
});

const wsClients = new Set();
const wss = new WebSocketServer({ server, path: "/ws/chat" });

const safeSend = (socket, payload) => {
  try {
    if (socket.readyState === socket.OPEN) {
      socket.send(JSON.stringify(payload));
    }
  } catch (error) {
    // Ignore individual socket send errors.
  }
};

const broadcast = (payload) => {
  wsClients.forEach((client) => safeSend(client, payload));
};

wss.on("connection", (socket) => {
  const clientMeta = {
    id: null,
    name: "Anonymous",
    role: "guest",
  };
  wsClients.add(socket);

  safeSend(socket, {
    type: "system",
    message: "Connected to live chat",
    timestamp: new Date().toISOString(),
  });

  socket.on("message", (rawMessage) => {
    let message;
    try {
      message = JSON.parse(rawMessage.toString());
    } catch (error) {
      safeSend(socket, {
        type: "error",
        message: "Invalid message format",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (message.type === "join") {
      clientMeta.id = message.user?.id || null;
      clientMeta.name = message.user?.name || "Anonymous";
      clientMeta.role = message.user?.role || "guest";

      broadcast({
        type: "presence",
        message: `${clientMeta.name} joined chat`,
        user: clientMeta,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (message.type === "chat") {
      const chatPayload = {
        type: "chat",
        text: message.text || "",
        user: clientMeta,
        timestamp: new Date().toISOString(),
      };
      broadcast(chatPayload);
      return;
    }
  });

  socket.on("close", () => {
    wsClients.delete(socket);
    if (clientMeta.name && clientMeta.name !== "Anonymous") {
      broadcast({
        type: "presence",
        message: `${clientMeta.name} left chat`,
        user: clientMeta,
        timestamp: new Date().toISOString(),
      });
    }
  });
});
