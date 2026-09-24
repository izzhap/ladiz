import { Anthropic } from "@anthropic-ai/sdk"
import OpenAI from "openai"
import { OpenAiHandler } from "./openai"
import { ladizModels, ladizDefaultModelId, type ModelInfo } from "@roo-code/types"
import type { ApiHandlerOptions } from "../../shared/api"
import { TagMatcher } from "../../utils/tag-matcher"
import { convertToOpenAiMessages } from "../transform/openai-format"
import type { ApiHandlerCreateMessageMetadata } from "../index"
import type { ApiStream } from "../transform/stream"

export const LADIZ_DEFAULT_BASE_URL = "https://ladiz.web.id/v1"

export class LadizHandler extends OpenAiHandler {
	constructor(options: ApiHandlerOptions) {
		const apiKey = options.ladizApiKey || options.openAiApiKey || options.apiKey || "not-provided"
		const baseURL = options.ladizBaseUrl || options.openAiBaseUrl || LADIZ_DEFAULT_BASE_URL
		const modelId = options.apiModelId || options.ladizModelId || ladizDefaultModelId

		super({
			...options,
			openAiApiKey: apiKey,
			openAiBaseUrl: baseURL,
			openAiModelId: modelId,
			openAiCustomModelInfo:
				options.openAiCustomModelInfo ||
				ladizModels[modelId as keyof typeof ladizModels] ||
				ladizModels[ladizDefaultModelId],
			openAiStreamingEnabled: true,
			includeMaxTokens: true,
		})
	}

	override getModel(): { id: string; info: ModelInfo; reasoning?: boolean } {
		const modelId = this.options.openAiModelId || this.options.apiModelId || ladizDefaultModelId
		const info = ladizModels[modelId as keyof typeof ladizModels] || ladizModels[ladizDefaultModelId]
		return { id: modelId, info }
	}

	protected override addMaxTokensIfNeeded(
		requestOptions:
			| OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming
			| OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming,
		modelInfo: ModelInfo,
	): void {
		if (this.options.includeMaxTokens === true) {
			const maxTokens = this.options.modelMaxTokens || modelInfo.maxTokens || 8192
			requestOptions.max_tokens = maxTokens
		}
	}

	override async *createMessage(
		systemPrompt: string,
		messages: Anthropic.Messages.MessageParam[],
		metadata?: ApiHandlerCreateMessageMetadata,
	): ApiStream {
		const { info: modelInfo } = this.getModel()
		const modelId = this.options.openAiModelId || this.options.apiModelId || ladizDefaultModelId

		const systemMessage: OpenAI.Chat.ChatCompletionSystemMessageParam = {
			role: "system",
			content: systemPrompt,
		}

		const convertedMessages = [systemMessage, ...convertToOpenAiMessages(messages)]

		const requestOptions: OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming = {
			model: modelId,
			temperature: this.options.modelTemperature ?? 0,
			messages: convertedMessages,
			stream: true as const,
			tools: this.convertToolsForOpenAI(metadata?.tools),
			tool_choice: metadata?.tool_choice,
			parallel_tool_calls: metadata?.parallelToolCalls ?? true,
		}

		this.addMaxTokensIfNeeded(requestOptions, modelInfo)

		let stream
		try {
			stream = await this.client.chat.completions.create(requestOptions)
		} catch (error: any) {
			const errorMsg =
				error?.error?.message || error?.message || (typeof error === "string" ? error : JSON.stringify(error))
			throw new Error(`Ladiz AI Error (${error?.status || "API"}): ${errorMsg}`)
		}

		const matcher = new TagMatcher(
			"think",
			(chunk) =>
				({
					type: chunk.matched ? "reasoning" : "text",
					text: chunk.data,
				}) as const,
		)

		let lastUsage
		const activeToolCallIds = new Set<string>()

		for await (const chunk of stream) {
			const delta = chunk.choices?.[0]?.delta ?? {}
			const finishReason = chunk.choices?.[0]?.finish_reason

			if (delta.content) {
				for (const c of matcher.update(delta.content)) {
					yield c
				}
			}

			if ("reasoning_content" in delta && delta.reasoning_content) {
				yield {
					type: "reasoning",
					text: (delta.reasoning_content as string | undefined) || "",
				}
			}

			if (delta.tool_calls) {
				for (const toolCall of delta.tool_calls) {
					if (toolCall.id) {
						activeToolCallIds.add(toolCall.id)
					}
					yield {
						type: "tool_call_partial",
						index: toolCall.index,
						id: toolCall.id,
						name: toolCall.function?.name,
						arguments: toolCall.function?.arguments,
					}
				}
			}

			if (finishReason === "tool_calls" && activeToolCallIds.size > 0) {
				for (const id of activeToolCallIds) {
					yield { type: "tool_call_end", id }
				}
				activeToolCallIds.clear()
			}

			if (chunk.usage) {
				lastUsage = chunk.usage
			}
		}

		for (const chunk of matcher.final()) {
			yield chunk
		}

		if (lastUsage) {
			yield {
				type: "usage",
				inputTokens: lastUsage.prompt_tokens || 0,
				outputTokens: lastUsage.completion_tokens || 0,
			}
		}
	}
}
