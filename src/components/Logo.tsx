import { Link } from "wouter";

import logo from "../assets/logo.svg";

const Logo = ({ disabled = false }: { disabled?: boolean }) => {
  if (disabled) {
    return (
      <div className="flex items-center gap-3 mb-4">
        <img src={logo} alt="HyProp" className="w-12 h-12" />
        <span className="text-white text-4xl font-medium tracking-[7px] font-poppins">
          HYPROP
        </span>
      </div>
    );
  }

  return (
    <Link
      href="/"
      className="flex items-center gap-3 hover:scale-110 transition-all"
    >
      <img src={logo} alt="HyProp" className="w-8 h-8" />
      <span className="text-white text-xl font-medium tracking-[7px] font-poppins">
        HYPROP
      </span>
    </Link>
  );
};

export default Logo;
