import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSize } from "react-use"
import { useTranslation } from "react-i18next"
import deepEqual from "fast-deep-equal"

import type {
	ClineMessage,
	FollowUpData,
	SuggestionItem,
	ClineApiReqInfo,
	ClineAskUseMcpServer,
	ClineSayTool,
} from "@roo-code/types"

import { Mode } from "@roo/modes"

import { COMMAND_OUTPUT_STRING } from "@roo/combineCommandSequences"
import { safeJsonParse } from "@roo/core"

import { useExtensionState } from "@src/context/ExtensionStateContext"
import { findMatchingResourceOrTemplate } from "@src/utils/mcp"
import { vscode } from "@src/utils/vscode"

import UpdateTodoListToolBlock from "./UpdateTodoListToolBlock"
import { TodoChangeDisplay } from "./TodoChangeDisplay"
import CodeAccordion from "../common/CodeAccordion"
import MarkdownBlock from "../common/MarkdownBlock"
import { ReasoningBlock } from "./ReasoningBlock"
import Thumbnails from "../common/Thumbnails"
import ImageBlock from "../common/ImageBlock"
import ErrorRow from "./ErrorRow"
import WarningRow from "./WarningRow"

import McpResourceRow from "../mcp/McpResourceRow"

import { Mention } from "./Mention"
import { CheckpointSaved } from "./checkpoints/CheckpointSaved"
import { FollowUpSuggest } from "./FollowUpSuggest"
import { BatchFilePermission } from "./BatchFilePermission"
import { BatchDiffApproval } from "./BatchDiffApproval"
import { ProgressIndicator } from "./ProgressIndicator"
import { ApiRequestLoading } from "./ApiRequestLoading"
import { LadizAnimatedLogo } from "./LadizAnimatedLogo"
import { Markdown } from "./Markdown"
import { CommandExecution } from "./CommandExecution"
import { CommandExecutionError } from "./CommandExecutionError"
import { AutoApprovedRequestLimitWarning } from "./AutoApprovedRequestLimitWarning"
import { InProgressRow, CondensationResultRow, CondensationErrorRow, TruncationResultRow } from "./context-management"
import CodebaseSearchResultsDisplay from "./CodebaseSearchResultsDisplay"
import { appendImages } from "@src/utils/imageUtils"
import { McpExecution } from "./McpExecution"
import { ChatTextArea } from "./ChatTextArea"
import { MAX_IMAGES_PER_MESSAGE } from "./ChatView"
import { useSelectedModel } from "../ui/hooks/useSelectedModel"
import {
	Edit,
	Trash2,
	MessageCircleQuestionMark,
	SquareArrowOutUpRight,
	TerminalSquare,
	Repeat2,
	ArrowRight,
	ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { OpenMarkdownPreviewButton } from "./OpenMarkdownPreviewButton"
import { TimelineItem } from "./TimelineItem"

// Helper function to get previous todos before a specific message
function getPreviousTodos(messages: ClineMessage[], currentMessageTs: number): any[] {
	// Find the previous updateTodoList message before the current one
	const previousUpdateIndex = messages
		.slice()
		.reverse()
		.findIndex((msg) => {
			if (msg.ts >= currentMessageTs) return false
			if (msg.type === "ask" && msg.ask === "tool") {
				try {
					const tool = JSON.parse(msg.text || "{}")
					return tool.tool === "updateTodoList"
				} catch {
					return false
				}
			}
			return false
		})

	if (previousUpdateIndex !== -1) {
		const previousMessage = messages.slice().reverse()[previousUpdateIndex]
		try {
			const tool = JSON.parse(previousMessage.text || "{}")
			return tool.todos || []
		} catch {
			return []
		}
	}

	// If no previous updateTodoList message, return empty array
	return []
}

interface ChatRowProps {
	message: ClineMessage
	lastModifiedMessage?: ClineMessage
	isExpanded: boolean
	isLast: boolean
	isStreaming: boolean
	onToggleExpand: (ts: number) => void
	onHeightChange: (isTaller: boolean) => void
	onSuggestionClick?: (suggestion: SuggestionItem, event?: React.MouseEvent) => void
	onBatchFileResponse?: (response: { [key: string]: boolean }) => void
	onFollowUpUnmount?: () => void
	isFollowUpAnswered?: boolean
	isFollowUpAutoApprovalPaused?: boolean
	editable?: boolean
	hasCheckpoint?: boolean
	onJumpToPreviousCheckpoint?: () => void
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ChatRowContentProps extends Omit<ChatRowProps, "onHeightChange"> {}

const ChatRow = memo(
	(props: ChatRowProps) => {
		const { isLast, onHeightChange, message } = props
		// Store the previous height to compare with the current height
		// This allows us to detect changes without causing re-renders
		const prevHeightRef = useRef(0)

		const [chatrow, { height }] = useSize(
			<div className="px-3.5 py-1.5">
				<ChatRowContent {...props} />
			</div>,
		)

		useEffect(() => {
			const isHeightValid = height !== 0 && height !== Infinity
			// used for partials, command output, etc.
			// NOTE: it's important we don't distinguish between partial or complete here since our scroll effects in chatview need to handle height change during partial -> complete
			const isInitialRender = prevHeightRef.current === 0 // prevents scrolling when new element is added since we already scroll for that
			// height starts off at Infinity
			if (isLast && isHeightValid && height !== prevHeightRef.current) {
				if (!isInitialRender) {
					onHeightChange(height > prevHeightRef.current)
				}
				prevHeightRef.current = height
			}
		}, [height, isLast, onHeightChange, message])

		// we cannot return null as virtuoso does not support it, so we use a separate visibleMessages array to filter out messages that should not be rendered
		return chatrow
	},
	// memo does shallow comparison of props, so we need to do deep comparison of arrays/objects whose properties might change
	deepEqual,
)

export default ChatRow

export const ChatRowContent = ({
	message,
	lastModifiedMessage,
	isExpanded,
	isLast,
	isStreaming,
	onToggleExpand,
	onSuggestionClick,
	onFollowUpUnmount,
	onBatchFileResponse,
	isFollowUpAnswered,
	isFollowUpAutoApprovalPaused,
	onJumpToPreviousCheckpoint,
}: ChatRowContentProps) => {
	const { t, i18n } = useTranslation()

	const { mcpServers, alwaysAllowMcp, currentCheckpoint, mode, apiConfiguration, clineMessages, currentTaskItem } =
		useExtensionState()
	const { info: model } = useSelectedModel(apiConfiguration)
	const [isEditing, setIsEditing] = useState(false)
	const [editedContent, setEditedContent] = useState("")
	const [editMode, setEditMode] = useState<Mode>(mode || "code")
	const [editImages, setEditImages] = useState<string[]>([])

	// Handle message events for image selection during edit mode
	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			const msg = event.data
			if (msg.type === "selectedImages" && msg.context === "edit" && msg.messageTs === message.ts && isEditing) {
				setEditImages((prevImages) => appendImages(prevImages, msg.images, MAX_IMAGES_PER_MESSAGE))
			}
		}

		window.addEventListener("message", handleMessage)
		return () => window.removeEventListener("message", handleMessage)
	}, [isEditing, message.ts])

	// Memoized callback to prevent re-renders caused by inline arrow functions.
	const handleToggleExpand = useCallback(() => {
		onToggleExpand(message.ts)
	}, [onToggleExpand, message.ts])

	// Handle edit button click
	const handleEditClick = useCallback(() => {
		setIsEditing(true)
		setEditedContent(message.text || "")
		setEditImages(message.images || [])
		setEditMode(mode || "code")
		// Edit mode is now handled entirely in the frontend
		// No need to notify the backend
	}, [message.text, message.images, mode])

	// Handle cancel edit
	const handleCancelEdit = useCallback(() => {
		setIsEditing(false)
		setEditedContent(message.text || "")
		setEditImages(message.images || [])
		setEditMode(mode || "code")
	}, [message.text, message.images, mode])

	// Handle save edit
	const handleSaveEdit = useCallback(() => {
		setIsEditing(false)
		// Send edited message to backend
		vscode.postMessage({
			type: "submitEditedMessage",
			value: message.ts,
			editedMessageContent: editedContent,
			images: editImages,
		})
	}, [message.ts, editedContent, editImages])

	// Handle image selection for editing
	const handleSelectImages = useCallback(() => {
		vscode.postMessage({ type: "selectImages", context: "edit", messageTs: message.ts })
	}, [message.ts])

	const [cost, apiReqCancelReason, apiReqStreamingFailedMessage] = useMemo(() => {
		if (message.text !== null && message.text !== undefined && message.say === "api_req_started") {
			const info = safeJsonParse<ClineApiReqInfo>(message.text)
			return [info?.cost, info?.cancelReason, info?.streamingFailedMessage]
		}

		return [undefined, undefined, undefined]
	}, [message.text, message.say])

	// When resuming task, last won't be api_req_failed but a resume_task
	// message, so api_req_started will show loading spinner. That's why we just
	// remove the last api_req_started that failed without streaming anything.
	const apiRequestFailedMessage =
		isLast && lastModifiedMessage?.ask === "api_req_failed" // if request is retried then the latest message is a api_req_retried
			? lastModifiedMessage?.text
			: undefined

	const isCommandExecuting =
		isLast && lastModifiedMessage?.ask === "command" && lastModifiedMessage?.text?.includes(COMMAND_OUTPUT_STRING)

	const isMcpServerResponding = isLast && lastModifiedMessage?.say === "mcp_server_request_started"

	const type = message.type === "ask" ? message.ask : message.say

	const normalColor = "var(--vscode-foreground)"
	const errorColor = "var(--vscode-errorForeground)"
	const successColor = "var(--vscode-charts-green)"
	const cancelledColor = "var(--vscode-descriptionForeground)"

	const [icon, title] = useMemo(() => {
		switch (type) {
			case "error":
			case "mistake_limit_reached":
				return [null, null] // These will be handled by ErrorRow component
			case "command":
				return [
					isCommandExecuting ? (
						<ProgressIndicator />
					) : (
						<TerminalSquare className="size-4" aria-label="Terminal icon" />
					),
					<span style={{ color: normalColor, fontWeight: "bold" }}>
						{t("chat:commandExecution.running")}
					</span>,
				]
			case "use_mcp_server":
				const mcpServerUse = safeJsonParse<ClineAskUseMcpServer>(message.text)
				if (mcpServerUse === undefined) {
					return [null, null]
				}
				return [
					isMcpServerResponding ? (
						<ProgressIndicator />
					) : (
						<span
							className="codicon codicon-server"
							style={{ color: normalColor, marginBottom: "-1.5px" }}></span>
					),
					<span style={{ color: normalColor, fontWeight: "bold" }}>
						{mcpServerUse.type === "use_mcp_tool"
							? t("chat:mcp.wantsToUseTool", { serverName: mcpServerUse.serverName })
							: t("chat:mcp.wantsToAccessResource", { serverName: mcpServerUse.serverName })}
					</span>,
				]
			case "completion_result":
				return [
					<span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] inline-block shrink-0"></span>,
					<span style={{ color: successColor, fontWeight: "bold" }}>{t("chat:taskCompleted")}</span>,
				]
			case "api_req_rate_limit_wait":
				return []
			case "api_req_retry_delayed":
				return []
			case "api_req_started":
				const getIconSpan = (iconName: string, color: string) => (
					<div
						style={{
							width: 16,
							height: 16,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}>
						<span
							className={`codicon codicon-${iconName}`}
							style={{ color, fontSize: 16, marginBottom: "-1.5px" }}
						/>
					</div>
				)
				return [
					apiReqCancelReason !== null && apiReqCancelReason !== undefined ? (
						apiReqCancelReason === "user_cancelled" ? (
							getIconSpan("error", cancelledColor)
						) : (
							getIconSpan("error", errorColor)
						)
					) : cost !== null && cost !== undefined ? (
						getIconSpan("arrow-swap", normalColor)
					) : apiRequestFailedMessage ? (
						getIconSpan("error", errorColor)
					) : isLast ? (
						<ProgressIndicator />
					) : (
						getIconSpan("arrow-swap", normalColor)
					),
					apiReqCancelReason !== null && apiReqCancelReason !== undefined ? (
						apiReqCancelReason === "user_cancelled" ? (
							<span style={{ color: normalColor, fontWeight: "bold" }}>
								{t("chat:apiRequest.cancelled")}
							</span>
						) : (
							<span style={{ color: errorColor, fontWeight: "bold" }}>
								{t("chat:apiRequest.streamingFailed")}
							</span>
						)
					) : cost !== null && cost !== undefined ? (
						<span style={{ color: normalColor }}>{t("chat:apiRequest.title")}</span>
					) : apiRequestFailedMessage ? (
						<span style={{ color: errorColor }}>{t("chat:apiRequest.failed")}</span>
					) : (
						<span style={{ color: normalColor }}>{t("chat:apiRequest.streaming")}</span>
					),
				]
			case "followup":
				return [
					<MessageCircleQuestionMark className="w-4 shrink-0" aria-label="Question icon" />,
					<span style={{ color: normalColor, fontWeight: "bold" }}>{t("chat:questions.hasQuestion")}</span>,
				]
			default:
				return [null, null]
		}
	}, [
		type,
		isCommandExecuting,
		message,
		isMcpServerResponding,
		apiReqCancelReason,
		cost,
		apiRequestFailedMessage,
		t,
		isLast,
	])

	const headerStyle: React.CSSProperties = {
		display: "flex",
		alignItems: "center",
		gap: "10px",
		cursor: "default",
		marginBottom: "10px",
		wordBreak: "break-word",
	}

	const tool = useMemo(
		() => (message.ask === "tool" ? safeJsonParse<ClineSayTool>(message.text) : null),
		[message.ask, message.text],
	)

	// Unified diff content (provided by backend when relevant)
	const unifiedDiff = useMemo(() => {
		if (!tool) return undefined
		return (tool.content ?? tool.diff) as string | undefined
	}, [tool])

	const onJumpToCreatedFile = useMemo(() => {
		if (!tool || tool.tool !== "newFileCreated" || !tool.path) {
			return undefined
		}

		return () => vscode.postMessage({ type: "openFile", text: "./" + tool.path })
	}, [tool])

	const followUpData = useMemo(() => {
		if (message.type === "ask" && message.ask === "followup" && !message.partial) {
			return safeJsonParse<FollowUpData>(message.text)
		}
		return null
	}, [message.type, message.ask, message.partial, message.text])

	if (tool) {
		switch (tool.tool as string) {
			case "editedExistingFile":
			case "appliedDiff":
			case "newFileCreated":
			case "searchAndReplace":
			case "search_and_replace":
			case "search_replace":
			case "edit":
			case "edit_file":
			case "apply_patch":
			case "apply_diff":
				// Check if this is a batch diff request
				if (message.type === "ask" && tool.batchDiffs && Array.isArray(tool.batchDiffs)) {
					return (
						<TimelineItem
							status="edit"
							action="Batch Edit"
							target={
								<span className="font-semibold">
									{t("chat:fileOperations.wantsToApplyBatchChanges")}
								</span>
							}
							actions={
								<button
									onClick={handleToggleExpand}
									className="text-vscode-descriptionForeground/60 hover:text-vscode-foreground p-0.5 rounded transition-colors cursor-pointer">
									<ChevronDown
										className={cn(
											"size-3.5 transition-transform duration-200",
											isExpanded && "rotate-180",
										)}
									/>
								</button>
							}>
							<BatchDiffApproval files={tool.batchDiffs} ts={message.ts} />
						</TimelineItem>
					)
				}

				// Regular single file diff
				return (
					<TimelineItem
						status="edit"
						action={tool.tool === "newFileCreated" ? "Write" : "Edit"}
						target={tool.path}
						subtext={
							tool.isProtected
								? t("chat:fileOperations.wantsToEditProtected")
								: tool.diffStats
									? `Modified (+${tool.diffStats.added} -${tool.diffStats.removed})`
									: "Modified"
						}
						actions={
							<button
								onClick={handleToggleExpand}
								className="text-vscode-descriptionForeground/60 hover:text-vscode-foreground p-0.5 rounded transition-colors cursor-pointer"
								aria-label="Toggle diff">
								<ChevronDown
									className={cn(
										"size-3.5 transition-transform duration-200",
										isExpanded && "rotate-180",
									)}
								/>
							</button>
						}
						onClick={handleToggleExpand}>
						<CodeAccordion
							path={tool.path}
							code={unifiedDiff ?? tool.content ?? tool.diff ?? ""}
							language="diff"
							progressStatus={message.progressStatus}
							isLoading={message.partial}
							isExpanded={isExpanded}
							onToggleExpand={handleToggleExpand}
							onJumpToFile={onJumpToCreatedFile}
							diffStats={tool.diffStats}
						/>
					</TimelineItem>
				)
			case "insertContent":
				return (
					<TimelineItem
						status="edit"
						action="Insert"
						target={tool.path}
						subtext={
							tool.lineNumber === 0
								? t("chat:fileOperations.wantsToInsertAtEnd")
								: t("chat:fileOperations.wantsToInsertWithLineNumber", { lineNumber: tool.lineNumber })
						}
						actions={
							<button
								onClick={handleToggleExpand}
								className="text-vscode-descriptionForeground/60 hover:text-vscode-foreground p-0.5 rounded transition-colors cursor-pointer"
								aria-label="Toggle diff">
								<ChevronDown
									className={cn(
										"size-3.5 transition-transform duration-200",
										isExpanded && "rotate-180",
									)}
								/>
							</button>
						}
						onClick={handleToggleExpand}>
						<CodeAccordion
							path={tool.path}
							code={unifiedDiff ?? tool.diff}
							language="diff"
							progressStatus={message.progressStatus}
							isLoading={message.partial}
							isExpanded={isExpanded}
							onToggleExpand={handleToggleExpand}
							diffStats={tool.diffStats}
						/>
					</TimelineItem>
				)
			case "codebaseSearch": {
				return (
					<TimelineItem
						status="success"
						action="Search"
						target={`"${tool.query}"`}
						subtext={tool.path ? `${tool.path}` : "Workspace codebase"}
					/>
				)
			}
			case "updateTodoList" as any: {
				const todos = (tool as any).todos || []
				const previousTodos = getPreviousTodos(clineMessages, message.ts)
				return <TodoChangeDisplay previousTodos={previousTodos} newTodos={todos} />
			}
			case "readFile":
				// Check if this is a batch file permission request
				const isBatchRequest = message.type === "ask" && tool.batchFiles && Array.isArray(tool.batchFiles)

				if (isBatchRequest) {
					return (
						<TimelineItem
							status="success"
							action="Read"
							target={t("chat:fileOperations.wantsToReadMultiple")}
							actions={
								<button
									onClick={handleToggleExpand}
									className="text-vscode-descriptionForeground/60 hover:text-vscode-foreground p-0.5 rounded transition-colors cursor-pointer">
									<ChevronDown
										className={cn(
											"size-3.5 transition-transform duration-200",
											isExpanded && "rotate-180",
										)}
									/>
								</button>
							}>
							<BatchFilePermission
								files={tool.batchFiles || []}
								onPermissionResponse={(response) => {
									onBatchFileResponse?.(response)
								}}
								ts={message?.ts}
							/>
						</TimelineItem>
					)
				}

				// Regular single file read request
				return (
					<TimelineItem
						status="success"
						action="Read"
						target={tool.path}
						subtext={
							tool.reason ||
							(message.type === "ask"
								? tool.isOutsideWorkspace
									? t("chat:fileOperations.wantsToReadOutsideWorkspace")
									: tool.additionalFileCount && tool.additionalFileCount > 0
										? t("chat:fileOperations.wantsToReadAndXMore", {
												count: tool.additionalFileCount,
											})
										: t("chat:fileOperations.wantsToRead")
								: undefined)
						}
						actions={
							<button
								className="text-vscode-descriptionForeground/60 hover:text-vscode-foreground p-0.5 rounded transition-colors cursor-pointer"
								onClick={() =>
									vscode.postMessage({
										type: "openFile",
										text: tool.content,
										values: tool.startLine ? { line: tool.startLine } : undefined,
									})
								}
								title="Open file">
								<SquareArrowOutUpRight className="size-3.5" />
							</button>
						}
					/>
				)
			case "skill": {
				const skillInfo = tool
				return (
					<TimelineItem
						status="info"
						action="Skill"
						target={skillInfo.skill}
						subtext={
							skillInfo.description ||
							(message.type === "ask" ? t("chat:skill.wantsToLoad") : t("chat:skill.didLoad"))
						}
						actions={
							skillInfo.args || skillInfo.description ? (
								<button
									onClick={handleToggleExpand}
									className="text-vscode-descriptionForeground/60 hover:text-vscode-foreground p-0.5 rounded transition-colors cursor-pointer">
									<ChevronDown
										className={cn(
											"size-3.5 transition-transform duration-200",
											isExpanded && "rotate-180",
										)}
									/>
								</button>
							) : null
						}
						onClick={skillInfo.args || skillInfo.description ? handleToggleExpand : undefined}>
						{isExpanded && (skillInfo.args || skillInfo.description) && (
							<div className="bg-vscode-editor-background/50 border border-vscode-panel-border/40 rounded-lg p-2.5 text-xs text-vscode-descriptionForeground space-y-1 mt-1">
								{skillInfo.description && <div>{skillInfo.description}</div>}
								{skillInfo.args && (
									<div>
										<span className="font-semibold text-vscode-foreground">Args: </span>
										<span>{skillInfo.args}</span>
									</div>
								)}
							</div>
						)}
					</TimelineItem>
				)
			}
			case "listFilesTopLevel":
				return (
					<TimelineItem
						status="info"
						action="List"
						target={tool.path || "."}
						subtext={
							message.type === "ask"
								? t("chat:directoryOperations.wantsToViewTopLevel")
								: t("chat:directoryOperations.didViewTopLevel")
						}
						actions={
							tool.content ? (
								<button
									onClick={handleToggleExpand}
									className="text-vscode-descriptionForeground/60 hover:text-vscode-foreground p-0.5 rounded transition-colors cursor-pointer">
									<ChevronDown
										className={cn(
											"size-3.5 transition-transform duration-200",
											isExpanded && "rotate-180",
										)}
									/>
								</button>
							) : null
						}
						onClick={tool.content ? handleToggleExpand : undefined}>
						{tool.content && (
							<CodeAccordion
								path={tool.path}
								code={tool.content}
								language="shell-session"
								isExpanded={isExpanded}
								onToggleExpand={handleToggleExpand}
							/>
						)}
					</TimelineItem>
				)
			case "listFilesRecursive":
				return (
					<TimelineItem
						status="info"
						action="List"
						target={tool.path || "."}
						subtext="Recursive file tree"
						actions={
							tool.content ? (
								<button
									onClick={handleToggleExpand}
									className="text-vscode-descriptionForeground/60 hover:text-vscode-foreground p-0.5 rounded transition-colors cursor-pointer">
									<ChevronDown
										className={cn(
											"size-3.5 transition-transform duration-200",
											isExpanded && "rotate-180",
										)}
									/>
								</button>
							) : null
						}
						onClick={tool.content ? handleToggleExpand : undefined}>
						{tool.content && (
							<CodeAccordion
								path={tool.path}
								code={tool.content}
								language="shellsession"
								isExpanded={isExpanded}
								onToggleExpand={handleToggleExpand}
							/>
						)}
					</TimelineItem>
				)
			case "searchFiles":
				return (
					<TimelineItem
						status="success"
						action="Grep"
						target={`"${tool.regex}"`}
						subtext={tool.path ? `${tool.path}` : undefined}
						actions={
							tool.content ? (
								<button
									onClick={handleToggleExpand}
									className="text-vscode-descriptionForeground/60 hover:text-vscode-foreground p-0.5 rounded transition-colors cursor-pointer">
									<ChevronDown
										className={cn(
											"size-3.5 transition-transform duration-200",
											isExpanded && "rotate-180",
										)}
									/>
								</button>
							) : null
						}
						onClick={tool.content ? handleToggleExpand : undefined}>
						{tool.content && (
							<CodeAccordion
								path={tool.path! + (tool.filePattern ? `/(${tool.filePattern})` : "")}
								code={tool.content}
								language="shellsession"
								isExpanded={isExpanded}
								onToggleExpand={handleToggleExpand}
							/>
						)}
					</TimelineItem>
				)
			case "switchMode":
				return (
					<TimelineItem
						status="info"
						action="Mode"
						target={tool.mode}
						subtext={
							tool.reason ||
							(message.type === "ask" ? t("chat:modes.wantsToSwitch") : t("chat:modes.didSwitch"))
						}
					/>
				)
			case "newTask":
				const newTaskMessages = clineMessages.filter((msg) => {
					if (msg.type === "ask" && msg.ask === "tool") {
						const t = safeJsonParse<ClineSayTool>(msg.text)
						return t?.tool === "newTask"
					}
					return false
				})
				const thisNewTaskIndex = newTaskMessages.findIndex((msg) => msg.ts === message.ts)
				const childIds = currentTaskItem?.childIds || []
				const childTaskId =
					thisNewTaskIndex >= 0 && thisNewTaskIndex < childIds.length ? childIds[thisNewTaskIndex] : undefined

				const currentMessageIndex = clineMessages.findIndex((msg) => msg.ts === message.ts)
				const nextMessage = currentMessageIndex >= 0 ? clineMessages[currentMessageIndex + 1] : undefined
				const isFollowedBySubtaskResult = nextMessage?.type === "say" && nextMessage?.say === "subtask_result"

				return (
					<TimelineItem
						status="info"
						action="Subtask"
						target={tool.mode}
						subtext={
							childTaskId && !isFollowedBySubtaskResult ? (
								<button
									className="cursor-pointer inline-flex items-center gap-1 text-vscode-descriptionForeground hover:text-vscode-foreground hover:underline font-normal text-[11px]"
									onClick={() => vscode.postMessage({ type: "showTaskWithId", text: childTaskId })}>
									{t("chat:subtasks.goToSubtask")}
									<ArrowRight className="size-3" />
								</button>
							) : null
						}>
						<div className="bg-vscode-editor-background/50 border border-vscode-panel-border/40 rounded-lg p-2 text-xs">
							<MarkdownBlock markdown={tool.content} />
						</div>
					</TimelineItem>
				)
			case "finishTask":
				return (
					<TimelineItem status="success" action="Finish" target={t("chat:subtasks.wantsToFinish")}>
						<div className="text-vscode-descriptionForeground/80 text-xs">
							<MarkdownBlock markdown={t("chat:subtasks.completionInstructions")} />
						</div>
					</TimelineItem>
				)
			case "runSlashCommand": {
				const slashCommandInfo = tool
				return (
					<TimelineItem
						status="command"
						action="Command"
						target={`/${slashCommandInfo.command}`}
						subtext={
							slashCommandInfo.description ||
							(slashCommandInfo.args ? `Args: ${slashCommandInfo.args}` : undefined)
						}
					/>
				)
			}
			case "generateImage":
				return (
					<TimelineItem status="info" action="Image" target={tool.path} subtext={tool.content}>
						{message.type === "ask" && (
							<div className="p-2 bg-vscode-editor-background/50 border border-vscode-panel-border/40 rounded-lg text-xs">
								<div className="break-words">{tool.content}</div>
								<div className="text-[10px] text-vscode-descriptionForeground mt-1 font-mono">
									{tool.path}
								</div>
							</div>
						)}
					</TimelineItem>
				)
			default:
				return null
		}
	}

	switch (message.type) {
		case "say":
			switch (message.say) {
				case "diff_error":
					return (
						<ErrorRow
							type="diff_error"
							message={message.text || ""}
							expandable={true}
							showCopyButton={true}
						/>
					)
				case "subtask_result":
					const completedChildTaskId = currentTaskItem?.completedByChildId
					return (
						<TimelineItem
							status="success"
							action="Subtask Result"
							target={
								completedChildTaskId ? (
									<button
										className="cursor-pointer inline-flex items-center gap-1 text-vscode-descriptionForeground hover:text-vscode-foreground hover:underline font-normal text-[11px]"
										onClick={() =>
											vscode.postMessage({ type: "showTaskWithId", text: completedChildTaskId })
										}>
										{t("chat:subtasks.goToSubtask")}
										<ArrowRight className="size-3" />
									</button>
								) : null
							}>
							<div className="bg-vscode-editor-background/50 border border-vscode-panel-border/40 rounded-lg p-2.5 text-xs">
								<MarkdownBlock markdown={message.text} />
							</div>
						</TimelineItem>
					)
				case "reasoning":
					return (
						<ReasoningBlock
							content={message.text || ""}
							ts={message.ts}
							isStreaming={isStreaming}
							isLast={isLast}
						/>
					)
				case "api_req_started":
					const isApiRequestInProgress =
						apiReqCancelReason === undefined && apiRequestFailedMessage === undefined && cost === undefined

					if (isApiRequestInProgress) {
						return (
							<TimelineItem
								status="running"
								customDot={
									<div className="flex items-center justify-center size-3.5">
										<LadizAnimatedLogo className="size-3.5" />
									</div>
								}
								action={<ApiRequestLoading />}
							/>
						)
					}

					return (
						<>
							<TimelineItem
								status="idle"
								action={
									<span className="text-vscode-descriptionForeground/70 text-[11px] font-medium">
										{t("chat:apiRequest.title")}
									</span>
								}
								actions={
									cost !== null && cost !== undefined && cost > 0 ? (
										<span className="text-[10px] font-mono text-cyan-300 bg-blue-500/10 border border-blue-400/20 px-2 py-0.5 rounded-full">
											${Number(cost || 0)?.toFixed(4)}
										</span>
									) : null
								}
							/>
							{(((cost === null || cost === undefined) && apiRequestFailedMessage) ||
								apiReqStreamingFailedMessage) && (
								<ErrorRow
									type="api_failure"
									message={apiRequestFailedMessage || apiReqStreamingFailedMessage || ""}
									docsURL={
										apiRequestFailedMessage?.toLowerCase().includes("powershell")
											? "https://github.com/cline/cline/wiki/TroubleShooting-%E2%80%90-%22PowerShell-is-not-recognized-as-an-internal-or-external-command%22"
											: undefined
									}
									errorDetails={apiReqStreamingFailedMessage}
								/>
							)}
						</>
					)
				case "api_req_retry_delayed":
					let body = t(`chat:apiRequest.failed`)
					let retryInfo, rawError, code, docsURL
					if (message.text !== undefined) {
						const potentialCode = parseInt(message.text.substring(0, 3))
						if (!isNaN(potentialCode) && potentialCode >= 400) {
							code = potentialCode
							const stringForError = `chat:apiRequest.errorMessage.${code}`
							if (i18n.exists(stringForError)) {
								body = t(stringForError)
							} else {
								body = t("chat:apiRequest.errorMessage.unknown")
								docsURL = "https://github.com/izzhap/ladiz/issues"
							}
						}

						const retryTimerMatch = message.text.match(/<retry_timer>(.*?)<\/retry_timer>/)
						const retryTimer = retryTimerMatch && retryTimerMatch[1] ? parseInt(retryTimerMatch[1], 10) : 0
						rawError = message.text.replace(/<retry_timer>(.*?)<\/retry_timer>/, "").trim()
						retryInfo = retryTimer > 0 && (
							<p
								className={cn(
									"mt-2 font-light text-xs text-vscode-descriptionForeground cursor-default flex items-center gap-1 transition-all duration-1000",
									retryTimer === 0 ? "opacity-0 max-h-0" : "max-h-2 opacity-100",
								)}>
								<Repeat2 className="size-3" strokeWidth={1.5} />
								<span>{retryTimer}s</span>
							</p>
						)
					}
					return (
						<ErrorRow
							type="api_req_retry_delayed"
							code={code}
							message={body}
							docsURL={docsURL}
							additionalContent={retryInfo}
							errorDetails={rawError}
						/>
					)
				case "api_req_rate_limit_wait": {
					const isWaiting = message.partial === true

					const waitSeconds = (() => {
						if (!message.text) return undefined
						try {
							const data = JSON.parse(message.text)
							return typeof data.seconds === "number" ? data.seconds : undefined
						} catch {
							return undefined
						}
					})()

					return isWaiting && waitSeconds !== undefined ? (
						<TimelineItem
							status="running"
							action={<span>{t("chat:apiRequest.rateLimitWait")}</span>}
							target={<span className="text-xs font-mono text-cyan-400">{waitSeconds}s</span>}
						/>
					) : null
				}
				case "api_req_finished":
					return null
				case "text":
					return (
						<div className="group relative my-2.5">
							<div className="flex items-center justify-between gap-2 pb-1.5 mb-1.5 border-b border-vscode-panel-border/30 select-none">
								<div className="flex items-center gap-2">
									<span className="size-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(56,189,248,0.6)]" />
									<span className="text-xs font-semibold tracking-tight text-vscode-foreground">
										Ladiz AI
									</span>
								</div>
								<OpenMarkdownPreviewButton markdown={message.text} />
							</div>
							<div className="text-xs leading-relaxed text-vscode-foreground/95 select-text pl-1">
								<Markdown markdown={message.text} partial={message.partial} />
								{message.images && message.images.length > 0 && (
									<div style={{ marginTop: "10px" }}>
										{message.images.map((image, index) => (
											<ImageBlock key={index} imageData={image} />
										))}
									</div>
								)}
							</div>
						</div>
					)
				case "user_feedback":
					return (
						<div className="group relative my-2">
							<div
								className={cn(
									"relative rounded-xl border border-vscode-panel-border/50 bg-vscode-sideBar-background/70 backdrop-blur-sm overflow-hidden transition-all duration-200 shadow-sm hover:border-blue-500/30",
									isEditing ? "p-3 bg-vscode-editor-background" : "p-3 cursor-text",
								)}>
								{isEditing ? (
									<div className="flex flex-col gap-2">
										<ChatTextArea
											inputValue={editedContent}
											setInputValue={setEditedContent}
											sendingDisabled={false}
											selectApiConfigDisabled={true}
											placeholderText={t("chat:editMessage.placeholder")}
											selectedImages={editImages}
											setSelectedImages={setEditImages}
											onSend={handleSaveEdit}
											onSelectImages={handleSelectImages}
											shouldDisableImages={!model?.supportsImages}
											mode={editMode}
											setMode={setEditMode}
											modeShortcutText=""
											isEditMode={true}
											onCancel={handleCancelEdit}
										/>
									</div>
								) : (
									<div className="flex items-start justify-between gap-3">
										<div
											className="flex-grow text-xs leading-relaxed text-vscode-foreground wrap-anywhere font-medium select-text"
											onClick={(e) => {
												e.stopPropagation()
												if (!isStreaming) {
													handleEditClick()
												}
											}}
											title={t("chat:queuedMessages.clickToEdit")}>
											<Mention text={message.text} />
										</div>
										<div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
											<button
												className="p-1 rounded text-vscode-descriptionForeground/60 hover:text-vscode-foreground hover:bg-vscode-toolbar-hoverBackground transition-colors cursor-pointer"
												style={{ visibility: isStreaming ? "hidden" : "visible" }}
												onClick={(e) => {
													e.stopPropagation()
													handleEditClick()
												}}
												aria-label={t("chat:queuedMessages.clickToEdit")}>
												<Edit className="size-3.5" />
											</button>
											<button
												className="p-1 rounded text-vscode-descriptionForeground/60 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
												style={{ visibility: isStreaming ? "hidden" : "visible" }}
												onClick={(e) => {
													e.stopPropagation()
													vscode.postMessage({ type: "deleteMessage", value: message.ts })
												}}
												aria-label="Delete message">
												<Trash2 className="size-3.5" />
											</button>
										</div>
									</div>
								)}
								{!isEditing && message.images && message.images.length > 0 && (
									<Thumbnails images={message.images} style={{ marginTop: "8px" }} />
								)}
							</div>
						</div>
					)
				case "user_feedback_diff":
					const toolDiff = safeJsonParse<ClineSayTool>(message.text)
					return (
						<div style={{ marginTop: -10, width: "100%" }}>
							<CodeAccordion
								code={toolDiff?.diff}
								language="diff"
								isFeedback={true}
								isExpanded={isExpanded}
								onToggleExpand={handleToggleExpand}
							/>
						</div>
					)
				case "error":
					const isNoToolsUsedError = message.text === "MODEL_NO_TOOLS_USED"
					const isNoAssistantMessagesError = message.text === "MODEL_NO_ASSISTANT_MESSAGES"

					if (isNoToolsUsedError) {
						return (
							<ErrorRow
								type="error"
								title={t("chat:modelResponseIncomplete")}
								message={t("chat:modelResponseErrors.noToolsUsed")}
								errorDetails={t("chat:modelResponseErrors.noToolsUsedDetails")}
							/>
						)
					}

					if (isNoAssistantMessagesError) {
						return (
							<ErrorRow
								type="error"
								title={t("chat:modelResponseIncomplete")}
								message={t("chat:modelResponseErrors.noAssistantMessages")}
								errorDetails={t("chat:modelResponseErrors.noAssistantMessagesDetails")}
							/>
						)
					}

					return (
						<ErrorRow type="error" message={message.text || t("chat:error")} errorDetails={message.text} />
					)
				case "completion_result":
					return (
						<div className="group relative my-2 overflow-hidden rounded-xl border border-emerald-500/25 bg-gradient-to-b from-emerald-950/20 via-slate-900/40 to-slate-950/30 p-3.5 shadow-sm">
							<div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-emerald-500/15">
								<div className="flex items-center gap-2">
									<span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] shrink-0" />
									<span className="text-xs font-semibold tracking-wider text-emerald-300 uppercase font-mono">
										{t("chat:taskCompleted")}
									</span>
								</div>
								<OpenMarkdownPreviewButton markdown={message.text} />
							</div>
							<div className="text-xs leading-relaxed text-slate-200">
								<Markdown markdown={message.text} />
							</div>
						</div>
					)
				case "shell_integration_warning":
					return <CommandExecutionError />
				case "checkpoint_saved":
					return (
						<CheckpointSaved
							ts={message.ts!}
							commitHash={message.text!}
							currentHash={currentCheckpoint}
							checkpoint={message.checkpoint}
							onJumpToPreviousCheckpoint={onJumpToPreviousCheckpoint}
						/>
					)
				case "condense_context":
					if (message.partial) {
						return <InProgressRow eventType="condense_context" />
					}
					if (message.contextCondense) {
						return <CondensationResultRow data={message.contextCondense} />
					}
					return null
				case "condense_context_error":
					return <CondensationErrorRow errorText={message.text} />
				case "sliding_window_truncation":
					if (message.partial) {
						return <InProgressRow eventType="sliding_window_truncation" />
					}
					if (message.contextTruncation) {
						return <TruncationResultRow data={message.contextTruncation} />
					}
					return null
				case "codebase_search_result":
					let parsed: {
						content: {
							query: string
							results: Array<{
								filePath: string
								score: number
								startLine: number
								endLine: number
								codeChunk: string
							}>
						}
					} | null = null

					try {
						if (message.text) {
							parsed = JSON.parse(message.text)
						}
					} catch (error) {
						console.error("Failed to parse codebaseSearch content:", error)
					}

					if (parsed && !parsed?.content) {
						console.error("Invalid codebaseSearch content structure:", parsed.content)
						return <div>Error displaying search results.</div>
					}

					const { results = [] } = parsed?.content || {}

					return <CodebaseSearchResultsDisplay results={results} />
				case "user_edit_todos":
					return <UpdateTodoListToolBlock userEdited onChange={() => {}} />
				case "tool" as any:
					const sayTool = safeJsonParse<ClineSayTool>(message.text)
					if (!sayTool) return null

					switch (sayTool.tool) {
						case "runSlashCommand": {
							const slashCommandInfo = sayTool
							return (
								<TimelineItem
									status="command"
									action="Command"
									target={`/${slashCommandInfo.command}`}
									subtext={
										slashCommandInfo.description ||
										(slashCommandInfo.args ? `Args: ${slashCommandInfo.args}` : undefined)
									}
								/>
							)
						}
						case "readCommandOutput": {
							const formatBytes = (bytes: number) => {
								if (bytes < 1024) return `${bytes} B`
								if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
								return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
							}

							const isSearch = sayTool.searchPattern !== undefined

							let infoText = ""
							if (isSearch) {
								const matchText =
									sayTool.matchCount !== undefined
										? sayTool.matchCount === 1
											? "1 match"
											: `${sayTool.matchCount} matches`
										: ""
								infoText = `search: "${sayTool.searchPattern}"${matchText ? ` • ${matchText}` : ""}`
							} else if (
								sayTool.readStart !== undefined &&
								sayTool.readEnd !== undefined &&
								sayTool.totalBytes !== undefined
							) {
								infoText = `${formatBytes(sayTool.readStart)} - ${formatBytes(sayTool.readEnd)} of ${formatBytes(sayTool.totalBytes)}`
							} else if (sayTool.totalBytes !== undefined) {
								infoText = formatBytes(sayTool.totalBytes)
							}

							return <TimelineItem status="command" action="Terminal Output" target={infoText} />
						}
						default:
							return null
					}
				case "image":
					const imageInfo = safeJsonParse<{ imageUri: string; imagePath: string }>(message.text || "{}")
					if (!imageInfo) {
						return null
					}
					return (
						<div style={{ marginTop: "10px" }}>
							<ImageBlock imageUri={imageInfo.imageUri} imagePath={imageInfo.imagePath} />
						</div>
					)
				case "too_many_tools_warning": {
					const warningData = safeJsonParse<{
						toolCount: number
						serverCount: number
						threshold: number
					}>(message.text || "{}")
					if (!warningData) return null
					const toolsPart = t("chat:tooManyTools.toolsPart", { count: warningData.toolCount })
					const serversPart = t("chat:tooManyTools.serversPart", { count: warningData.serverCount })
					return (
						<WarningRow
							title={t("chat:tooManyTools.title")}
							message={t("chat:tooManyTools.messageTemplate", {
								tools: toolsPart,
								servers: serversPart,
								threshold: warningData.threshold,
							})}
							actionText={t("chat:tooManyTools.openMcpSettings")}
							onAction={() =>
								window.postMessage(
									{ type: "action", action: "settingsButtonClicked", values: { section: "mcp" } },
									"*",
								)
							}
						/>
					)
				}
				default:
					return (
						<>
							{title && (
								<div style={headerStyle}>
									{icon}
									{title}
								</div>
							)}
							<div style={{ paddingTop: 10 }}>
								<Markdown markdown={message.text} partial={message.partial} />
							</div>
						</>
					)
			}
		case "ask":
			switch (message.ask) {
				case "mistake_limit_reached":
					return <ErrorRow type="mistake_limit" message={message.text || ""} errorDetails={message.text} />
				case "command":
					return (
						<CommandExecution
							executionId={message.ts.toString()}
							text={message.text}
							icon={icon as JSX.Element | null}
							title={title as JSX.Element | null}
						/>
					)
				case "use_mcp_server":
					const messageJson = safeJsonParse<any>(message.text, {})
					const { response, ...mcpServerRequest } = messageJson

					const useMcpServer: ClineAskUseMcpServer = {
						...mcpServerRequest,
						response,
					}

					if (!useMcpServer) {
						return null
					}

					const server = mcpServers.find((server) => server.name === useMcpServer.serverName)

					return (
						<TimelineItem
							status="info"
							action="MCP Server"
							target={useMcpServer.serverName}
							subtext={
								useMcpServer.type === "use_mcp_tool"
									? `Tool: ${useMcpServer.toolName}`
									: `Resource: ${useMcpServer.uri}`
							}>
							<div className="w-full bg-vscode-editor-background/60 border border-vscode-panel-border/40 rounded-lg p-2 mt-1">
								{useMcpServer.type === "access_mcp_resource" && (
									<McpResourceRow
										item={{
											...(findMatchingResourceOrTemplate(
												useMcpServer.uri || "",
												server?.resources,
												server?.resourceTemplates,
											) || {
												name: "",
												mimeType: "",
												description: "",
											}),
											uri: useMcpServer.uri || "",
										}}
									/>
								)}
								{useMcpServer.type === "use_mcp_tool" && (
									<McpExecution
										executionId={message.ts.toString()}
										text={useMcpServer.arguments !== "{}" ? useMcpServer.arguments : undefined}
										serverName={useMcpServer.serverName}
										toolName={useMcpServer.toolName}
										isArguments={true}
										server={server}
										useMcpServer={useMcpServer}
										alwaysAllowMcp={alwaysAllowMcp}
									/>
								)}
							</div>
						</TimelineItem>
					)
				case "completion_result":
					if (message.text) {
						return (
							<div className="group relative my-2 overflow-hidden rounded-xl border border-emerald-500/25 bg-gradient-to-b from-emerald-950/20 via-slate-900/40 to-slate-950/30 p-3.5 shadow-sm">
								<div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-emerald-500/15">
									<div className="flex items-center gap-2">
										<span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] shrink-0" />
										<span className="text-xs font-semibold tracking-wider text-emerald-300 uppercase font-mono">
											{t("chat:taskCompleted")}
										</span>
									</div>
									<OpenMarkdownPreviewButton markdown={message.text} />
								</div>
								<div className="text-xs leading-relaxed text-slate-200">
									<Markdown markdown={message.text} partial={message.partial} />
								</div>
							</div>
						)
					} else {
						return null
					}
				case "followup":
					return (
						<TimelineItem
							status="info"
							customDot={
								<div className="flex items-center justify-center size-3.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30">
									<MessageCircleQuestionMark className="size-2.5" />
								</div>
							}
							action={<span>{t("chat:questions.hasQuestion")}</span>}>
							<div className="flex flex-col gap-2 mt-1">
								<div className="text-xs leading-relaxed text-vscode-foreground select-text">
									<Markdown
										markdown={message.partial === true ? message?.text : followUpData?.question}
									/>
								</div>
								<FollowUpSuggest
									suggestions={followUpData?.suggest}
									onSuggestionClick={onSuggestionClick}
									ts={message?.ts}
									onCancelAutoApproval={onFollowUpUnmount}
									isAnswered={isFollowUpAnswered}
									isFollowUpAutoApprovalPaused={isFollowUpAutoApprovalPaused}
								/>
							</div>
						</TimelineItem>
					)
				case "auto_approval_max_req_reached": {
					return <AutoApprovedRequestLimitWarning message={message} />
				}
				default:
					return null
			}
	}
}
