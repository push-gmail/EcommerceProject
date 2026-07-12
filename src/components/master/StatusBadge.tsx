type StatusBadgeProps = {
  status: string;
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const styles: Record<string, string> = {
    active: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
    inactive: "border-slate-400/30 bg-slate-400/10 text-slate-200",
  };

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
        styles[status] || styles.inactive
      }`}
    >
      {status}
    </span>
  );
}