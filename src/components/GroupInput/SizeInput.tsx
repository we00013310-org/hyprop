import { ChevronDownIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useState } from "react";

interface SizeInputProps {
  tokens: string[];
}
const SizeInput = ({ tokens }: SizeInputProps) => {
  const [selectedOpt, setSelected] = useState<string>(tokens[0]);

  return (
    <InputGroup>
      <InputGroupInput type="number" placeholder="Size" />
      <InputGroupAddon align="inline-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <InputGroupButton
              className="text-textBtn hover:bg-transparent font-light hover:text-white cursor-pointer"
              variant="ghost"
            >
              {selectedOpt} <ChevronDownIcon />
            </InputGroupButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {tokens.map((o) => (
              <DropdownMenuItem onClick={() => setSelected(o)} key={o}>
                {o.toUpperCase()}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </InputGroupAddon>
    </InputGroup>
  );
};

export default SizeInput;
