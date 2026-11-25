import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { useTranslation } from "react-i18next"
import { Eye, EyeOff } from "lucide-react"

import type { ClineMessage, ClineSayTool } from "@ladiz/types"
import { safeJsonParse } from "@roo/core"
import { cn } from "@/lib/utils"

const HIDE_TIPS_STORAGE_KEY = "ladiz.hideLoadingTips"
const TIPS_TOGGLE_EVENT = "ladiz:loading-tips-toggle"

function readHideTipsPreference(): boolean {
	try {
		return localStorage.getItem(HIDE_TIPS_STORAGE_KEY) === "true"
	} catch {
		return false
	}
}

export function getLoadingActivityStatusKey(lastModifiedMessage?: ClineMessage): string {
	if (!lastModifiedMessage) {
		return "chat:loadingTips.status.thinking"
	}

	if (lastModifiedMessage.ask === "command" || lastModifiedMessage.ask === "command_output") {
		return "chat:loadingTips.status.executing"
	}

	if (lastModifiedMessage.ask === "use_mcp_server" || lastModifiedMessage.say === "mcp_server_request_started") {
		return "chat:loadingTips.status.executingMcp"
	}

	if (lastModifiedMessage.ask === "tool" || lastModifiedMessage.say === ("tool" as any)) {
		const tool = safeJsonParse<ClineSayTool>(lastModifiedMessage.text)
		switch (tool?.tool as string | undefined) {
			case "editedExistingFile":
			case "appliedDiff":
			case "newFileCreated":
			case "searchAndReplace":
			case "search_and_replace":
			case "search_replace":
			case "edit":
			case "edit_file":
			case "apply_patch":
			case "apply_diff":
				return "chat:loadingTips.status.editing"
			case "readFile":
			case "readCommandOutput":
				return "chat:loadingTips.status.reading"
			case "searchFiles":
			case "listFilesTopLevel":
			case "listFilesRecursive":
			case "codebaseSearch":
				return "chat:loadingTips.status.searching"
			default:
				return "chat:loadingTips.status.executing"
		}
	}

	switch (lastModifiedMessage.say) {
		case "text":
			return "chat:loadingTips.status.responding"
		case "command_output":
			return "chat:loadingTips.status.executing"
		case "condense_context":
			return "chat:loadingTips.status.condensing"
		case "sliding_window_truncation":
			return "chat:loadingTips.status.truncating"
		case "api_req_rate_limit_wait":
			return "chat:loadingTips.status.rateLimiting"
		case "api_req_retry_delayed":
			return "chat:loadingTips.status.retrying"
		case "reasoning":
		case "api_req_started":
		default:
			return "chat:loadingTips.status.thinking"
	}
}

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

export function ApiRequestLoading({ lastModifiedMessage }: { lastModifiedMessage?: ClineMessage }) {
	const { t, i18n } = useTranslation()
	const isIndonesian = i18n.language?.toLowerCase().startsWith("id")
	const [isTipsHidden, setIsTipsHidden] = useState<boolean>(readHideTipsPreference)
	const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null)
	const menuRef = useRef<HTMLDivElement>(null)

	// Randomly shuffled tips list on mount
	const shuffledTips = useMemo(() => {
		const rawTips = isIndonesian ? TIPS_ID : TIPS_EN
		return shuffleArray(rawTips)
	}, [isIndonesian])

	const [tipIndex, setTipIndex] = useState(0)
	const [isVisible, setIsVisible] = useState(true)

	useEffect(() => {
		const syncPreference = () => setIsTipsHidden(readHideTipsPreference())
		window.addEventListener(TIPS_TOGGLE_EVENT, syncPreference)
		return () => window.removeEventListener(TIPS_TOGGLE_EVENT, syncPreference)
	}, [])

	useEffect(() => {
		if (!menuPos) {
			return
		}
		const handleClose = (e: Event) => {
			if (e.type === "keydown" && (e as KeyboardEvent).key !== "Escape") {
				return
			}
			if (e.type === "mousedown" && menuRef.current?.contains(e.target as Node)) {
				return
			}
			setMenuPos(null)
		}
		document.addEventListener("mousedown", handleClose)
		document.addEventListener("keydown", handleClose)
		window.addEventListener("blur", handleClose)
		return () => {
			document.removeEventListener("mousedown", handleClose)
			document.removeEventListener("keydown", handleClose)
			window.removeEventListener("blur", handleClose)
		}
	}, [menuPos])

	useEffect(() => {
		if (isTipsHidden) {
			return
		}

		let fadeTimeout: ReturnType<typeof setTimeout> | undefined
		const interval = setInterval(() => {
			setIsVisible(false)
			fadeTimeout = setTimeout(() => {
				setTipIndex((prev) => (prev + 1) % shuffledTips.length)
				setIsVisible(true)
			}, 250)
		}, 4500)

		return () => {
			clearInterval(interval)
			if (fadeTimeout) {
				clearTimeout(fadeTimeout)
			}
		}
	}, [shuffledTips.length, isTipsHidden])

	const handleToggleTips = useCallback(() => {
		const next = !isTipsHidden
		setIsTipsHidden(next)
		setMenuPos(null)
		try {
			localStorage.setItem(HIDE_TIPS_STORAGE_KEY, String(next))
		} catch {
			// Ignore storage errors in restricted environments
		}
		window.dispatchEvent(new CustomEvent(TIPS_TOGGLE_EVENT))
	}, [isTipsHidden])

	const handleContextMenu = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
		e.preventDefault()
		setMenuPos({
			x: Math.max(8, Math.min(e.clientX, window.innerWidth - 168)),
			y: Math.max(8, Math.min(e.clientY, window.innerHeight - 44)),
		})
	}, [])

	const activityLabel = t(getLoadingActivityStatusKey(lastModifiedMessage))

	return (
		<div onContextMenu={handleContextMenu} className="flex items-center gap-2 min-w-0 w-full py-0.5">
			{isTipsHidden ? (
				<span className="text-xs text-vscode-descriptionForeground font-normal flex-1 truncate">
					{activityLabel}
				</span>
			) : (
				<>
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
				</>
			)}
			{menuPos && (
				<div
					ref={menuRef}
					role="menu"
					style={{ top: menuPos.y, left: menuPos.x }}
					className="fixed z-50 min-w-[8rem] overflow-hidden rounded-xs p-1 shadow-xs border border-vscode-focusBorder bg-vscode-dropdown-background text-vscode-dropdown-foreground">
					<button
						type="button"
						role="menuitem"
						onClick={handleToggleTips}
						className="w-full relative flex select-none items-center gap-2 px-2 py-1.5 outline-none transition-colors hover:bg-vscode-list-activeSelectionBackground hover:text-vscode-list-activeSelectionForeground focus:bg-vscode-list-activeSelectionBackground focus:text-vscode-list-activeSelectionForeground text-vscode-dropdown-foreground text-sm rounded-xs cursor-pointer">
						{isTipsHidden ? (
							<Eye className="size-3.5 shrink-0" />
						) : (
							<EyeOff className="size-3.5 shrink-0" />
						)}
						<span>{t(isTipsHidden ? "chat:loadingTips.show" : "chat:loadingTips.hide")}</span>
					</button>
				</div>
			)}
		</div>
	)
}
