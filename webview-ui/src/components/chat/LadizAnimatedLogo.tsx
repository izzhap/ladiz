export function LadizAnimatedLogo({ className = "", active = true }: { className?: string; active?: boolean }) {
	return (
		<div className={`relative flex items-center justify-center shrink-0 size-4 ${className}`}>
			{/* Ambient luminous glow halo - Ladiz signature */}
			<div
				className={`absolute -inset-0.5 rounded-full bg-gradient-to-tr from-cyan-400/50 via-sky-500/25 to-indigo-500/50 blur-[3px] transition-all duration-300 ${
					active ? "animate-pulse opacity-100 scale-105" : "opacity-40"
				}`}
			/>

			{/* Outer rotating orbital arc ring */}
			<svg
				viewBox="0 0 24 24"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				className={`absolute inset-0 size-full ${
					active ? "animate-[spin_2s_linear_infinite]" : "animate-[spin_6s_linear_infinite]"
				}`}>
				<circle
					cx="12"
					cy="12"
					r="9.5"
					stroke="url(#ladizOrbitGrad)"
					strokeWidth="1.25"
					strokeDasharray="16 14"
					strokeLinecap="round"
				/>
				<defs>
					<linearGradient id="ladizOrbitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
						<stop offset="0%" stopColor="#38bdf8" />
						<stop offset="50%" stopColor="#818cf8" stopOpacity="0.4" />
						<stop offset="100%" stopColor="#06b6d4" stopOpacity="0.05" />
					</linearGradient>
				</defs>
			</svg>

			{/* Center radiant kinetic star - counter-rotating */}
			<div
				className={`relative size-3 flex items-center justify-center ${
					active ? "animate-[spin_5s_linear_infinite_reverse]" : "animate-[spin_10s_linear_infinite_reverse]"
				}`}>
				<svg
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					className="size-full drop-shadow-[0_0_6px_rgba(56,189,248,0.95)]">
					<defs>
						<linearGradient id="ladizCoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
							<stop offset="0%" stopColor="#ffffff" />
							<stop offset="30%" stopColor="#38bdf8" />
							<stop offset="70%" stopColor="#818cf8" />
							<stop offset="100%" stopColor="#06b6d4" />
						</linearGradient>
					</defs>

					{/* 4-point organic hyper-spark */}
					<path
						d="M12 1.5C12 7.29899 7.29899 12 1.5 12C7.29899 12 12 16.701 12 22.5C12 16.701 16.701 12 22.5 12C16.701 12 12 7.29899 12 1.5Z"
						fill="url(#ladizCoreGrad)"
					/>

					{/* Bright luminous center point */}
					<circle cx="12" cy="12" r="2" fill="#ffffff" />
				</svg>
			</div>
		</div>
	)
}
