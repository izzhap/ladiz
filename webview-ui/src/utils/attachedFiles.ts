import type { AttachedFile } from "@ladiz/types"

export function formatMessageWithAttachedFiles(text: string, files: AttachedFile[]): string {
	const trimmed = text.trim()
	if (!files || files.length === 0) {
		return trimmed
	}

	const fileBlocks = files
		.map((file) => {
			const safeName = file.name.replace(/"/g, "'")
			return `<attached_file name="${safeName}">\n${file.content}\n</attached_file>`
		})
		.join("\n\n")

	return trimmed ? `${trimmed}\n\n${fileBlocks}` : fileBlocks
}

export function extractAttachedFilesFromText(text: string): { cleanText: string; files: AttachedFile[] } {
	if (!text || !text.includes("<attached_file")) {
		return { cleanText: text, files: [] }
	}

	const files: AttachedFile[] = []
	const cleanText = text
		.replace(/<attached_file\s+name="([^"]+)">\n?([\s\S]*?)\n?<\/attached_file>/g, (_match, name, content) => {
			files.push({ name, content })
			return ""
		})
		.trim()

	return { cleanText, files }
}
