import React, { useState, useEffect, useMemo } from "react"

import type { IndexingStatus, IndexingStatusUpdateMessage } from "@roo-code/types"

import { cn } from "@src/lib/utils"
import { vscode } from "@src/utils/vscode"
import { useAppTranslation } from "@/i18n/TranslationContext"

import { useExtensionState } from "@src/context/ExtensionStateContext"
import { PopoverTrigger, StandardTooltip } from "@src/components/ui"

import { CodeIndexPopover } from "./CodeIndexPopover"

interface IndexingStatusBadgeProps {
	className?: string
}

export const IndexingStatusBadge: React.FC<IndexingStatusBadgeProps> = ({ className }) => {
	const { t } = useAppTranslation()
	const { cwd } = useExtensionState()

	const [indexingStatus, setIndexingStatus] = useState<IndexingStatus>({
		systemStatus: "Standby",
		processedItems: 0,
		totalItems: 0,
		currentItemUnit: "items",
	})

	useEffect(() => {
		// Request initial indexing status.
		vscode.postMessage({ type: "requestIndexingStatus" })

		// Set up message listener for status updates.
		const handleMessage = (event: MessageEvent<IndexingStatusUpdateMessage>) => {
			if (event.data.type === "indexingStatusUpdate") {
				const status = event.data.values
				if (!status.workspacePath || status.workspacePath === cwd) {
					setIndexingStatus(status)
				}
			}
		}

		window.addEventListener("message", handleMessage)

		return () => {
			window.removeEventListener("message", handleMessage)
		}
	}, [cwd])

	const progressPercentage = useMemo(
		() =>
			indexingStatus.totalItems > 0
				? Math.round((indexingStatus.processedItems / indexingStatus.totalItems) * 100)
				: 0,
		[indexingStatus.processedItems, indexingStatus.totalItems],
	)

	const tooltipText = useMemo(() => {
		switch (indexingStatus.systemStatus) {
			case "Standby":
				return t("chat:indexingStatus.ready")
			case "Indexing":
				return t("chat:indexingStatus.indexing", { percentage: progressPercentage })
			case "Indexed":
				return t("chat:indexingStatus.indexed")
			case "Stopping":
				return t("chat:indexingStatus.stopping")
			case "Error":
				return t("chat:indexingStatus.error")
			default:
				return t("chat:indexingStatus.status")
		}
	}, [indexingStatus.systemStatus, progressPercentage, t])

	const statusColorClass = useMemo(() => {
		const statusColors = {
			Standby: "bg-vscode-descriptionForeground/60",
			Indexing: "bg-yellow-500 animate-pulse",
			Indexed: "bg-green-500",
			Stopping: "bg-amber-500 animate-pulse",
			Error: "bg-red-500",
		}

		return statusColors[indexingStatus.systemStatus as keyof typeof statusColors] || statusColors.Standby
	}, [indexingStatus.systemStatus])

	return (
		<CodeIndexPopover indexingStatus={indexingStatus}>
			<StandardTooltip content={tooltipText}>
				<PopoverTrigger asChild>
					<button
						type="button"
						aria-label={tooltipText}
						className={cn(
							"inline-flex items-center gap-1.5 relative whitespace-nowrap px-2.5 py-1 text-xs font-mono font-medium rounded-full border transition-all duration-150 select-none cursor-pointer",
							"bg-white/[0.04] border-white/10 text-slate-300 hover:bg-white/[0.08] hover:text-slate-100 hover:border-white/20",
							"focus:outline-none focus-visible:ring-1 focus-visible:ring-vscode-focusBorder active:scale-95",
							className,
						)}>
						<span
							className={cn(
								"size-1.5 rounded-full shrink-0 transition-colors duration-200",
								statusColorClass,
							)}
						/>
						<span className="font-sans text-xs">
							{indexingStatus.systemStatus === "Indexing"
								? `${progressPercentage}%`
								: indexingStatus.systemStatus === "Indexed"
									? t("chat:indexingStatus.indexed")
									: "Index"}
						</span>
					</button>
				</PopoverTrigger>
			</StandardTooltip>
		</CodeIndexPopover>
	)
}
