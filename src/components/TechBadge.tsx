interface TechBadgeProps {
  name: string;
  className?: string;
}

export default function TechBadge({ name, className = "" }: TechBadgeProps) {
  return (
    <span
      className={`inline-block px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.04] border border-white/[0.06] text-white/70 ${className}`}
    >
      {name}
    </span>
  );
}
