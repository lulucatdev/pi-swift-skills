---
name: swiftui-ui-patterns
description: Best practices and example-driven guidance for building SwiftUI views and components, including navigation hierarchies, custom view modifiers, and responsive layouts with stacks and grids. Use when creating or refactoring SwiftUI UI, designing tab architecture with TabView, composing screens with VStack/HStack, managing @State or @Binding, building declarative iOS interfaces, or needing component-specific patterns and examples.
---

# SwiftUI UI Patterns

## Quick start

Choose a track based on your goal:

### Existing project

- Identify the feature or screen and the primary interaction model (list, detail, editor, settings, tabbed).
- Find a nearby example in the repo with `rg "TabView\("` or similar, then read the closest SwiftUI view.
- Apply local conventions: prefer SwiftUI-native state, keep state local when possible, and use environment injection for shared dependencies.
- Choose the relevant component reference from `references/components-index.md` and follow its guidance.
- If the interaction reveals secondary content by dragging or scrolling the primary content away, read `references/scroll-reveal.md` before implementing gestures manually.
- Build the view with small, focused subviews and SwiftUI-native data flow.

### New project scaffolding

- Start with `references/app-wiring.md` to wire TabView + NavigationStack + sheets.
- Add a minimal `AppTab` and `RouterPath` based on the provided skeletons.
- Choose the next component reference based on the UI you need first (TabView, NavigationStack, Sheets).
- Expand the route and sheet enums as new screens are added.

## General rules to follow

- Use modern SwiftUI state (`@State`, `@Binding`, `@Observable`, `@Environment`) and avoid unnecessary view models.
- If the deployment target includes iOS 16 or earlier and cannot use the Observation API introduced in iOS 17, fall back to `ObservableObject` with `@StateObject` for root ownership, `@ObservedObject` for injected observation, and `@EnvironmentObject` only for truly shared app-level state.
- Prefer composition; keep views small and focused.
- Use async/await with `.task` and explicit loading/error states.
- Maintain existing legacy patterns only when editing legacy files.
- Follow the project's formatter and style guide.
- **Sheets**: Prefer `.sheet(item:)` over `.sheet(isPresented:)` when state represents a selected model. Avoid `if let` inside a sheet body. Sheets should own their actions and call `dismiss()` internally instead of forwarding `onCancel`/`onConfirm` closures.
- **Scroll-driven reveals**: Prefer deriving a normalized progress value from scroll offset and driving the visual state from that single source of truth. Avoid parallel gesture state machines unless scroll alone cannot express the interaction.

## State ownership matrix

Use the narrowest state tool that matches the ownership model:

| Scenario | Preferred pattern |
| --- | --- |
| Local UI state owned by one view | `@State` |
| Child mutates parent-owned value state | `@Binding` |
| Root-owned reference model on iOS 17+ | `@State` with an `@Observable` type |
| Child reads or mutates an injected `@Observable` model | Pass it explicitly as a stored property |
| Shared app service or configuration | `@Environment(Type.self)` |
| Legacy reference model on iOS 16 and earlier | `@StateObject` at the root, `@ObservedObject` when injected |

Choose the ownership location first, then pick the wrapper. Do not introduce a reference model when plain value state is enough.

## Navigation and routing

- Use `NavigationStack` and local route state for most features. Keep navigation ownership close to the feature unless multiple entry points truly need shared routing.
- In tabbed apps, prefer one navigation history per tab instead of a single shared stack for the entire app.
- Use enum-driven sheet, alert, and destination routing when presentation is mutually exclusive or deep-linkable.
- Centralize route enums only when the feature has deep links, handoff from multiple surfaces, or cross-feature navigation requirements.
- Avoid global routers for simple push flows that can stay local to one screen tree.
- See `references/navigationstack.md`, `references/sheets.md`, and `references/deeplinks.md` when the view needs more than straightforward local navigation.

## Preview guidance

- Add `#Preview` coverage for the primary state plus important secondary states such as loading, empty, and error.
- Use deterministic fixtures, mocks, and sample data. Do not make previews depend on live network calls, real databases, or global singletons.
- Install required environment dependencies directly in the preview so the view can render in isolation.
- Keep preview setup close to the view until it becomes noisy; then extract lightweight preview helpers or fixtures.
- If a preview crashes, fix the state initialization or dependency wiring before expanding the feature further.

## Async and task lifecycle

- Use `.task` for load-on-appear work that belongs to the view lifecycle.
- Use `.task(id:)` when async work should restart for a changing input such as a query, selection, or identifier.
- Treat cancellation as a normal path for view-driven tasks. Check `Task.isCancelled` in longer flows and avoid surfacing cancellation as a user-facing error.
- Debounce or coalesce user-driven async work such as search before it fans out into repeated requests.
- Keep UI-facing models and mutations main-actor-safe; do background work in services, then publish the result back to UI state.

## Performance guardrails

- Give `ForEach` and list content stable identity. Do not use unstable indices as identity when the collection can reorder or mutate.
- Keep expensive filtering, sorting, and formatting out of `body`; precompute or move it into a model/helper when it is not trivial.
- Narrow observation scope so only the views that read changing state need to update.
- Prefer lazy containers for larger scrolling content and extract subviews when only part of a screen changes frequently.
- Avoid swapping entire top-level view trees for small state changes; keep a stable root view and vary localized sections or modifiers.

## Environment injection policy

- Use `@Environment` for app-level services, shared clients, theme/configuration, and values that many descendants genuinely need.
- Prefer initializer injection for feature-local dependencies and models. Do not move a dependency into the environment just to avoid passing one or two arguments.
- Keep mutable feature state out of the environment unless it is intentionally shared across broad parts of the app.
- Use `@EnvironmentObject` only as a legacy fallback or when the project already standardizes on it for a truly shared object.

## Anti-patterns

- Giant views that mix layout, business logic, networking, routing, and formatting in one file.
- Multiple boolean flags for mutually exclusive sheets, alerts, or navigation destinations.
- Live service calls directly inside `body`-driven code paths instead of view lifecycle hooks or injected models/services.
- Reaching for `AnyView` to work around type mismatches that should be solved with better composition.
- Defaulting every shared dependency to `@EnvironmentObject` or a global router without a clear ownership reason.

## Platform and version guidance

- Prefer the newest SwiftUI API that fits the deployment target, but call out the minimum OS whenever guidance depends on it.
- When using iOS 17+ Observation or iOS 26+ UI APIs, include a fallback for older targets if the skill is meant to support them.
- Keep compatibility notes next to the rule or example they affect so the fallback is easy to apply.
- Avoid mixing the new Observation system and legacy Combine-based observation in the same feature unless compatibility requires it.

## Workflow for a new SwiftUI view

1. Define the view's state, ownership location, and minimum OS assumptions before writing UI code.
2. Identify which dependencies belong in `@Environment` and which should stay as explicit initializer inputs.
3. Sketch the view hierarchy, routing model, and presentation points; extract repeated parts into subviews. **Build and verify no compiler errors before proceeding.**
4. Implement async loading with `.task` or `.task(id:)`, plus explicit loading and error states when needed.
5. Add previews for the primary and secondary states, then add accessibility labels or identifiers when the UI is interactive.
6. Validate with a build: confirm no compiler errors, check that previews render without crashing, ensure state changes propagate correctly, and sanity-check that list identity and observation scope will not cause avoidable re-renders. For common SwiftUI compilation errors — missing `@State` annotations, ambiguous `ViewBuilder` closures, or mismatched generic types — resolve them before updating callsites. **If the build fails:** read the error message carefully, fix the identified issue, then rebuild before proceeding to the next step. If a preview crashes, isolate the offending subview, confirm its state initialisation is valid, and re-run the preview before continuing.

## Component references

Use `references/components-index.md` as the entry point. Each component reference should include:
- Intent and best-fit scenarios.
- Minimal usage pattern with local conventions.
- Pitfalls and performance notes.
- Paths to existing examples in the current repo.

For detail surfaces that progressively reveal actions, metadata, or contextual panels, use `references/scroll-reveal.md`.

## Sheet patterns

### Item-driven sheet (preferred)

```swift
@State private var selectedItem: Item?

.sheet(item: $selectedItem) { item in
    EditItemSheet(item: item)
}
```

### Sheet owns its actions

```swift
struct EditItemSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(Store.self) private var store

    let item: Item
    @State private var isSaving = false

    var body: some View {
        VStack {
            Button(isSaving ? "Saving…" : "Save") {
                Task { await save() }
            }
        }
    }

    private func save() async {
        isSaving = true
        await store.save(item)
        dismiss()
    }
}
```

## Adding a new component reference

- Create `references/<component>.md`.
- Keep it short and actionable; link to concrete files in the current repo.
- Update `references/components-index.md` with the new entry.
