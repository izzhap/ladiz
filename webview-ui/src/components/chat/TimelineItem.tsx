import React, { memo } from "react"
import { cn } from "@/lib/utils"

export type TimelineStatus = "success" | "edit" | "info" | "command" | "running" | "error" | "idle" | "spark"

export interface TimelineItemProps {
	/** Dot status style */
	status?: TimelineStatus
	/** Custom dot icon/element instead of simple dot */
	customDot?: React.ReactNode
	/** Action verb, e.g. "Grep", "Read", "Edit", "Command", "Thinking" */
	action?: React.ReactNode
	/** Target path, query, or parameter */
	target?: React.ReactNode
	/** Subtitle or summary, e.g. "2 lines of output", "Modified" */
	subtext?: React.ReactNode
	/** Extra action badge/buttons on the right */
	actions?: React.ReactNode
	/** Whether this item is expanded or clickable */
	onClick?: () => void
	/** Main expandable or details content */
	children?: React.ReactNode
	/** Custom className */
	className?: string
	/** Whether to hide the vertical line at the top or bottom */
	isFirst?: boolean
	isLast?: boolean
	/** Whether it is in a loading/running state */
	isLoading?: boolean
}

export const TimelineItem: React.FC<TimelineItemProps> = memo(
	({
		status = "success",
		customDot,
		action,
		target,
		subtext,
		actions,
		onClick,
		children,
		className,
		isFirst = false,
		isLast = false,
		isLoading = false,
	}) => {
		// Determine dot styling based on status
		const getDotClass = () => {
			switch (status) {
				case "success":
					return "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]"
				case "edit":
					return "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]"
				case "command":
					return "bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.7)]"
				case "info":
					return "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.7)]"
				case "running":
					return "bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.9)] animate-pulse"
				case "error":
					return "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.7)]"
				case "idle":
				default:
					return "bg-slate-400/80"
			}
		}

		return (
			<div className={cn("relative flex flex-col group/timeline select-none py-1.5", className)}>
				{/* Continuous vertical timeline connector line */}
				<div
					className={cn(
						"absolute left-[9px] w-[1.5px] bg-vscode-panel-border/40 pointer-events-none transition-colors group-hover/timeline:bg-vscode-panel-border/70",
						isFirst ? "top-3 bottom-0" : isLast ? "top-0 h-3" : "top-0 bottom-0",
					)}
				/>

				{/* Header Row: Dot + Action + Target + Actions */}
				<div
					className={cn(
						"flex items-start gap-2.5 min-w-0 z-[1]",
						onClick ? "cursor-pointer" : "cursor-default",
					)}
					onClick={onClick}>
					{/* Status Dot / Node */}
					<div className="flex items-center justify-center size-[19px] shrink-0 mt-0.5">
						{customDot ? (
							customDot
						) : (
							<div
								className={cn(
									"size-2 rounded-full ring-2 ring-vscode-editor-background transition-all duration-300",
									getDotClass(),
									isLoading && "scale-110",
								)}
							/>
						)}
					</div>

					{/* Action + Target + Subtext */}
					<div className="flex flex-col min-w-0 flex-1 leading-snug">
						<div className="flex items-center gap-2 min-w-0 w-full">
							{action && (
								<div
									className={cn(
										"font-semibold text-xs text-vscode-foreground tracking-tight shrink-0",
										!target && !actions && "flex-1",
									)}>
									{action}
								</div>
							)}
							{target && (
								<div
									className="font-mono text-[11px] text-vscode-foreground/90 select-text font-normal opacity-90 min-w-0 flex-1 truncate"
									title={typeof target === "string" ? target : undefined}>
									{target}
								</div>
							)}
							{actions && <div className="ml-auto shrink-0 flex items-center gap-1.5">{actions}</div>}
						</div>

						{/* Subtext description / metadata */}
						{subtext && (
							<div className="text-[11px] text-vscode-descriptionForeground/70 font-normal leading-relaxed mt-0.5 select-text truncate">
								{subtext}
							</div>
						)}
					</div>
				</div>

				{/* Body Content (Collapsible details, CodeBlock, DiffView, etc.) */}
				{children && <div className="ml-[19px] pl-2.5 mt-1.5 min-w-0 z-[1]">{children}</div>}
			</div>
		)
	},
)

TimelineItem.displayName = "TimelineItem"
