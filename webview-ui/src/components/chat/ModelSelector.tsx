import React, { useState, useMemo, useCallback } from "react"
import { Sparkles, Check, ChevronDown } from "lucide-react"

import { ladizModels, ladizDefaultModelId, type ProviderSettings } from "@roo-code/types"
import { cn } from "@/lib/utils"
import { useExtensionState } from "@/context/ExtensionStateContext"
import { useRooPortal } from "@/components/ui/hooks/useRooPortal"
import { Popover, PopoverContent, PopoverTrigger, StandardTooltip } from "@/components/ui"
import { vscode } from "@/utils/vscode"

interface ModelSelectorProps {
	disabled?: boolean
	triggerClassName?: string
}

export const ModelSelector = ({ disabled = false, triggerClassName = "" }: ModelSelectorProps) => {
	const [open, setOpen] = useState(false)
	const portalContainer = useRooPortal("roo-portal")
	const { apiConfiguration, setApiConfiguration, currentApiConfigName } = useExtensionState()

	const currentModelId = apiConfiguration?.apiModelId || apiConfiguration?.ladizModelId || ladizDefaultModelId

	const availableModels = useMemo(() => {
		return Object.keys(ladizModels)
	}, [])

	const handleSelectModel = useCallback(
		(modelId: string) => {
			const updated: ProviderSettings = {
				...apiConfiguration,
				apiModelId: modelId,
				ladizModelId: modelId,
			}
			setApiConfiguration(updated)
			vscode.postMessage({
				type: "upsertApiConfiguration",
				text: currentApiConfigName || "default",
				apiConfiguration: updated,
			})
			setOpen(false)
		},
		[apiConfiguration, currentApiConfigName, setApiConfiguration],
	)

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<StandardTooltip content="Select Model">
				<PopoverTrigger
					disabled={disabled}
					className={cn(
						"inline-flex items-center relative whitespace-nowrap px-2.5 py-1 text-xs font-mono font-medium rounded-full",
						"bg-blue-950/60 border border-blue-500/30 text-blue-300",
						"transition-all duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500",
						disabled
							? "opacity-50 cursor-not-allowed"
							: "hover:bg-blue-900/50 hover:border-blue-400/50 cursor-pointer",
						triggerClassName,
					)}>
					<span className="truncate">{currentModelId}</span>
				</PopoverTrigger>
			</StandardTooltip>
			<PopoverContent
				align="start"
				sideOffset={4}
				container={portalContainer}
				className="p-1.5 overflow-hidden w-[260px] bg-[#0c101d] border border-blue-500/20 shadow-xl rounded-xl">
				<div className="flex flex-col gap-1 w-full text-xs">
					<div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-white/5">
						Model Ladiz AI
					</div>
					{availableModels.map((modelId) => {
						const isSelected = modelId === currentModelId
						const modelInfo = ladizModels[modelId as keyof typeof ladizModels]
						return (
							<button
								key={modelId}
								onClick={() => handleSelectModel(modelId)}
								className={cn(
									"flex flex-col items-start px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer border-none bg-transparent",
									isSelected
										? "bg-blue-500/20 text-blue-200 border border-blue-400/30"
										: "hover:bg-white/5 text-slate-300",
								)}>
								<div className="flex items-center justify-between w-full">
									<span className="font-semibold font-mono text-xs">{modelId}</span>
									{isSelected && <Check className="size-3.5 text-blue-400" />}
								</div>
								{modelInfo?.description && (
									<span className="text-[11px] text-slate-400 mt-0.5 leading-snug">
										{modelInfo.description}
									</span>
								)}
							</button>
						)
					})}
				</div>
			</PopoverContent>
		</Popover>
	)
}
