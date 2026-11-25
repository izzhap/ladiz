import { memo, useEffect, useMemo, useState, useCallback, useRef } from "react"
import { useTranslation } from "react-i18next"
import { ChevronRight, FileDiff } from "lucide-react"
import { createTwoFilesPatch } from "diff"

import type { ClineMessage, ExtensionMessage } from "@ladiz/types"

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui"
import { cn } from "@/lib/utils"
import { vscode } from "@src/utils/vscode"

import { fileChangesFromMessages, type FileChangeEntry } from "./utils/fileChangesFromMessages"
import CodeAccordion from "../common/CodeAccordion"

interface FileChangesPanelProps {
	clineMessages: ClineMessage[] | undefined
	className?: string
}

const normalizePath = (p: string) => (p.startsWith("./") ? p.slice(2) : p).replace(/\\/g, "/")

const FileChangesPanel = memo(({ clineMessages, className }: FileChangesPanelProps) => {
	const { t } = useTranslation()
	const [panelExpanded, setPanelExpanded] = useState(false)
	const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set())
	const [finalContentByPath, setFinalContentByPath] = useState<Record<string, string | null>>({})
	const [revertedPaths, setRevertedPaths] = useState<Set<string>>(new Set())
	const [confirmingRevertFile, setConfirmingRevertFile] = useState<string | null>(null)
	const [confirmingRevertAll, setConfirmingRevertAll] = useState(false)
	const pendingPathsRef = useRef<Set<string>>(new Set())

	// Reset state when switching to a different task
	const taskTs = clineMessages?.[0]?.ts
	useEffect(() => {
		setExpandedPaths(new Set())
		setRevertedPaths(new Set())
		setFinalContentByPath({})
		pendingPathsRef.current = new Set()
	}, [taskTs])

	const fileChanges = useMemo(() => fileChangesFromMessages(clineMessages), [clineMessages])

	// Group by path so we show one row per file (excluding reverted files)
	const byPath = useMemo(() => {
		const map = new Map<string, FileChangeEntry[]>()
		for (const entry of fileChanges) {
			const key = entry.path
			const lookupPath = normalizePath(key)
			if (revertedPaths.has(lookupPath)) continue
			const list = map.get(key) ?? []
			list.push(entry)
			map.set(key, list)
		}
		return map
	}, [fileChanges, revertedPaths])

	// Aggregate total lines added/removed across active files for the panel header
	const totalStats = useMemo(() => {
		let added = 0
		let removed = 0
		for (const entries of byPath.values()) {
			for (const e of entries) {
				added += e.diffStats?.added ?? 0
				removed += e.diffStats?.removed ?? 0
			}
		}
		return { added, removed }
	}, [byPath])

	const togglePath = useCallback((path: string) => {
		setExpandedPaths((prev) => {
			const next = new Set(prev)
			if (next.has(path)) next.delete(path)
			else next.add(path)
			return next
		})
	}, [])

	// Request final file content when a row is expanded and we have originalContent
	useEffect(() => {
		for (const path of expandedPaths) {
			const entries = byPath.get(path)
			if (!entries?.length) continue
			const originalContent = entries[0].originalContent
			const lookupPath = normalizePath(path)
			if (
				originalContent !== undefined &&
				!(lookupPath in finalContentByPath) &&
				!pendingPathsRef.current.has(lookupPath)
			) {
				pendingPathsRef.current.add(lookupPath)
				vscode.postMessage({ type: "readFileContent", text: lookupPath })
			}
		}
	}, [expandedPaths, byPath, finalContentByPath])

	// Listen for fileContent and fileReverted responses
	useEffect(() => {
		const handler = (event: MessageEvent) => {
			const message: ExtensionMessage = event.data
			if (message.type === "fileContent" && message.fileContent?.path != null) {
				const fc = message.fileContent
				pendingPathsRef.current.delete(fc.path)
				setFinalContentByPath((prev) => ({ ...prev, [fc.path]: fc.content ?? null }))
			} else if (message.type === "fileReverted" && message.fileReverted?.success) {
				const { path: revertedPath, paths } = message.fileReverted
				const newlyReverted = new Set<string>()
				if (paths && Array.isArray(paths)) {
					paths.forEach((p) => newlyReverted.add(normalizePath(p)))
				}
				if (revertedPath) {
					newlyReverted.add(normalizePath(revertedPath))
				}
				setRevertedPaths((prev) => {
					const next = new Set(prev)
					newlyReverted.forEach((p) => next.add(p))
					return next
				})
			}
		}
		window.addEventListener("message", handler)
		return () => window.removeEventListener("message", handler)
	}, [])

	const handleConfirmRevertFile = useCallback(() => {
		if (!confirmingRevertFile) return
		const entries = byPath.get(confirmingRevertFile)
		const originalContent = entries?.[0]?.originalContent
		const isNewFile = entries?.[0]?.isNewFile
		const lookupPath = normalizePath(confirmingRevertFile)
		vscode.postMessage({
			type: "revertFile",
			text: lookupPath,
			values: { originalContent, ...(isNewFile ? { isNewFile } : {}) },
		})
		setConfirmingRevertFile(null)
	}, [confirmingRevertFile, byPath])

	const handleConfirmRevertAll = useCallback(() => {
		const files = Array.from(byPath.entries()).map(([path, entries]) => ({
			filePath: normalizePath(path),
			originalContent: entries[0]?.originalContent,
			...(entries[0]?.isNewFile ? { isNewFile: true } : {}),
		}))
		vscode.postMessage({
			type: "revertAllFiles",
			values: { files },
		})
		setConfirmingRevertAll(false)
	}, [byPath])

	if (byPath.size === 0) return null

	const fileCount = byPath.size

	return (
		<Collapsible open={panelExpanded} onOpenChange={setPanelExpanded} className={cn("px-3.5 my-1.5", className)}>
			<div
				className={cn(
					"group flex items-center justify-between w-full px-3 py-2 text-left select-none transition-all duration-200",
					"rounded-xl border border-white/[0.08] bg-white/[0.03] hover:border-white/15 shadow-sm",
					panelExpanded && "rounded-b-none border-b-transparent bg-white/[0.05]",
				)}>
				<CollapsibleTrigger asChild>
					<button
						type="button"
						className="flex items-center gap-2.5 flex-1 min-w-0 text-left bg-transparent border-0 p-0 cursor-pointer">
						<ChevronRight
							className={cn(
								"size-3.5 shrink-0 text-vscode-descriptionForeground/70 group-hover:text-vscode-foreground transition-transform duration-200",
								panelExpanded && "rotate-90",
							)}
							aria-hidden
						/>
						<div className="flex items-center justify-center size-5 rounded-md bg-blue-500/15 border border-blue-400/25 text-cyan-300 shrink-0">
							<FileDiff className="size-3" aria-hidden />
						</div>
						<span className="text-xs font-medium text-vscode-foreground/90 group-hover:text-vscode-foreground transition-colors truncate">
							{t("chat:fileChangesInConversation.header", { count: fileCount })}
						</span>
					</button>
				</CollapsibleTrigger>
				<div className="flex items-center gap-2 ml-auto shrink-0 pl-2">
					{totalStats.added > 0 || totalStats.removed > 0 ? (
						<div
							className="flex items-center gap-1.5 font-mono text-[11px]"
							aria-label={`${totalStats.added} lines added, ${totalStats.removed} lines removed`}>
							{totalStats.added > 0 && (
								<span
									className="px-1.5 py-0.5 rounded font-medium bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
									data-testid="total-added">
									+{totalStats.added}
								</span>
							)}
							{totalStats.removed > 0 && (
								<span
									className="px-1.5 py-0.5 rounded font-medium bg-rose-500/15 border border-rose-500/30 text-rose-300"
									data-testid="total-removed">
									-{totalStats.removed}
								</span>
							)}
						</div>
					) : null}
					<button
						type="button"
						onClick={() => setConfirmingRevertAll(true)}
						className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium text-vscode-descriptionForeground hover:text-vscode-errorForeground hover:bg-white/[0.06] transition-colors cursor-pointer"
						data-testid="revert-all-btn"
						title={t("chat:fileChangesInConversation.revertAll")}>
						<span className="codicon codicon-discard" style={{ fontSize: 12 }} />
						<span>{t("chat:fileChangesInConversation.revertAll")}</span>
					</button>
				</div>
			</div>
			<CollapsibleContent className="rounded-b-xl border-x border-b border-white/[0.08] bg-black/25 p-2 space-y-1.5 overflow-hidden">
				<div className="flex flex-col gap-1.5">
					{Array.from(byPath.entries()).map(([path, entries]) => {
						const originalContent = entries[0].originalContent
						const lookupPath = normalizePath(path)
						const finalContent = finalContentByPath[lookupPath]
						const hasMergedDiff =
							originalContent !== undefined && finalContent != null && finalContent !== ""
						const displayDiff = hasMergedDiff
							? createTwoFilesPatch(path, path, originalContent, finalContent)
							: entries.map((e) => e.diff).join("\n\n")
						const combinedStats = entries.reduce(
							(acc, e) => ({
								added: acc.added + (e.diffStats?.added ?? 0),
								removed: acc.removed + (e.diffStats?.removed ?? 0),
							}),
							{ added: 0, removed: 0 },
						)
						const isExpanded = expandedPaths.has(path)
						return (
							<div
								key={path}
								className="rounded-lg border border-white/[0.06] bg-vscode-editor-background/70 hover:border-white/10 transition-colors overflow-hidden">
								<CodeAccordion
									path={path}
									code={displayDiff}
									language="diff"
									isExpanded={isExpanded}
									onToggleExpand={() => togglePath(path)}
									diffStats={
										combinedStats.added > 0 || combinedStats.removed > 0 ? combinedStats : undefined
									}
									onJumpToFile={
										path
											? () =>
													vscode.postMessage({
														type: "openFile",
														text: path.startsWith("./") ? path : "./" + path,
													})
											: undefined
									}
									onRevert={() => setConfirmingRevertFile(path)}
								/>
							</div>
						)
					})}
				</div>
			</CollapsibleContent>

			<AlertDialog open={!!confirmingRevertFile} onOpenChange={(open) => !open && setConfirmingRevertFile(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("chat:fileChangesInConversation.revertFileConfirmTitle")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("chat:fileChangesInConversation.revertFileConfirmDescription", {
								path: confirmingRevertFile || "",
							})}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("common:answers.cancel")}</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleConfirmRevertFile}
							className="bg-vscode-button-background hover:bg-vscode-button-hoverBackground text-vscode-button-foreground"
							data-testid="confirm-revert-file-btn">
							{t("chat:fileChangesInConversation.revertFile")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog open={confirmingRevertAll} onOpenChange={setConfirmingRevertAll}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("chat:fileChangesInConversation.revertAllConfirmTitle")}</AlertDialogTitle>
						<AlertDialogDescription>
							{t("chat:fileChangesInConversation.revertAllConfirmDescription", {
								count: byPath.size,
							})}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("common:answers.cancel")}</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleConfirmRevertAll}
							className="bg-vscode-button-background hover:bg-vscode-button-hoverBackground text-vscode-button-foreground"
							data-testid="confirm-revert-all-btn">
							{t("chat:fileChangesInConversation.revertAll")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</Collapsible>
	)
})

FileChangesPanel.displayName = "FileChangesPanel"

export default FileChangesPanel
