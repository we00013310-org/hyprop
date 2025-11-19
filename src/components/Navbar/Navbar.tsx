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
  const [showSettings, setShowSettings] = useState(false);
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
      <div className="max-w-[1920px] mx-auto px-4 h-16 flex items-center justify-between relative">
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
              <div className="absolute top-full mt-2 right-0 w-48 bg-cardBg rounded-lg shadow-xl py-2 z-50">
                <NavLink href="/about">
                  <span className="block px-4 py-2 text-sm text-slate-400 hover:text-white">
                    About
                  </span>
                </NavLink>
                <NavLink href="/help">
                  <span className="block px-4 py-2 text-sm text-slate-400 hover:text-white">
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

          <IconButton onClick={() => setShowSettings(true)}>
            <Settings />
          </IconButton>
          {!!showSettings && (
            <div
              onClick={() => setShowSettings(false)}
              className="fixed top-0 left-0 w-screen h-screen z-10"
            >
              <div className="absolute right-0 top-8 mt-2 w-64 bg-dropdownBg border border-slate-700 rounded-lg shadow-xl z-50">
                <div className="p-2">
                  <button className="w-full text-left px-3 py-2 text-sm hover:bg-slate-700/50 rounded flex items-center justify-between">
                    <span className="text-slate-300">
                      Trading Terms & Conditions
                    </span>
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm hover:bg-slate-700/50 rounded flex items-center justify-between">
                    <span className="text-slate-300">Account Statement</span>
                  </button>
                  <div className="border-t border-slate-700 my-1" />
                  <button className="w-full text-left px-3 py-2 text-sm hover:bg-slate-700/50 rounded flex items-center justify-between">
                    <span className="text-slate-300">Broker Price Alerts</span>
                    <div className="w-10 h-5 bg-teal-500 rounded-full relative">
                      <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full" />
                    </div>
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm hover:bg-slate-700/50 rounded flex items-center justify-between">
                    <span className="text-slate-300">Reference Currency</span>
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm hover:bg-slate-700/50 rounded flex items-center justify-between">
                    <span className="text-slate-300">Languages</span>
                  </button>
                  <div className="border-t border-slate-700 my-1" />
                  <button className="w-full text-left px-3 py-2 text-sm hover:bg-slate-700/50 rounded flex items-center justify-between">
                    <span className="text-slate-300">
                      Play Sound on Order Execution
                    </span>
                    <div className="w-10 h-5 bg-slate-600 rounded-full relative">
                      <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full" />
                    </div>
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm hover:bg-slate-700/50 rounded flex items-center justify-between">
                    <span className="text-slate-300">
                      Play Sound on Order Rejection
                    </span>
                    <div className="w-10 h-5 bg-slate-600 rounded-full relative">
                      <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full" />
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
