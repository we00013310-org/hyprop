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
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all">
            <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center ${iconClassName}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-slate-400 text-sm font-medium">{title}</h3>
            </div>
            <div className="flex items-baseline gap-2 mt-3">
                <span className="text-3xl font-bold text-white">{value}</span>
                {currency && (
                    <span className="text-slate-400 text-sm font-medium">{currency}</span>
                )}
            </div>
        </div>
    );
}
