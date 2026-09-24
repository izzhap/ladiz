import React from "react"
import { useTranslation } from "react-i18next"
import { ShieldCheck } from "lucide-react"
import { MaxRequestsInput } from "./MaxRequestsInput"
import { MaxCostInput } from "./MaxCostInput"

export interface MaxLimitInputsProps {
	allowedMaxRequests?: number
	allowedMaxCost?: number
	onMaxRequestsChange: (value: number | undefined) => void
	onMaxCostChange: (value: number | undefined) => void
}

export const MaxLimitInputs: React.FC<MaxLimitInputsProps> = ({
	allowedMaxRequests,
	allowedMaxCost,
	onMaxRequestsChange,
	onMaxCostChange,
}) => {
	const { t } = useTranslation()

	return (
		<div className="space-y-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/10">
			<div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
				<ShieldCheck className="size-4 text-amber-400" />
				<span>Batas Permintaan & Biaya</span>
			</div>
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
				<MaxRequestsInput allowedMaxRequests={allowedMaxRequests} onValueChange={onMaxRequestsChange} />
				<MaxCostInput allowedMaxCost={allowedMaxCost} onValueChange={onMaxCostChange} />
			</div>
			<div className="text-xs text-vscode-descriptionForeground">
				{t("settings:autoApprove.maxLimits.description")}
			</div>
		</div>
	)
}
