import { useCallback, useState, memo, useMemo } from "react"
import { useEvent } from "react-use"
import { t } from "i18next"
import { ChevronDown, OctagonX, Terminal } from "lucide-react"

import { type ExtensionMessage, type CommandExecutionStatus, commandExecutionStatusSchema } from "@roo-code/types"

import { safeJsonParse } from "@roo/core"
import { COMMAND_OUTPUT_STRING } from "@roo/combineCommandSequences"
import { parseCommand } from "@roo/parse-command"

import { vscode } from "@src/utils/vscode"
import { extractPatternsFromCommand } from "@src/utils/command-parser"
import { useExtensionState } from "@src/context/ExtensionStateContext"
import { cn } from "@src/lib/utils"

import { Button, StandardTooltip } from "@src/components/ui"
import CodeBlock from "@src/components/common/CodeBlock"

import { CommandPatternSelector } from "./CommandPatternSelector"
import { TerminalOutput } from "./TerminalOutput"
import { TimelineItem } from "./TimelineItem"

interface CommandPattern {
	pattern: string
	description?: string
}

interface CommandExecutionProps {
	executionId: string
	text?: string
	icon?: JSX.Element | null
	title?: JSX.Element | null
}

export const CommandExecution = ({ executionId, text, icon: _icon, title: _title }: CommandExecutionProps) => {
	const {
		terminalShellIntegrationDisabled = false,
		allowedCommands = [],
		deniedCommands = [],
		setAllowedCommands,
		setDeniedCommands,
	} = useExtensionState()

	const { command, output: parsedOutput } = useMemo(() => parseCommandAndOutput(text), [text])

	// If we aren't opening the VSCode terminal for this command then we default
	// to expanding the command execution output.
	const [isExpanded, setIsExpanded] = useState(terminalShellIntegrationDisabled)
	const [streamingOutput, setStreamingOutput] = useState("")
	const [status, setStatus] = useState<CommandExecutionStatus | null>(null)

	// The command's output can either come from the text associated with the
	// task message (this is the case for completed commands) or from the
	// streaming output (this is the case for running commands).
	const output = streamingOutput || parsedOutput

	// Extract command patterns from the actual command that was executed
	const commandPatterns = useMemo<CommandPattern[]>(() => {
		// First get all individual commands (including subshell commands) using parseCommand
		const allCommands = parseCommand(command)

		// Then extract patterns from each command using the existing pattern extraction logic
		const allPatterns = new Set<string>()

		// Add all individual commands first
		allCommands.forEach((cmd) => {
			if (cmd.trim()) {
				allPatterns.add(cmd.trim())
			}
		})

		// Then add extracted patterns for each command
		allCommands.forEach((cmd) => {
			const patterns = extractPatternsFromCommand(cmd)
			patterns.forEach((pattern) => allPatterns.add(pattern))
		})

		return Array.from(allPatterns).map((pattern) => ({
			pattern,
		}))
	}, [command])

	// Handle pattern changes
	const handleAllowPatternChange = (pattern: string) => {
		const isAllowed = allowedCommands.includes(pattern)
		const newAllowed = isAllowed ? allowedCommands.filter((p) => p !== pattern) : [...allowedCommands, pattern]
		const newDenied = deniedCommands.filter((p) => p !== pattern)

		setAllowedCommands(newAllowed)
		setDeniedCommands(newDenied)

		vscode.postMessage({
			type: "updateSettings",
			updatedSettings: { allowedCommands: newAllowed, deniedCommands: newDenied },
		})
	}

	const handleDenyPatternChange = (pattern: string) => {
		const isDenied = deniedCommands.includes(pattern)
		const newDenied = isDenied ? deniedCommands.filter((p) => p !== pattern) : [...deniedCommands, pattern]
		const newAllowed = allowedCommands.filter((p) => p !== pattern)

		setAllowedCommands(newAllowed)
		setDeniedCommands(newDenied)

		vscode.postMessage({
			type: "updateSettings",
			updatedSettings: { allowedCommands: newAllowed, deniedCommands: newDenied },
		})
	}

	const onMessage = useCallback(
		(event: MessageEvent) => {
			const message: ExtensionMessage = event.data

			if (message.type === "commandExecutionStatus") {
				const result = commandExecutionStatusSchema.safeParse(safeJsonParse(message.text, {}))

				if (result.success) {
					const data = result.data

					if (data.executionId !== executionId) {
						return
					}

					switch (data.status) {
						case "started":
							setStatus(data)
							break
						case "output":
							setStreamingOutput(data.output)
							break
						case "fallback":
							setIsExpanded(true)
							break
						default:
							setStatus(data)
							break
					}
				}
			}
		},
		[executionId],
	)

	useEvent("message", onMessage)

	const isRunning = status?.status === "started"
	const isExited = status?.status === "exited"
	const exitCode = status?.status === "exited" ? status.exitCode : undefined
	const pid = status?.status === "started" ? status.pid : undefined
	const isExitOk = exitCode === 0

	return (
		<TimelineItem
			status={isRunning ? "running" : isExited && !isExitOk ? "error" : "command"}
			customDot={
				<div
					className={cn(
						"flex items-center justify-center size-3.5 rounded-full",
						isRunning
							? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 animate-pulse"
							: isExited && !isExitOk
								? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
								: "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30",
					)}>
					<Terminal className="size-2.5" />
				</div>
			}
			action={<span>{t("chat:commandExecution.running")}</span>}
			target={<span className="font-mono text-[11px] truncate max-w-[280px]">{command}</span>}
			subtext={
				isExited ? (
					<span className={cn("text-[10px] font-mono", isExitOk ? "text-emerald-400" : "text-rose-400")}>
						Exit code: {exitCode}
					</span>
				) : pid ? (
					<span className="text-[10px] font-mono text-cyan-400">PID: {pid}</span>
				) : null
			}
			actions={
				<div className="flex items-center gap-1">
					{isRunning && (
						<StandardTooltip content={t("chat:commandExecution.abort")}>
							<Button
								variant="ghost"
								size="icon"
								className="size-5 p-0 text-rose-400 hover:text-rose-300"
								onClick={() =>
									vscode.postMessage({
										type: "terminalOperation",
										terminalOperation: "abort",
									})
								}>
								<OctagonX className="size-3.5" />
							</Button>
						</StandardTooltip>
					)}
					{output.length > 0 && (
						<Button
							variant="ghost"
							size="icon"
							className="size-5 p-0 text-vscode-descriptionForeground hover:text-vscode-foreground"
							onClick={() => setIsExpanded(!isExpanded)}>
							<ChevronDown
								className={cn("size-3.5 transition-transform duration-200", isExpanded && "rotate-180")}
							/>
						</Button>
					)}
				</div>
			}>
			<div className="bg-vscode-editor-background/60 border border-vscode-panel-border/40 rounded-lg overflow-hidden mt-1">
				<div className="p-2">
					<CodeBlock source={command} language="shell" />
					<OutputContainer isExpanded={isExpanded} output={output} />
				</div>
				{command && command.trim() && (
					<CommandPatternSelector
						patterns={commandPatterns}
						allowedCommands={allowedCommands}
						deniedCommands={deniedCommands}
						onAllowPatternChange={handleAllowPatternChange}
						onDenyPatternChange={handleDenyPatternChange}
					/>
				)}
			</div>
		</TimelineItem>
	)
}

CommandExecution.displayName = "CommandExecution"

const OutputContainerInternal = ({ isExpanded, output }: { isExpanded: boolean; output: string }) => (
	<div
		className={cn("overflow-hidden", {
			"max-h-0": !isExpanded,
			"max-h-[100%] mt-1 pt-1 border-t border-border/25": isExpanded,
		})}>
		{output.length > 0 && <TerminalOutput content={output} />}
	</div>
)

const OutputContainer = memo(OutputContainerInternal)

const parseCommandAndOutput = (text: string | undefined) => {
	if (!text) {
		return { command: "", output: "" }
	}

	const index = text.indexOf(COMMAND_OUTPUT_STRING)

	if (index === -1) {
		return { command: text, output: "" }
	}

	return {
		command: text.slice(0, index),
		output: text.slice(index + COMMAND_OUTPUT_STRING.length),
	}
}
