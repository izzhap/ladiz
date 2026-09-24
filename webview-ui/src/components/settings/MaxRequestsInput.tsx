import { useTranslation } from "react-i18next"

import { FormattedTextField, unlimitedIntegerFormatter } from "../common/FormattedTextField"

interface MaxRequestsInputProps {
	allowedMaxRequests?: number
	onValueChange: (value: number | undefined) => void
}

export function MaxRequestsInput({ allowedMaxRequests, onValueChange }: MaxRequestsInputProps) {
	const { t } = useTranslation()

	return (
		<div className="flex flex-col gap-1.5 w-full">
			<label className="flex items-center gap-1.5 text-xs font-medium text-slate-300 whitespace-nowrap">
				<span className="codicon codicon-pulse text-amber-400" />
				{t("settings:autoApprove.apiRequestLimit.title")}:
			</label>
			<FormattedTextField
				value={allowedMaxRequests}
				onValueChange={onValueChange}
				formatter={unlimitedIntegerFormatter}
				placeholder={t("settings:autoApprove.apiRequestLimit.unlimited")}
				className="w-full"
				data-testid="max-requests-input"
			/>
		</div>
	)
}
