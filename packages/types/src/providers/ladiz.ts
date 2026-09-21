import type { ModelInfo } from "../model.js"

export type LadizModelId = "ladiz-core" | "ladiz-swift" | "ladiz-apex"

export const ladizDefaultModelId: LadizModelId = "ladiz-core"

export const ladizModels: Record<LadizModelId, ModelInfo> = {
	"ladiz-core": {
		maxTokens: 64000,
		contextWindow: 200000,
		supportsImages: true,
		supportsPromptCache: true,
		inputPrice: 0,
		outputPrice: 0,
		description: "Ladiz Core: Model serbaguna untuk coding dan refactoring",
	},
	"ladiz-swift": {
		maxTokens: 32000,
		contextWindow: 128000,
		supportsImages: true,
		supportsPromptCache: true,
		inputPrice: 0,
		outputPrice: 0,
		description: "Ladiz Swift: Model super cepat dan responsif",
	},
	"ladiz-apex": {
		maxTokens: 128000,
		contextWindow: 400000,
		supportsImages: true,
		supportsPromptCache: true,
		inputPrice: 0,
		outputPrice: 0,
		description: "Ladiz Apex: Model penalaran tinggi untuk arsitektur kompleks",
	},
}
