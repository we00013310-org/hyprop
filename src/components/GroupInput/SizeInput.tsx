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
  value: number;
  tokens: string[];
  onChangeToken: (val: string) => void;
}
const SizeInput = ({ tokens, value, onChangeToken }: SizeInputProps) => {
  const [selectedOpt, setSelected] = useState<string>(tokens[0]);
  const handleChange = (val: string) => {
    setSelected(val);
    onChangeToken(val);
  };

  return (
    <InputGroup>
      <InputGroupInput value={value} type="number" placeholder="Size" />
      <InputGroupAddon align="inline-end">
        <DropdownMenu>
          <DropdownMenuTrigger>
            <InputGroupButton
              className="text-textBtn hover:bg-transparent font-light hover:text-white cursor-pointer"
              variant="ghost"
            >
              {selectedOpt} <ChevronDownIcon />
            </InputGroupButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-cardBg border-textBtn" align="end">
            {tokens.map((o) => (
              <DropdownMenuItem
                className="text-textBtn hover:bg-textBtn hover:text-cardBg"
                onClick={() => handleChange(o)}
                key={o}
              >
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
