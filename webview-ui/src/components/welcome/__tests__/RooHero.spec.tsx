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

	it("renders version indicator when onVersionClick is provided", () => {
		const onVersionClick = vi.fn()
		render(<RooHero centered={true} onVersionClick={onVersionClick} />)
		const versionBtn = screen.getByText("v3.53.6")
		expect(versionBtn).toBeInTheDocument()
		versionBtn.click()
		expect(onVersionClick).toHaveBeenCalledTimes(1)
	})
})
