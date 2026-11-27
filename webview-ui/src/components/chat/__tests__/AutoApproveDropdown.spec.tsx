import { render, screen, fireEvent } from "@/utils/test-utils"
import { useExtensionState } from "@/context/ExtensionStateContext"
import { vscode } from "@/utils/vscode"

import { AutoApproveDropdown } from "../AutoApproveDropdown"

vi.mock("@/utils/vscode", () => ({
	vscode: {
		postMessage: vi.fn(),
	},
}))

vi.mock("@/context/ExtensionStateContext", () => ({
	useExtensionState: vi.fn(),
}))

vi.mock("@/hooks/useAutoApprovalToggles", () => ({
	useAutoApprovalToggles: () => ({
		alwaysAllowReadOnly: true,
		alwaysAllowWrite: false,
	}),
}))

vi.mock("@/hooks/useAutoApprovalState", () => ({
	useAutoApprovalState: (_toggles: unknown, autoApprovalEnabled: boolean) => ({
		effectiveAutoApprovalEnabled: autoApprovalEnabled,
	}),
}))

describe("AutoApproveDropdown", () => {
	const mockState = {
		autoApprovalEnabled: false,
		setAutoApprovalEnabled: vi.fn(),
		setAlwaysAllowReadOnly: vi.fn(),
		setAlwaysAllowWrite: vi.fn(),
		setAlwaysAllowExecute: vi.fn(),
		setAlwaysAllowMcp: vi.fn(),
		setAlwaysAllowModeSwitch: vi.fn(),
		setAlwaysAllowSubtasks: vi.fn(),
		setAlwaysAllowFollowupQuestions: vi.fn(),
	}

	beforeEach(() => {
		vi.clearAllMocks()
		vi.mocked(useExtensionState).mockReturnValue(mockState as unknown as ReturnType<typeof useExtensionState>)
	})

	it("renders Auto-approve off state with aria-pressed=false and toggles all permissions on click", () => {
		render(<AutoApproveDropdown />)

		const trigger = screen.getByTestId("auto-approve-dropdown-trigger")
		expect(trigger).toHaveAttribute("aria-pressed", "false")
		expect(trigger).toHaveTextContent("chat:autoApprove.statusOff")

		fireEvent.click(trigger)

		expect(mockState.setAutoApprovalEnabled).toHaveBeenCalledWith(true)
		expect(vscode.postMessage).toHaveBeenCalledWith({ type: "autoApprovalEnabled", bool: true })
	})

	it("renders Auto-approve on state with aria-pressed=true when enabled", () => {
		vi.mocked(useExtensionState).mockReturnValue({
			...mockState,
			autoApprovalEnabled: true,
		} as unknown as ReturnType<typeof useExtensionState>)

		render(<AutoApproveDropdown />)

		const trigger = screen.getByTestId("auto-approve-dropdown-trigger")
		expect(trigger).toHaveAttribute("aria-pressed", "true")
		expect(trigger).toHaveTextContent("chat:autoApprove.statusOn")
	})
})
