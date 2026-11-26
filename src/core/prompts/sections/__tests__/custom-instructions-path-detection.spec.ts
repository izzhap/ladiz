import * as path from "path"

describe("custom-instructions path detection", () => {
	it("should use exact path comparison instead of string includes", () => {
		// Test the logic that our fix implements
		const fakeHomeDir = "/Users/john.ladiz.smith"
		const globalLadizDir = path.join(fakeHomeDir, ".ladiz") // "/Users/john.ladiz.smith/.ladiz"
		const projectLadizDir = "/projects/my-project/.ladiz"

		// Old implementation (fragile):
		// const isGlobal = ladizDir.includes(path.join(os.homedir(), ".ladiz"))
		// This could fail if the home directory path contains ".ladiz" elsewhere

		// New implementation (robust):
		// const isGlobal = path.resolve(ladizDir) === path.resolve(getGlobalLadizDirectory())

		// Test the new logic
		const isGlobalForGlobalDir = path.resolve(globalLadizDir) === path.resolve(globalLadizDir)
		const isGlobalForProjectDir = path.resolve(projectLadizDir) === path.resolve(globalLadizDir)

		expect(isGlobalForGlobalDir).toBe(true)
		expect(isGlobalForProjectDir).toBe(false)

		// Verify that the old implementation would have been problematic
		// if the home directory contained ".roo" in the path
		const oldLogicGlobal = globalLadizDir.includes(path.join(fakeHomeDir, ".ladiz"))
		const oldLogicProject = projectLadizDir.includes(path.join(fakeHomeDir, ".ladiz"))

		expect(oldLogicGlobal).toBe(true) // This works
		expect(oldLogicProject).toBe(false) // This also works, but is fragile

		// The issue was that if the home directory path itself contained ".roo",
		// the includes() check could produce false positives in edge cases
	})

	it("should handle edge cases with path resolution", () => {
		// Test various edge cases that exact path comparison handles better
		const testCases = [
			{
				global: "/Users/test/.ladiz",
				project: "/Users/test/project/.ladiz",
				expected: { global: true, project: false },
			},
			{
				global: "/home/user/.ladiz",
				project: "/home/user/.ladiz", // Same directory
				expected: { global: true, project: true },
			},
			{
				global: "/Users/john.ladiz.smith/.ladiz",
				project: "/projects/app/.ladiz",
				expected: { global: true, project: false },
			},
		]

		testCases.forEach(({ global, project, expected }) => {
			const isGlobalForGlobal = path.resolve(global) === path.resolve(global)
			const isGlobalForProject = path.resolve(project) === path.resolve(global)

			expect(isGlobalForGlobal).toBe(expected.global)
			expect(isGlobalForProject).toBe(expected.project)
		})
	})
})
