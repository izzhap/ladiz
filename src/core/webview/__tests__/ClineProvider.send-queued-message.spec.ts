import { ClineProvider } from "../ClineProvider"
import { MessageQueueService } from "../../message-queue/MessageQueueService"

describe("ClineProvider.sendQueuedMessage", () => {
	it("submits directly when task is waiting on a non-command_output ask", async () => {
		const queue = new MessageQueueService()
		const q1 = queue.addMessage("first")!
		const q2 = queue.addMessage("second", ["img.png"])!

		const submitUserMessage = vi.fn().mockResolvedValue(undefined)
		const cancelTask = vi.fn().mockResolvedValue(undefined)
		const mockTask = {
			messageQueueService: queue,
			isWaitingForAsk: true,
			isStreaming: false,
			clineMessages: [{ type: "ask", ask: "followup", ts: 1 }],
			submitUserMessage,
		}

		const provider = Object.create(ClineProvider.prototype) as ClineProvider
		provider.getCurrentTask = vi.fn().mockReturnValue(mockTask)
		provider.cancelTask = cancelTask

		await provider.sendQueuedMessage(q2.id)

		expect(submitUserMessage).toHaveBeenCalledWith("second", ["img.png"])
		expect(cancelTask).not.toHaveBeenCalled()
		expect(queue.messages.map((m) => m.id)).toEqual([q1.id])
	})

	it("cancels and reorders queue with target first when task is streaming or running command_output", async () => {
		const queue = new MessageQueueService()
		const q1 = queue.addMessage("first")!
		const q2 = queue.addMessage("second")!
		const q3 = queue.addMessage("third")!

		const cancelTask = vi.fn().mockResolvedValue(undefined)
		const mockTask = {
			messageQueueService: queue,
			isWaitingForAsk: false,
			isStreaming: true,
			clineMessages: [{ type: "say", say: "api_req_started", ts: 1 }],
			submitUserMessage: vi.fn(),
		}

		const provider = Object.create(ClineProvider.prototype) as ClineProvider
		provider.getCurrentTask = vi.fn().mockReturnValue(mockTask)
		provider.cancelTask = cancelTask

		await provider.sendQueuedMessage(q2.id)

		expect(cancelTask).toHaveBeenCalledWith({
			initialQueuedMessages: [q2, q1, q3],
		})
	})

	it("seeds messages into MessageQueueService without losing order", () => {
		const queue = new MessageQueueService()
		queue.seedMessages([
			{ id: "a", text: "alpha", timestamp: 1 },
			{ id: "b", text: "beta", timestamp: 2 },
		])

		expect(queue.messages.map((m) => m.id)).toEqual(["a", "b"])
		expect(queue.dequeueMessage()?.id).toBe("a")
		expect(queue.dequeueMessage()?.id).toBe("b")
		expect(queue.isEmpty()).toBe(true)
	})
})
