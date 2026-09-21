import { ShieldCheck, Sparkles, Terminal, Code2 } from "lucide-react"

const RooTips = () => {
	return (
		<div className="flex flex-col gap-3 my-2 w-full max-w-[500px]">
			{/* Main Feature Highlight Card inspired by Claude Code UI */}
			<div className="relative overflow-hidden rounded-xl border border-blue-500/20 bg-gradient-to-b from-[#131b2e] to-[#0c101d] p-4 shadow-lg shadow-black/40">
				<div className="flex items-start gap-3">
					<div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400">
						<ShieldCheck className="size-4.5" />
					</div>
					<div className="flex flex-col gap-1 text-xs">
						<div className="flex items-center gap-2">
							<span className="font-semibold text-sm text-blue-100">Ladiz AI Ready</span>
							<span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-medium text-blue-300 border border-blue-400/30">
								Active
							</span>
						</div>
						<p className="text-slate-300/80 leading-relaxed m-0 text-xs">
							Autonomous AI development team in your editor. Automatically handles code editing, file operations, debugging, and terminal execution with approval guardrails.
						</p>
					</div>
				</div>

				{/* Feature pills */}
				<div className="mt-3 flex flex-wrap gap-2 border-t border-white/5 pt-3 text-[11px] text-slate-400">
					<div className="flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 border border-white/5">
						<Code2 className="size-3 text-blue-400" />
						<span>Smart Code Edit</span>
					</div>
					<div className="flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 border border-white/5">
						<Terminal className="size-3 text-cyan-400" />
						<span>Terminal Automation</span>
					</div>
					<div className="flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 border border-white/5">
						<Sparkles className="size-3 text-indigo-400" />
						<span>Multi-Mode Reasoning</span>
					</div>
				</div>
			</div>
		</div>
	)
}

export default RooTips
