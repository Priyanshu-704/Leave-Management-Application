import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Button, Input } from "@/components/ui";
import { candidatePortalService } from "@/services/api";
import BrandLogo from "@/components/BrandLogo";

const CandidateLogin = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await candidatePortalService.login(form);
      localStorage.setItem("candidateToken", response.token);
      localStorage.setItem("candidateUser", JSON.stringify(response.candidate));
      toast.success("Login successful");
      navigate("/candidate/dashboard");
    } catch (error) {
      toast.error(error.message || "Candidate login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8 space-y-4">
        <BrandLogo iconClassName="h-9 w-9" textClassName="text-2xl font-bold text-gray-900" />
        <h1 className="text-2xl font-bold text-gray-900">Candidate Login</h1>
        <Input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <Input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        <Button type="submit" className="btn-primary w-full" disabled={loading}>{loading ? "Signing in..." : "Sign In"}</Button>
        <p className="text-sm text-gray-600">No account? <Link to="/candidate/register" className="text-primary-600 font-semibold">Register</Link></p>
        <p className="text-sm text-gray-600">Browse openings: <Link to="/careers" className="text-primary-600 font-semibold">Careers</Link></p>
      </form>
    </div>
  );
};

export default CandidateLogin;
