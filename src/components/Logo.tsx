import { TrendingUp } from "lucide-react";
import { Link } from "wouter";

const Logo = () => {
  return (
    <Link
      href="/"
      className="flex items-center space-x-3 hover:scale-110 transition-all"
    >
      <TrendingUp className="w-8 h-8 text-blue-500" />
      <h1 className="text-2xl font-bold text-white">HyProp</h1>
    </Link>
  );
};

export default Logo;
