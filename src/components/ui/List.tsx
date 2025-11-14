import clsx from "clsx";
import { ReactNode } from "react";

interface ListProps {
  data: {
    label: ReactNode;
    value: ReactNode;
  }[];
  hasBorder?: boolean;
}

const List = ({ data, hasBorder = false }: ListProps) => {
  return (
    <div className="flex flex-col w-full">
      {data.map((o, i) => {
        return (
          <div
            key={i}
            className={clsx("flex py-1 text-white text-sm gap-2", {
              "border-b-[0.6px] border-btnBorder text-base py-4": hasBorder,
            })}
          >
            <div className="flex-1 text-textBtn">{o.label}</div>
            <div className="text-right">{o.value}</div>
          </div>
        );
      })}
    </div>
  );
};

export default List;
