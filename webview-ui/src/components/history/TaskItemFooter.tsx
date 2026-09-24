import React from "react"
import type { HistoryItem } from "@roo-code/types"
import { formatTimeAgo } from "@/utils/format"
import { CopyButton } from "./CopyButton"
import { ExportButton } from "./ExportButton"
import { DeleteButton } from "./DeleteButton"
import { StandardTooltip } from "../ui/standard-tooltip"
import { useAppTranslation } from "@/i18n/TranslationContext"

export interface TaskItemFooterProps {
	item: HistoryItem
	variant: "compact" | "full"
	isSelectionMode?: boolean
	isSubtask?: boolean
	onDelete?: (taskId: string) => void
}

const TaskItemFooter: React.FC<TaskItemFooterProps> = ({
	item,
	variant,
	isSelectionMode = false,
	isSubtask = false,
	onDelete,
}) => {
	const { t } = useAppTranslation()

	return (
		<div className="text-[11px] text-vscode-descriptionForeground/70 flex justify-between items-center mt-1">
			<div className="flex gap-1.5 items-center">
				{/* Subtask tag */}
				{isSubtask && (
					<>
						<span className="px-1.5 py-0.5 rounded bg-vscode-badge-background/40 text-[10px] font-medium text-vscode-badge-foreground">
							{t("history:subtaskTag")}
						</span>
						<span>·</span>
					</>
				)}
				{/* Datetime with time-ago format */}
				<StandardTooltip content={new Date(item.ts).toLocaleString()}>
					<span className="first-letter:uppercase">{formatTimeAgo(item.ts)}</span>
				</StandardTooltip>

				{/* Cost */}
				{!!item.totalCost && (
					<>
						<span>·</span>
						<span className="flex items-center font-mono text-[10px]" data-testid="cost-footer-compact">
							{"$" + item.totalCost.toFixed(2)}
						</span>
					</>
				)}
			</div>

			{/* Action Buttons for non-compact view */}
			{!isSelectionMode && (
				<div className="flex flex-row gap-0.5 -mx-1 items-center text-vscode-descriptionForeground/60 hover:text-vscode-foreground opacity-0 group-hover:opacity-100 transition-opacity">
					<CopyButton itemTask={item.task} />
					{variant === "full" && <ExportButton itemId={item.id} />}
					{onDelete && <DeleteButton itemId={item.id} onDelete={onDelete} />}
				</div>
			)}
		</div>
	)
}

export default TaskItemFooter
