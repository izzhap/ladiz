import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { LadizAnimatedLogo } from "./LadizAnimatedLogo"

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
]

export function ApiRequestLoading() {
	const { i18n } = useTranslation()
	const isIndonesian = i18n.language?.toLowerCase().startsWith("id")
	const tips = isIndonesian ? TIPS_ID : TIPS_EN

	// Random initial tip index
	const [tipIndex, setTipIndex] = useState(() => Math.floor(Math.random() * tips.length))
	const [isVisible, setIsVisible] = useState(true)

	useEffect(() => {
		const interval = setInterval(() => {
			setIsVisible(false)
			setTimeout(() => {
				setTipIndex((prev) => {
					let next = Math.floor(Math.random() * tips.length)
					if (next === prev && tips.length > 1) {
						next = (prev + 1) % tips.length
					}
					return next
				})
				setIsVisible(true)
			}, 200)
		}, 4500)

		return () => clearInterval(interval)
	}, [tips.length])

	return (
		<div className="flex items-center gap-2 min-w-0 flex-1 py-0 my-0 leading-tight">
			<LadizAnimatedLogo className="size-3.5 shrink-0" />
			<div className="min-w-0 flex-1 overflow-hidden">
				<p
					className={`text-[11px] text-slate-300 font-normal truncate transition-all duration-200 m-0 p-0 ${
						isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-0.5"
					}`}
					title={tips[tipIndex]}>
					{tips[tipIndex]}
				</p>
			</div>
		</div>
	)
}
