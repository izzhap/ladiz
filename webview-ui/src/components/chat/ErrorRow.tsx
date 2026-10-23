import React, { useState, useCallback, memo, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { BookOpenText, Copy, Check, Microscope, Info, ChevronDown } from "lucide-react"

import { useCopyToClipboard } from "@src/utils/clipboard"
import { vscode } from "@src/utils/vscode"
import CodeBlock from "../common/CodeBlock"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@src/components/ui/dialog"
import { Button } from "../ui"
import { useExtensionState } from "@src/context/ExtensionStateContext"
import { useSelectedModel } from "@src/components/ui/hooks/useSelectedModel"
import { PROVIDERS } from "../settings/constants"
import { TimelineItem } from "./TimelineItem"
import { cn } from "@/lib/utils"

export interface ErrorRowProps {
	type:
		| "error"
		| "mistake_limit"
		| "api_failure"
		| "diff_error"
		| "streaming_failed"
		| "cancelled"
		| "api_req_retry_delayed"
	title?: string
	message: string
	showCopyButton?: boolean
	expandable?: boolean
	defaultExpanded?: boolean
	additionalContent?: React.ReactNode
	headerClassName?: string
	messageClassName?: string
	code?: number
	docsURL?: string
	errorDetails?: string
}

export const ErrorRow = memo(
	({
		type,
		title,
		message,
		showCopyButton = false,
		expandable = false,
		defaultExpanded = false,
		additionalContent,
		headerClassName: _headerClassName,
		messageClassName,
		docsURL,
		code,
		errorDetails,
	}: ErrorRowProps) => {
		const { t } = useTranslation()
		const [isExpanded, setIsExpanded] = useState(defaultExpanded)
		const [showCopySuccess, setShowCopySuccess] = useState(false)
		const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
		const [showDetailsCopySuccess, setShowDetailsCopySuccess] = useState(false)
		const { copyWithFeedback } = useCopyToClipboard()
		const { version, apiConfiguration } = useExtensionState()
		const { provider, id: modelId } = useSelectedModel(apiConfiguration)
		const usesProxy = PROVIDERS.find((p) => p.value === provider)?.proxy ?? false

		// Format error details with metadata prepended
		const formattedErrorDetails = useMemo(() => {
			if (!errorDetails) return undefined

			const metadata = [
				`Date/time: ${new Date().toISOString()}`,
				`Extension version: ${version}`,
				`Provider: ${provider}${usesProxy ? " (proxy)" : ""}`,
				`Model: ${modelId}`,
				"",
				"",
			].join("\n")

			return metadata + errorDetails
		}, [errorDetails, version, provider, modelId, usesProxy])

		const handleDownloadDiagnostics = useCallback(
			(e: React.MouseEvent) => {
				e.stopPropagation()
				vscode.postMessage({
					type: "downloadErrorDiagnostics",
					values: {
						timestamp: new Date().toISOString(),
						version,
						provider,
						model: modelId,
						details: errorDetails || "",
					},
				})
			},
			[version, provider, modelId, errorDetails],
		)

		// Default titles for different error types
		const getDefaultTitle = () => {
			if (title) return title

			switch (type) {
				case "error":
					return t("chat:error")
				case "mistake_limit":
					return t("chat:troubleMessage")
				case "api_failure":
					return t("chat:apiRequest.failed")
				case "api_req_retry_delayed":
					return t("chat:apiRequest.errorTitle", { code: code ? ` · ${code}` : "" })
				case "streaming_failed":
					return t("chat:apiRequest.streamingFailed")
				case "cancelled":
					return t("chat:apiRequest.cancelled")
				case "diff_error":
					return t("chat:diffError.title")
				default:
					return null
			}
		}

		const handleToggleExpand = useCallback(() => {
			if (expandable) {
				setIsExpanded(!isExpanded)
			}
		}, [expandable, isExpanded])

		const handleCopy = useCallback(
			async (e: React.MouseEvent) => {
				e.stopPropagation()
				const success = await copyWithFeedback(message)
				if (success) {
					setShowCopySuccess(true)
					setTimeout(() => {
						setShowCopySuccess(false)
					}, 1000)
				}
			},
			[message, copyWithFeedback],
		)

		const handleCopyDetails = useCallback(
			async (e: React.MouseEvent) => {
				e.stopPropagation()
				if (formattedErrorDetails) {
					const success = await copyWithFeedback(formattedErrorDetails)
					if (success) {
						setShowDetailsCopySuccess(true)
						setTimeout(() => {
							setShowDetailsCopySuccess(false)
						}, 1000)
					}
				}
			},
			[formattedErrorDetails, copyWithFeedback],
		)

		const errorTitle = getDefaultTitle()

		// For diff_error type with expandable content
		if (type === "diff_error" && expandable) {
			return (
				<TimelineItem
					status="error"
					className="py-1"
					action={
						<span className="text-rose-400 font-semibold text-xs cursor-pointer hover:underline">
							{errorTitle}
						</span>
					}
					actions={
						<div className="flex items-center gap-1">
							{showCopyButton && (
								<button
									type="button"
									className="p-1 rounded text-vscode-descriptionForeground/60 hover:text-vscode-foreground hover:bg-white/10 transition-colors cursor-pointer"
									onClick={handleCopy}
									title="Copy error">
									{showCopySuccess ? (
										<Check className="size-3 text-emerald-400" />
									) : (
										<Copy className="size-3" />
									)}
								</button>
							)}
							<button
								type="button"
								className="text-vscode-descriptionForeground/60 hover:text-vscode-foreground p-0.5 rounded transition-colors cursor-pointer"
								aria-label="Toggle error details">
								<ChevronDown
									className={cn(
										"size-3.5 transition-transform duration-200",
										isExpanded && "rotate-180",
									)}
								/>
							</button>
						</div>
					}
					onClick={handleToggleExpand}>
					{isExpanded && (
						<div className="p-2 mt-1 bg-vscode-editor-background/60 border border-vscode-panel-border/40 rounded-lg text-xs">
							<CodeBlock source={message} language="text" />
						</div>
					)}
				</TimelineItem>
			)
		}

		// Standard error display
		return (
			<>
				<TimelineItem
					status="error"
					className="py-1"
					action={<span className="text-rose-400 font-semibold text-xs">{errorTitle}</span>}
					actions={
						docsURL ? (
							<a
								href={docsURL}
								className="text-xs text-blue-400 hover:underline flex items-center gap-1"
								onClick={(e) => {
									e.preventDefault()
									if (docsURL.startsWith("roocode://settings")) {
										vscode.postMessage({
											type: "switchTab",
											tab: "settings",
											values: { section: "providers" },
										})
									} else {
										vscode.postMessage({ type: "openExternal", url: docsURL })
									}
								}}>
								<BookOpenText className="size-3" />
								<span>
									{docsURL.startsWith("roocode://settings")
										? t("chat:apiRequest.errorMessage.goToSettings", { defaultValue: "Settings" })
										: t("chat:apiRequest.errorMessage.docs")}
								</span>
							</a>
						) : null
					}>
					<div className="text-xs text-vscode-descriptionForeground leading-relaxed select-text mt-0.5">
						<p className={messageClassName || "cursor-default my-0 whitespace-pre-wrap break-words"}>
							{message}
							{formattedErrorDetails && (
								<button
									type="button"
									onClick={() => setIsDetailsDialogOpen(true)}
									className="cursor-pointer ml-1.5 text-blue-400 hover:underline font-medium inline-flex items-center gap-0.5"
									aria-label={t("chat:errorDetails.title")}>
									{t("chat:errorDetails.link")}
								</button>
							)}
						</p>
						{additionalContent}
					</div>
				</TimelineItem>

				{/* Error Details Dialog */}
				{formattedErrorDetails && (
					<Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
						<DialogContent className="max-w-2xl">
							<DialogHeader>
								<DialogTitle>{t("chat:errorDetails.title")}</DialogTitle>
							</DialogHeader>
							<div className="max-h-96 overflow-auto bg-vscode-editor-background rounded-xl border border-vscode-editorGroup-border">
								<pre className="font-mono text-sm whitespace-pre-wrap break-words bg-transparent px-3">
									{formattedErrorDetails}
								</pre>
								{usesProxy && (
									<div className="cursor-default flex gap-2 border-t-1 px-3 py-2 border-vscode-editorGroup-border bg-foreground/5 text-vscode-button-secondaryForeground">
										<Info className="size-3 shrink-0 mt-1 text-vscode-descriptionForeground" />
										<span className="text-vscode-descriptionForeground text-sm">
											{t("chat:errorDetails.proxyProvider")}
										</span>
									</div>
								)}
							</div>
							<DialogFooter>
								<Button variant="secondary" className="w-full" onClick={handleCopyDetails}>
									{showDetailsCopySuccess ? (
										<>
											<Check className="size-3" />
											{t("chat:errorDetails.copied")}
										</>
									) : (
										<>
											<Copy className="size-3" />
											{t("chat:errorDetails.copyToClipboard")}
										</>
									)}
								</Button>
								<Button variant="secondary" className="w-full" onClick={handleDownloadDiagnostics}>
									<Microscope className="size-3" />
									{t("chat:errorDetails.diagnostics")}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				)}
			</>
		)
	},
)

export default ErrorRow
