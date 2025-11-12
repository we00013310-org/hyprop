import { DollarSign, LucideIcon } from "lucide-react";

interface StatCardProps {
    title: string;
    value: string | number;
    currency?: string;
    icon?: LucideIcon;
    iconClassName?: string;
}

export function StatCard({
    title,
    value,
    currency = "USDC",
    icon: Icon = DollarSign,
    iconClassName = "text-emerald-400"
}: StatCardProps) {
    return (
        <div className="bg-[#1a2332] rounded-2xl p-6 border border-[#2a3647] hover:border-[#3a4657] transition-all shadow-lg">
            <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center ${iconClassName}`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
            <div className="space-y-1">
                <p className="text-slate-400 text-sm font-medium">{title}</p>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-white">{value}</span>
                    {currency && (
                        <span className="text-slate-500 text-sm font-medium">{currency}</span>
                    )}
                </div>
            </div>
        </div>
    );
}
