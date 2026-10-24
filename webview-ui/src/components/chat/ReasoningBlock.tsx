import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useExtensionState } from "@src/context/ExtensionStateContext"

import MarkdownBlock from "../common/MarkdownBlock"
import { ChevronDown, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { TimelineItem } from "./TimelineItem"

interface ReasoningBlockProps {
	content: string
	ts: number
	isStreaming: boolean
	isLast: boolean
	metadata?: any
}

export const ReasoningBlock = ({ content, ts, isStreaming, isLast }: ReasoningBlockProps) => {
	const { t } = useTranslation()
	const { reasoningBlockCollapsed } = useExtensionState()

	const [isCollapsed, setIsCollapsed] = useState(reasoningBlockCollapsed)

	const isThinkingStreaming = isStreaming && isLast
	const startTimeRef = useRef<number>(ts || Date.now())
	const [elapsed, setElapsed] = useState<number>(0)
	const contentRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		setIsCollapsed(reasoningBlockCollapsed)
	}, [reasoningBlockCollapsed])

	useEffect(() => {
		const startTime = ts || startTimeRef.current
		if (isThinkingStreaming) {
			const tick = () => setElapsed(Date.now() - startTime)
			tick()
			const id = setInterval(tick, 500)
			return () => {
				clearInterval(id)
				setElapsed(Date.now() - startTime)
			}
		}
	}, [isThinkingStreaming, ts])

	const seconds = Math.floor(elapsed / 1000)
	const secondsLabel = t("chat:reasoning.seconds", { count: seconds })

	const handleToggle = () => {
		setIsCollapsed(!isCollapsed)
	}

	const hasContent = (content?.trim()?.length ?? 0) > 0

	const thinkingTitle = isThinkingStreaming
		? t("chat:reasoning.thinking")
		: seconds > 0
			? t("chat:reasoning.thought", { count: seconds, defaultValue: `Thought for ${seconds}s` })
			: t("chat:reasoning.thought", { count: 1, defaultValue: `Thought for 1s` })

	return (
		<TimelineItem
			status={isThinkingStreaming ? "running" : "info"}
			customDot={
				<div
					className={cn(
						"flex items-center justify-center size-3.5 rounded-full border transition-colors",
						isThinkingStreaming
							? "bg-indigo-500/20 text-indigo-400 border-indigo-500/40 animate-pulse"
							: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
					)}>
					<Sparkles className="size-2.5" />
				</div>
			}
			action={<span>{thinkingTitle}</span>}
			target={
				isThinkingStreaming && seconds > 0 ? (
					<span className="text-[10px] text-indigo-300 font-mono">({secondsLabel})</span>
				) : null
			}
			actions={
				hasContent ? (
					<button
						onClick={handleToggle}
						className="cursor-pointer text-vscode-descriptionForeground/60 hover:text-vscode-foreground p-0.5 rounded transition-colors"
						aria-label="Toggle thinking content">
						<ChevronDown
							className={cn("size-3.5 transition-transform duration-200", !isCollapsed && "rotate-180")}
						/>
					</button>
				) : null
			}
			onClick={hasContent ? handleToggle : undefined}>
			{hasContent && !isCollapsed && (
				<div
					ref={contentRef}
					className="bg-vscode-editor-background/50 border border-vscode-panel-border/40 rounded-lg p-2.5 text-xs text-vscode-descriptionForeground/90 break-words mt-1 leading-relaxed">
					<MarkdownBlock markdown={content} />
				</div>
			)}
		</TimelineItem>
	)
}
