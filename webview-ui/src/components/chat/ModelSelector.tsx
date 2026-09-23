import { useState, useMemo, useCallback, useRef, useEffect } from "react"
import { Check, Search, X, Loader2, ChevronDown, RotateCw } from "lucide-react"

import {
	ladizModels,
	ladizDefaultModelId,
	openAiModelInfoSaneDefaults,
	type ProviderName,
	type ProviderSettings,
	type ModelInfo,
	isDynamicProvider,
} from "@roo-code/types"
import { cn } from "@src/lib/utils"
import { useExtensionState } from "@src/context/ExtensionStateContext"
import { useRooPortal } from "@src/components/ui/hooks/useRooPortal"
import { useSelectedModel } from "@src/components/ui/hooks/useSelectedModel"
import { useRouterModels } from "@src/components/ui/hooks/useRouterModels"
import { useOllamaModels } from "@src/components/ui/hooks/useOllamaModels"
import { useLmStudioModels } from "@src/components/ui/hooks/useLmStudioModels"
import { useOpenAiModels } from "@src/components/ui/hooks/useOpenAiModels"
import { useVsCodeLmModels } from "@src/components/ui/hooks/useVsCodeLmModels"
import { MODELS_BY_PROVIDER, PROVIDERS } from "@src/components/settings/constants"
import { PROVIDER_SERVICE_CONFIG } from "@src/components/settings/utils/providerModelConfig"
import { Popover, PopoverContent, PopoverTrigger, StandardTooltip } from "@src/components/ui"
import { vscode } from "@src/utils/vscode"

interface ModelSelectorProps {
	disabled?: boolean
	triggerClassName?: string
}

const COMMON_OPENAI_COMPATIBLE_MODELS: Record<string, ModelInfo> = {
	"gpt-4o": {
		...openAiModelInfoSaneDefaults,
		description: "GPT-4o: Model flagship cepat dan multimodal",
	},
	"gpt-4o-mini": {
		...openAiModelInfoSaneDefaults,
		description: "GPT-4o mini: Model cepat dan hemat biaya",
	},
	"gpt-4-turbo": {
		...openAiModelInfoSaneDefaults,
		description: "GPT-4 Turbo: Model reasoning tinggi",
	},
	o1: {
		...openAiModelInfoSaneDefaults,
		description: "OpenAI o1: Model penalaran mendalam untuk masalah rumit",
	},
	"o3-mini": {
		...openAiModelInfoSaneDefaults,
		description: "OpenAI o3-mini: Model coding & reasoning cepat",
	},
	"deepseek-chat": {
		...openAiModelInfoSaneDefaults,
		description: "DeepSeek V3: Model serbaguna berkinerja tinggi",
	},
	"deepseek-reasoner": {
		...openAiModelInfoSaneDefaults,
		description: "DeepSeek R1: Model reasoning tingkat lanjut",
	},
	"qwen-2.5-coder-32b": {
		...openAiModelInfoSaneDefaults,
		description: "Qwen 2.5 Coder: Model spesialis pemrograman",
	},
	"claude-3-5-sonnet": {
		...openAiModelInfoSaneDefaults,
		description: "Claude 3.5 Sonnet: Model coding teratas",
	},
}

function getModelIdKeyForProvider(provider: ProviderName): keyof ProviderSettings {
	switch (provider) {
		case "openrouter":
			return "openRouterModelId"
		case "requesty":
			return "requestyModelId"
		case "unbound":
			return "unboundModelId"
		case "litellm":
			return "litellmModelId"
		case "vercel-ai-gateway":
			return "vercelAiGatewayModelId"
		case "ollama":
			return "ollamaModelId"
		case "lmstudio":
			return "lmStudioModelId"
		case "openai":
			return "openAiModelId"
		case "ladiz":
			return "ladizModelId"
		default:
			return "apiModelId"
	}
}

function formatContextWindow(tokens?: number): string | null {
	if (!tokens || tokens <= 0) return null
	if (tokens >= 1_000_000) {
		return `${(tokens / 1_000_000).toFixed(tokens % 1_000_000 === 0 ? 0 : 1)}M`
	}
	if (tokens >= 1_000) {
		return `${Math.round(tokens / 1_000)}k`
	}
	return `${tokens}`
}

function formatPricing(info?: ModelInfo): string | null {
	if (!info || (info.inputPrice === undefined && info.outputPrice === undefined)) return null
	if (info.inputPrice === 0 && info.outputPrice === 0) return "Free"
	const inPrice = info.inputPrice !== undefined ? `$${info.inputPrice}` : "?"
	const outPrice = info.outputPrice !== undefined ? `$${info.outputPrice}` : "?"
	return `${inPrice} / ${outPrice}`
}

export const ModelSelector = ({ disabled = false, triggerClassName = "" }: ModelSelectorProps) => {
	const [open, setOpen] = useState(false)
	const [search, setSearch] = useState("")
	const searchInputRef = useRef<HTMLInputElement>(null)
	const portalContainer = useRooPortal("roo-portal")
	const { apiConfiguration, setApiConfiguration, currentApiConfigName } = useExtensionState()

	const provider = (apiConfiguration?.apiProvider || "openrouter") as ProviderName
	const isDynamic = isDynamicProvider(provider)

	// Fetch dynamic models per provider
	const routerModels = useRouterModels({
		provider: isDynamic ? provider : undefined,
		enabled: isDynamic,
	})

	const ollamaModels = useOllamaModels(
		provider === "ollama"
			? apiConfiguration?.ollamaBaseUrl || apiConfiguration?.ollamaModelId || "fetch"
			: undefined,
	)

	const lmStudioModels = useLmStudioModels(
		provider === "lmstudio"
			? apiConfiguration?.lmStudioBaseUrl || apiConfiguration?.lmStudioModelId || "fetch"
			: undefined,
	)

	const openAiModels = useOpenAiModels(
		apiConfiguration?.openAiBaseUrl,
		apiConfiguration?.openAiApiKey,
		apiConfiguration?.openAiHeaders,
		provider === "openai",
	)

	const vsCodeLmModels = useVsCodeLmModels(provider === "vscode-lm")

	const { id: currentModelId } = useSelectedModel(apiConfiguration)

	const providerLabel = useMemo(() => {
		const found = PROVIDERS.find((p) => p.value === provider)
		return found?.label || PROVIDER_SERVICE_CONFIG[provider]?.serviceName || String(provider).toUpperCase()
	}, [provider])

	// Refresh models handler
	const handleRefresh = useCallback(() => {
		if (isDynamic) {
			vscode.postMessage({ type: "requestRouterModels", values: { provider } })
		} else if (provider === "openai") {
			vscode.postMessage({
				type: "requestOpenAiModels",
				values: {
					baseUrl: apiConfiguration?.openAiBaseUrl,
					apiKey: apiConfiguration?.openAiApiKey,
					openAiHeaders: apiConfiguration?.openAiHeaders,
				},
			})
			openAiModels.refetch()
		} else if (provider === "ollama") {
			vscode.postMessage({ type: "requestOllamaModels" })
			ollamaModels.refetch()
		} else if (provider === "lmstudio") {
			vscode.postMessage({ type: "requestLmStudioModels" })
			lmStudioModels.refetch()
		} else if (provider === "vscode-lm") {
			vscode.postMessage({ type: "requestVsCodeLmModels" })
			vsCodeLmModels.refetch()
		}
	}, [isDynamic, provider, apiConfiguration, openAiModels, ollamaModels, lmStudioModels, vsCodeLmModels])

	// Aggregate available models for current provider
	const rawModels: Record<string, ModelInfo> = useMemo(() => {
		if (isDynamic) {
			const dynamicMap = routerModels.data as Record<string, Record<string, ModelInfo>> | undefined
			return dynamicMap?.[provider] || {}
		}
		if (provider === "openai") {
			const fetched = (openAiModels.data as Record<string, ModelInfo>) || {}
			if (Object.keys(fetched).length > 0) {
				return fetched
			}
			return COMMON_OPENAI_COMPATIBLE_MODELS
		}
		if (provider === "ollama") {
			return (ollamaModels.data as Record<string, ModelInfo>) || {}
		}
		if (provider === "lmstudio") {
			return (lmStudioModels.data as Record<string, ModelInfo>) || {}
		}
		if (provider === "vscode-lm") {
			return (vsCodeLmModels.data as Record<string, ModelInfo>) || {}
		}
		if (provider === "ladiz") {
			return ladizModels
		}
		return (MODELS_BY_PROVIDER[provider] as Record<string, ModelInfo>) || {}
	}, [
		isDynamic,
		provider,
		routerModels.data,
		openAiModels.data,
		ollamaModels.data,
		lmStudioModels.data,
		vsCodeLmModels.data,
	])

	const isFetching =
		(isDynamic && routerModels.isLoading) ||
		(provider === "openai" && openAiModels.isLoading) ||
		(provider === "ollama" && ollamaModels.isLoading) ||
		(provider === "lmstudio" && lmStudioModels.isLoading) ||
		(provider === "vscode-lm" && vsCodeLmModels.isLoading)

	// Combine into list, ensuring currently selected model is always present
	const modelList = useMemo(() => {
		const entries = Object.entries(rawModels).map(([id, info]) => ({
			id,
			info,
		}))

		// If currentModelId is not in the list, insert it at top
		if (currentModelId && !entries.some((m) => m.id === currentModelId)) {
			entries.unshift({
				id: currentModelId,
				info: {
					contextWindow: 128_000,
					supportsImages: true,
					supportsPromptCache: false,
					description: "Model aktif saat ini",
				},
			})
		}

		return entries
	}, [rawModels, currentModelId])

	// Search filter
	const filteredModels = useMemo(() => {
		const q = search.trim().toLowerCase()
		if (!q) return modelList

		return modelList.filter(({ id, info }) => {
			const matchId = id.toLowerCase().includes(q)
			const matchDesc = info?.description ? info.description.toLowerCase().includes(q) : false
			return matchId || matchDesc
		})
	}, [modelList, search])

	const handleSelectModel = useCallback(
		(modelId: string) => {
			if (!modelId.trim()) return

			const key = getModelIdKeyForProvider(provider)
			const updated: ProviderSettings = {
				...apiConfiguration,
				[key]: modelId,
			}

			// Keep apiModelId in sync for standard providers
			if (provider === "ladiz") {
				updated.apiModelId = modelId
				updated.ladizModelId = modelId
			} else if (key !== "apiModelId" && !isDynamic) {
				updated.apiModelId = modelId
			}

			setApiConfiguration(updated)
			vscode.postMessage({
				type: "upsertApiConfiguration",
				text: currentApiConfigName || "default",
				apiConfiguration: updated,
			})
			setOpen(false)
			setSearch("")
		},
		[apiConfiguration, currentApiConfigName, provider, setApiConfiguration, isDynamic],
	)

	// Focus search input when popover opens
	useEffect(() => {
		if (open) {
			const timer = setTimeout(() => {
				searchInputRef.current?.focus()
			}, 50)
			return () => clearTimeout(timer)
		} else {
			setSearch("")
		}
	}, [open])

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<StandardTooltip content={`Model: ${currentModelId || ladizDefaultModelId} (${providerLabel})`}>
				<PopoverTrigger
					disabled={disabled}
					className={cn(
						"inline-flex items-center gap-1.5 relative whitespace-nowrap px-2.5 py-1 text-xs font-mono font-medium rounded-full",
						"bg-blue-950/60 border border-blue-500/30 text-blue-300",
						"transition-all duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500",
						disabled
							? "opacity-50 cursor-not-allowed"
							: "hover:bg-blue-900/50 hover:border-blue-400/50 cursor-pointer",
						triggerClassName,
					)}>
					<span className="truncate max-w-[130px]">{currentModelId || ladizDefaultModelId}</span>
					<ChevronDown className="size-3 opacity-60 shrink-0" />
				</PopoverTrigger>
			</StandardTooltip>
			<PopoverContent
				align="start"
				sideOffset={6}
				container={portalContainer}
				className="p-0 overflow-hidden w-[340px] bg-[#0c101d] border border-blue-500/30 shadow-2xl rounded-xl flex flex-col font-sans">
				{/* Header with Provider Name & Count & Refresh */}
				<div className="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-slate-900/60">
					<span className="text-[11px] font-semibold text-slate-200 truncate uppercase tracking-wider font-mono">
						{providerLabel}
					</span>
					<div className="flex items-center gap-1.5 shrink-0">
						<button
							onClick={handleRefresh}
							title="Refresh daftar model dari API"
							className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer">
							<RotateCw className={`size-3 ${isFetching ? "animate-spin text-cyan-400" : ""}`} />
						</button>
						<span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-400/20">
							{filteredModels.length} {filteredModels.length === 1 ? "model" : "models"}
						</span>
					</div>
				</div>

				{/* Search Box */}
				<div className="p-2 border-b border-white/5 bg-black/20">
					<div className="relative flex items-center">
						<Search className="absolute left-2.5 size-3.5 text-slate-400 pointer-events-none" />
						<input
							ref={searchInputRef}
							type="text"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder={`Cari model di ${providerLabel}...`}
							className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-900/80 border border-white/10 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all font-sans"
						/>
						{search && (
							<button
								onClick={() => setSearch("")}
								className="absolute right-2 p-0.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors">
								<X className="size-3" />
							</button>
						)}
					</div>
				</div>

				{/* Loading State */}
				{isFetching && (
					<div className="p-4 flex flex-col items-center justify-center gap-2 text-slate-400">
						<Loader2 className="size-4 animate-spin text-cyan-400" />
						<span className="text-xs">Mengambil model dari API {providerLabel}...</span>
					</div>
				)}

				{/* Model List */}
				{!isFetching && (
					<div className="max-h-[300px] overflow-y-auto p-1.5 flex flex-col gap-1 custom-scrollbar">
						{filteredModels.map(({ id, info }) => {
							const isSelected = id === currentModelId
							const ctx = formatContextWindow(info?.contextWindow)
							const price = formatPricing(info)

							return (
								<button
									key={id}
									onClick={() => handleSelectModel(id)}
									className={cn(
										"flex flex-col items-start p-2.5 rounded-lg text-left transition-all cursor-pointer border",
										isSelected
											? "bg-blue-500/15 border-blue-500/40 text-blue-200 shadow-sm shadow-blue-500/10"
											: "border-transparent hover:bg-white/[0.04] text-slate-300",
									)}>
									{/* Top Row: Model ID & Selected Check */}
									<div className="flex items-center justify-between w-full gap-2">
										<span className="font-semibold font-mono text-xs text-slate-100 truncate flex-1">
											{id}
										</span>
										{isSelected && <Check className="size-3.5 text-cyan-400 shrink-0" />}
									</div>

									{/* Badges Row - Clean text-based tags */}
									<div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px]">
										{ctx && (
											<span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300 font-mono">
												{ctx} ctx
											</span>
										)}
										{info?.supportsImages && (
											<span className="px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-medium">
												Vision
											</span>
										)}
										{(info?.supportsReasoningBudget ||
											info?.supportsReasoningBinary ||
											info?.supportsReasoningEffort ||
											!!info?.maxThinkingTokens) && (
											<span className="px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-medium">
												Thinking
											</span>
										)}
										{price && (
											<span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-mono">
												{price}
											</span>
										)}
									</div>

									{/* Description */}
									{info?.description && (
										<span className="text-[11px] text-slate-400/90 mt-1 line-clamp-2 leading-relaxed">
											{info.description}
										</span>
									)}
								</button>
							)
						})}

						{/* Empty Search State & Custom Model Option */}
						{filteredModels.length === 0 && (
							<div className="p-4 text-center flex flex-col items-center gap-2">
								<span className="text-xs text-slate-400">Tidak ada model yang cocok</span>
								{search.trim() && (
									<button
										onClick={() => handleSelectModel(search.trim())}
										className="mt-1 px-3 py-1.5 rounded-lg text-xs font-mono bg-blue-600/30 hover:bg-blue-600/50 border border-blue-400/40 text-blue-200 transition-colors cursor-pointer w-full flex items-center justify-center gap-1.5">
										<span>
											Gunakan &quot;<strong>{search.trim()}</strong>&quot;
										</span>
									</button>
								)}
							</div>
						)}
					</div>
				)}
			</PopoverContent>
		</Popover>
	)
}
