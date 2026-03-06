import { useState } from "react";
import { Button, Input } from "@/components/ui";
import { useAuth } from "../context/AuthContext";
import { authService } from "@/services/api";
import { usePortalPaths } from "../context/PortalPathContext";
import { Link, useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock, FaSignInAlt, FaDesktop, FaExclamationTriangle } from "react-icons/fa";
import { loginSchema, mapZodErrors } from "@/lib/validation";
import toast from "react-hot-toast";
import BrandLogo from "@/components/BrandLogo";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [takeoverPrompt, setTakeoverPrompt] = useState(null);
  const [twoFactorState, setTwoFactorState] = useState({
    required: false,
    code: "",
    message: "",
    deviceName: "",
  });
  const { login } = useAuth();
  const portalPaths = usePortalPaths();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const parsed = loginSchema.safeParse(formData);
    if (!parsed.success) {
      setErrors(mapZodErrors(parsed.error));
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const precheck = await authService.precheckLogin({
        email: formData.email,
        password: formData.password,
      });

      if (precheck?.hasActiveSession) {
        setTakeoverPrompt(precheck.activeSession || {});
        setLoading(false);
        return;
      }
    } catch (error) {
      setLoading(false);
      toast.error(error.message || "Login failed");
      return;
    }

    const result = await login(formData.email, formData.password);
    setLoading(false);
    if (result?.requiresTwoFactor) {
      setTwoFactorState({
        required: true,
        code: "",
        message: result.message || "Enter the verification code sent to your email.",
        deviceName: result.deviceName || "",
      });
      return;
    }
    if (result?.success) {
      navigate(result.forcePasswordChange ? "/profile" : "/dashboard");
    }
  };

  const confirmTakeover = async () => {
    setLoading(true);
    const result = await login(
      formData.email,
      formData.password,
      { takeoverExistingSession: true },
    );
    setLoading(false);
    if (result?.requiresTwoFactor) {
      setTakeoverPrompt(null);
      setTwoFactorState({
        required: true,
        code: "",
        message: result.message || "Enter the verification code sent to your email.",
        deviceName: result.deviceName || "",
      });
      return;
    }
    if (result?.success) {
      setTakeoverPrompt(null);
      navigate(result.forcePasswordChange ? "/profile" : "/dashboard");
    }
  };

  const verifyTwoFactor = async () => {
    if (!twoFactorState.code.trim()) {
      toast.error("Enter verification code");
      return;
    }
    setLoading(true);
    const result = await login(formData.email, formData.password, {
      takeoverExistingSession: true,
      twoFactorCode: twoFactorState.code.trim(),
    });
    setLoading(false);
    if (result?.success) {
      setTwoFactorState({ required: false, code: "", message: "", deviceName: "" });
      navigate(result.forcePasswordChange ? "/profile" : "/dashboard");
    }
  };

  const hasSecurityPrompt = Boolean(takeoverPrompt || twoFactorState.required);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl w-full overflow-hidden">
          {/* Header */}
          <div className="bg-primary-600 p-6 text-center">
            <BrandLogo
              className="justify-center"
              iconClassName="h-10 w-10"
              textClassName="text-3xl font-bold text-white"
            />
            <p className="text-primary-100 mt-2">Leave Management System</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div>
              <label className="required-label block text-gray-700 text-sm font-semibold mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="text-gray-400" />
                </div>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="input-field pl-10"
                  placeholder="john@company.com"
                  required
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-600 mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="required-label block text-gray-700 text-sm font-semibold mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400" />
                </div>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="input-field pl-10"
                  placeholder="••••••••"
                  required
                />
              </div>
              {errors.password && (
                <p className="text-xs text-red-600 mt-1">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Input
                  type="checkbox"
                  id="remember"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="remember" className="ml-2 text-sm text-gray-600">
                  Remember me
                </label>
              </div>
              <Link
                to="/forgot-password"
                className="text-sm text-primary-600 hover:text-primary-800 font-medium"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <FaSignInAlt />
                  <span>Sign In</span>
                </>
              )}
            </Button>

            <div className="border-t pt-4 space-y-2 text-sm text-gray-600">
              <p>
                Candidate?{" "}
                <Link
                  to={portalPaths.candidate.login}
                  className="text-primary-600 hover:text-primary-800 font-medium"
                >
                  Candidate Login
                </Link>
              </p>
              <p>
                New candidate?{" "}
                <Link
                  to={portalPaths.candidate.register}
                  className="text-primary-600 hover:text-primary-800 font-medium"
                >
                  Register and Apply
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      {hasSecurityPrompt && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={() => { setTakeoverPrompt(null); setTwoFactorState((prev) => ({ ...prev, required: false })); }} />
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-gradient-to-b from-primary-700 via-primary-700 to-primary-800 shadow-2xl overflow-y-auto border-l border-primary-500/40">
            <div className="sticky top-0 z-10 border-b border-primary-500/40 bg-primary-800/70 backdrop-blur px-5 py-4">
              <p className="text-white font-semibold text-lg">Security Check</p>
              <p className="text-primary-100 text-sm mt-1">Verify this sign-in safely</p>
            </div>
            <div className="p-5 space-y-4">
            {takeoverPrompt && (
              <div className="rounded-xl border border-amber-300/70 bg-amber-50 p-4 text-sm shadow-md">
                <p className="font-semibold text-amber-900 flex items-center gap-2">
                  <FaExclamationTriangle />
                  Other Device Session
                </p>
                <p className="text-amber-800 mt-2 flex items-center gap-2">
                  <FaDesktop />
                  {takeoverPrompt.deviceName || "Unknown Device"} ({takeoverPrompt.ipAddress || "N/A"})
                </p>
                <p className="text-amber-800 mt-1">
                  Continue to sign in and log out the other device.
                </p>
                <div className="flex gap-2 mt-3">
                  <Button
                    type="button"
                    className="px-3 py-2 bg-amber-700 text-white rounded hover:bg-amber-800"
                    onClick={confirmTakeover}
                    disabled={loading}
                  >
                    Continue Login
                  </Button>
                  <Button
                    type="button"
                    className="px-3 py-2 bg-white text-slate-700 border border-slate-200 rounded hover:bg-slate-50"
                    onClick={() => setTakeoverPrompt(null)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {twoFactorState.required && (
              <div className="rounded-xl border border-primary-200 bg-white p-4 text-sm shadow-md">
                <p className="font-semibold text-primary-800">Two-Factor Verification</p>
                <p className="text-primary-700 mt-1">{twoFactorState.message}</p>
                {twoFactorState.deviceName && (
                  <p className="text-primary-700 mt-1">Device: {twoFactorState.deviceName}</p>
                )}
                <label className="form-label mt-3 text-slate-700">Verification Code</label>
                <Input
                  type="text"
                  value={twoFactorState.code}
                  onChange={(e) =>
                    setTwoFactorState((prev) => ({ ...prev, code: e.target.value.replace(/\\D/g, "").slice(0, 6) }))
                  }
                  placeholder="Enter 6-digit code"
                  className="input-field"
                />
                <div className="flex gap-2 mt-3">
                  <Button type="button" className="btn-primary" onClick={verifyTwoFactor} disabled={loading}>
                    Verify & Login
                  </Button>
                  <Button
                    type="button"
                    className="px-3 py-2 bg-white text-slate-700 border border-slate-200 rounded hover:bg-slate-50"
                    onClick={() => setTwoFactorState({ required: false, code: "", message: "", deviceName: "" })}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
