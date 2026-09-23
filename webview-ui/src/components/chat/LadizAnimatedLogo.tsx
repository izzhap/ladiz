export function LadizAnimatedLogo({ className = "" }: { className?: string }) {
	return (
		<div className={`relative flex items-center justify-center shrink-0 size-3.5 ${className}`}>
			{/* Ambient aura glow */}
			<div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-[2px] animate-pulse" />

			{/* Claude-style rotating spark */}
			<div className="relative size-full animate-[spin_6s_linear_infinite] flex items-center justify-center">
				<svg
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					className="size-full drop-shadow-[0_0_4px_rgba(56,189,248,0.8)]">
					<defs>
						<linearGradient id="claudeSparkGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
							<stop offset="0%" stopColor="#38bdf8" />
							<stop offset="50%" stopColor="#818cf8" />
							<stop offset="100%" stopColor="#06b6d4" />
						</linearGradient>
						<linearGradient id="claudeSparkGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
							<stop offset="0%" stopColor="#ffffff" />
							<stop offset="50%" stopColor="#38bdf8" />
							<stop offset="100%" stopColor="#6366f1" />
						</linearGradient>
					</defs>

					{/* Primary 4-point organic spark */}
					<path
						d="M12 1.5C12 7.29899 7.29899 12 1.5 12C7.29899 12 12 16.701 12 22.5C12 16.701 16.701 12 22.5 12C16.701 12 12 7.29899 12 1.5Z"
						fill="url(#claudeSparkGrad1)"
					/>

					{/* Secondary rotated 4-point spark */}
					<path
						d="M12 4C12 8.41828 8.41828 12 4 12C8.41828 12 12 15.5817 12 20C12 15.5817 15.5817 12 20 12C15.5817 12 12 8.41828 12 4Z"
						fill="url(#claudeSparkGrad2)"
						opacity="0.8"
						transform="rotate(45 12 12)"
					/>

					{/* Bright luminous center point */}
					<circle cx="12" cy="12" r="2.2" fill="#ffffff" />
				</svg>
			</div>
		</div>
	)
}
