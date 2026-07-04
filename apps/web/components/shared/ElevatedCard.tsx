import { ReactNode } from "react";

interface ElevatedCardProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

export default function ElevatedCard({ children, className = "", id }: ElevatedCardProps) {
  return (
    <div className={`elevated-card p-6 ${className}`} id={id}>
      {children}
    </div>
  );
}
