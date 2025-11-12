import { LucideIcon, Inbox } from "lucide-react";

interface EmptyPlaceholderProps {
    message: string;
    icon?: LucideIcon;
    iconClassName?: string;
}

export function EmptyPlaceholder({
    message,
    icon: Icon = Inbox,
    iconClassName = "text-slate-500"
}: EmptyPlaceholderProps) {
    return (
        <div className="bg-[#1a2332] rounded-2xl p-16 border border-dashed border-[#2a3647]">
            <div className="flex flex-col items-center justify-center text-center">
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center mb-5 ${iconClassName}`}>
                    <Icon className="w-10 h-10" />
                </div>
                <p className="text-slate-400 text-base font-medium">{message}</p>
            </div>
        </div>
    );
}
