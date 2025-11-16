import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { ChevronDown, Globe, Settings, Copy, LogOut } from "lucide-react";

import { NavLink } from "./NavLink";
import { Button, IconButton, HoverMenu, MenuItem } from "../ui";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";

import Logo from "../Logo";

export function Navbar() {
  const [location, setLocation] = useLocation();
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);
  const moreDropdownRef = useRef<HTMLDivElement>(null);
  const { walletAddress, disconnectWallet } = useAuth();
  const toast = useToast();

  // Handle click outside for More dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        moreDropdownRef.current &&
        !moreDropdownRef.current.contains(event.target as Node)
      ) {
        setShowMoreDropdown(false);
      }
    };

    if (showMoreDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMoreDropdown]);

  const formatWalletAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyWalletAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      toast.success("Copied to clipboard!");
    }
  };

  return (
    <nav>
      <div className="max-w-[1920px] mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left: Logo */}

        <Logo />
        {/* Center: Navigation Links */}
        <div className="flex items-center gap-8">
          <NavLink href="/trade" active={location === "/trade"}>
            Trade
          </NavLink>
          <NavLink href="/portfolio" active={location === "/portfolio"}>
            Portfolio
          </NavLink>
          <NavLink href="/referrals" active={location === "/referrals"}>
            Referrals
          </NavLink>
          <NavLink href="/leaderboard" active={location === "/leaderboard"}>
            Leaderboard
          </NavLink>

          {/* More Dropdown */}
          <div className="relative" ref={moreDropdownRef}>
            <button
              onClick={() => setShowMoreDropdown(!showMoreDropdown)}
              className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
            >
              More
              <ChevronDown className="w-4 h-4" />
            </button>

            {showMoreDropdown && (
              <div className="absolute top-full mt-2 right-0 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-2 z-50">
                <NavLink href="/about">
                  <span className="block px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-700">
                    About
                  </span>
                </NavLink>
                <NavLink href="/help">
                  <span className="block px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-700">
                    Help
                  </span>
                </NavLink>
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <Button href="/">Dashboard</Button>

          {walletAddress && (
            <HoverMenu
              trigger={
                <span className="text-sm">
                  {formatWalletAddress(walletAddress)}
                </span>
              }
            >
              <MenuItem
                onClick={copyWalletAddress}
                leftIcon={<Copy className="w-4 h-4" />}
              >
                Copy Address
              </MenuItem>
              <MenuItem
                variant="danger"
                onClick={disconnectWallet}
                leftIcon={<LogOut className="w-4 h-4" />}
              >
                Disconnect
              </MenuItem>
            </HoverMenu>
          )}

          <IconButton onClick={() => setLocation("/demo")}>
            <Globe />
          </IconButton>

          <IconButton onClick={() => setLocation("/demo")}>
            <Settings />
          </IconButton>
        </div>
      </div>
    </nav>
  );
}
