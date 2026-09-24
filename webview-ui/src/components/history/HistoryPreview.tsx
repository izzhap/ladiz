import { memo } from "react"

import { vscode } from "@src/utils/vscode"
import { useAppTranslation } from "@src/i18n/TranslationContext"

import { useTaskSearch } from "./useTaskSearch"
import { useGroupedTasks } from "./useGroupedTasks"
import TaskGroupItem from "./TaskGroupItem"

const HistoryPreview = () => {
	const { tasks, searchQuery } = useTaskSearch()
	const { groups, toggleExpand } = useGroupedTasks(tasks, searchQuery)
	const { t } = useAppTranslation()

	const handleViewAllHistory = () => {
		vscode.postMessage({ type: "switchTab", tab: "history" })
	}

	// Show up to 4 groups (parent + subtasks count as 1 block)
	const displayGroups = groups.slice(0, 4)

	return (
		<div className="flex flex-col gap-1">
			<div className="flex items-center justify-between pt-1 pb-1">
				<div className="flex items-center gap-2">
					<h2 className="text-xs font-semibold uppercase tracking-wider text-vscode-foreground/80 m-0">
						{t("history:recentTasks")}
					</h2>
					{groups.length > 0 && (
						<span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-vscode-badge-background text-vscode-badge-foreground">
							{groups.length}
						</span>
					)}
				</div>
				<button
					onClick={handleViewAllHistory}
					className="text-xs text-vscode-textLink-foreground hover:underline transition-colors cursor-pointer font-medium"
					aria-label={t("history:viewAllHistory")}>
					{t("history:viewAllHistory")}
				</button>
			</div>
			{displayGroups.length !== 0 && (
				<div className="flex flex-col gap-1.5">
					{displayGroups.map((group) => (
						<TaskGroupItem
							key={group.parent.id}
							group={group}
							variant="compact"
							onToggleExpand={() => toggleExpand(group.parent.id)}
							onToggleSubtaskExpand={toggleExpand}
						/>
					))}
				</div>
			)}
		</div>
	)
}

export default memo(HistoryPreview)
