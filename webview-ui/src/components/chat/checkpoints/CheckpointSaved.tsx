import { useMemo, useRef, useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"

import { CheckpointMenu } from "./CheckpointMenu"
import { checkpointSchema } from "./schema"
import { TimelineItem } from "../TimelineItem"

type CheckpointSavedProps = {
	ts: number
	commitHash: string
	currentHash?: string
	checkpoint?: Record<string, unknown>
	onJumpToPreviousCheckpoint?: () => void
}

export const CheckpointSaved = ({
	checkpoint,
	currentHash,
	onJumpToPreviousCheckpoint,
	...props
}: CheckpointSavedProps) => {
	const { t } = useTranslation()
	const isCurrent = currentHash === props.commitHash
	const [isPopoverOpen, setIsPopoverOpen] = useState(false)
	const [isClosing, setIsClosing] = useState(false)
	const [isHovering, setIsHovering] = useState(false)
	const closeTimer = useRef<number | null>(null)

	useEffect(() => {
		return () => {
			if (closeTimer.current) {
				window.clearTimeout(closeTimer.current)
				closeTimer.current = null
			}
		}
	}, [])

	const handlePopoverOpenChange = (open: boolean) => {
		setIsPopoverOpen(open)
		if (open) {
			setIsClosing(false)
			if (closeTimer.current) {
				window.clearTimeout(closeTimer.current)
				closeTimer.current = null
			}
		} else {
			setIsClosing(true)
			closeTimer.current = window.setTimeout(() => {
				setIsClosing(false)
				closeTimer.current = null
			}, 200) // keep menu visible briefly to avoid popover jump
		}
	}

	const handleMouseEnter = () => {
		setIsHovering(true)
	}

	const handleMouseLeave = () => {
		setIsHovering(false)
	}

	// Menu is visible when hovering, popover is open, or briefly after popover closes
	const menuVisible = isHovering || isPopoverOpen || isClosing

	const metadata = useMemo(() => {
		if (!checkpoint) {
			return undefined
		}

		const result = checkpointSchema.safeParse(checkpoint)

		if (!result.success) {
			return undefined
		}

		return result.data
	}, [checkpoint])

	if (!metadata) {
		return null
	}

	return (
		<div
			className="flex items-center justify-between gap-2 w-full group/checkpoint"
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}>
			<TimelineItem
				status="info"
				className="w-full py-0.5"
				action={
					<span className="text-sky-400 font-semibold text-xs flex items-center gap-1.5">
						<span>{t("chat:checkpoint.regular")}</span>
						{isCurrent && (
							<span className="text-vscode-descriptionForeground/60 text-[11px] font-normal">
								({t("chat:checkpoint.current")})
							</span>
						)}
					</span>
				}
				actions={
					<div
						data-testid="checkpoint-menu-container"
						className={cn("h-4", menuVisible ? "block" : "hidden")}>
						<CheckpointMenu
							ts={props.ts}
							commitHash={props.commitHash}
							checkpoint={metadata}
							onOpenChange={handlePopoverOpenChange}
							onJumpToPreviousCheckpoint={onJumpToPreviousCheckpoint}
						/>
					</div>
				}
			/>
		</div>
	)
}
