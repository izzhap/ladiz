import VersionIndicator from "../common/VersionIndicator"

interface RooHeroProps {
	onVersionClick?: () => void
	className?: string
	centered?: boolean
}

const RooHero = ({ onVersionClick, className = "", centered = false }: RooHeroProps) => {
	if (centered) {
		return (
			<div className={`relative group flex flex-col items-center justify-center text-center select-none ${className}`}>
				{/* Centered Logo Mark */}
				<div
					className="relative flex items-center justify-center size-14 rounded-2xl bg-gradient-to-br from-[#1e40af] via-[#2563eb] to-[#06b6d4] shadow-lg shadow-blue-500/25 border border-white/25 transition-all duration-300 shrink-0 mb-3 group-hover:scale-105 group-hover:-translate-y-0.5 group-hover:shadow-blue-500/40">
					{/* Ladiz L Logo + Cyan Dot */}
					<svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M 32 26 H 48 V 60 H 70 V 74 H 32 Z" fill="#ffffff" />
						<circle cx="71" cy="28" r="9" fill="#38bdf8" />
					</svg>
				</div>

				{/* Brand Typography & Version Badge */}
				<div className="flex items-center justify-center gap-2 mb-1">
					<h1 className="text-xl font-bold tracking-tight text-vscode-foreground m-0 leading-tight">
						Ladiz AI
					</h1>
					{onVersionClick && <VersionIndicator onClick={onVersionClick} className="shrink-0" />}
				</div>
				<p className="text-xs text-vscode-descriptionForeground/80 m-0 max-w-[340px] leading-relaxed">
					Autonomous coding & engineering assistant
				</p>
			</div>
		)
	}

	return (
		<div className={`relative group flex items-center justify-between w-full pt-1 pb-1 select-none ${className}`}>
			<div className="flex items-center gap-3.5 min-w-0">
				{/* Logo Mark */}
				<div className="relative flex items-center justify-center size-11 rounded-xl bg-gradient-to-br from-[#1e40af] via-[#2563eb] to-[#06b6d4] shadow-md border border-white/25 transition-all duration-300 shrink-0 group-hover:scale-105 group-hover:-translate-y-0.5">
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
