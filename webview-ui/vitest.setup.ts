import Module from "module"

// Normalize Windows drive letter casing to avoid duplicate module instances in require.cache
const originalResolveFilename = (Module as any)._resolveFilename
if (originalResolveFilename) {
	;(Module as any)._resolveFilename = function (request: string, parent: any, isMain: boolean, options: any) {
		const filename = originalResolveFilename.call(this, request, parent, isMain, options)
		if (typeof filename === "string" && /^[a-zA-Z]:[\\\/]/.test(filename)) {
			return filename[0].toLowerCase() + filename.slice(1)
		}
		return filename
	}
}

// Also sync require.cache if any module was cached with uppercase drive letter
const cacheProxy = new Proxy(require.cache, {
	get(target, prop: string) {
		if (typeof prop === "string" && /^[a-zA-Z]:[\\\/]/.test(prop)) {
			const lower = prop[0].toLowerCase() + prop.slice(1)
			const upper = prop[0].toUpperCase() + prop.slice(1)
			return target[lower] ?? target[upper]
		}
		return target[prop]
	},
	set(target, prop: string, value) {
		target[prop] = value
		if (typeof prop === "string" && /^[a-zA-Z]:[\\\/]/.test(prop)) {
			const lower = prop[0].toLowerCase() + prop.slice(1)
			const upper = prop[0].toUpperCase() + prop.slice(1)
			target[lower] = value
			target[upper] = value
		}
		return true
	},
})
;(Module as any)._cache = cacheProxy

import "@testing-library/jest-dom"
import "@testing-library/jest-dom/vitest"

// Force React into development mode for tests
// This is needed to enable act(...) function in React Testing Library
globalThis.process = globalThis.process || {}
globalThis.process.env = globalThis.process.env || {}
globalThis.process.env.NODE_ENV = "development"

class MockResizeObserver {
	observe() {}
	unobserve() {}
	disconnect() {}
}

global.ResizeObserver = MockResizeObserver

// Fix for Microsoft FAST Foundation compatibility with JSDOM
// FAST Foundation tries to set HTMLElement.focus property, but it's read-only in JSDOM
// The issue is that FAST Foundation's handleUnsupportedDelegatesFocus tries to set element.focus = originalFocus
// but JSDOM's HTMLElement.focus is a getter-only property
Object.defineProperty(HTMLElement.prototype, "focus", {
	get: function () {
		return (
			this._focus ||
			function () {
				// Mock focus behavior for tests
			}
		)
	},
	set: function (value) {
		this._focus = value
	},
	configurable: true,
})

Object.defineProperty(window, "matchMedia", {
	writable: true,
	value: vi.fn().mockImplementation((query) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(),
		removeListener: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	})),
})

// Mock scrollIntoView which is not available in jsdom
Element.prototype.scrollIntoView = vi.fn()
