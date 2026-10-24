import { useState, useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"

const TIPS_ID = [
	"Gunakan @ untuk melampirkan file, folder, atau git diff ke dalam prompt",
	"Ketik / untuk memicu slash command seperti /architect atau custom skills",
	"Bagi tugas kompleks menjadi beberapa langkah kecil untuk hasil optimal",
	"Gunakan Checkpoints untuk kembali ke status kode sebelumnya kapan saja",
	"Tekan Escape untuk membatalkan proses generasi sewaktu-waktu",
	"Tambahkan aturan proyek di .ladizrules agar coding style konsisten",
	"Pilih mode Architect untuk perencanaan dan Code untuk implementasi",
	"Ketik @problems untuk menyertakan diagnostik error VSCode ke dalam chat",
	"Periksa diff view dengan teliti sebelum menyetujui perubahan file",
	"Gunakan mode Ask untuk berdiskusi & konsultasi tanpa mengubah file",
	"Sertakan log error atau stack trace lengkap untuk diagnosis cepat",
	"Gunakan @terminal untuk membagikan output terminal terkini ke AI",
	"Gunakan mode Debug untuk diagnosis bug dan pelacakan akar masalah sistematis",
	"Gunakan pintasan keyboard Enter untuk kirim, Shift+Enter untuk baris baru",
	"Buka Settings untuk menyesuaikan provider AI, API key, dan model kustom",
	"Manfaatkan Yolo mode untuk auto-approve tindakan berulang yang aman",
	"Gunakan Todo Checklist untuk melacak progres tugas secara terstruktur",
	"Ekstensi mendukung MCP servers untuk mengintegrasikan alat dan API eksternal",
]

const TIPS_EN = [
	"Use @ to reference files, folders, or git diffs in your prompt",
	"Type / to trigger slash commands and custom skills",
	"Break complex tasks into smaller subtasks for best results",
	"Use Checkpoints to restore previous code states at any time",
	"Press Escape to cancel the active response instantly",
	"Add custom rules in .ladizrules to enforce coding standards",
	"Switch to Architect mode for planning and Code mode for building",
	"Type @problems to include active VS Code diagnostics in chat",
	"Carefully review diffs in the diff viewer before approving",
	"Use Ask mode to discuss solutions without editing files",
	"Include full error stack traces for faster root-cause fixes",
	"Use @terminal to share recent terminal output with the AI",
	"Switch to Debug mode for systematic diagnostic workflows",
	"Press Enter to send message, Shift+Enter for a new line",
	"Open Settings to configure custom AI providers and model keys",
	"Enable Yolo mode to auto-approve repetitive safe tool actions",
	"Use Todo Checklist to track task progress methodically",
	"Connect MCP servers to integrate external developer tools and APIs",
]

// Fisher-Yates shuffle helper
function shuffleArray<T>(array: readonly T[]): T[] {
	const copy = [...array]
	for (let i = copy.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1))
		;[copy[i], copy[j]] = [copy[j], copy[i]]
	}
	return copy
}

export function ApiRequestLoading() {
	const { i18n } = useTranslation()
	const isIndonesian = i18n.language?.toLowerCase().startsWith("id")

	// Randomly shuffled tips list on mount
	const shuffledTips = useMemo(() => {
		const rawTips = isIndonesian ? TIPS_ID : TIPS_EN
		return shuffleArray(rawTips)
	}, [isIndonesian])

	const [tipIndex, setTipIndex] = useState(0)
	const [isVisible, setIsVisible] = useState(true)

	useEffect(() => {
		const interval = setInterval(() => {
			setIsVisible(false)
			setTimeout(() => {
				setTipIndex((prev) => (prev + 1) % shuffledTips.length)
				setIsVisible(true)
			}, 250)
		}, 4500)

		return () => clearInterval(interval)
	}, [shuffledTips.length])

	return (
		<div className="flex items-center gap-2 min-w-0 w-full py-0.5">
			<span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase rounded bg-vscode-badge-background text-vscode-badge-foreground shrink-0 select-none leading-none">
				Tip
			</span>
			<p
				className={cn(
					"text-xs text-vscode-descriptionForeground font-normal line-clamp-2 leading-normal break-words transition-all duration-300 m-0 p-0 flex-1",
					isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-0.5",
				)}
				title={shuffledTips[tipIndex]}>
				{shuffledTips[tipIndex]}
			</p>
		</div>
	)
}
