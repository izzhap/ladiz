import { render, screen, fireEvent } from "@testing-library/react"
import VersionIndicator from "../VersionIndicator"

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (_key: string, options?: { version?: string }) => `Version ${options?.version}`,
	}),
}))

vi.mock("@/context/ExtensionStateContext", () => ({
	useExtensionState: () => ({
		version: "3.53.19",
	}),
}))

describe("VersionIndicator", () => {
	it("renders version button with accessible label and handles click", () => {
		const onClick = vi.fn()
		render(<VersionIndicator onClick={onClick} />)

		const button = screen.getByRole("button", { name: "Version 3.53.19" })
		expect(button).toHaveAttribute("type", "button")
		expect(button).toHaveTextContent("v3.53.19")

		fireEvent.click(button)
		expect(onClick).toHaveBeenCalledTimes(1)
	})
})
