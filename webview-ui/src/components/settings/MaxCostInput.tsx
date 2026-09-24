import { useTranslation } from "react-i18next"

import { FormattedTextField, unlimitedDecimalFormatter } from "../common/FormattedTextField"

interface MaxCostInputProps {
	allowedMaxCost?: number
	onValueChange: (value: number | undefined) => void
}

export function MaxCostInput({ allowedMaxCost, onValueChange }: MaxCostInputProps) {
	const { t } = useTranslation()

	return (
		<div className="flex flex-col gap-1.5 w-full">
			<label className="flex items-center gap-1.5 text-xs font-medium text-slate-300 whitespace-nowrap">
				<span className="codicon codicon-credit-card text-amber-400" />
				{t("settings:autoApprove.apiCostLimit.title")}:
			</label>
			<FormattedTextField
				value={allowedMaxCost}
				onValueChange={onValueChange}
				formatter={unlimitedDecimalFormatter}
				placeholder={t("settings:autoApprove.apiCostLimit.unlimited")}
				className="w-full"
				data-testid="max-cost-input"
				leftNodes={[
					<span key="dollar" className="text-amber-400 font-semibold px-1">
						$
					</span>,
				]}
			/>
		</div>
	)
}
