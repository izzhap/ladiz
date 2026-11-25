import { Task } from "../Task"

// Keep this test focused: if a queued message arrives while Task.ask() is blocked,
// it should be consumed and used to fulfill the ask.

describe("Task.ask queued message drain", () => {
	it("consumes queued message while blocked on followup ask", async () => {
		const task = Object.create(Task.prototype) as Task
		;(task as any).abort = false
		;(task as any).clineMessages = []
		;(task as any).askResponse = undefined
		;(task as any).askResponseText = undefined
		;(task as any).askResponseImages = undefined
		;(task as any).lastMessageTs = undefined

		// Message queue service exists in constructor; for unit test we can attach a real one.
		const { MessageQueueService } = await import("../../message-queue/MessageQueueService")
		;(task as any).messageQueueService = new MessageQueueService()

		// Minimal stubs used by ask()
		;(task as any).addToClineMessages = vi.fn(async () => {})
		;(task as any).saveClineMessages = vi.fn(async () => {})
		;(task as any).updateClineMessage = vi.fn(async () => {})
		;(task as any).cancelAutoApprovalTimeout = vi.fn(() => {})
		;(task as any).checkpointSave = vi.fn(async () => {})
		;(task as any).emit = vi.fn()
		;(task as any).providerRef = { deref: () => undefined }

		const askPromise = task.ask("followup", "Q?", false)

		// Simulate webview queuing the user's selection text while the ask is pending.
		;(task as any).messageQueueService.addMessage("picked answer")

		const result = await askPromise
		expect(result.response).toBe("messageResponse")
		expect(result.text).toBe("picked answer")
	})

	it("consumes queued message when task completes (completion_result)", async () => {
		const task = Object.create(Task.prototype) as Task
		;(task as any).abort = false
		;(task as any).clineMessages = []
		;(task as any).askResponse = undefined
		;(task as any).askResponseText = undefined
		;(task as any).askResponseImages = undefined
		;(task as any).lastMessageTs = undefined

		const { MessageQueueService } = await import("../../message-queue/MessageQueueService")
		;(task as any).messageQueueService = new MessageQueueService()
		;(task as any).addToClineMessages = vi.fn(async () => {})
		;(task as any).saveClineMessages = vi.fn(async () => {})
		;(task as any).updateClineMessage = vi.fn(async () => {})
		;(task as any).cancelAutoApprovalTimeout = vi.fn(() => {})
		;(task as any).checkpointSave = vi.fn(async () => {})
		;(task as any).emit = vi.fn()
		;(task as any).providerRef = { deref: () => undefined }
		;(task as any).messageQueueService.addMessage("next task after completion")

		const result = await task.ask("completion_result", "", false)

		expect(result.response).toBe("messageResponse")
		expect(result.text).toBe("next task after completion")
		expect((task as any).messageQueueService.isEmpty()).toBe(true)
	})

	it.each(["command_output", "tool", "command", "use_mcp_server", "api_req_failed"] as const)(
		"does not consume queued messages for %s asks",
		async (askType) => {
			const task = Object.create(Task.prototype) as Task
			;(task as any).abort = false
			;(task as any).clineMessages = []
			;(task as any).askResponse = undefined
			;(task as any).askResponseText = undefined
			;(task as any).askResponseImages = undefined
			;(task as any).lastMessageTs = undefined

			const { MessageQueueService } = await import("../../message-queue/MessageQueueService")
			;(task as any).messageQueueService = new MessageQueueService()
			;(task as any).addToClineMessages = vi.fn(async () => {})
			;(task as any).saveClineMessages = vi.fn(async () => {})
			;(task as any).updateClineMessage = vi.fn(async () => {})
			;(task as any).cancelAutoApprovalTimeout = vi.fn(() => {})
			;(task as any).checkpointSave = vi.fn(async () => {})
			;(task as any).emit = vi.fn()
			;(task as any).providerRef = { deref: () => undefined }
			;(task as any).messageQueueService.addMessage("1+1=?")

			const askPromise = task.ask(
				askType,
				askType === "tool" ? JSON.stringify({ tool: "readFile" }) : "msg",
				false,
			)

			setTimeout(() => {
				task.approveAsk()
			}, 0)

			const result = await askPromise

			expect(result.response).toBe("yesButtonClicked")
			expect(result.text).toBeUndefined()
			expect((task as any).messageQueueService.isEmpty()).toBe(false)
			expect((task as any).messageQueueService.messages[0]?.text).toBe("1+1=?")
		},
	)

	it("does not consume queued messages during auto-approved tool asks", async () => {
		const task = Object.create(Task.prototype) as Task
		;(task as any).abort = false
		;(task as any).clineMessages = []
		;(task as any).askResponse = undefined
		;(task as any).askResponseText = undefined
		;(task as any).askResponseImages = undefined
		;(task as any).lastMessageTs = undefined

		const { MessageQueueService } = await import("../../message-queue/MessageQueueService")
		;(task as any).messageQueueService = new MessageQueueService()
		;(task as any).addToClineMessages = vi.fn(async () => {})
		;(task as any).saveClineMessages = vi.fn(async () => {})
		;(task as any).updateClineMessage = vi.fn(async () => {})
		;(task as any).cancelAutoApprovalTimeout = vi.fn(() => {})
		;(task as any).checkpointSave = vi.fn(async () => {})
		;(task as any).emit = vi.fn()
		;(task as any).providerRef = {
			deref: () => ({
				getState: async () => ({ autoApprovalEnabled: true, alwaysAllowReadOnly: true }),
				postMessageToWebview: vi.fn(),
			}),
		}
		;(task as any).messageQueueService.addMessage("wait until done")

		const result = await task.ask("tool", JSON.stringify({ tool: "readFile" }), false)

		expect(result.response).toBe("yesButtonClicked")
		expect(result.text).toBeUndefined()
		expect((task as any).messageQueueService.isEmpty()).toBe(false)
		expect((task as any).messageQueueService.messages[0]?.text).toBe("wait until done")
	})
})
