import { HTMLAttributes, useState } from "react"
import { X, Zap, Terminal, Edit3, Eye } from "lucide-react"
import { Trans } from "react-i18next"
import { Package } from "@roo/package"

import { useAppTranslation } from "@/i18n/TranslationContext"
import { VSCodeCheckbox } from "@vscode/webview-ui-toolkit/react"
import { vscode } from "@/utils/vscode"
import { Button, Input } from "@/components/ui"
import { cn } from "@/lib/utils"

import { SetCachedStateField } from "./types"
import { SectionHeader } from "./SectionHeader"
import { Section } from "./Section"
import { SearchableSetting } from "./SearchableSetting"
import { AutoApproveToggle, autoApproveSettingsConfig, AutoApproveSetting } from "./AutoApproveToggle"
import { MaxLimitInputs } from "./MaxLimitInputs"
import { useExtensionState } from "@/context/ExtensionStateContext"
import { useAutoApprovalState } from "@/hooks/useAutoApprovalState"
import { useAutoApprovalToggles } from "@/hooks/useAutoApprovalToggles"

type AutoApproveSettingsProps = HTMLAttributes<HTMLDivElement> & {
	alwaysAllowReadOnly?: boolean
	alwaysAllowReadOnlyOutsideWorkspace?: boolean
	alwaysAllowWrite?: boolean
	alwaysAllowWriteOutsideWorkspace?: boolean
	alwaysAllowWriteProtected?: boolean
	alwaysAllowMcp?: boolean
	alwaysAllowModeSwitch?: boolean
	alwaysAllowSubtasks?: boolean
	alwaysAllowExecute?: boolean
	alwaysAllowFollowupQuestions?: boolean
	followupAutoApproveTimeoutMs?: number
	allowedCommands?: string[]
	allowedMaxRequests?: number | undefined
	allowedMaxCost?: number | undefined
	deniedCommands?: string[]
	setCachedStateField: SetCachedStateField<
		| "alwaysAllowReadOnly"
		| "alwaysAllowReadOnlyOutsideWorkspace"
		| "alwaysAllowWrite"
		| "alwaysAllowWriteOutsideWorkspace"
		| "alwaysAllowWriteProtected"
		| "alwaysAllowMcp"
		| "alwaysAllowModeSwitch"
		| "alwaysAllowSubtasks"
		| "alwaysAllowExecute"
		| "alwaysAllowFollowupQuestions"
		| "followupAutoApproveTimeoutMs"
		| "allowedCommands"
		| "allowedMaxRequests"
		| "allowedMaxCost"
		| "deniedCommands"
	>
}

export const AutoApproveSettings = ({
	alwaysAllowReadOnly,
	alwaysAllowReadOnlyOutsideWorkspace,
	alwaysAllowWrite,
	alwaysAllowWriteOutsideWorkspace,
	alwaysAllowWriteProtected,
	alwaysAllowMcp,
	alwaysAllowModeSwitch,
	alwaysAllowSubtasks,
	alwaysAllowExecute,
	alwaysAllowFollowupQuestions,
	followupAutoApproveTimeoutMs: _followupAutoApproveTimeoutMs = 60000,
	allowedCommands,
	allowedMaxRequests,
	allowedMaxCost,
	deniedCommands,
	setCachedStateField,
	...props
}: AutoApproveSettingsProps) => {
	const { t } = useAppTranslation()
	const [commandInput, setCommandInput] = useState("")
	const [deniedCommandInput, setDeniedCommandInput] = useState("")
	const { autoApprovalEnabled, setAutoApprovalEnabled } = useExtensionState()

	const toggles = useAutoApprovalToggles()
	const { effectiveAutoApprovalEnabled } = useAutoApprovalState(toggles, autoApprovalEnabled)

	const isYoloActive = !!effectiveAutoApprovalEnabled

	const activeCount = [
		alwaysAllowReadOnly,
		alwaysAllowWrite,
		alwaysAllowMcp,
		alwaysAllowModeSwitch,
		alwaysAllowSubtasks,
		alwaysAllowExecute,
	].filter(Boolean).length

	const handleAddCommand = () => {
		const currentCommands = allowedCommands ?? []

		if (commandInput && !currentCommands.includes(commandInput)) {
			const newCommands = [...currentCommands, commandInput]
			setCachedStateField("allowedCommands", newCommands)
			setCommandInput("")
			vscode.postMessage({ type: "updateSettings", updatedSettings: { allowedCommands: newCommands } })
		}
	}

	const handleAddDeniedCommand = () => {
		const currentCommands = deniedCommands ?? []

		if (deniedCommandInput && !currentCommands.includes(deniedCommandInput)) {
			const newCommands = [...currentCommands, deniedCommandInput]
			setCachedStateField("deniedCommands", newCommands)
			setDeniedCommandInput("")
			vscode.postMessage({ type: "updateSettings", updatedSettings: { deniedCommands: newCommands } })
		}
	}

	const handleSetAllToggles = (enable: boolean) => {
		Object.keys(autoApproveSettingsConfig).forEach((key) => {
			setCachedStateField(key as AutoApproveSetting, enable)
		})
	}

	return (
		<div {...props}>
			<SectionHeader>{t("settings:sections.autoApprove")}</SectionHeader>

			<Section>
				<div className="space-y-4">
					{/* YOLO Master Hero Banner */}
					<div
						className={cn(
							"rounded-xl p-4 border transition-all duration-200",
							isYoloActive
								? "bg-amber-500/[0.04] border-amber-500/30 shadow-sm shadow-amber-500/5"
								: "bg-white/[0.02] border-white/10",
						)}>
						<div className="flex items-start justify-between gap-3 mb-3">
							<div className="flex items-center gap-2.5">
								<div
									className={cn(
										"flex items-center justify-center size-8 rounded-lg transition-colors",
										isYoloActive
											? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_12px_rgba(251,191,36,0.2)]"
											: "bg-white/[0.05] text-slate-400 border border-white/10",
									)}>
									<Zap className="size-4 fill-current" />
								</div>
								<div>
									<h4 className="text-sm font-semibold text-slate-100 m-0">
										{t("settings:autoApprove.enabled")}
									</h4>
									<p className="text-xs text-slate-400 m-0">
										{isYoloActive
											? "YOLO Mode Active — tindakan diizinkan otomatis"
											: "Manual Approval — setiap tindakan butuh konfirmasi"}
									</p>
								</div>
							</div>

							{/* Live YOLO Status Pill */}
							<div
								className={cn(
									"inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full select-none transition-all",
									isYoloActive
										? "bg-amber-500/15 border border-amber-500/40 text-amber-300 shadow-sm shadow-amber-500/15"
										: "bg-white/[0.04] border border-white/10 text-slate-400",
								)}>
								<span
									className={cn(
										"size-1.5 rounded-full shrink-0 transition-colors",
										isYoloActive
											? "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.9)] animate-pulse"
											: "bg-slate-500",
									)}
								/>
								<span className="font-mono text-[11px]">{isYoloActive ? "YOLO: ON" : "YOLO: OFF"}</span>
							</div>
						</div>

						<SearchableSetting
							settingId="auto-approve-enabled"
							section="autoApprove"
							label={t("settings:autoApprove.enabled")}>
							<VSCodeCheckbox
								checked={effectiveAutoApprovalEnabled}
								aria-label={t("settings:autoApprove.toggleAriaLabel")}
								onChange={() => {
									const newValue = !(autoApprovalEnabled ?? false)
									setAutoApprovalEnabled(newValue)
									vscode.postMessage({ type: "autoApprovalEnabled", bool: newValue })
								}}>
								<span className="font-medium text-xs text-slate-200">
									{t("settings:autoApprove.enabled")}
								</span>
							</VSCodeCheckbox>
							<div className="text-vscode-descriptionForeground text-xs mt-1.5 leading-relaxed space-y-1">
								<p>{t("settings:autoApprove.description")}</p>
								<p>
									<Trans
										i18nKey="settings:autoApprove.toggleShortcut"
										components={{
											SettingsLink: (
												<a
													href="#"
													className="text-amber-400 hover:text-amber-300 hover:underline cursor-pointer font-medium"
													onClick={(e) => {
														e.preventDefault()
														vscode.postMessage({
															type: "openKeyboardShortcuts",
															text: `${Package.name}.toggleAutoApprove`,
														})
													}}
												/>
											),
										}}
									/>
								</p>
							</div>
						</SearchableSetting>
					</div>

					{/* Action Permissions Section */}
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
								Izin Tindakan ({activeCount}/7 Aktif)
							</span>
							<div className="flex items-center gap-1.5">
								<button
									type="button"
									onClick={() => handleSetAllToggles(true)}
									className="text-[11px] text-amber-400 hover:text-amber-300 font-medium px-2 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-colors cursor-pointer">
									Full YOLO (Semua)
								</button>
								<button
									type="button"
									onClick={() => handleSetAllToggles(false)}
									className="text-[11px] text-slate-400 hover:text-slate-200 font-medium px-2 py-0.5 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-colors cursor-pointer">
									Reset
								</button>
							</div>
						</div>

						<AutoApproveToggle
							alwaysAllowReadOnly={alwaysAllowReadOnly}
							alwaysAllowWrite={alwaysAllowWrite}
							alwaysAllowMcp={alwaysAllowMcp}
							alwaysAllowModeSwitch={alwaysAllowModeSwitch}
							alwaysAllowSubtasks={alwaysAllowSubtasks}
							alwaysAllowExecute={alwaysAllowExecute}
							onToggle={(key, value) => setCachedStateField(key, value)}
						/>
					</div>

					{/* Limits Section */}
					<MaxLimitInputs
						allowedMaxRequests={allowedMaxRequests}
						allowedMaxCost={allowedMaxCost}
						onMaxRequestsChange={(value) => setCachedStateField("allowedMaxRequests", value)}
						onMaxCostChange={(value) => setCachedStateField("allowedMaxCost", value)}
					/>

					{/* DETAILED PERMISSION SUB-SECTIONS */}

					{/* Read-Only Options */}
					{alwaysAllowReadOnly && (
						<div className="rounded-xl p-3.5 bg-white/[0.02] border border-white/10 space-y-3">
							<div className="flex items-center gap-2 font-semibold text-xs text-slate-200">
								<Eye className="size-4 text-amber-400" />
								<span>{t("settings:autoApprove.readOnly.label")}</span>
							</div>
							<SearchableSetting
								settingId="auto-approve-readonly-outside-workspace"
								section="autoApprove"
								label={t("settings:autoApprove.readOnly.outsideWorkspace.label")}>
								<VSCodeCheckbox
									checked={alwaysAllowReadOnlyOutsideWorkspace}
									onChange={(e: any) =>
										setCachedStateField("alwaysAllowReadOnlyOutsideWorkspace", e.target.checked)
									}
									data-testid="always-allow-readonly-outside-workspace-checkbox">
									<span className="font-medium text-xs text-slate-300">
										{t("settings:autoApprove.readOnly.outsideWorkspace.label")}
									</span>
								</VSCodeCheckbox>
								<div className="text-vscode-descriptionForeground text-xs mt-1">
									{t("settings:autoApprove.readOnly.outsideWorkspace.description")}
								</div>
							</SearchableSetting>
						</div>
					)}

					{/* Write Options */}
					{alwaysAllowWrite && (
						<div className="rounded-xl p-3.5 bg-white/[0.02] border border-white/10 space-y-3">
							<div className="flex items-center gap-2 font-semibold text-xs text-slate-200">
								<Edit3 className="size-4 text-amber-400" />
								<span>{t("settings:autoApprove.write.label")}</span>
							</div>
							<SearchableSetting
								settingId="auto-approve-write-outside-workspace"
								section="autoApprove"
								label={t("settings:autoApprove.write.outsideWorkspace.label")}>
								<VSCodeCheckbox
									checked={alwaysAllowWriteOutsideWorkspace}
									onChange={(e: any) =>
										setCachedStateField("alwaysAllowWriteOutsideWorkspace", e.target.checked)
									}
									data-testid="always-allow-write-outside-workspace-checkbox">
									<span className="font-medium text-xs text-slate-300">
										{t("settings:autoApprove.write.outsideWorkspace.label")}
									</span>
								</VSCodeCheckbox>
								<div className="text-vscode-descriptionForeground text-xs mt-1">
									{t("settings:autoApprove.write.outsideWorkspace.description")}
								</div>
							</SearchableSetting>
							<SearchableSetting
								settingId="auto-approve-write-protected"
								section="autoApprove"
								label={t("settings:autoApprove.write.protected.label")}>
								<VSCodeCheckbox
									checked={alwaysAllowWriteProtected}
									onChange={(e: any) =>
										setCachedStateField("alwaysAllowWriteProtected", e.target.checked)
									}
									data-testid="always-allow-write-protected-checkbox">
									<span className="font-medium text-xs text-slate-300">
										{t("settings:autoApprove.write.protected.label")}
									</span>
								</VSCodeCheckbox>
								<div className="text-vscode-descriptionForeground text-xs mt-1">
									{t("settings:autoApprove.write.protected.description")}
								</div>
							</SearchableSetting>
						</div>
					)}

					{/* Terminal Execution Options */}
					{alwaysAllowExecute && (
						<div className="rounded-xl p-3.5 bg-white/[0.02] border border-white/10 space-y-4">
							<div className="flex items-center gap-2 font-semibold text-xs text-slate-200">
								<Terminal className="size-4 text-amber-400" />
								<span>{t("settings:autoApprove.execute.label")}</span>
							</div>

							{/* Allowed Commands */}
							<div className="space-y-2">
								<SearchableSetting
									settingId="auto-approve-allowed-commands"
									section="autoApprove"
									label={t("settings:autoApprove.execute.allowedCommands")}>
									<label
										className="block text-xs font-semibold text-slate-300 mb-1"
										data-testid="allowed-commands-heading">
										{t("settings:autoApprove.execute.allowedCommands")}
									</label>
									<div className="text-vscode-descriptionForeground text-xs mb-2">
										{t("settings:autoApprove.execute.allowedCommandsDescription")}
									</div>
								</SearchableSetting>

								<div className="flex gap-2">
									<Input
										value={commandInput}
										onChange={(e: any) => setCommandInput(e.target.value)}
										onKeyDown={(e: any) => {
											if (e.key === "Enter") {
												e.preventDefault()
												handleAddCommand()
											}
										}}
										placeholder={t("settings:autoApprove.execute.commandPlaceholder")}
										className="grow text-xs h-8"
										data-testid="command-input"
									/>
									<Button
										className="h-8 px-3 text-xs bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 font-medium"
										onClick={handleAddCommand}
										data-testid="add-command-button">
										{t("settings:autoApprove.execute.addButton")}
									</Button>
								</div>

								{allowedCommands && allowedCommands.length > 0 && (
									<div className="flex flex-wrap gap-1.5 pt-1">
										{allowedCommands.map((cmd, index) => (
											<button
												key={index}
												type="button"
												data-testid={`remove-command-${index}`}
												onClick={() => {
													const newCommands = (allowedCommands ?? []).filter(
														(_, i) => i !== index,
													)
													setCachedStateField("allowedCommands", newCommands)

													vscode.postMessage({
														type: "updateSettings",
														updatedSettings: { allowedCommands: newCommands },
													})
												}}
												className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded-md bg-white/[0.05] hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 text-slate-300 hover:text-red-300 transition-colors cursor-pointer group">
												<span>{cmd}</span>
												<X className="size-3 opacity-60 group-hover:opacity-100" />
											</button>
										))}
									</div>
								)}
							</div>

							{/* Denied Commands */}
							<div className="space-y-2 pt-2 border-t border-white/5">
								<SearchableSetting
									settingId="auto-approve-denied-commands"
									section="autoApprove"
									label={t("settings:autoApprove.execute.deniedCommands")}>
									<label
										className="block text-xs font-semibold text-slate-300 mb-1"
										data-testid="denied-commands-heading">
										{t("settings:autoApprove.execute.deniedCommands")}
									</label>
									<div className="text-vscode-descriptionForeground text-xs mb-2">
										{t("settings:autoApprove.execute.deniedCommandsDescription")}
									</div>
								</SearchableSetting>

								<div className="flex gap-2">
									<Input
										value={deniedCommandInput}
										onChange={(e: any) => setDeniedCommandInput(e.target.value)}
										onKeyDown={(e: any) => {
											if (e.key === "Enter") {
												e.preventDefault()
												handleAddDeniedCommand()
											}
										}}
										placeholder={t("settings:autoApprove.execute.deniedCommandPlaceholder")}
										className="grow text-xs h-8"
										data-testid="denied-command-input"
									/>
									<Button
										className="h-8 px-3 text-xs bg-white/[0.05] border border-white/10 hover:bg-white/[0.08] text-slate-300 font-medium"
										onClick={handleAddDeniedCommand}
										data-testid="add-denied-command-button">
										{t("settings:autoApprove.execute.addButton")}
									</Button>
								</div>

								{deniedCommands && deniedCommands.length > 0 && (
									<div className="flex flex-wrap gap-1.5 pt-1">
										{deniedCommands.map((cmd, index) => (
											<button
												key={index}
												type="button"
												data-testid={`remove-denied-command-${index}`}
												onClick={() => {
													const newCommands = (deniedCommands ?? []).filter(
														(_, i) => i !== index,
													)
													setCachedStateField("deniedCommands", newCommands)

													vscode.postMessage({
														type: "updateSettings",
														updatedSettings: { deniedCommands: newCommands },
													})
												}}
												className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded-md bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-300 transition-colors cursor-pointer group">
												<span>{cmd}</span>
												<X className="size-3 opacity-60 group-hover:opacity-100" />
											</button>
										))}
									</div>
								)}
							</div>
						</div>
					)}
				</div>
			</Section>
		</div>
	)
}
