import { execFile } from "child_process"
import { execa, ExecaError } from "execa"
import psTree from "ps-tree"
import process from "process"

import type { RooTerminal } from "./types"
import { BaseTerminal } from "./BaseTerminal"
import { BaseTerminalProcess } from "./BaseTerminalProcess"

export class ExecaTerminalProcess extends BaseTerminalProcess {
	private terminalRef: WeakRef<RooTerminal>
	private aborted = false
	private pid?: number
	private subprocess?: ReturnType<typeof execa>
	private flushTimer?: NodeJS.Timeout

	constructor(terminal: RooTerminal) {
		super()

		this.terminalRef = new WeakRef(terminal)

		this.once("completed", () => {
			this.terminal.busy = false
		})
	}

	public get terminal(): RooTerminal {
		const terminal = this.terminalRef.deref()

		if (!terminal) {
			throw new Error("Unable to dereference terminal")
		}

		return terminal
	}

	public override async run(command: string) {
		this.command = command

		try {
			this.isHot = true

			this.subprocess = execa({
				shell: BaseTerminal.getExecaShellPath() || true,
				cwd: this.terminal.getCurrentWorkingDirectory(),
				all: true,
				// Ignore stdin to ensure non-interactive mode and prevent hanging
				stdin: "ignore",
				env: {
					...process.env,
					// Ensure UTF-8 encoding for Ruby, CocoaPods, etc.
					LANG: "en_US.UTF-8",
					LC_ALL: "en_US.UTF-8",
				},
			})`${command}`

			this.pid = this.subprocess.pid

			const rawStream = this.subprocess.iterable({ from: "all", preserveNewlines: true })

			// Wrap the stream to ensure all chunks are strings (execa can return Uint8Array)
			const stream = (async function* () {
				for await (const chunk of rawStream) {
					yield typeof chunk === "string" ? chunk : new TextDecoder().decode(chunk)
				}
			})()

			this.terminal.setActiveStream(stream, this.pid)

			for await (const line of stream) {
				if (this.aborted) {
					break
				}

				this.fullOutput += line

				const now = Date.now()

				if (this.isListening) {
					const elapsed = now - this.lastEmitTime_ms
					if (elapsed > 500 || this.lastEmitTime_ms === 0) {
						this.clearFlushTimer()
						this.emitRemainingBufferIfListening()
						this.lastEmitTime_ms = now
					} else if (!this.flushTimer) {
						this.flushTimer = setTimeout(() => {
							this.flushTimer = undefined
							this.emitRemainingBufferIfListening()
							this.lastEmitTime_ms = Date.now()
						}, 500 - elapsed)
					}
				}

				this.startHotTimer(line)
			}

			if (this.aborted) {
				let timeoutId: NodeJS.Timeout | undefined

				const kill = new Promise<void>((resolve) => {
					console.log(`[ExecaTerminalProcess#run] SIGKILL -> ${this.pid}`)

					timeoutId = setTimeout(() => {
						try {
							this.subprocess?.kill("SIGKILL")
						} catch (e) {}

						resolve()
					}, 5_000)
				})

				try {
					await Promise.race([this.subprocess, kill])
				} catch (error) {
					console.log(
						`[ExecaTerminalProcess#run] subprocess termination error: ${error instanceof Error ? error.message : String(error)}`,
					)
				}

				if (timeoutId) {
					clearTimeout(timeoutId)
				}
			}

			this.emit(
				"shell_execution_complete",
				this.aborted ? { exitCode: undefined, signalName: "SIGKILL" } : { exitCode: 0 },
			)
		} catch (error) {
			if (error instanceof ExecaError) {
				console.error(`[ExecaTerminalProcess#run] shell execution error: ${error.message}`)
				this.emit("shell_execution_complete", {
					exitCode: this.aborted || error.signal ? error.exitCode : (error.exitCode ?? 1),
					signalName: error.signal ?? (this.aborted ? "SIGKILL" : undefined),
				})
			} else {
				console.error(
					`[ExecaTerminalProcess#run] shell execution error: ${error instanceof Error ? error.message : String(error)}`,
				)

				this.emit("shell_execution_complete", { exitCode: 1 })
			}
			this.subprocess = undefined
		}

		this.clearFlushTimer()
		this.terminal.setActiveStream(undefined)
		this.emitRemainingBufferIfListening()
		this.stopHotTimer()
		this.emit("completed", this.fullOutput)
		this.emit("continue")
		this.subprocess = undefined
	}

	public override continue() {
		this.clearFlushTimer()
		this.isListening = false
		this.removeAllListeners("line")
		this.emit("continue")
	}

	public override abort() {
		this.aborted = true

		const pid = this.pid

		const killSubprocessAndRoot = () => {
			if (this.subprocess) {
				try {
					this.subprocess.kill("SIGKILL")
				} catch (e) {
					console.warn(
						`[ExecaTerminalProcess#abort] Failed to kill subprocess: ${e instanceof Error ? e.message : String(e)}`,
					)
				}
			}

			if (pid) {
				try {
					process.kill(pid, "SIGKILL")
				} catch (e) {
					console.warn(
						`[ExecaTerminalProcess#abort] Failed to kill process ${pid}: ${e instanceof Error ? e.message : String(e)}`,
					)
				}
			}
		}

		if (!pid) {
			killSubprocessAndRoot()
			return
		}

		if (process.platform === "win32") {
			// Kill the full process tree atomically on Windows (avoids wmic dependency in ps-tree).
			execFile("taskkill", ["/pid", String(pid), "/T", "/F"], (err) => {
				if (err) {
					killSubprocessAndRoot()
				}
			})

			return
		}

		// Collect descendants via psTree before killing parent so children are not orphaned.
		psTree(pid, (err, children) => {
			if (!err) {
				for (const child of children) {
					const childPid = parseInt(child.PID)
					if (!isNaN(childPid)) {
						try {
							process.kill(childPid, "SIGKILL")
						} catch (e) {
							console.warn(
								`[ExecaTerminalProcess#abort] Failed to send SIGKILL to child PID ${childPid}: ${e instanceof Error ? e.message : String(e)}`,
							)
						}
					}
				}
			} else {
				console.error(`[ExecaTerminalProcess#abort] Failed to get process tree for PID ${pid}: ${err.message}`)
			}

			killSubprocessAndRoot()
		})
	}

	public override hasUnretrievedOutput() {
		return this.lastRetrievedIndex < this.fullOutput.length
	}

	public override getUnretrievedOutput() {
		let output = this.fullOutput.slice(this.lastRetrievedIndex)
		let index = output.lastIndexOf("\n")

		if (index === -1) {
			return ""
		}

		index++
		this.lastRetrievedIndex += index

		// console.log(
		// 	`[ExecaTerminalProcess#getUnretrievedOutput] fullOutput.length=${this.fullOutput.length} lastRetrievedIndex=${this.lastRetrievedIndex}`,
		// 	output.slice(0, index),
		// )

		return output.slice(0, index)
	}

	private clearFlushTimer() {
		if (this.flushTimer) {
			clearTimeout(this.flushTimer)
			this.flushTimer = undefined
		}
	}

	private emitRemainingBufferIfListening() {
		if (!this.isListening) {
			return
		}

		const output = this.getUnretrievedOutput()

		if (output !== "") {
			this.emit("line", output)
		}
	}
}
