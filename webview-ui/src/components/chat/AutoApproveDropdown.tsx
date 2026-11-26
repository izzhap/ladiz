import { useCallback } from "react"

import { vscode } from "@/utils/vscode"
import { cn } from "@/lib/utils"
import { useExtensionState } from "@/context/ExtensionStateContext"
import { StandardTooltip } from "@/components/ui"
import { useAutoApprovalToggles } from "@/hooks/useAutoApprovalToggles"
import { useAutoApprovalState } from "@/hooks/useAutoApprovalState"
import { autoApproveSettingsConfig } from "../settings/AutoApproveToggle"

interface AutoApproveDropdownProps {
	disabled?: boolean
	triggerClassName?: string
}

export const AutoApproveDropdown = ({ disabled = false, triggerClassName = "" }: AutoApproveDropdownProps) => {
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
		<StandardTooltip
			content={
				isYoloOn
					? "YOLO Mode: ON (Semua tindakan diizinkan otomatis)"
					: "YOLO Mode: OFF (Memerlukan konfirmasi manual)"
			}>
			<button
				type="button"
				onClick={handleToggleYolo}
				disabled={disabled}
				aria-pressed={isYoloOn}
				data-testid="auto-approve-dropdown-trigger"
				className={cn(
					"inline-flex items-center gap-1.5 h-7 relative whitespace-nowrap px-2 text-[11px] font-medium rounded-md border select-none cursor-pointer transition-colors duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-vscode-focusBorder",
					isYoloOn
						? "bg-amber-500/12 border-amber-500/30 text-amber-300 hover:bg-amber-500/20 hover:border-amber-500/45"
						: "bg-white/[0.04] border-white/[0.08] text-slate-400 hover:text-slate-200 hover:bg-white/[0.08] hover:border-white/[0.16]",
					disabled && "opacity-50 cursor-not-allowed",
					triggerClassName,
				)}>
				<span
					aria-hidden="true"
					className={cn(
						"size-1.5 rounded-full shrink-0 transition-colors",
						isYoloOn ? "bg-amber-400" : "bg-slate-500",
					)}
				/>
				<span className="font-mono tracking-tight">{isYoloOn ? "YOLO: On" : "YOLO: Off"}</span>
			</button>
		</StandardTooltip>
	)
}
