import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Edit,
  Loader2,
  Plus,
  RefreshCcw,
  Save,
  Trash2,
  UserCog,
  X,
} from "lucide-react";
import backendApi from "../../api/backendApi";

type Employee = {
  _id: string;
  employeeId?: string;
  name: string;
  email: string;
  phone?: string;
  status: "active" | "inactive" | "blocked";
  availability: "available" | "busy" | "offline";
  createdAt?: string;
};

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  status: "active",
  availability: "available",
};

export default function MasterEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [form, setForm] = useState(emptyForm);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await backendApi.get("/master/employees");
      const data = Array.isArray(res.data?.data) ? res.data.data : [];

      setEmployees(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const openCreateModal = () => {
    setEditingEmployee(null);
    setForm(emptyForm);
    setMessage("");
    setError("");
    setModalOpen(true);
  };

  const openEditModal = (employee: Employee) => {
    setEditingEmployee(employee);
    setForm({
      name: employee.name || "",
      email: employee.email || "",
      phone: employee.phone || "",
      password: "",
      status: employee.status || "active",
      availability: employee.availability || "available",
    });
    setMessage("");
    setError("");
    setModalOpen(true);
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage("");
      setError("");

      if (!form.name.trim()) {
        setError("Employee name is required");
        return;
      }

      if (!form.email.trim()) {
        setError("Employee email is required");
        return;
      }

      if (!editingEmployee && form.password.trim().length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }

      if (editingEmployee) {
        await backendApi.put(`/master/employees/${editingEmployee._id}`, {
          name: form.name,
          email: form.email,
          phone: form.phone,
          status: form.status,
          availability: form.availability,
        });

        if (form.password.trim()) {
          await backendApi.patch(
            `/master/employees/${editingEmployee._id}/reset-password`,
            {
              password: form.password,
            }
          );
        }

        setMessage("Employee updated successfully");
      } else {
        await backendApi.post("/master/employees", {
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
        });

        setMessage("Employee created successfully");
      }

      setModalOpen(false);
      await fetchEmployees();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save employee");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (
    employeeMongoId: string,
    status: "active" | "inactive" | "blocked"
  ) => {
    try {
      setError("");

      await backendApi.patch(`/master/employees/${employeeMongoId}/status`, {
        status,
      });

      await fetchEmployees();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update status");
    }
  };

  const deleteEmployee = async (employeeMongoId: string) => {
    const ok = window.confirm("Are you sure you want to delete this employee?");

    if (!ok) return;

    try {
      setError("");

      await backendApi.delete(`/master/employees/${employeeMongoId}`);

      await fetchEmployees();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete employee");
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-emerald-400/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl md:flex-row md:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-300">
            Master Control
          </p>

          <h1 className="mt-2 text-3xl font-black text-white">
            Employee Management
          </h1>

          <p className="mt-2 text-sm text-slate-300">
            Create employees, send login credentials and manage support access.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={fetchEmployees}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white hover:bg-white/15"
          >
            <RefreshCcw size={16} />
            Refresh
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-400"
          >
            <Plus size={18} />
            Add Employee
          </button>
        </div>
      </div>

      {message && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm font-bold text-emerald-100">
          <CheckCircle2 size={18} />
          {message}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm font-bold text-red-100">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/10 shadow-2xl backdrop-blur-xl">
        {loading ? (
          <div className="flex min-h-[320px] items-center justify-center gap-2 text-white">
            <Loader2 className="animate-spin" size={20} />
            Loading employees...
          </div>
        ) : employees.length === 0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center text-center text-white">
            <UserCog size={48} className="text-emerald-300" />

            <h3 className="mt-4 text-xl font-black">No employees yet</h3>

            <p className="mt-2 text-sm text-slate-300">
              Create your first support employee.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-black/20 text-xs uppercase tracking-[0.16em] text-slate-300">
                <tr>
                  <th className="px-5 py-4">Employee</th>
                  <th className="px-5 py-4">Employee ID</th>
                  <th className="px-5 py-4">Phone</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Availability</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10">
                {employees.map((employee) => (
                  <tr key={employee._id} className="text-white">
                    <td className="px-5 py-4">
                      <p className="font-black">{employee.name}</p>
                      <p className="mt-1 text-xs text-slate-300">
                        {employee.email}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-black text-emerald-200">
                        {employee.employeeId || "-"}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-slate-200">
                      {employee.phone || "-"}
                    </td>

                    <td className="px-5 py-4">
                      <select
                        value={employee.status}
                        onChange={(event) =>
                          updateStatus(
                            employee._id,
                            event.target.value as Employee["status"]
                          )
                        }
                        className="rounded-xl border border-white/10 bg-[#031C12] px-3 py-2 text-sm font-bold text-white outline-none"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="blocked">Blocked</option>
                      </select>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${
                          employee.availability === "available"
                            ? "bg-emerald-400/15 text-emerald-200"
                            : employee.availability === "busy"
                            ? "bg-yellow-400/15 text-yellow-200"
                            : "bg-slate-400/15 text-slate-200"
                        }`}
                      >
                        {employee.availability}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(employee)}
                          className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-400/10 text-cyan-200 hover:bg-cyan-400/20"
                        >
                          <Edit size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteEmployee(employee._id)}
                          className="grid h-9 w-9 place-items-center rounded-xl bg-red-400/10 text-red-200 hover:bg-red-400/20"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#020b08] p-6 text-white shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-black">
                  {editingEmployee ? "Edit Employee" : "Create Employee"}
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  {editingEmployee
                    ? "Update employee details."
                    : "Employee will receive login credentials."}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="Name"
                name="name"
                value={form.name}
                onChange={handleChange}
              />

              <Input
                label="Email"
                name="email"
                value={form.email}
                onChange={handleChange}
              />

              <Input
                label="Phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
              />

              <Input
                label={editingEmployee ? "New Password Optional" : "Password"}
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
              />

              <Select
                label="Status"
                name="status"
                value={form.status}
                onChange={handleChange}
                options={["active", "inactive", "blocked"]}
              />

              <Select
                label="Availability"
                name="availability"
                value={form.availability}
                onChange={handleChange}
                options={["available", "busy", "offline"]}
              />
            </div>

            {error && (
              <p className="mt-4 rounded-2xl bg-red-400/10 p-3 text-sm font-bold text-red-200">
                {error}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-bold text-slate-200 hover:bg-white/10"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-white disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Save size={16} />
                )}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Input({
  label,
  name,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  name: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </span>

      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-white/10 px-4 text-sm font-semibold text-white outline-none placeholder:text-slate-500 focus:border-emerald-300/40"
      />
    </label>
  );
}

function Select({
  label,
  name,
  value,
  onChange,
  options,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </span>

      <select
        name={name}
        value={value}
        onChange={onChange}
        className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-[#031C12] px-4 text-sm font-semibold text-white outline-none focus:border-emerald-300/40"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}