import clsx from "clsx";

interface SectionWrapperProps {
  children: React.ReactNode;
  className?: string;
}

const SectionWrapper = ({ children, className = "" }: SectionWrapperProps) => {
  return (
    <div
      className={clsx("bg-tradingBg p-3 rounded-2xl flex flex-col", className)}
    >
      {children}
    </div>
  );
};

export default SectionWrapper;
