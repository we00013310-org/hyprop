import { Link } from "wouter";

import logo from "../assets/logo.svg";

const Logo = () => {
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
