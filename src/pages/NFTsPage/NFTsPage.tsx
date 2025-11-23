import { useState } from "react";
import {
  Search,
  Grid3x3,
  Grid2x2,
  List,
  Copy,
  ShoppingCart,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { formatWalletAddress } from "@/lib/utils";
import { HoverMenu, MenuItem } from "@/components/ui";
import { useToast } from "@/contexts/ToastContext";
import SectionWrapper from "@/components/ui/SectionWrapper";

const tabs = [
  { id: "Item" as const, label: "Item" },
  { id: "Activity" as const, label: "Activity" },
  { id: "Offers" as const, label: "Offers" },
  { id: "Rare Sats" as const, label: "Rare Sats" },
];

export default function NFTsPage() {
  const [activeTab, setActiveTab] = useState<
    "Item" | "Activity" | "Offers" | "Rare Sats"
  >("Item");
  const toast = useToast();
  const { walletAddress, disconnectWallet } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid-3" | "grid-2" | "list">(
    "grid-3"
  );

  const displayWallet = formatWalletAddress(walletAddress || "");

  // Mock NFT data based on the design
  const nfts = Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    name: `Wizard #3279`,
    description: "Dive into the world of Pepe Wif Swa...",
    price: "0.00550",
    currency: "BTC",
    volumeUSD: "5.93K",
    image: "/nft-placeholder.png", // You'll need to add actual NFT images
  }));

  const filteredNFTs = nfts.filter((nft) =>
    nft.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const copyWalletAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      toast.success("Copied to clipboard!");
    }
  };

  return (
    <div className="fade-in min-h-screen">
      {/* Hero Section */}
      <div className="relative h-96">
        <div
          style={{
            background: `url('/images/bg_nft_page.png') no-repeat center center`,
            backgroundSize: "cover",
          }}
          className="absolute inset-0"
        />

        <div className="relative max-w-[1920px] mx-auto px-6 h-full flex flex-col justify-end pb-8">
          {/* Profile Section */}
          <div className="flex items-end gap-4">
            <div className="w-36 h-36 overflow-hidden rounded-2xl">
              <img src="/images/nft_img.png" alt="nft_img" />
            </div>

            <div className="flex-1 pb-2">
              <h1 className="text-3xl font-bold text-white mb-1">
                {displayWallet}
              </h1>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-slate-300">
                  Total Items:{" "}
                  <span className="text-white font-semibold">7</span>
                </span>
                <span className="text-slate-300">
                  Active On:{" "}
                  <span className="text-white font-semibold">Hyperliquid</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 z-10">
              {walletAddress && (
                <HoverMenu
                  trigger={
                    <span className="text-sm text-white">
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
            </div>
          </div>
        </div>
      </div>

      {/* Tabs and Controls */}
      <div className="bg-sectionBg">
        <div className="border-b border-slate-700/50">
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm border-b-2 transition-colors relative flex gap-1 items-center cursor-pointer border-r border-r-slate-700/50 ${
                    activeTab === tab.id
                      ? "border-b-highlight text-highlight"
                      : "border-b-transparent text-textBtn hover:opacity-60"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1920px] mx-auto px-6 py-6">
        {/* Search and View Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search items"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-sectionBg text-white pl-10 pr-4 py-2.5 rounded-lg border border-slate-700/50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex bg-sectionBg rounded-lg p-1">
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded ${
                  viewMode === "list"
                    ? "bg-slate-700 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("grid-2")}
                className={`p-2 rounded ${
                  viewMode === "grid-2"
                    ? "bg-slate-700 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Grid2x2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("grid-3")}
                className={`p-2 rounded ${
                  viewMode === "grid-3"
                    ? "bg-slate-700 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
            </div>

            <select className="bg-sectionBg text-white px-4 py-2.5 rounded-lg text-sm border-none focus:outline-none focus:ring-2 focus:ring-teal-500">
              <option>All</option>
              <option>Listed</option>
              <option>Unlisted</option>
            </select>
          </div>
        </div>

        {/* NFT Grid */}
        <div
          className={`grid gap-4 ${
            viewMode === "grid-3"
              ? "grid-cols-6"
              : viewMode === "grid-2"
              ? "grid-cols-4"
              : "grid-cols-1"
          }`}
        >
          {filteredNFTs.map((nft) => (
            <SectionWrapper
              className="cursor-pointer hover:scale-105 transition-all"
              key={nft.id}
            >
              <div className="flex flex-col gap-2">
                <img
                  className="rounded-2xl overflow-hidden"
                  src="/images/nft_img.png"
                />
                {/* NFT Info */}
                <div className="flex flex-col gap-1">
                  <h3 className="text-white font-semibold text-sm truncate group-hover:text-teal-400 transition-colors">
                    {nft.name}
                  </h3>
                  <p className="text-slate-400 text-xs mb-2 truncate">
                    {nft.description}
                  </p>

                  <div className="flex items-center justify-between mb-2">
                    <div className="text-white font-bold text-sm">
                      {nft.price}{" "}
                      <span className="text-slate-400 text-xs">
                        {nft.currency}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-slate-400 text-xs">
                    <ShoppingCart className="w-3 h-3" />
                    <span>{nft.volumeUSD}</span>
                  </div>
                </div>
              </div>
            </SectionWrapper>
          ))}
        </div>
      </div>
    </div>
  );
}
