import * as vscode from "vscode"
import fs from "fs/promises"
import { selectAttachments } from "../process-images"
import { extractTextFromFileWithMetadata } from "../extract-text"

vi.mock("vscode", () => ({
	window: {
		showOpenDialog: vi.fn(),
	},
}))

vi.mock("fs/promises", () => ({
	default: {
		readFile: vi.fn(),
	},
}))

vi.mock("../extract-text", () => ({
	extractTextFromFileWithMetadata: vi.fn(),
	extractTextFromBuffer: vi.fn(),
}))

describe("selectAttachments", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it("opens dialog without restrictive image filters and returns both images and non-image files", async () => {
		vi.mocked(vscode.window.showOpenDialog).mockResolvedValueOnce([
			{ fsPath: "/tmp/photo.png" } as vscode.Uri,
			{ fsPath: "/tmp/notes.ts" } as vscode.Uri,
		])
		vi.mocked(fs.readFile).mockResolvedValueOnce(Buffer.from("png-bytes"))
		vi.mocked(extractTextFromFileWithMetadata).mockResolvedValueOnce({
			content: "1 | const x = 1",
			totalLines: 1,
			returnedLines: 1,
			wasTruncated: false,
		})

		const result = await selectAttachments()

		expect(vscode.window.showOpenDialog).toHaveBeenCalledWith({
			canSelectMany: true,
			openLabel: "Select",
		})
		expect(result.images).toEqual([`data:image/png;base64,${Buffer.from("png-bytes").toString("base64")}`])
		expect(result.files).toEqual([
			{
				name: "notes.ts",
				path: "/tmp/notes.ts",
				content: "1 | const x = 1",
			},
		])
	})
})
