import { FormEvent, useEffect, useState } from "react";
import backendApi from "../../api/backendApi";

export default function UserDeposit() {
  const [form, setForm] = useState({
    amount: "",
    method: "upi",
    transactionId: "",
    proofImage: "",
  });

  const [deposits, setDeposits] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchDeposits = async () => {
    const res = await backendApi.get("/user/deposits");
    setDeposits(res.data.data || []);
  };

  useEffect(() => {
    fetchDeposits();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      setMessage("");
      setError("");

      const res = await backendApi.post("/user/deposit", {
        ...form,
        amount: Number(form.amount),
      });

      setMessage(
        res.data.message || "Deposit request submitted for master approval"
      );

      setForm({
        amount: "",
        method: "upi",
        transactionId: "",
        proofImage: "",
      });

      fetchDeposits();
    } catch (err: any) {
      setError(err.response?.data?.message || "Deposit failed");
    }
  };

  return (
    <div className="space-y-6 text-white">
      <section className="rounded-[2rem] border border-emerald-400/20 bg-white/10 p-6 backdrop-blur-2xl">
        <h1 className="text-3xl font-black">Deposit</h1>
        <p className="mt-1 text-slate-400">
          Submit deposit request. Wallet will be credited after master approval.
        </p>
      </section>

      {message && (
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-emerald-200">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-rose-200">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="rounded-[2rem] border border-emerald-400/20 bg-white/10 p-6 backdrop-blur-2xl"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <input
            type="number"
            placeholder="Amount"
            className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 outline-none"
            value={form.amount}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, amount: e.target.value }))
            }
          />

          <select
            className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 outline-none"
            value={form.method}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, method: e.target.value }))
            }
          >
            <option className="bg-[#031C12]" value="upi">
              UPI
            </option>
            <option className="bg-[#031C12]" value="bank">
              Bank
            </option>
            <option className="bg-[#031C12]" value="cash">
              Cash
            </option>
          </select>

          <input
            placeholder="Transaction ID"
            className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 outline-none"
            value={form.transactionId}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, transactionId: e.target.value }))
            }
          />

          <input
            placeholder="Proof Image URL / Base64"
            className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 outline-none"
            value={form.proofImage}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, proofImage: e.target.value }))
            }
          />
        </div>

        <button className="mt-5 rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-400 to-blue-500 px-6 py-3 font-black text-slate-950">
          Submit Deposit Request
        </button>
      </form>

      <section className="rounded-[2rem] border border-emerald-400/20 bg-white/10 p-6 backdrop-blur-2xl">
        <h2 className="mb-4 text-2xl font-black">Deposit History</h2>

        <div className="overflow-x-auto rounded-3xl border border-white/10 bg-black/30">
          <table className="w-full text-left text-sm">
            <thead className="bg-emerald-400/10 text-emerald-100">
              <tr>
                <th className="p-4">Amount</th>
                <th className="p-4">Method</th>
                <th className="p-4">Transaction</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>

            <tbody>
              {deposits.map((deposit) => (
                <tr key={deposit._id} className="border-t border-white/10">
                  <td className="p-4">₹{deposit.amount}</td>
                  <td className="p-4">{deposit.method}</td>
                  <td className="p-4">{deposit.transactionId || "-"}</td>
                  <td className="p-4">{deposit.status}</td>
                </tr>
              ))}

              {deposits.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400">
                    No deposit found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}