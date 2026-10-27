import { render, screen, fireEvent } from "@testing-library/react"
import { PromptSuggestions } from "../PromptSuggestions"

describe("PromptSuggestions", () => {
	it("renders all prompt suggestions", () => {
		const onSelect = vi.fn()
		render(<PromptSuggestions onSelectPrompt={onSelect} />)

		expect(screen.getByText("Buat Fitur Baru")).toBeInTheDocument()
		expect(screen.getByText("Perbaiki Bug")).toBeInTheDocument()
		expect(screen.getByText("Refactor & Optimasi")).toBeInTheDocument()
		expect(screen.getByText("Buat Unit Test")).toBeInTheDocument()
	})

	it("calls onSelectPrompt with the correct prompt when clicked", () => {
		const onSelect = vi.fn()
		render(<PromptSuggestions onSelectPrompt={onSelect} />)

		const button = screen.getByText("Perbaiki Bug").closest("button")
		expect(button).not.toBeNull()
		fireEvent.click(button!)

		expect(onSelect).toHaveBeenCalledTimes(1)
		expect(onSelect).toHaveBeenCalledWith("Tolong periksa kode atau pesan error ini dan bantu perbaiki: ")
	})
})
