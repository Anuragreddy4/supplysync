interface StatusPillProps {
  status: "pending" | "confirmed" | "in_transit" | "delivered" | "cancelled";
}

const labels: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  in_transit: "In Transit",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function StatusPill({ status }: StatusPillProps) {
  return (
    <span className={`status-pill status-pill--${status}`} id={`status-pill-${status}`}>
      {labels[status] || status}
    </span>
  );
}
