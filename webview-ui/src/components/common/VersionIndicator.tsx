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
			onClick={onClick}
			className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-medium tracking-tight rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 hover:border-blue-500/40 transition-all cursor-pointer select-none ${className}`}
			aria-label={t("chat:versionIndicator.ariaLabel", { version: displayVersion })}>
			<span>v{displayVersion}</span>
		</button>
	)
}

export default VersionIndicator
