import { mentionRegexGlobal } from "@roo/context-mentions"
import { FileText } from "lucide-react"

import { vscode } from "../../utils/vscode"

interface MentionProps {
	text?: string
	withShadow?: boolean
}

const ATTACHED_FILE_REGEX = /<attached_file\s+name="([^"]+)">[\s\S]*?<\/attached_file>/g

function renderMentionsInSegment(segment: string, withShadow: boolean, keyPrefix: string) {
	return segment.split(mentionRegexGlobal).map((part, index) => {
		if (index % 2 === 0) {
			return part
		}
		return (
			<span
				key={`${keyPrefix}-${index}`}
				className={`${withShadow ? "mention-context-highlight-with-shadow" : "mention-context-highlight"} text-[0.9em] cursor-pointer`}
				onClick={() => vscode.postMessage({ type: "openMention", text: part })}>
				@{part}
			</span>
		)
	})
}

export const Mention = ({ text, withShadow = false }: MentionProps) => {
	if (!text) {
		return <>{text}</>
	}

	const nodes: React.ReactNode[] = []
	let lastIndex = 0
	let match: RegExpExecArray | null
	let blockIndex = 0

	ATTACHED_FILE_REGEX.lastIndex = 0
	while ((match = ATTACHED_FILE_REGEX.exec(text)) !== null) {
		if (match.index > lastIndex) {
			nodes.push(...renderMentionsInSegment(text.slice(lastIndex, match.index), withShadow, `seg-${blockIndex}`))
		}
		const fileName = match[1]
		nodes.push(
			<span
				key={`file-${blockIndex}`}
				className="inline-flex items-center gap-1 px-1.5 py-0.5 mr-1 rounded border border-vscode-panel-border bg-vscode-sideBar-background text-[0.85em] font-mono text-vscode-foreground align-middle">
				<FileText className="size-3 text-vscode-descriptionForeground shrink-0" aria-hidden="true" />
				<span>{fileName}</span>
			</span>,
		)
		lastIndex = match.index + match[0].length
		blockIndex++
	}

	if (lastIndex < text.length) {
		nodes.push(...renderMentionsInSegment(text.slice(lastIndex), withShadow, `seg-${blockIndex}`))
	}

	return <>{nodes}</>
}
