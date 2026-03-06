import { useEffect, useState } from "react";
import PageSkeleton from "@/components/PageSkeleton";
import toast from "react-hot-toast";
import { Button, Input } from "@/components/ui";
import { candidatePortalService } from "@/services/api";

const CandidateProfile = () => {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    resumeUrl: "",
    currentCompany: "",
    experienceYears: 0,
    password: "",
  });
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const response = await candidatePortalService.getMe();
        const data = response.data;
        setEmail(data.email || "");
        setForm({
          name: data.name || "",
          phone: data.phone || "",
          resumeUrl: data.resumeUrl || "",
          currentCompany: data.currentCompany || "",
          experienceYears: data.experienceYears || 0,
          password: "",
        });
      } catch (error) {
        toast.error(error.message || "Failed to fetch profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      await candidatePortalService.updateMe(form);
      toast.success("Profile updated");
      setForm((prev) => ({ ...prev, password: "" }));
    } catch (error) {
      toast.error(error.message || "Failed to update profile");
    }
  };

  if (loading) return <PageSkeleton rows={6} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600">Manage your candidate profile and resume details.</p>
      </div>

      <form onSubmit={save} className="card grid grid-cols-1 md:grid-cols-2 gap-3">
        <Input placeholder="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <Input placeholder="Email" value={email} disabled />
        <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Input placeholder="Current Company" value={form.currentCompany} onChange={(e) => setForm({ ...form, currentCompany: e.target.value })} />
        <Input type="number" min="0" placeholder="Experience Years" value={form.experienceYears} onChange={(e) => setForm({ ...form, experienceYears: Number(e.target.value) })} />
        <Input placeholder="Resume URL" value={form.resumeUrl} onChange={(e) => setForm({ ...form, resumeUrl: e.target.value })} />
        <Input className="md:col-span-2" type="password" placeholder="New Password (optional)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <Button type="submit" className="btn-primary md:col-span-2">Save Profile</Button>
      </form>
    </div>
  );
};

export default CandidateProfile;
