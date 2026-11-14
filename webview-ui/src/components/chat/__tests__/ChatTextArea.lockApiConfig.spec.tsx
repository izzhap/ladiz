import React from "react"
import { render, fireEvent, screen } from "@src/utils/test-utils"
import { vscode } from "@src/utils/vscode"
import { ApiConfigSelector } from "../ApiConfigSelector"

vi.mock("@src/utils/vscode", () => ({
	vscode: {
		postMessage: vi.fn(),
	},
}))

vi.mock("@src/components/common/CodeBlock")
vi.mock("@src/components/common/MarkdownBlock")
vi.mock("@src/utils/path-mentions", () => ({
	convertToMentionPath: vi.fn((path: string) => path),
}))

const mockPostMessage = vscode.postMessage as ReturnType<typeof vi.fn>

describe("ChatTextArea - lockApiConfigAcrossModes toggle", () => {
	const defaultState = {
		listApiConfigMeta: [{ id: "default", name: "Default", modelId: "claude-3" }],
		pinnedApiConfigs: {},
		togglePinnedApiConfig: vi.fn(),
	}

	beforeEach(() => {
		vi.clearAllMocks()
	})

	const openPopoverAndGetLockToggle = (ariaLabel: string) => {
		const trigger = screen.getByTestId("dropdown-trigger")
		fireEvent.click(trigger)
		return screen.getByRole("button", { name: ariaLabel })
	}

	const renderSelector = (lockApiConfigAcrossModes = false, onToggle?: () => void) => {
		return render(
			<ApiConfigSelector
				value="default"
				displayName="Default"
				title="Default"
				listApiConfigMeta={defaultState.listApiConfigMeta}
				pinnedApiConfigs={defaultState.pinnedApiConfigs}
				togglePinnedApiConfig={defaultState.togglePinnedApiConfig}
				lockApiConfigAcrossModes={lockApiConfigAcrossModes}
				onToggleLockApiConfig={
					onToggle ||
					(() => {
						vscode.postMessage({
							type: "lockApiConfigAcrossModes",
							bool: !lockApiConfigAcrossModes,
						})
					})
				}
				onChange={vi.fn()}
			/>,
		)
	}

	describe("rendering", () => {
		it("renders with muted opacity when lockApiConfigAcrossModes is false", () => {
			renderSelector(false)

			const button = openPopoverAndGetLockToggle("chat:lockApiConfigAcrossModes")
			expect(button).toBeInTheDocument()
			expect(button.className).toContain("opacity-60")
			expect(button.className).not.toContain("text-vscode-focusBorder")
		})

		it("renders with highlight color when lockApiConfigAcrossModes is true", () => {
			renderSelector(true)

			const button = openPopoverAndGetLockToggle("chat:unlockApiConfigAcrossModes")
			expect(button).toBeInTheDocument()
			expect(button.className).toContain("text-vscode-focusBorder")
			expect(button.className).not.toContain("opacity-60")
		})

		it("renders in unlocked state when lockApiConfigAcrossModes is undefined (default)", () => {
			renderSelector(undefined as any)

			const button = openPopoverAndGetLockToggle("chat:lockApiConfigAcrossModes")
			expect(button).toBeInTheDocument()
			expect(button.className).toContain("opacity-60")
		})
	})

	describe("interaction", () => {
		it("posts lockApiConfigAcrossModes=true message when locking", () => {
			renderSelector(false)

			mockPostMessage.mockClear()

			const button = openPopoverAndGetLockToggle("chat:lockApiConfigAcrossModes")
			fireEvent.click(button)

			expect(mockPostMessage).toHaveBeenCalledWith({
				type: "lockApiConfigAcrossModes",
				bool: true,
			})
		})

		it("posts lockApiConfigAcrossModes=false message when unlocking", () => {
			renderSelector(true)

			mockPostMessage.mockClear()

			const button = openPopoverAndGetLockToggle("chat:unlockApiConfigAcrossModes")
			fireEvent.click(button)

			expect(mockPostMessage).toHaveBeenCalledWith({
				type: "lockApiConfigAcrossModes",
				bool: false,
			})
		})
	})
})
