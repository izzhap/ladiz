import { useState } from "react"
import VersionIndicator from "../common/VersionIndicator"

interface RooHeroProps {
	onVersionClick?: () => void
	className?: string
}

const RooHero = ({ onVersionClick, className = "" }: RooHeroProps) => {
	const [isHovered, setIsHovered] = useState(false)

	return (
		<div
			className={`relative group flex items-center justify-between w-full pt-1 pb-1 select-none ${className}`}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}>
			<div className="flex items-center gap-3.5 min-w-0">
				{/* Logo Mark */}
				<div
					className="relative flex items-center justify-center size-11 rounded-xl bg-gradient-to-br from-[#1e40af] via-[#2563eb] to-[#06b6d4] shadow-md transition-all duration-300 shrink-0"
					style={{
						transform: isHovered ? "scale(1.04) translateY(-1px)" : "scale(1) translateY(0)",
						boxShadow: isHovered
							? "0 8px 20px -4px rgba(37, 99, 235, 0.45), 0 4px 8px -2px rgba(6, 182, 212, 0.3)"
							: "0 3px 10px -2px rgba(37, 99, 235, 0.25)",
					}}>
					{/* Subtle inner border */}
					<div className="absolute inset-0 rounded-xl border border-white/25 pointer-events-none" />

					{/* Ladiz L Logo + Cyan Dot */}
					<svg width="26" height="26" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M 32 26 H 48 V 60 H 70 V 74 H 32 Z" fill="#ffffff" />
						<circle cx="71" cy="28" r="9" fill="#38bdf8" />
					</svg>
				</div>

				{/* Brand Typography */}
				<div className="flex flex-col min-w-0 justify-center">
					<div className="flex items-center gap-2">
						<h1 className="text-base font-semibold tracking-tight text-vscode-foreground m-0 leading-tight">
							Ladiz AI
						</h1>
					</div>
					<p className="text-xs text-vscode-descriptionForeground/80 m-0 truncate leading-tight mt-0.5">
						Autonomous coding & engineering assistant
					</p>
				</div>
			</div>

			{/* Integrated Version Badge */}
			{onVersionClick && <VersionIndicator onClick={onVersionClick} className="shrink-0" />}
		</div>
	)
}

export default RooHero
