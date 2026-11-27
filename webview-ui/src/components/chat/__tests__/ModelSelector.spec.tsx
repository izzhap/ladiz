import { render, screen, fireEvent } from "@/utils/test-utils"
import { vscode } from "@/utils/vscode"

import { ModelSelector } from "../ModelSelector"

const mockSetApiConfiguration = vi.fn()
let mockApiConfiguration: Record<string, any> = {
	apiProvider: "ladiz",
	apiModelId: "ladiz-core",
}

vi.mock("@/utils/vscode", () => ({
	vscode: {
		postMessage: vi.fn(),
	},
}))

vi.mock("@/components/ui/hooks/useRooPortal", () => ({
	useRooPortal: () => document.body,
}))

vi.mock("@/context/ExtensionStateContext", () => ({
	useExtensionState: () => ({
		apiConfiguration: mockApiConfiguration,
		setApiConfiguration: mockSetApiConfiguration,
		currentApiConfigName: "default",
	}),
}))

vi.mock("@/components/ui/hooks/useRouterModels", () => ({
	useRouterModels: () => ({ data: undefined, isLoading: false }),
}))

vi.mock("@/components/ui/hooks/useOllamaModels", () => ({
	useOllamaModels: () => ({ data: undefined, isLoading: false, refetch: vi.fn() }),
}))

vi.mock("@/components/ui/hooks/useLmStudioModels", () => ({
	useLmStudioModels: () => ({ data: undefined, isLoading: false, refetch: vi.fn() }),
}))

vi.mock("@/components/ui/hooks/useOpenAiModels", () => ({
	useOpenAiModels: () => ({ data: undefined, isLoading: false, refetch: vi.fn() }),
}))

vi.mock("@/components/ui/hooks/useVsCodeLmModels", () => ({
	useVsCodeLmModels: () => ({ data: undefined, isLoading: false, refetch: vi.fn() }),
}))

vi.mock("@/components/ui", () => ({
	Popover: ({ children, open }: any) => (
		<div data-testid="popover-root" data-open={open}>
			{children}
		</div>
	),
	PopoverTrigger: ({ children, disabled, ...props }: any) => (
		<button data-testid="dropdown-trigger" disabled={disabled} {...props}>
			{children}
		</button>
	),
	PopoverContent: ({ children }: any) => <div data-testid="popover-content">{children}</div>,
	StandardTooltip: ({ children }: any) => <>{children}</>,
}))

describe("ModelSelector", () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mockApiConfiguration = {
			apiProvider: "ladiz",
			apiModelId: "ladiz-core",
		}
	})

	it("renders thinking level controls (Off, Low, Med, High) and updates apiConfiguration on click", () => {
		render(<ModelSelector />)

		expect(screen.getByTestId("thinking-level-disable")).toHaveTextContent("Off")
		expect(screen.getByTestId("thinking-level-low")).toHaveTextContent("Low")
		expect(screen.getByTestId("thinking-level-medium")).toHaveTextContent("Med")
		expect(screen.getByTestId("thinking-level-high")).toHaveTextContent("High")

		fireEvent.click(screen.getByTestId("thinking-level-high"))

		expect(mockSetApiConfiguration).toHaveBeenCalledWith(
			expect.objectContaining({
				enableReasoningEffort: true,
				reasoningEffort: "high",
			}),
		)
		expect(vscode.postMessage).toHaveBeenCalledWith(
			expect.objectContaining({
				type: "upsertApiConfiguration",
				text: "default",
				apiConfiguration: expect.objectContaining({
					enableReasoningEffort: true,
					reasoningEffort: "high",
				}),
			}),
		)

		fireEvent.click(screen.getByTestId("thinking-level-disable"))
		expect(mockSetApiConfiguration).toHaveBeenLastCalledWith(
			expect.objectContaining({
				enableReasoningEffort: false,
				reasoningEffort: "disable",
			}),
		)
	})

	it("syncs thinking level into openAiCustomModelInfo for openai provider", () => {
		mockApiConfiguration = {
			apiProvider: "openai",
			openAiModelId: "kantor",
		}

		render(<ModelSelector />)
		fireEvent.click(screen.getByTestId("thinking-level-medium"))

		expect(mockSetApiConfiguration).toHaveBeenCalledWith(
			expect.objectContaining({
				enableReasoningEffort: true,
				reasoningEffort: "medium",
				openAiCustomModelInfo: expect.objectContaining({
					supportsReasoningEffort: true,
					reasoningEffort: "medium",
				}),
			}),
		)
	})

	it("allows editing and resetting context length", () => {
		render(<ModelSelector />)

		const input = screen.getByTestId("context-length-input") as HTMLInputElement
		expect(input.value).toBe("1000000")

		fireEvent.change(input, { target: { value: "256k" } })
		fireEvent.keyDown(input, { key: "Enter" })

		expect(mockSetApiConfiguration).toHaveBeenCalledWith(
			expect.objectContaining({
				modelContextWindow: 256000,
			}),
		)
		expect(vscode.postMessage).toHaveBeenCalledWith(
			expect.objectContaining({
				type: "upsertApiConfiguration",
				apiConfiguration: expect.objectContaining({
					modelContextWindow: 256000,
				}),
			}),
		)
	})

	it("shows reset button when modelContextWindow is overridden and clears it on click", () => {
		mockApiConfiguration = {
			apiProvider: "ladiz",
			apiModelId: "ladiz-core",
			modelContextWindow: 65536,
		}

		render(<ModelSelector />)

		const resetBtn = screen.getByTestId("reset-context-length")
		fireEvent.click(resetBtn)

		expect(mockSetApiConfiguration).toHaveBeenCalledWith(
			expect.objectContaining({
				modelContextWindow: undefined,
			}),
		)
	})
})
