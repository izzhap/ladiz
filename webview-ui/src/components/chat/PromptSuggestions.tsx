import React from "react"

interface PromptItem {
	title: string
	description: string
	prompt: string
}

interface PromptSuggestionsProps {
	onSelectPrompt: (prompt: string) => void
	className?: string
}

const SUGGESTIONS: PromptItem[] = [
	{
		title: "Buat Fitur Baru",
		description: "Buat komponen atau logika baru",
		prompt: "Buatkan fitur atau komponen baru dengan TypeScript: ",
	},
	{
		title: "Perbaiki Bug",
		description: "Analisis & atasi error pada kode",
		prompt: "Tolong periksa kode atau pesan error ini dan bantu perbaiki: ",
	},
	{
		title: "Refactor & Optimasi",
		description: "Buat kode lebih rapi & efisien",
		prompt: "Refactor kode ini agar lebih rapi, modular, dan efisien: ",
	},
	{
		title: "Buat Unit Test",
		description: "Tulis test menyeluruh & edge cases",
		prompt: "Tulis unit test lengkap untuk menguji fungsi dan edge cases: ",
	},
]

export const PromptSuggestions: React.FC<PromptSuggestionsProps> = ({ onSelectPrompt, className = "" }) => {
	return (
		<div
			className={`w-full max-w-[440px] flex flex-col divide-y divide-vscode-panel-border/40 border border-vscode-panel-border/60 rounded-md overflow-hidden bg-vscode-sideBar-background/40 ${className}`}>
			{SUGGESTIONS.map((item, index) => (
				<button
					key={index}
					type="button"
					onClick={() => onSelectPrompt(item.prompt)}
					className="group flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-vscode-list-hoverBackground text-left transition-colors duration-100 cursor-pointer">
					<div className="flex flex-col min-w-0">
						<span className="text-xs font-medium text-vscode-foreground truncate">{item.title}</span>
						<span className="text-[11px] text-vscode-descriptionForeground truncate leading-tight mt-0.5">
							{item.description}
						</span>
					</div>
					<span
						aria-hidden="true"
						className="text-xs font-mono text-vscode-descriptionForeground/50 group-hover:text-vscode-foreground group-hover:translate-x-0.5 transition-all duration-100 shrink-0">
						→
					</span>
				</button>
			))}
		</div>
	)
}

export default PromptSuggestions
