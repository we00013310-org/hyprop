import { LucideIcon } from "lucide-react";

interface TagProps {
  label: string;
  icon: LucideIcon;
  color: string;
}

const Tag = ({ label, color, icon }: TagProps) => {
  const StatusIcon = icon;
  const colorClasses = {
    active: "bg-active/10 text-active",
    red: "bg-red-500/10 text-red-500",
    blue: "bg-blue-500/10 text-blue-500",
    green: "bg-green-500/10 text-green-500",
    gray: "bg-gray-500/10 text-gray-500",
  } as const;

  return (
    <div
      className={`flex items-center space-x-1 px-3 py-1 rounded-full ${
        colorClasses[color as keyof typeof colorClasses]
      }`}
    >
      <span className="text-sm">{label}</span>
      <StatusIcon className="w-4 h-4" />
    </div>
  );
};

export default Tag;
