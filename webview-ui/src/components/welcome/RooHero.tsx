import { useState } from "react"

const RooHero = () => {
	const [isHovered, setIsHovered] = useState(false)

	return (
		<div
			className="mb-4 relative group flex flex-col items-start pt-2"
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}>
			<div
				className="relative flex items-center justify-center size-16 rounded-2xl bg-gradient-to-br from-[#1d4ed8] via-[#2563eb] to-[#0ea5e9] shadow-lg shadow-blue-500/20 transition-all duration-300"
				style={{
					transform: isHovered ? "scale(1.05) translateY(-2px)" : "scale(1) translateY(0)",
					boxShadow: isHovered
						? "0 10px 25px -5px rgba(37, 99, 235, 0.4), 0 8px 10px -6px rgba(37, 99, 235, 0.4)"
						: "0 4px 12px -2px rgba(37, 99, 235, 0.25)",
				}}>
				{/* Inner glow border */}
				<div className="absolute inset-0 rounded-2xl border border-white/20 pointer-events-none" />

				{/* Ladiz L Logo + Cyan Dot */}
				<svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M 32 26 H 48 V 60 H 70 V 74 H 32 Z" fill="#ffffff" />
					<circle cx="71" cy="28" r="9" fill="#38bdf8" />
				</svg>
			</div>
		</div>
	)
}

export default RooHero
