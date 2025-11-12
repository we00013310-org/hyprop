import { LucideIcon, Inbox } from "lucide-react";

interface EmptyPlaceholderProps {
    message: string;
    icon?: LucideIcon;
    iconClassName?: string;
}

export function EmptyPlaceholder({
    message,
    icon: Icon = Inbox,
    iconClassName = "text-slate-600"
}: EmptyPlaceholderProps) {
    return (
        <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-12 border border-slate-700/30">
            <div className="flex flex-col items-center justify-center text-center">
                <div className={`w-16 h-16 rounded-full bg-slate-700/30 flex items-center justify-center mb-4 ${iconClassName}`}>
                    <Icon className="w-8 h-8" />
                </div>
                <p className="text-slate-400 text-sm font-medium">{message}</p>
            </div>
        </div>
    );
}
