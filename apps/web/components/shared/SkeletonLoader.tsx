interface SkeletonLoaderProps {
  count?: number;
  type?: "card" | "row" | "stat";
}

function SkeletonCard() {
  return (
    <div className="elevated-card overflow-hidden">
      <div className="skeleton h-40 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-3 w-1/2" />
        <div className="skeleton h-6 w-1/3 mt-2" />
        <div className="skeleton h-10 w-full mt-2" />
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="elevated-card p-4 flex items-center gap-4">
      <div className="skeleton w-10 h-10 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-4 w-2/3" />
        <div className="skeleton h-3 w-1/3" />
      </div>
      <div className="skeleton h-6 w-20" />
    </div>
  );
}

function SkeletonStat() {
  return (
    <div className="elevated-card p-5 space-y-3">
      <div className="skeleton h-3 w-1/2" />
      <div className="skeleton h-8 w-1/3" />
    </div>
  );
}

export default function SkeletonLoader({ count = 4, type = "card" }: SkeletonLoaderProps) {
  const Component = type === "row" ? SkeletonRow : type === "stat" ? SkeletonStat : SkeletonCard;
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Component key={i} />
      ))}
    </>
  );
}
