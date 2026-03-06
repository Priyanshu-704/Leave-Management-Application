import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Button, Input } from "@/components/ui";
import { FaEnvelope, FaArrowLeft } from "react-icons/fa";
import { authService } from "@/services/api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await authService.forgotPassword(email);
      toast.success(
        response?.message ||
          "If the account exists, reset instructions have been sent.",
      );
      setEmail("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to process request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-primary-600 p-6 text-center">
          <h2 className="text-3xl font-bold text-white">Forgot Password</h2>
          <p className="text-primary-100 mt-2">We will email you a reset link</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaEnvelope className="text-gray-400" />
              </div>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field pl-10"
                placeholder="john@company.com"
                required
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full btn-primary">
            {loading ? "Sending..." : "Send Reset Link"}
          </Button>

          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-800"
          >
            <FaArrowLeft />
            Back to Login
          </Link>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
