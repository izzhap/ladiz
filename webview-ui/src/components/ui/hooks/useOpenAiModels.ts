import { useQuery } from "@tanstack/react-query"
import { type ModelRecord, type ExtensionMessage, openAiModelInfoSaneDefaults } from "@roo-code/types"
import { vscode } from "@src/utils/vscode"

const getOpenAiModels = (baseUrl?: string, apiKey?: string, headers?: Record<string, string>) =>
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

			if (message.type === "openAiModels") {
				clearTimeout(timeout)
				cleanup()

				if (message.openAiModels && Array.isArray(message.openAiModels)) {
					const record: ModelRecord = {}
					for (const modelId of message.openAiModels) {
						record[modelId] = {
							...openAiModelInfoSaneDefaults,
							description: `OpenAI Compatible: ${modelId}`,
						}
					}
					resolve(record)
				} else {
					resolve({})
				}
			}
		}

		window.addEventListener("message", handler)
		vscode.postMessage({
			type: "requestOpenAiModels",
			values: {
				baseUrl,
				apiKey,
				openAiHeaders: headers,
			},
		})
	})

export const useOpenAiModels = (baseUrl?: string, apiKey?: string, headers?: Record<string, string>, enabled = true) =>
	useQuery({
		queryKey: ["openAiModels", baseUrl || "", apiKey || ""],
		queryFn: () => (baseUrl ? getOpenAiModels(baseUrl, apiKey, headers) : Promise.resolve({})),
		enabled: enabled && !!baseUrl,
		staleTime: 30 * 1000,
	})
