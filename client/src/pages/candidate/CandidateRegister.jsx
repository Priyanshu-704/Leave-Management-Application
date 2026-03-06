import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Button, Input } from "@/components/ui";
import { candidatePortalService } from "@/services/api";
import BrandLogo from "@/components/BrandLogo";

const CandidateRegister = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    resumeUrl: "",
    currentCompany: "",
    experienceYears: 0,
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await candidatePortalService.register(form);
      localStorage.setItem("candidateToken", response.token);
      localStorage.setItem("candidateUser", JSON.stringify(response.candidate));
      toast.success("Registration successful");
      navigate("/candidate/dashboard");
    } catch (error) {
      toast.error(error.message || "Candidate registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white w-full max-w-xl rounded-2xl shadow-xl p-8 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <BrandLogo iconClassName="h-9 w-9" textClassName="text-2xl font-bold text-gray-900" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 md:col-span-2">Candidate Registration</h1>
        <Input placeholder="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <Input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <Input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Input placeholder="Current Company" value={form.currentCompany} onChange={(e) => setForm({ ...form, currentCompany: e.target.value })} />
        <Input type="number" min="0" placeholder="Experience Years" value={form.experienceYears} onChange={(e) => setForm({ ...form, experienceYears: Number(e.target.value) })} />
        <Input className="md:col-span-2" placeholder="Resume URL" value={form.resumeUrl} onChange={(e) => setForm({ ...form, resumeUrl: e.target.value })} />
        <Button type="submit" className="btn-primary md:col-span-2" disabled={loading}>{loading ? "Creating account..." : "Register"}</Button>
        <p className="text-sm text-gray-600 md:col-span-2">Already registered? <Link to="/candidate/login" className="text-primary-600 font-semibold">Login</Link></p>
      </form>
    </div>
  );
};

export default CandidateRegister;
