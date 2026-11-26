import * as path from "path"
import * as os from "os"
import fs from "fs/promises"

/**
 * Gets the global .ladiz directory path based on the current platform
 *
 * @returns The absolute path to the global .ladiz directory
 */
export function getGlobalLadizDirectory(): string {
	return path.join(os.homedir(), ".ladiz")
}

/**
 * Gets the global .agents directory path based on the current platform.
 * This is a shared directory for agent skills across different AI coding tools.
 *
 * @returns The absolute path to the global .agents directory
 */
export function getGlobalAgentsDirectory(): string {
	return path.join(os.homedir(), ".agents")
}

/**
 * Gets the project-local .agents directory path for a given cwd.
 * This is a shared directory for agent skills across different AI coding tools.
 *
 * @param cwd - Current working directory (project path)
 * @returns The absolute path to the project-local .agents directory
 */
export function getProjectAgentsDirectoryForCwd(cwd: string): string {
	return path.join(cwd, ".agents")
}

/**
 * Gets the project-local .ladiz directory path for a given cwd
 *
 * @param cwd - Current working directory (project path)
 * @returns The absolute path to the project-local .ladiz directory
 */
export function getProjectLadizDirectoryForCwd(cwd: string): string {
	return path.join(cwd, ".ladiz")
}

/**
 * Checks if a directory exists
 */
export async function directoryExists(dirPath: string): Promise<boolean> {
	try {
		const stat = await fs.stat(dirPath)
		return stat.isDirectory()
	} catch (error: any) {
		if (error.code === "ENOENT" || error.code === "ENOTDIR") {
			return false
		}
		throw error
	}
}

/**
 * Checks if a file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
	try {
		const stat = await fs.stat(filePath)
		return stat.isFile()
	} catch (error: any) {
		if (error.code === "ENOENT" || error.code === "ENOTDIR") {
			return false
		}
		throw error
	}
}

/**
 * Reads a file safely, returning null if it doesn't exist
 */
export async function readFileIfExists(filePath: string): Promise<string | null> {
	try {
		return await fs.readFile(filePath, "utf-8")
	} catch (error: any) {
		if (error.code === "ENOENT" || error.code === "ENOTDIR" || error.code === "EISDIR") {
			return null
		}
		throw error
	}
}

/**
 * Discovers all .ladiz directories in subdirectories of the workspace
 *
 * @param cwd - Current working directory (workspace root)
 * @returns Array of absolute paths to .ladiz directories found in subdirectories,
 *          sorted alphabetically. Does not include the root .ladiz directory.
 */
export async function discoverSubfolderLadizDirectories(cwd: string): Promise<string[]> {
	try {
		// Dynamic import to avoid vscode dependency at module load time
		const { executeRipgrep } = await import("../search/file-search")

		const args = [
			"--files",
			"--hidden",
			"--follow",
			"-g",
			"**/.ladiz/**",
			"-g",
			"!node_modules/**",
			"-g",
			"!.git/**",
			cwd,
		]

		const results = await executeRipgrep({ args, workspacePath: cwd })

		const ladizDirs = new Set<string>()
		const rootLadizDir = path.join(cwd, ".ladiz")

		for (const result of results) {
			const match = result.path.match(/^(.+?)[/\\]\.ladiz[/\\]/)
			if (match) {
				const ladizDir = path.join(cwd, match[1], ".ladiz")
				if (ladizDir !== rootLadizDir) {
					ladizDirs.add(ladizDir)
				}
			}
		}

		return Array.from(ladizDirs).sort()
	} catch (error) {
		return []
	}
}

/**
 * Gets the ordered list of .ladiz directories to check (global first, then project-local)
 */
export function getLadizDirectoriesForCwd(cwd: string): string[] {
	return [getGlobalLadizDirectory(), getProjectLadizDirectoryForCwd(cwd)]
}

/**
 * Gets the ordered list of all .ladiz directories including subdirectories
 */
export async function getAllLadizDirectoriesForCwd(cwd: string): Promise<string[]> {
	const directories: string[] = [getGlobalLadizDirectory(), getProjectLadizDirectoryForCwd(cwd)]
	const subfolderDirs = await discoverSubfolderLadizDirectories(cwd)
	directories.push(...subfolderDirs)
	return directories
}

/**
 * Gets parent directories containing .ladiz folders, in order from root to subfolders
 */
export async function getAgentsDirectoriesForCwd(cwd: string): Promise<string[]> {
	const directories: string[] = [cwd]
	const subfolderLadizDirs = await discoverSubfolderLadizDirectories(cwd)

	for (const ladizDir of subfolderLadizDirs) {
		directories.push(path.dirname(ladizDir))
	}

	return directories
}

/**
 * Loads configuration from multiple .ladiz directories with project overriding global
 */
export async function loadConfiguration(
	relativePath: string,
	cwd: string,
): Promise<{
	global: string | null
	project: string | null
	merged: string
}> {
	const globalDir = getGlobalLadizDirectory()
	const projectDir = getProjectLadizDirectoryForCwd(cwd)

	const globalFilePath = path.join(globalDir, relativePath)
	const projectFilePath = path.join(projectDir, relativePath)

	const globalContent = await readFileIfExists(globalFilePath)
	const projectContent = await readFileIfExists(projectFilePath)

	let merged = ""

	if (globalContent) {
		merged += globalContent
	}

	if (projectContent) {
		if (merged) {
			merged += "\n\n# Project-specific rules (override global):\n\n"
		}
		merged += projectContent
	}

	return {
		global: globalContent,
		project: projectContent,
		merged: merged || "",
	}
}
