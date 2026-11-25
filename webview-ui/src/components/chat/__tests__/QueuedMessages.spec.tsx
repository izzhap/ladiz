import { render, fireEvent, screen } from "@/utils/test-utils"

import { QueuedMessages } from "../QueuedMessages"

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string) => key,
	}),
}))

vi.mock("../Mention", () => ({
	Mention: ({ text }: { text: string }) => <span>{text}</span>,
}))

vi.mock("../../common/Thumbnails", () => ({
	default: () => null,
}))

describe("QueuedMessages", () => {
	const queue = [
		{ id: "q1", text: "first message", timestamp: 1 },
		{ id: "q2", text: "second message", timestamp: 2 },
	]

	it("supports send immediately, edit, and delete actions", () => {
		const onRemove = vi.fn()
		const onUpdate = vi.fn()
		const onSendNow = vi.fn()

		render(<QueuedMessages queue={queue} onRemove={onRemove} onUpdate={onUpdate} onSendNow={onSendNow} />)

		const sendButtons = screen.getAllByLabelText("queuedMessages.sendNow")
		fireEvent.click(sendButtons[1])
		expect(onSendNow).toHaveBeenCalledWith(1)

		const editButtons = screen.getAllByLabelText("queuedMessages.edit")
		fireEvent.click(editButtons[0])

		const textarea = screen.getByDisplayValue("first message")
		fireEvent.change(textarea, { target: { value: "updated first" } })
		fireEvent.click(screen.getByLabelText("queuedMessages.save"))
		expect(onUpdate).toHaveBeenCalledWith(0, "updated first")

		const deleteButtons = screen.getAllByLabelText("queuedMessages.delete")
		fireEvent.click(deleteButtons[1])
		expect(onRemove).toHaveBeenCalledWith(1)
	})

	it("cancels editing without updating when cancel button is clicked", () => {
		const onUpdate = vi.fn()

		render(<QueuedMessages queue={[queue[0]]} onRemove={vi.fn()} onUpdate={onUpdate} onSendNow={vi.fn()} />)

		fireEvent.click(screen.getByLabelText("queuedMessages.edit"))
		const textarea = screen.getByDisplayValue("first message")
		fireEvent.change(textarea, { target: { value: "discarded" } })
		fireEvent.click(screen.getByLabelText("queuedMessages.cancel"))

		expect(onUpdate).not.toHaveBeenCalled()
		expect(screen.getByText("first message")).toBeInTheDocument()
	})
})
