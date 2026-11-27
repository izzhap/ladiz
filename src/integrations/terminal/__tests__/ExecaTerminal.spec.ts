// npx vitest run src/integrations/terminal/__tests__/ExecaTerminal.spec.ts

import { RooTerminalCallbacks } from "../types"
import { ExecaTerminal } from "../ExecaTerminal"

describe("ExecaTerminal", () => {
	it("should run terminal commands and collect output", async () => {
		// TODO: Run the equivalent test for Windows.
		if (process.platform === "win32") {
			return
		}

		const terminal = new ExecaTerminal(1, "/tmp")
		let result

		const callbacks: RooTerminalCallbacks = {
			onLine: vi.fn(),
			onCompleted: (output) => {
				result = output
			},
			onShellExecutionStarted: vi.fn(),
			onShellExecutionComplete: vi.fn(),
		}

		const subprocess = terminal.runCommand("ls -al", callbacks)
		await subprocess

		expect(callbacks.onLine).toHaveBeenCalled()
		expect(callbacks.onShellExecutionStarted).toHaveBeenCalled()
		expect(callbacks.onShellExecutionComplete).toHaveBeenCalled()

		expect(result).toBeTypeOf("string")
		expect(result).toContain("total")
	})

	it("should abort a running process tree including grandchild processes holding stdout open", async () => {
		const os = await import("os")
		const terminal = new ExecaTerminal(2, os.tmpdir())
		let completed = false
		let exitDetails: any

		const childScript =
			"const { spawn } = require('child_process'); " +
			"spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'inherit' }); " +
			"console.log('READY'); " +
			"setInterval(() => {}, 1000);"

		const command = `"${process.execPath}" -e "${childScript}"`

		let proc!: ReturnType<typeof terminal.runCommand>
		const readyPromise = new Promise<void>((resolve) => {
			const callbacks: RooTerminalCallbacks = {
				onLine: (line) => {
					if (line.includes("READY")) {
						resolve()
					}
				},
				onCompleted: () => {
					completed = true
				},
				onShellExecutionStarted: vi.fn(),
				onShellExecutionComplete: (details) => {
					exitDetails = details
				},
			}

			proc = terminal.runCommand(command, callbacks)
		})

		await readyPromise
		// Wait past the 100ms pidUpdatePromise window so this.pid is updated
		await new Promise((resolve) => setTimeout(resolve, 250))

		proc.abort()

		await proc

		expect(completed).toBe(true)
		expect(exitDetails).toBeDefined()
		expect(exitDetails.exitCode).not.toBe(0)
	}, 10_000)
})
