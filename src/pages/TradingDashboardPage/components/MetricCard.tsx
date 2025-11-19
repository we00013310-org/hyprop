interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  className?: string;
}

const MetricCard = ({
  title,
  value,
  subtitle,
  className = "",
}: MetricCardProps) => {
  return (
    <div
      className={`bg-[#0F1A1E66] rounded-lg h-40 flex flex-col justify-center items-center p-4 ${className}`}
    >
      <div className="text-xs text-textBtn mb-2">{title}</div>
      {subtitle && (
        <div className="text-xs text-slate-500 mb-1">{subtitle}</div>
      )}
      <div className="text-3xl font-semibold text-white">{value}</div>
    </div>
  );
};

export default MetricCard;
