import clsx from "clsx";
import ControlBar from "./ControlBar";

interface SectionWrapperWithControllerProps {
  children: React.ReactNode;
  className?: string;
  tabName: string;
  showTags?: boolean;
}

const SectionWrapperWithController = ({
  children,
  className = "",
  tabName,
  showTags = false,
}: SectionWrapperWithControllerProps) => {
  return (
    <div className={clsx("bg-tradingBg rounded-2xl flex flex-col", className)}>
      <div className="w-full border-b border-slate-700/50 mb-1">
        <ControlBar showTags={showTags} tabName={tabName} />
      </div>
      <div className="p-1 flex flex-col">{children}</div>
    </div>
  );
};

export default SectionWrapperWithController;
