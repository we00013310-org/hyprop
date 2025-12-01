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
import { useState, useEffect } from "react";

interface SizeInputProps {
  value: number;
  tokens: string[];
  max?: number;
  onChangeToken: (val: string) => void;
  onChange: (val: number) => void;
}
const SizeInput = ({ tokens, value, max, onChangeToken, onChange }: SizeInputProps) => {
  const [selectedOpt, setSelected] = useState<string>(tokens[0]);
  const [inputValue, setInputValue] = useState<string>(value === 0 ? "" : String(value));

  // Sync internal string state when external value changes (e.g., from slider or reset)
  useEffect(() => {
    // Only update if the numeric values are different to avoid overwriting user input
    const currentNumericValue = inputValue === "" ? 0 : parseFloat(inputValue);
    if (!isNaN(currentNumericValue) && currentNumericValue !== value) {
      setInputValue(value === 0 ? "" : String(value));
    }
  }, [value]);

  const handleChange = (val: string) => {
    setSelected(val);
    onChangeToken(val);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;

    // Only update parent with valid numbers
    if (val === "" || val === ".") {
      setInputValue(val);
      onChange(0);
    } else {
      const parsed = parseFloat(val);
      if (!isNaN(parsed)) {
        // Enforce max limit if provided
        if (max !== undefined && parsed > max) {
          const clampedValue = max;
          setInputValue(String(clampedValue));
          onChange(clampedValue);
        } else {
          setInputValue(val);
          onChange(parsed);
        }
      }
    }
  };

  return (
    <InputGroup>
      <InputGroupInput
        value={inputValue}
        type="text"
        inputMode="decimal"
        placeholder="Size"
        onChange={handleInputChange}
      />
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
