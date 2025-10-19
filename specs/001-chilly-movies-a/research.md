````markdown
```markdown
# Research: Cinematic UI Overhaul

**Date**: 2025-10-18
**Spec**: [spec.md](./spec.md)
**Plan**: [plan.md](./plan.md)

This document outlines the research and decisions made for the implementation of the new cinematic UI.

## 1. UI Component Cleanup Strategy

**Decision**: A "rip and replace" strategy will be employed for the `src/renderer` directory. All existing components in `src/renderer/components` and views in `src/renderer/views` will be deleted. The `App.tsx` and `index.css` files will be completely overwritten. The `CINEMATIC_UI_REDESIGN.md` and related config files (`tailwind.config.js`, `postcss.config.cjs`) will also be removed as they belong to the previous implementation.

**Rationale**: The new UI design provided in the prompt is a complete departure from the previous "cinematic" UI. Attempting to refactor the old components would be more time-consuming and error-prone than starting fresh. A clean slate ensures no legacy styles or logic conflicts with the new implementation. The core application logic (backend, services) is decoupled from the UI and will remain untouched.

**Alternatives Considered**:
- **Incremental Refactoring**: Replacing one component at a time. Rejected because the new design has a different structure, component library, and styling paradigm (Tailwind CSS from the ground up), making incremental changes difficult and inconsistent.

**Affected Files for Removal/Overwrite**:
- `/src/renderer/App.tsx` (Overwrite)
- `/src/renderer/index.css` (Overwrite)
- `/src/renderer/components/` (Delete directory)
- `/src/renderer/views/` (Delete directory)
- `tailwind.config.js` (Overwrite)
- `postcss.config.cjs` (Delete, will be re-evaluated)
- `CINEMATIC_UI_REDESIGN.md` (Delete)

## 2. Tailwind CSS Integration

**Decision**: The `tailwind.config.js` provided in the prompt's HTML reference will be used as the new configuration. It will be placed at the root of the project. The `postcss.config.cjs` will be simplified to the standard setup for Tailwind CSS v3. The main CSS file (`src/renderer/index.css`) will be reset to include only the core Tailwind directives.

**Rationale**: The provided HTML is a self-contained prototype. Using its embedded Tailwind configuration ensures that the visual fidelity of the final implementation matches the reference design. The existing `postcss.config.cjs` was for a different version/setup of Tailwind and should be replaced to avoid build issues.

**Implementation Details**:
1.  Create a new `tailwind.config.js` at the project root with the content from the HTML `<script>` tag.
2.  Create a standard `postcss.config.cjs` file.
3.  Replace the content of `src/renderer/index.css` with:
    ```css
    @tailwind base;
    @tailwind components;
    @tailwind utilities;
    /* Custom scrollbar styles from reference */
    ::-webkit-scrollbar { width: 8px; }
    ::-webkit-scrollbar-track { background: #1f2937; }
    ::-webkit-scrollbar-thumb { background-color: #4b5563; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background-color: #6b7280; }
    ```

## 3. Functional Integration Points

**Decision**: Existing application logic will be re-integrated into the new component structure.

**Rationale**: The core backend and application services are stable. The UI is the only layer being replaced. A clear mapping is required to ensure all features continue to work.

**Mapping**:

| Existing Functionality | New UI Implementation | File/Component | Notes |
| :--- | :--- | :--- | :--- |
| **Routing** | `react-router-dom`'s `<BrowserRouter>`, `<Routes>`, `<Route>` will be used in the main layout. | `App.tsx` | No change in library, just in structure. |
| **Navigation** | `<NavLink>` will be replaced by `<a>` tags styled as buttons within the new sidebar. Active states will be handled by a custom hook or logic if needed, but for this design, we will use static links first. | `App.tsx` (Sidebar) | The reference uses `<a>` tags. We will adapt this to work with `react-router-dom`. |
| **Bilingual Support** | The `useTranslation` hook from `react-i18next` will be used. The language switcher will be a `<select>` dropdown in the sidebar. | `App.tsx` (Sidebar) | The `toggleLanguage` logic will be adapted to work with the new dropdown. |
| **Theme Switching** | A dark/light mode toggle will be implemented in the header. | `App.tsx` (Header) | The logic `document.documentElement.classList.toggle('dark')` from the reference is standard and will be used. |
| **Search** | A search input will be placed in the header. The `onSearch` prop will be passed down from a parent view. | `App.tsx` (Header) | The search functionality itself is managed by higher-level views, the header just contains the input. |
| **Discovery View** | Will be the main content area, displaying movie cards. | `views/HomeView.tsx` | The old `DiscoveryView.tsx` will be replaced by a new `HomeView.tsx` to match the reference. |
| **Downloads/Library/Settings** | These will be separate views, routed from the sidebar. | `views/DownloadsView.tsx`, etc. | New, simplified views will be created. |

This research concludes Phase 0. All "NEEDS CLARIFICATION" items are resolved. The path forward is to execute the cleanup and then begin implementation based on this plan.


```
````
