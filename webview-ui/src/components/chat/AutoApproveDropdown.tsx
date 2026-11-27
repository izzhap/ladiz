import { useCallback } from "react"

import { vscode } from "@/utils/vscode"
import { cn } from "@/lib/utils"
import { useExtensionState } from "@/context/ExtensionStateContext"
import { useAppTranslation } from "@/i18n/TranslationContext"
import { StandardTooltip } from "@/components/ui"
import { useAutoApprovalToggles } from "@/hooks/useAutoApprovalToggles"
import { useAutoApprovalState } from "@/hooks/useAutoApprovalState"
import { autoApproveSettingsConfig } from "../settings/AutoApproveToggle"

interface AutoApproveDropdownProps {
	disabled?: boolean
	triggerClassName?: string
}

export const AutoApproveDropdown = ({ disabled = false, triggerClassName = "" }: AutoApproveDropdownProps) => {
	const { t } = useAppTranslation()
	const {
		autoApprovalEnabled,
		setAutoApprovalEnabled,
		setAlwaysAllowReadOnly,
		setAlwaysAllowWrite,
		setAlwaysAllowExecute,
		setAlwaysAllowMcp,
		setAlwaysAllowModeSwitch,
		setAlwaysAllowSubtasks,
		setAlwaysAllowFollowupQuestions,
	} = useExtensionState()

	const toggles = useAutoApprovalToggles()
	const { effectiveAutoApprovalEnabled } = useAutoApprovalState(toggles, autoApprovalEnabled)

	const isYoloOn = !!effectiveAutoApprovalEnabled

	const handleToggleYolo = useCallback(() => {
		const nextState = !isYoloOn

		// Master toggle
		setAutoApprovalEnabled(nextState)
		vscode.postMessage({ type: "autoApprovalEnabled", bool: nextState })

		// Toggle all permissions together for YOLO mode
		const settingsUpdate: Record<string, boolean> = {}
		Object.keys(autoApproveSettingsConfig).forEach((key) => {
			settingsUpdate[key] = nextState
		})

		vscode.postMessage({ type: "updateSettings", updatedSettings: settingsUpdate })

		setAlwaysAllowReadOnly(nextState)
		setAlwaysAllowWrite(nextState)
		setAlwaysAllowExecute(nextState)
		setAlwaysAllowMcp(nextState)
		setAlwaysAllowModeSwitch(nextState)
		setAlwaysAllowSubtasks(nextState)
		setAlwaysAllowFollowupQuestions(nextState)
	}, [
		isYoloOn,
		setAutoApprovalEnabled,
		setAlwaysAllowReadOnly,
		setAlwaysAllowWrite,
		setAlwaysAllowExecute,
		setAlwaysAllowMcp,
		setAlwaysAllowModeSwitch,
		setAlwaysAllowSubtasks,
		setAlwaysAllowFollowupQuestions,
	])

	return (
		<StandardTooltip content={isYoloOn ? t("chat:autoApprove.tooltipOn") : t("chat:autoApprove.tooltipOff")}>
			<button
				type="button"
				onClick={handleToggleYolo}
				disabled={disabled}
				aria-pressed={isYoloOn}
				data-testid="auto-approve-dropdown-trigger"
				className={cn(
					"inline-flex items-center gap-1.5 h-6.5 relative whitespace-nowrap px-2 text-[11px] font-medium rounded border select-none cursor-pointer transition-colors duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-vscode-focusBorder",
					isYoloOn
						? "bg-vscode-editorWarning-background/35 border-vscode-charts-yellow/55 text-vscode-foreground hover:bg-vscode-editorWarning-background/55"
						: "bg-transparent border-transparent text-vscode-descriptionForeground hover:text-vscode-foreground hover:bg-vscode-list-hoverBackground hover:border-vscode-panel-border/80",
					disabled && "opacity-50 cursor-not-allowed",
					triggerClassName,
				)}>
				<span
					aria-hidden="true"
					className={cn(
						"size-1.5 rounded-[1px] shrink-0 transition-colors",
						isYoloOn ? "bg-vscode-charts-yellow" : "border border-current opacity-65",
					)}
				/>
				<span>{isYoloOn ? t("chat:autoApprove.statusOn") : t("chat:autoApprove.statusOff")}</span>
			</button>
		</StandardTooltip>
	)
}
