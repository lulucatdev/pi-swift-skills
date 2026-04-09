# Swift Skills for pi

> **Upstream:** Fork of [Dimillian/Skills](https://github.com/Dimillian/Skills)  
> This project maintains pi integration for Swift and SwiftUI development skills.

A collection of 9 focused development skills for Swift and SwiftUI development on Apple platforms.

## Installation

```bash
pi install git:github.com/lulucatdev/pi-swift-skills
```

## Skills

| Skill | Description |
|-------|-------------|
| `swift-app-store-changelog` | Generate App Store release notes from git history |
| `swift-concurrency` | Swift 6.2+ concurrency fixes (`@MainActor`, `Sendable`, data races) |
| `swift-ios-debugger` | iOS simulator debugging with XcodeBuildMCP |
| `swift-macos-menubar` | macOS menubar apps with Tuist and SwiftUI |
| `swift-macos-packaging` | SwiftPM-based macOS app packaging without Xcode |
| `swiftui-liquid-glass` | iOS 26+ Liquid Glass API implementation |
| `swiftui-patterns` | 30+ SwiftUI component patterns and best practices |
| `swiftui-performance` | SwiftUI performance auditing and optimization |
| `swiftui-refactor` | SwiftUI view refactoring (MV-first architecture) |

## Usage

Invoke any skill directly:

```
/skill:swiftui-patterns
/skill:swift-concurrency
/skill:swiftui-performance
```

## Settings

Configure trigger mode and skill enablement:

```
/swift-settings
```

- **Manual mode** (default): Skills are disabled by default, use `/skill:name` to invoke
- **Auto mode**: All skills enabled by default

## Syncing with Upstream

```bash
git remote add upstream https://github.com/Dimillian/Skills.git
git fetch upstream
git merge upstream/main
```

### Post-merge checklist
- [ ] No new platform-specific files (.claude-plugin/, .codex/, etc.)
- [ ] All skill names match directory names
- [ ] SKILL.md frontmatter valid

## Acknowledgments

Originally built by [Dimillian](https://github.com/Dimillian).

## License

MIT — see LICENSE file.
