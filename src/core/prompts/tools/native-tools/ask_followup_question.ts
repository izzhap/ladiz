import type OpenAI from "openai"

const ASK_FOLLOWUP_QUESTION_DESCRIPTION = `Ask the user a question to gather additional information or confirmation needed to complete the task. Do not create multiple-choice option buttons; always pass an empty list [] for follow_up so the user can type their answer directly.

Parameters:
- question: (required) A clear, specific question addressing the information needed
- follow_up: (required) Pass empty list [] (user types their answer directly)

Example: Asking user question
{ "question": "What is the path to the frontend-config.json file?", "follow_up": [] }`

const QUESTION_PARAMETER_DESCRIPTION = `Clear, specific question that captures the missing information you need`

const FOLLOW_UP_PARAMETER_DESCRIPTION = `List of suggested responses (pass empty list [] so user types their response directly)`

const FOLLOW_UP_TEXT_DESCRIPTION = `Suggested answer the user can pick`

const FOLLOW_UP_MODE_DESCRIPTION = `Optional mode slug to switch to if this suggestion is chosen (e.g., code, architect)`

export default {
	type: "function",
	function: {
		name: "ask_followup_question",
		description: ASK_FOLLOWUP_QUESTION_DESCRIPTION,
		strict: true,
		parameters: {
			type: "object",
			properties: {
				question: {
					type: "string",
					description: QUESTION_PARAMETER_DESCRIPTION,
				},
				follow_up: {
					type: "array",
					description: FOLLOW_UP_PARAMETER_DESCRIPTION,
					items: {
						type: "object",
						properties: {
							text: {
								type: "string",
								description: FOLLOW_UP_TEXT_DESCRIPTION,
							},
							mode: {
								type: ["string", "null"],
								description: FOLLOW_UP_MODE_DESCRIPTION,
							},
						},
						required: ["text", "mode"],
						additionalProperties: false,
					},
					minItems: 0,
					maxItems: 4,
				},
			},
			required: ["question", "follow_up"],
			additionalProperties: false,
		},
	},
} satisfies OpenAI.Chat.ChatCompletionTool
