import { LadizHandler, LADIZ_DEFAULT_BASE_URL } from "../ladiz"
import OpenAI from "openai"
import { ladizModels, type LadizModelId } from "@ladiz/types"

const mockConstructor = vi.fn()

vi.mock("openai", () => {
	return {
		__esModule: true,
		default: vi.fn().mockImplementation((options) => {
			mockConstructor(options)
			return {
				chat: {
					completions: {
						create: vi.fn(),
					},
				},
			}
		}),
	}
})

describe("LadizHandler", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it("uses correct default API base URL", () => {
		expect(LADIZ_DEFAULT_BASE_URL).toBe("https://api.ladizai.com/v1")
	})

	it("initializes OpenAI client with default baseURL", () => {
		new LadizHandler({
			ladizApiKey: "test-key",
		})

		expect(mockConstructor).toHaveBeenCalledWith(
			expect.objectContaining({
				apiKey: "test-key",
				baseURL: "https://api.ladizai.com/v1",
			}),
		)
	})

	it("configures 1M context window for all ladiz models", () => {
		const modelIds: LadizModelId[] = ["ladiz-core", "ladiz-swift", "ladiz-apex"]

		for (const modelId of modelIds) {
			expect(ladizModels[modelId].contextWindow).toBe(1_000_000)

			const handler = new LadizHandler({
				ladizApiKey: "test-key",
				apiModelId: modelId,
			})
			const { info } = handler.getModel()
			expect(info.contextWindow).toBe(1_000_000)
		}
	})

	it("passes reasoning_effort in createMessage when reasoningEffort is configured", async () => {
		const handler = new LadizHandler({
			ladizApiKey: "test-key",
			apiModelId: "ladiz-core",
			enableReasoningEffort: true,
			reasoningEffort: "high",
		})

		const mockCreate = (handler as any).client.chat.completions.create as ReturnType<typeof vi.fn>
		mockCreate.mockResolvedValueOnce((async function* () {})())

		for await (const _chunk of handler.createMessage("system", [{ role: "user", content: "hi" }])) {
			// consume stream
		}

		expect(mockCreate).toHaveBeenCalledWith(
			expect.objectContaining({
				model: "ladiz-core",
				reasoning_effort: "high",
			}),
		)
	})
})
