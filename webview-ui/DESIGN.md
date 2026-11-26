# Design System — Ladiz AI (`webview-ui`)

## Visual Direction: Developer-Native Pixel Craft

- **Surface & Palette:** Grounded in VS Code theme tokens (`--vscode-sideBar-background`, `--vscode-editor-background`, `--vscode-foreground`, `--vscode-descriptionForeground`, `--vscode-panel-border`). No synthetic dark-mode purple/blue gradients or glowing halos.
- **Iconography:** Minimalist. Decorative icons are omitted in favor of typography, alignment, and hairline dividers. Functional action icons (copy, delete, collapse) remain subtle and low-contrast until hovered.
- **Signature Motion (Pixel-Stepped):** Uses `steps()` CSS timing functions and crisp 2px/3px pixel blocks—no blurry glows or bouncy spring clichés.
- **Components:**
    - `RooHero`: Crisp pixel-grid `L` mark with a subtle stepped pixel-dot animation, paired with clean typography and version indicator.
    - `PromptSuggestions`: Clean, icon-free action list with hairline borders and subtle hover state, replacing colored icon-box cards.
    - `TaskCompletedCard`: Sharp, low-chrome completion block with a minimal pixel indicator.
