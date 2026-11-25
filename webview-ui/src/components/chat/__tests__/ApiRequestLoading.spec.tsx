import { render, fireEvent, screen } from "@/utils/test-utils"
import type { ClineMessage } from "@ladiz/types"

import { ApiRequestLoading, getLoadingActivityStatusKey } from "../ApiRequestLoading"

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string) => key,
		i18n: { language: "en" },
	}),
}))

describe("ApiRequestLoading", () => {
	beforeEach(() => {
		localStorage.clear()
	})

	it("shows tips by default and toggles via right-click context menu", () => {
		const commandMessage: ClineMessage = {
			ts: 1,
			type: "ask",
			ask: "command",
			text: "npm test",
		}

		render(<ApiRequestLoading lastModifiedMessage={commandMessage} />)

		const tipBadge = screen.getByText("Tip")
		expect(tipBadge).toBeInTheDocument()
		expect(screen.queryByRole("menu")).not.toBeInTheDocument()

		fireEvent.contextMenu(tipBadge, { clientX: 100, clientY: 50 })

		fireEvent.click(screen.getByRole("menuitem", { name: "chat:loadingTips.hide" }))

		expect(screen.queryByRole("menu")).not.toBeInTheDocument()
		expect(screen.queryByText("Tip")).not.toBeInTheDocument()
		const statusLabel = screen.getByText("chat:loadingTips.status.executing")
		expect(statusLabel).toBeInTheDocument()
		expect(localStorage.getItem("ladiz.hideLoadingTips")).toBe("true")

		fireEvent.contextMenu(statusLabel, { clientX: 100, clientY: 50 })

		fireEvent.click(screen.getByRole("menuitem", { name: "chat:loadingTips.show" }))

		expect(screen.queryByRole("menu")).not.toBeInTheDocument()
		expect(screen.getByText("Tip")).toBeInTheDocument()
		expect(localStorage.getItem("ladiz.hideLoadingTips")).toBe("false")
	})

	it("closes the context menu on Escape or outside mousedown", () => {
		render(<ApiRequestLoading />)

		fireEvent.contextMenu(screen.getByText("Tip"), { clientX: 40, clientY: 40 })
		expect(screen.getByRole("menu")).toBeInTheDocument()

		fireEvent.keyDown(document, { key: "Escape" })
		expect(screen.queryByRole("menu")).not.toBeInTheDocument()

		fireEvent.contextMenu(screen.getByText("Tip"), { clientX: 40, clientY: 40 })
		expect(screen.getByRole("menu")).toBeInTheDocument()

		fireEvent.mouseDown(document.body)
		expect(screen.queryByRole("menu")).not.toBeInTheDocument()
	})

	it("maps lastModifiedMessage to the expected activity status key", () => {
		expect(getLoadingActivityStatusKey(undefined)).toBe("chat:loadingTips.status.thinking")
		expect(getLoadingActivityStatusKey({ ts: 1, type: "say", say: "reasoning" })).toBe(
			"chat:loadingTips.status.thinking",
		)
		expect(getLoadingActivityStatusKey({ ts: 1, type: "say", say: "text" })).toBe(
			"chat:loadingTips.status.responding",
		)
		expect(getLoadingActivityStatusKey({ ts: 1, type: "ask", ask: "command" })).toBe(
			"chat:loadingTips.status.executing",
		)
		expect(
			getLoadingActivityStatusKey({
				ts: 1,
				type: "ask",
				ask: "tool",
				text: JSON.stringify({ tool: "editedExistingFile", path: "a.ts" }),
			}),
		).toBe("chat:loadingTips.status.editing")
		expect(
			getLoadingActivityStatusKey({
				ts: 1,
				type: "ask",
				ask: "tool",
				text: JSON.stringify({ tool: "readFile", path: "a.ts" }),
			}),
		).toBe("chat:loadingTips.status.reading")
		expect(
			getLoadingActivityStatusKey({
				ts: 1,
				type: "ask",
				ask: "tool",
				text: JSON.stringify({ tool: "searchFiles", path: "." }),
			}),
		).toBe("chat:loadingTips.status.searching")
	})
})
