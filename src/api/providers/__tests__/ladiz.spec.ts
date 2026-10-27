import { LadizHandler, LADIZ_DEFAULT_BASE_URL } from "../ladiz"
import OpenAI from "openai"

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
})
