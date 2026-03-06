import axios from "axios";
import toast from "react-hot-toast";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const requestTimeoutMs = Number(import.meta.env.VITE_API_TIMEOUT_MS || 15000);
const maxRetryAttempts = Number(import.meta.env.VITE_API_RETRY_ATTEMPTS || 2);
const retryBaseDelayMs = Number(import.meta.env.VITE_API_RETRY_BASE_DELAY_MS || 600);
const retryMaxDelayMs = Number(import.meta.env.VITE_API_RETRY_MAX_DELAY_MS || 3000);
const retryableMethods = new Set(["get", "head", "options", "put", "delete"]);

let networkListenersRegistered = false;
let hasShownOfflineToast = false;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getRetryDelay = (attempt) =>
  Math.min(retryBaseDelayMs * 2 ** Math.max(0, attempt - 1), retryMaxDelayMs);

const isRetryableStatus = (status) =>
  [408, 425, 429, 500, 502, 503, 504].includes(status);

const isNetworkOrTimeoutError = (error) =>
  error?.code === "ERR_NETWORK" ||
  error?.code === "ECONNABORTED" ||
  !error?.response;

const shouldRetryRequest = (error) => {
  const config = error?.config || {};
  if (config._skipRetry) return false;

  const retries = config._retryCount || 0;
  if (retries >= maxRetryAttempts) return false;

  const method = String(config.method || "get").toLowerCase();
  if (!retryableMethods.has(method) && !config._retryUnsafe) return false;

  if (isNetworkOrTimeoutError(error)) return true;
  return isRetryableStatus(error?.response?.status);
};

if (typeof window !== "undefined" && !networkListenersRegistered) {
  networkListenersRegistered = true;

  window.addEventListener("offline", () => {
    hasShownOfflineToast = true;
    toast.error("You are offline. Trying again when the network is available.", {
      id: "network-status",
    });
  });

  window.addEventListener("online", () => {
    if (hasShownOfflineToast) {
      toast.success("Back online.", { id: "network-status" });
      hasShownOfflineToast = false;
    }
  });
}

export class ApiServiceError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "ApiServiceError";
    this.status = options.status || 500;
    this.code = options.code || "API_ERROR";
    this.details = options.details || null;
    this.response = options.response;
    this.originalError = options.originalError;
  }
}

export const normalizeApiError = (error, fallbackMessage = "Request failed") => {
  if (error instanceof ApiServiceError) return error;

  const status = error?.response?.status || 0;
  const data = error?.response?.data;

  const message =
    (error?.code === "ECONNABORTED" ? "Request timed out. Please check your network and try again." : null) ||
    (!error?.response ? "Network issue detected. Please check your connection and try again." : null) ||
    data?.message ||
    data?.error ||
    error?.message ||
    fallbackMessage;

  const code =
    data?.code ||
    (error?.code === "ECONNABORTED"
      ? "TIMEOUT"
      : !error?.response
        ? "NETWORK_ERROR"
        : null) ||
    (status === 401
      ? "UNAUTHORIZED"
      : status === 403
        ? "FORBIDDEN"
        : status === 404
          ? "NOT_FOUND"
          : status >= 500
            ? "SERVER_ERROR"
            : "API_ERROR");

  return new ApiServiceError(message, {
    status,
    code,
    details: data,
    response: error?.response,
    originalError: error,
  });
};

export const serviceRequest = async (requestFn, fallbackMessage) => {
  try {
    return await requestFn();
  } catch (error) {
    throw normalizeApiError(error, fallbackMessage);
  }
};

export const axiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  timeout: requestTimeoutMs,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let pendingRequests = [];

const resolvePendingRequests = (error) => {
  pendingRequests.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve();
  });
  pendingRequests = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const isUnauthorized = error.response?.status === 401;
    const isRefreshCall = originalRequest.url?.includes("/auth/refresh");
    const isLoginCall = originalRequest.url?.includes("/auth/login");

    if (isUnauthorized && !isRefreshCall && !isLoginCall && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingRequests.push({
            resolve: () => resolve(axiosInstance(originalRequest)),
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axiosInstance.post("/auth/refresh");
        resolvePendingRequests(null);
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        resolvePendingRequests(refreshError);
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        return Promise.reject(normalizeApiError(refreshError));
      } finally {
        isRefreshing = false;
      }
    }

    if (shouldRetryRequest(error)) {
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
      const delay = getRetryDelay(originalRequest._retryCount);
      await wait(delay);
      return axiosInstance(originalRequest);
    }

    if (error.config?._useGlobalErrorToast) {
      const message = normalizeApiError(error).message;
      toast.error(message);
    }

    return Promise.reject(normalizeApiError(error));
  },
);
