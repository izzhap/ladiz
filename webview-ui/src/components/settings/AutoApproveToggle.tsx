import type { GlobalSettings } from "@roo-code/types"

import { useAppTranslation } from "@/i18n/TranslationContext"
import { cn } from "@/lib/utils"
import { StandardTooltip } from "@/components/ui"

type AutoApproveToggles = Pick<
	GlobalSettings,
	| "alwaysAllowReadOnly"
	| "alwaysAllowWrite"
	| "alwaysAllowMcp"
	| "alwaysAllowModeSwitch"
	| "alwaysAllowSubtasks"
	| "alwaysAllowExecute"
	| "alwaysAllowFollowupQuestions"
>

export type AutoApproveSetting = keyof AutoApproveToggles

type AutoApproveConfig = {
	key: AutoApproveSetting
	labelKey: string
	descriptionKey: string
	icon: string
	testId: string
}

export const autoApproveSettingsConfig: Record<AutoApproveSetting, AutoApproveConfig> = {
	alwaysAllowReadOnly: {
		key: "alwaysAllowReadOnly",
		labelKey: "settings:autoApprove.readOnly.label",
		descriptionKey: "settings:autoApprove.readOnly.description",
		icon: "eye",
		testId: "always-allow-readonly-toggle",
	},
	alwaysAllowWrite: {
		key: "alwaysAllowWrite",
		labelKey: "settings:autoApprove.write.label",
		descriptionKey: "settings:autoApprove.write.description",
		icon: "edit",
		testId: "always-allow-write-toggle",
	},
	alwaysAllowMcp: {
		key: "alwaysAllowMcp",
		labelKey: "settings:autoApprove.mcp.label",
		descriptionKey: "settings:autoApprove.mcp.description",
		icon: "plug",
		testId: "always-allow-mcp-toggle",
	},
	alwaysAllowModeSwitch: {
		key: "alwaysAllowModeSwitch",
		labelKey: "settings:autoApprove.modeSwitch.label",
		descriptionKey: "settings:autoApprove.modeSwitch.description",
		icon: "sync",
		testId: "always-allow-mode-switch-toggle",
	},
	alwaysAllowSubtasks: {
		key: "alwaysAllowSubtasks",
		labelKey: "settings:autoApprove.subtasks.label",
		descriptionKey: "settings:autoApprove.subtasks.description",
		icon: "list-tree",
		testId: "always-allow-subtasks-toggle",
	},
	alwaysAllowExecute: {
		key: "alwaysAllowExecute",
		labelKey: "settings:autoApprove.execute.label",
		descriptionKey: "settings:autoApprove.execute.description",
		icon: "terminal",
		testId: "always-allow-execute-toggle",
	},
	alwaysAllowFollowupQuestions: {
		key: "alwaysAllowFollowupQuestions",
		labelKey: "settings:autoApprove.followupQuestions.label",
		descriptionKey: "settings:autoApprove.followupQuestions.description",
		icon: "question",
		testId: "always-allow-followup-questions-toggle",
	},
}

type AutoApproveToggleProps = AutoApproveToggles & {
	onToggle: (key: AutoApproveSetting, value: boolean) => void
}

export const AutoApproveToggle = ({ onToggle, ...props }: AutoApproveToggleProps) => {
	const { t } = useAppTranslation()

	return (
		<div className="flex flex-row flex-wrap gap-2 py-1">
			{Object.values(autoApproveSettingsConfig).map(({ key, descriptionKey, labelKey, icon, testId }) => {
				const isEnabled = !!props[key]
				return (
					<StandardTooltip key={key} content={t(descriptionKey || "")}>
						<button
							type="button"
							onClick={() => onToggle(key, !isEnabled)}
							aria-label={t(labelKey)}
							aria-pressed={isEnabled}
							data-testid={testId}
							className={cn(
								"inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg select-none cursor-pointer transition-all duration-150 border focus:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 active:scale-95",
								isEnabled
									? "bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-sm shadow-amber-500/10 hover:bg-amber-500/25"
									: "bg-white/[0.03] border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] hover:border-white/20",
							)}>
							<span
								className={cn(
									"size-1.5 rounded-full shrink-0 transition-colors",
									isEnabled
										? "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.9)] animate-pulse"
										: "bg-slate-500",
								)}
							/>
							<span className={`codicon codicon-${icon} text-xs`} />
							<span>{t(labelKey)}</span>
						</button>
					</StandardTooltip>
				)
			})}
		</div>
	)
}
