import { useQuery } from "@tanstack/react-query"
import { type ExtensionMessage, type ModelRecord } from "@roo-code/types"
import { vscode } from "@src/utils/vscode"

const getVsCodeLmModels = () =>
	new Promise<ModelRecord>((resolve) => {
		const cleanup = () => {
			window.removeEventListener("message", handler)
		}

		const timeout = setTimeout(() => {
			cleanup()
			resolve({})
		}, 10000)

		const handler = (event: MessageEvent) => {
			const message: ExtensionMessage = event.data

			if (message.type === "vsCodeLmModels") {
				clearTimeout(timeout)
				cleanup()

				if (message.vsCodeLmModels && Array.isArray(message.vsCodeLmModels)) {
					const record: ModelRecord = {}
					for (const m of message.vsCodeLmModels) {
						const modelId = `${m.vendor}/${m.family}`
						record[modelId] = {
							maxTokens: 0,
							contextWindow: 128_000,
							supportsPromptCache: false,
							supportsImages: false,
							description: `VS Code Language Model: ${m.vendor} ${m.family}`,
						}
					}
					resolve(record)
				} else {
					resolve({})
				}
			}
		}

		window.addEventListener("message", handler)
		vscode.postMessage({ type: "requestVsCodeLmModels" })
	})

export const useVsCodeLmModels = (enabled = true) =>
	useQuery({
		queryKey: ["vsCodeLmModels"],
		queryFn: () => getVsCodeLmModels(),
		enabled,
		staleTime: 60 * 1000,
	})
