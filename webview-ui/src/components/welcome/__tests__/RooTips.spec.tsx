import React from "react"
import { render, screen } from "@/utils/test-utils"

import RooTips from "../RooTips"

describe("RooTips Component", () => {
	test("renders capabilities", () => {
		render(<RooTips />)
		// ponytail: basic smoke test for static capabilities card; expand if interactive tips return
		expect(screen.getByText("Capabilities")).toBeInTheDocument()
		expect(screen.getByText("Smart Editing")).toBeInTheDocument()
	})
})
