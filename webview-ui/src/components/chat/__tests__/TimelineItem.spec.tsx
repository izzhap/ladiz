import { render, screen } from "@src/utils/test-utils"

import { TimelineItem } from "../TimelineItem"

describe("TimelineItem", () => {
	it("aligns the connector line, dot container, and header row on the same 20px grid", () => {
		const { container } = render(<TimelineItem action={<span>Thought for 1s</span>} />)

		const line = container.querySelector(".w-\\[1\\.5px\\]")
		expect(line).toHaveClass("left-[10px]", "-translate-x-1/2")

		const headerRow = screen.getByText("Thought for 1s").closest(".min-h-5")
		expect(headerRow).toBeInTheDocument()
	})
})
