import { LucideIcon, PackageOpen } from "lucide-react";
import Link from "next/link";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon: Icon = PackageOpen,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center" id="empty-state">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-muted" />
      </div>
      <h3 className="font-jakarta font-semibold text-heading text-lg mb-1">{title}</h3>
      {description && <p className="text-muted text-sm max-w-sm mb-5">{description}</p>}
      {actionLabel && actionHref && (
        <Link href={actionHref} className="btn-primary-buyer text-sm">
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionHref && (
        <button onClick={onAction} className="btn-primary-buyer text-sm">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
