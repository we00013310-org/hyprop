import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../animate-ui/components/animate/tooltip";

interface MyTooltipProps {
  children: React.ReactNode;
  content?: string | React.ReactNode;
}

const MyTooltip = ({
  children,
  content = "Feature coming soon",
}: MyTooltipProps) => {
  return (
    <TooltipProvider closeDelay={0}>
      <Tooltip>
        <TooltipTrigger>{children}</TooltipTrigger>
        <TooltipContent>{content}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default MyTooltip;
