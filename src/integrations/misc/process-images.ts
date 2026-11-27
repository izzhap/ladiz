import * as vscode from "vscode"
import fs from "fs/promises"
import * as path from "path"
import type { AttachedFile } from "@ladiz/types"
import { extractTextFromBuffer, extractTextFromFileWithMetadata } from "./extract-text"

const IMAGE_MIME_TYPES: Record<string, string> = {
	".png": "image/png",
	".jpeg": "image/jpeg",
	".jpg": "image/jpeg",
	".webp": "image/webp",
}

export async function selectAttachments(): Promise<{ images: string[]; files: AttachedFile[] }> {
	const options: vscode.OpenDialogOptions = {
		canSelectMany: true,
		openLabel: "Select",
	}

	const fileUris = await vscode.window.showOpenDialog(options)

	if (!fileUris || fileUris.length === 0) {
		return { images: [], files: [] }
	}

	const images: string[] = []
	const files: AttachedFile[] = []

	await Promise.all(
		fileUris.map(async (uri) => {
			const filePath = uri.fsPath
			const ext = path.extname(filePath).toLowerCase()
			const mimeType = IMAGE_MIME_TYPES[ext]

			if (mimeType) {
				const buffer = await fs.readFile(filePath)
				const base64 = buffer.toString("base64")
				images.push(`data:${mimeType};base64,${base64}`)
				return
			}

			const name = path.basename(filePath)
			try {
				const extracted = await extractTextFromFileWithMetadata(filePath)
				files.push({ name, path: filePath, content: extracted.content })
			} catch {
				const buffer = await fs.readFile(filePath)
				const content = await extractTextFromBuffer(name, buffer)
				files.push({ name, path: filePath, content })
			}
		}),
	)

	return { images, files }
}

export async function selectImages(): Promise<string[]> {
	const { images } = await selectAttachments()
	return images
}
