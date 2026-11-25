import React from "react"
import { fireEvent, render, screen } from "@/utils/test-utils"
import type { ClineMessage } from "@ladiz/types"
import { TranslationProvider } from "@/i18n/__mocks__/TranslationContext"
import FileChangesPanel from "../components/chat/FileChangesPanel"

const mockPostMessage = vi.fn()

vi.mock("@src/utils/vscode", () => ({
	vscode: {
		postMessage: (...args: unknown[]) => mockPostMessage(...args),
	},
}))

// Mock i18n to return readable header with count
vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, opts?: { count?: number }) => {
			if (key === "chat:fileChangesInConversation.header" && opts?.count != null) {
				return `${opts.count} file(s) changed in this conversation`
			}
			return key
		},
	}),
}))

// Lightweight mock so we don't pull in CodeBlock/DiffView
vi.mock("@src/components/common/CodeAccordion", () => ({
	default: ({
		path,
		isExpanded,
		onToggleExpand,
		onRevert,
		isReverted,
	}: {
		path?: string
		isExpanded: boolean
		onToggleExpand: () => void
		onRevert?: () => void
		isReverted?: boolean
	}) => (
		<div data-testid="code-accordian">
			<span data-testid="accordian-path">{path}</span>
			{onRevert && (
				<button type="button" onClick={onRevert} data-testid={`accordian-revert-${path}`}>
					{isReverted ? "reverted" : "revert"}
				</button>
			)}
			<button type="button" onClick={onToggleExpand} data-testid="accordian-toggle">
				{isExpanded ? "expanded" : "collapsed"}
			</button>
		</div>
	),
}))

function createFileEditMessage(
	path: string,
	diff: string,
	diffStats?: { added: number; removed: number },
): ClineMessage {
	return {
		type: "ask",
		ask: "tool",
		ts: Date.now(),
		partial: false,
		isAnswered: true,
		text: JSON.stringify({
			tool: "appliedDiff",
			path,
			diff,
			...(diffStats && { diffStats }),
		}),
	}
}

function renderPanel(messages: ClineMessage[] | undefined) {
	return render(
		<TranslationProvider>
			<FileChangesPanel clineMessages={messages} />
		</TranslationProvider>,
	)
}

describe("FileChangesPanel", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it("renders nothing when clineMessages is undefined", () => {
		const { container } = renderPanel(undefined)
		expect(container.firstChild).toBeNull()
	})

	it("renders nothing when clineMessages is empty", () => {
		const { container } = renderPanel([])
		expect(container.firstChild).toBeNull()
	})

	it("renders nothing when there are no file-edit messages", () => {
		const messages: ClineMessage[] = [
			{
				type: "say",
				say: "text",
				ts: Date.now(),
				partial: false,
				text: "hello",
			},
			{
				type: "ask",
				ask: "tool",
				ts: Date.now(),
				partial: false,
				text: JSON.stringify({ tool: "read_file", path: "x.ts" }),
			},
		]
		const { container } = renderPanel(messages)
		expect(container.firstChild).toBeNull()
	})

	it("renders nothing when file-edit ask tool is not approved (isAnswered false or missing)", () => {
		const messages: ClineMessage[] = [
			{
				type: "ask",
				ask: "tool",
				ts: Date.now(),
				partial: false,
				text: JSON.stringify({
					tool: "appliedDiff",
					path: "src/foo.ts",
					diff: "+line",
				}),
			},
		]
		const { container } = renderPanel(messages)
		expect(container.firstChild).toBeNull()
	})

	it("renders panel with header when there is one file edit", () => {
		const messages = [createFileEditMessage("src/foo.ts", "@@ -1 +1 @@\n+line")]
		renderPanel(messages)

		expect(screen.getByText("1 file(s) changed in this conversation")).toBeInTheDocument()
		// Expand panel so file row is in DOM (CollapsibleContent may not render when closed in some setups)
		fireEvent.click(screen.getByText("1 file(s) changed in this conversation").closest("button")!)
		expect(screen.getByTestId("accordian-path")).toHaveTextContent("src/foo.ts")
	})

	it("renders one row per unique path when multiple files edited", () => {
		const messages = [createFileEditMessage("src/a.ts", "diff a"), createFileEditMessage("src/b.ts", "diff b")]
		renderPanel(messages)

		expect(screen.getByText("2 file(s) changed in this conversation")).toBeInTheDocument()
		// Expand panel so file rows are rendered
		fireEvent.click(screen.getByText("2 file(s) changed in this conversation").closest("button")!)
		const paths = screen.getAllByTestId("accordian-path")
		expect(paths).toHaveLength(2)
		expect(paths.map((el) => el.textContent)).toEqual(expect.arrayContaining(["src/a.ts", "src/b.ts"]))
	})

	it("collapsed by default: panel trigger shows chevron and expanding reveals file rows", () => {
		const messages = [createFileEditMessage("src/foo.ts", "diff")]
		renderPanel(messages)

		// Header visible
		const headerText = screen.getByText("1 file(s) changed in this conversation")
		expect(headerText).toBeInTheDocument()
		// Trigger is the button that contains the header text
		const trigger = headerText.closest("button")
		expect(trigger).toBeInTheDocument()

		// Expand panel
		fireEvent.click(trigger!)
		expect(screen.getByTestId("accordian-path")).toHaveTextContent("src/foo.ts")
	})

	it("toggling a file row expand calls onToggleExpand", () => {
		const messages = [createFileEditMessage("src/foo.ts", "diff")]
		renderPanel(messages)

		// Expand panel first so the file row is rendered
		const headerText = screen.getByText("1 file(s) changed in this conversation")
		fireEvent.click(headerText.closest("button")!)

		const accordianToggle = screen.getByTestId("accordian-toggle")
		expect(accordianToggle).toHaveTextContent("collapsed")
		fireEvent.click(accordianToggle)
		expect(accordianToggle).toHaveTextContent("expanded")
	})

	it("hides aggregate stats when no diffStats are present", () => {
		const messages = [createFileEditMessage("src/a.ts", "diff a"), createFileEditMessage("src/b.ts", "diff b")]
		renderPanel(messages)

		expect(screen.queryByTestId("total-added")).not.toBeInTheDocument()
		expect(screen.queryByTestId("total-removed")).not.toBeInTheDocument()
	})

	it("shows aggregated + and - totals in the header when diffStats are present", () => {
		const messages = [
			createFileEditMessage("src/a.ts", "diff a", { added: 3, removed: 1 }),
			createFileEditMessage("src/b.ts", "diff b", { added: 2, removed: 5 }),
		]
		renderPanel(messages)

		expect(screen.getByTestId("total-added")).toHaveTextContent("+5")
		expect(screen.getByTestId("total-removed")).toHaveTextContent("-6")
	})

	it("shows revert all button and opens confirmation dialog when clicked", () => {
		const messages = [createFileEditMessage("src/foo.ts", "diff")]
		renderPanel(messages)

		const revertAllBtn = screen.getByTestId("revert-all-btn")
		expect(revertAllBtn).toBeInTheDocument()

		fireEvent.click(revertAllBtn)
		const confirmBtn = screen.getByTestId("confirm-revert-all-btn")
		expect(confirmBtn).toBeInTheDocument()

		fireEvent.click(confirmBtn)
		expect(mockPostMessage).toHaveBeenCalledWith({
			type: "revertAllFiles",
			values: {
				files: [{ filePath: "src/foo.ts", originalContent: undefined }],
			},
		})
	})

	it("triggers revert file and opens confirmation dialog", () => {
		const messages = [createFileEditMessage("src/foo.ts", "diff")]
		renderPanel(messages)

		// Expand panel
		fireEvent.click(screen.getByText("1 file(s) changed in this conversation").closest("button")!)

		const revertFileBtn = screen.getByTestId("accordian-revert-src/foo.ts")
		expect(revertFileBtn).toBeInTheDocument()
		expect(revertFileBtn).toHaveTextContent("revert")

		fireEvent.click(revertFileBtn)
		const confirmBtn = screen.getByTestId("confirm-revert-file-btn")
		expect(confirmBtn).toBeInTheDocument()

		fireEvent.click(confirmBtn)
		expect(mockPostMessage).toHaveBeenCalledWith({
			type: "revertFile",
			text: "src/foo.ts",
			values: { originalContent: undefined },
		})
	})

	it("removes a single reverted file from list when fileReverted event is received", () => {
		const messages = [createFileEditMessage("src/a.ts", "diff a"), createFileEditMessage("src/b.ts", "diff b")]
		renderPanel(messages)

		expect(screen.getByText("2 file(s) changed in this conversation")).toBeInTheDocument()

		fireEvent(
			window,
			new MessageEvent("message", {
				data: {
					type: "fileReverted",
					fileReverted: { path: "src/a.ts", success: true },
				},
			}),
		)

		expect(screen.getByText("1 file(s) changed in this conversation")).toBeInTheDocument()
	})

	it("disappears completely when all files are reverted", () => {
		const messages = [createFileEditMessage("src/a.ts", "diff a"), createFileEditMessage("src/b.ts", "diff b")]
		const { container } = renderPanel(messages)

		expect(screen.getByText("2 file(s) changed in this conversation")).toBeInTheDocument()

		fireEvent(
			window,
			new MessageEvent("message", {
				data: {
					type: "fileReverted",
					fileReverted: { paths: ["src/a.ts", "src/b.ts"], success: true },
				},
			}),
		)

		expect(container.firstChild).toBeNull()
	})
})
