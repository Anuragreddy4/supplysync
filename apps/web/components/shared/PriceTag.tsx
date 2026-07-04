import { formatINR } from "@/lib/format";

interface PriceTagProps {
  amount: number;
  size?: "sm" | "md" | "lg";
  accent?: boolean;
}

const sizeClasses = {
  sm: "text-sm",
  md: "text-lg",
  lg: "text-2xl",
};

export default function PriceTag({ amount, size = "md", accent = false }: PriceTagProps) {
  return (
    <span className={`price-tag ${sizeClasses[size]} ${accent ? "text-buyer" : "text-heading"}`}>
      {formatINR(amount)}
    </span>
  );
}
