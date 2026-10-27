import React from "react"
import { Sparkles, Bug, Code2, CheckCircle2 } from "lucide-react"

interface PromptItem {
	icon: React.ElementType
	title: string
	description: string
	prompt: string
	iconColor: string
	iconBg: string
}

interface PromptSuggestionsProps {
	onSelectPrompt: (prompt: string) => void
	className?: string
}

const SUGGESTIONS: PromptItem[] = [
	{
		icon: Sparkles,
		title: "Buat Fitur Baru",
		description: "Buat komponen atau logika baru",
		prompt: "Buatkan fitur atau komponen baru dengan TypeScript: ",
		iconColor: "text-sky-400",
		iconBg: "bg-sky-500/10 border-sky-500/20",
	},
	{
		icon: Bug,
		title: "Perbaiki Bug",
		description: "Analisis & atasi error pada kode",
		prompt: "Tolong periksa kode atau pesan error ini dan bantu perbaiki: ",
		iconColor: "text-rose-400",
		iconBg: "bg-rose-500/10 border-rose-500/20",
	},
	{
		icon: Code2,
		title: "Refactor & Optimasi",
		description: "Buat kode lebih rapi & efisien",
		prompt: "Refactor kode ini agar lebih rapi, modular, dan efisien: ",
		iconColor: "text-emerald-400",
		iconBg: "bg-emerald-500/10 border-emerald-500/20",
	},
	{
		icon: CheckCircle2,
		title: "Buat Unit Test",
		description: "Tulis test menyeluruh & edge cases",
		prompt: "Tulis unit test lengkap untuk menguji fungsi dan edge cases: ",
		iconColor: "text-indigo-400",
		iconBg: "bg-indigo-500/10 border-indigo-500/20",
	},
]

export const PromptSuggestions: React.FC<PromptSuggestionsProps> = ({ onSelectPrompt, className = "" }) => {
	return (
		<div className={`w-full max-w-[480px] flex flex-col gap-2 ${className}`}>
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
				{SUGGESTIONS.map((item, index) => {
					const Icon = item.icon
					return (
						<button
							key={index}
							type="button"
							onClick={() => onSelectPrompt(item.prompt)}
							className="group flex items-start gap-2.5 p-2.5 rounded-xl border border-vscode-panel-border/50 bg-vscode-sideBar-background/40 hover:bg-vscode-editor-background hover:border-blue-500/40 text-left transition-all duration-200 cursor-pointer shadow-sm active:scale-[0.98]">
							<div
								className={`flex items-center justify-center size-7 rounded-lg border shrink-0 mt-0.5 ${item.iconBg}`}>
								<Icon className={`size-3.5 ${item.iconColor}`} />
							</div>
							<div className="flex flex-col min-w-0">
								<span className="text-xs font-semibold text-vscode-foreground group-hover:text-blue-400 transition-colors truncate">
									{item.title}
								</span>
								<span className="text-[11px] text-vscode-descriptionForeground/80 truncate leading-tight mt-0.5">
									{item.description}
								</span>
							</div>
						</button>
					)
				})}
			</div>
		</div>
	)
}

export default PromptSuggestions
