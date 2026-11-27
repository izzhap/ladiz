import VersionIndicator from "../common/VersionIndicator"

interface RooHeroProps {
	onVersionClick?: () => void
	className?: string
	centered?: boolean
}

const RooHero = ({ onVersionClick, className = "", centered = false }: RooHeroProps) => {
	const pixelMark = (size: number) => (
		<svg
			width={size}
			height={size}
			viewBox="0 0 16 16"
			fill="none"
			shapeRendering="crispEdges"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true">
			{/* Crisp pixel L */}
			<rect x="3" y="2" width="3" height="10" fill="currentColor" />
			<rect x="6" y="9" width="7" height="3" fill="currentColor" />
			{/* Stepped pixel cursor/dot */}
			<rect
				x="10"
				y="2"
				width="3"
				height="3"
				className="fill-vscode-focusBorder animate-[pulse_1.6s_steps(2,end)_infinite] motion-reduce:animate-none"
			/>
		</svg>
	)

	if (centered) {
		return (
			<div
				className={`relative group flex flex-col items-center justify-center text-center select-none ${className}`}>
				{/* Minimal Pixel Mark */}
				<div className="flex items-center justify-center size-12 rounded-lg border border-vscode-panel-border bg-vscode-editor-background/70 text-vscode-foreground mb-4 transition-colors duration-150 group-hover:border-vscode-focusBorder/60">
					{pixelMark(26)}
				</div>

				{/* Brand Typography & Version Badge */}
				<div className="flex items-center justify-center gap-2 mb-1.5">
					<h1 className="text-[18px] font-semibold tracking-[-0.02em] text-vscode-foreground m-0 leading-tight">
						Ladiz AI
					</h1>
					{onVersionClick && <VersionIndicator onClick={onVersionClick} className="shrink-0" />}
				</div>
				<p className="text-xs text-vscode-descriptionForeground m-0 max-w-[280px] leading-relaxed">
					Autonomous coding & engineering assistant
				</p>
			</div>
		)
	}

	return (
		<div className={`relative group flex items-center justify-between w-full pt-1 pb-1 select-none ${className}`}>
			<div className="flex items-center gap-3 min-w-0">
				{/* Minimal Pixel Mark */}
				<div className="flex items-center justify-center size-9 rounded-md border border-vscode-panel-border bg-vscode-editor-background/70 text-vscode-foreground shrink-0 transition-colors duration-150 group-hover:border-vscode-focusBorder/60">
					{pixelMark(20)}
				</div>

				{/* Brand Typography */}
				<div className="flex flex-col min-w-0 justify-center">
					<div className="flex items-center gap-2">
						<h1 className="text-sm font-semibold tracking-[-0.01em] text-vscode-foreground m-0 leading-tight">
							Ladiz AI
						</h1>
					</div>
					<p className="text-xs text-vscode-descriptionForeground m-0 truncate leading-tight mt-0.5">
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
