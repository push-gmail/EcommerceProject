import { useEffect, useState } from "react";
import { Wallet, ShoppingBag, ClipboardList } from "lucide-react";
import backendApi from "../../api/backendApi";

export default function UserDashboard() {
  const [info, setInfo] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);

  const fetchData = async () => {
    const [meRes, orderRes] = await Promise.all([
      backendApi.get("/user/me"),
      backendApi.get("/user/orders"),
    ]);

    setInfo(meRes.data.data);
    setOrders(orderRes.data.data || []);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6 text-white">
      <section className="rounded-[2rem] border border-emerald-400/20 bg-white/10 p-6 backdrop-blur-2xl">
        <h1 className="text-4xl font-black">Welcome, {info?.user?.name}</h1>
        <p className="mt-2 text-slate-400">Your user shopping dashboard.</p>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <Card
          title="Wallet Balance"
          value={`₹${info?.wallet?.balance || 0}`}
          icon={<Wallet />}
        />

        <Card
          title="Total Orders"
          value={orders.length}
          icon={<ShoppingBag />}
        />

        <Card
          title="Placed Orders"
          value={orders.filter((o) => o.status === "placed").length}
          icon={<ClipboardList />}
        />
      </div>
    </div>
  );
}

function Card({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-[2rem] border border-emerald-400/20 bg-white/10 p-5 backdrop-blur-2xl">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-200">
        {icon}
      </div>

      <p className="text-sm text-slate-400">{title}</p>
      <p className="mt-1 text-3xl font-black">{value}</p>
    </div>
  );
}