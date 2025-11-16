import { HelpCircle } from "lucide-react";
import MySpinner from "../ui/MySpinner";
import SectionWrapper from "../ui/SectionWrapper";

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  loading?: boolean;
  showHelp?: boolean;
}

export default function StatCard({
  title,
  value,
  icon,
  loading = false,
  showHelp = false,
}: StatCardProps) {
  return (
    <SectionWrapper>
      <div className="flex gap-2">
        <div className="flex items-start">
          <div className="p-3 bg-highlight/10 rounded-full border border-highlight/20">
            {icon}
          </div>
        </div>
        <div className="space-y-1 flex-1">
          <div className="text-sm text-textBtn">{title}</div>
          <div className="text-3xl font-bold text-white">
            {loading ? (
              <div className="flex items-center gap-2">
                <MySpinner />
              </div>
            ) : (
              value
            )}
          </div>
        </div>
        {showHelp && (
          <div className="flex items-start mt-1">
            <button className="text-textBtn hover:text-white transition-colors">
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </SectionWrapper>
  );
}
