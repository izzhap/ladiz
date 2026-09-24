const RooTips = () => {
	return (
		<div className="w-full rounded-xl border border-vscode-panel-border/40 bg-vscode-sideBar-background/30 p-3.5 space-y-2.5">
			<div className="flex items-center justify-between">
				<span className="text-xs font-semibold text-vscode-foreground/90">Capabilities</span>
				<span className="text-[10px] uppercase font-semibold tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
					Ready
				</span>
			</div>

			<div className="grid grid-cols-1 gap-1.5 text-xs text-vscode-descriptionForeground">
				<div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-vscode-editor-background/30 hover:bg-vscode-editor-background/60 transition-colors">
					<div className="flex items-center gap-2 min-w-0">
						<span className="text-blue-400 font-bold text-xs select-none">•</span>
						<span className="text-vscode-foreground/90 font-medium">Smart Editing</span>
					</div>
					<span className="text-vscode-descriptionForeground/70 text-[11px] truncate">
						Refactor, fix, add features
					</span>
				</div>
				<div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-vscode-editor-background/30 hover:bg-vscode-editor-background/60 transition-colors">
					<div className="flex items-center gap-2 min-w-0">
						<span className="text-cyan-400 font-bold text-xs select-none">•</span>
						<span className="text-vscode-foreground/90 font-medium">Terminal</span>
					</div>
					<span className="text-vscode-descriptionForeground/70 text-[11px] truncate">
						Run & test with approval
					</span>
				</div>
				<div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-vscode-editor-background/30 hover:bg-vscode-editor-background/60 transition-colors">
					<div className="flex items-center gap-2 min-w-0">
						<span className="text-indigo-400 font-bold text-xs select-none">•</span>
						<span className="text-vscode-foreground/90 font-medium">Deep Context</span>
					</div>
					<span className="text-vscode-descriptionForeground/70 text-[11px] truncate">
						Semantic codebase index
					</span>
				</div>
			</div>
		</div>
	)
}

export default RooTips
