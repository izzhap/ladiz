import React from "react"
import { render, screen } from "@testing-library/react"
import RooHero from "../RooHero"

vi.mock("../../common/VersionIndicator", () => ({
	default: ({ onClick }: { onClick: () => void }) => <button onClick={onClick}>v3.53.6</button>,
}))

describe("RooHero", () => {
	it("renders default layout", () => {
		render(<RooHero />)
		expect(screen.getByText("Ladiz AI")).toBeInTheDocument()
		expect(screen.getByText("Autonomous coding & engineering assistant")).toBeInTheDocument()
	})

	it("renders centered layout", () => {
		render(<RooHero centered={true} />)
		expect(screen.getByText("Ladiz AI")).toBeInTheDocument()
		expect(screen.getByText("Autonomous coding & engineering assistant")).toBeInTheDocument()
	})
})
