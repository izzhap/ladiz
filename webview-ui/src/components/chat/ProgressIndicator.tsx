export const ProgressIndicator = () => (
	<div className="flex items-center gap-1.5 py-0.5 px-1">
		<span className="size-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:-0.3s] shadow-sm shadow-cyan-400/80" />
		<span className="size-2 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.15s] shadow-sm shadow-blue-500/80" />
		<span className="size-2 rounded-full bg-indigo-500 animate-bounce shadow-sm shadow-indigo-500/80" />
	</div>
)
