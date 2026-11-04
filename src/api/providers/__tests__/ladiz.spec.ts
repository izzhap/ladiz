import { LadizHandler, LADIZ_DEFAULT_BASE_URL } from "../ladiz"
import OpenAI from "openai"
import { ladizModels, type LadizModelId } from "@roo-code/types"

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
})
