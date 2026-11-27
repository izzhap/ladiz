import React from "react"
import { useTranslation } from "react-i18next"
import { Package } from "@roo/package"
import { useExtensionState } from "@/context/ExtensionStateContext"

interface VersionIndicatorProps {
	onClick: () => void
	className?: string
}

const VersionIndicator: React.FC<VersionIndicatorProps> = ({ onClick, className = "" }) => {
	const { t } = useTranslation()
	const { version } = useExtensionState()
	const displayVersion = version || Package.version

	return (
		<button
			type="button"
			onClick={onClick}
			className={`inline-flex items-center px-1.5 py-0.5 text-[11px] font-mono tabular-nums leading-none rounded border border-vscode-panel-border/80 bg-vscode-editor-background/60 text-vscode-descriptionForeground hover:text-vscode-foreground hover:border-vscode-focusBorder/70 hover:bg-vscode-list-hoverBackground transition-colors duration-150 cursor-pointer select-none focus:outline-none focus-visible:ring-1 focus-visible:ring-vscode-focusBorder ${className}`}
			aria-label={t("chat:versionIndicator.ariaLabel", { version: displayVersion })}>
			<span>v{displayVersion}</span>
		</button>
	)
}

export default VersionIndicator
