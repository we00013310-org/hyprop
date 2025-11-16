import clsx from "clsx";

interface CardTagProps {
  text: string;
  className?: string;
  bgClassName?: string;
  variant?: "dark" | "normal";
}

const CardTag = ({
  text,
  className = "",
  variant = "normal",
}: CardTagProps) => {
  const isDark = variant === "dark";
  const textCn = clsx("text-lg font-medium", {
    "text-cardTypeText": !isDark,
    "text-active": isDark,
  });
  const bgCn = clsx({
    "bg-tagDarkBg": isDark,
    "bg-tagNormalBg": !isDark,
  });

  return (
    <div
      className={`w-fit flex items-center relative rounded-tl-2xl rounded-br-2xl px-4 py-2 ${bgCn} ${className}`}
    >
      <span className={textCn}>{text}</span>
    </div>
  );
};

export default CardTag;
