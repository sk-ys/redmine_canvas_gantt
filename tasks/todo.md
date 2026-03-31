# Epic 6 query compatibility

- [x] Audit current query URL parsing and Redmine issue-list navigation flow
- [x] Extend backend query resolution for Redmine standard filter parameters and snake_case sort
- [x] Extend SPA query parsing and Redmine issue-list URL generation while preserving Canvas URL compatibility
- [x] Update Epic 6 spec notes to match the implemented compatibility boundaries
- [x] Add/update frontend and backend coverage for standard URL parsing and round-trip navigation
- [x] Run targeted verification and record results

## Review

- Backend `QueryStateResolver` now accepts Redmine standard issue query params (`set_filter`, `f[]`, `op[field]`, `v[field][]`) for the supported fields and returns warnings for unsupported fields/operators
- Snake_case Redmine `sort` values such as `start_date:desc` now normalize into the existing internal sort keys without breaking the existing Canvas URL contract
- SPA query helpers now read Redmine standard URLs, keep Canvas-specific URL sync behavior for backward compatibility, and build canonical Redmine issue-list URLs separately
- The toolbar `Redmineでクエリ編集` action now carries supported shared filters back to Redmine using standard issue-list query parameters and emits warnings when a filter cannot be represented exactly
- Updated `spec-docs/epic6.md` to document the actual compatibility boundary: supported fields/operators, `localStorage` scope, and round-trip limitations
- Verification passed with `cd spa && npm run test -- --run src/utils/queryParams.test.ts src/components/GanttToolbar.test.tsx src/api/client.test.ts`
- Verification passed with `cd spa && npx tsc -b`
- Verification passed with `cd spa && npm run lint`
- Ruby syntax checks passed for `lib/redmine_canvas_gantt/query_state_resolver.rb` and `spec/lib/redmine_canvas_gantt/query_state_resolver_spec.rb`

# Help screen refresh

- [x] Audit current help dialog against the live toolbar and editing flows
- [x] Refresh the help dialog content and structure for the current UI
- [x] Add/update localized help strings and frontend i18n payload keys
- [x] Update frontend/backend coverage for the refreshed help content
- [x] Run targeted verification and record results

## Review

- Help dialog now uses three quick-reference sections that match the live toolbar and editing flows
- Added coverage for missing current controls including query editor, workload pane, month navigation, top, and manual save/cancel behavior
- Replaced emoji markers in the operations area with SVG-based icons for consistency with the rest of the UI
- Localized new help labels/descriptions in Japanese and English and exposed them through the controller i18n payload
- Verification passed with `cd spa && npm run test -- --run src/components/HelpDialog.test.tsx src/components/GanttToolbar.test.tsx`
- Verification passed with `cd spa && npm run lint`
- Verification passed with `cd spa && npx tsc -b`
- Ruby syntax checks passed for controller and controller spec
- Docker Redmine runtime still could not execute plugin RSpec because `rspec` is not installed in the container (`bundler: command not found: rspec`)

# Epic 5 sidebar auto-scroll

- [x] Audit the current sidebar drag-and-drop and virtual scroll flow
- [x] Implement sidebar drag auto-scroll in `useSidebarDragAndDrop`
- [x] Wire `UiSidebar` body refs into the drag hook without changing DnD business rules
- [x] Refresh `spec-docs/epic5.md` so it matches the implementation contract
- [x] Add/update frontend coverage for the auto-scroll behavior
- [x] Run targeted verification and record results

## Review

- Added sidebar drag auto-scroll driven by `requestAnimationFrame`, with pointer updates from both task-row and body `dragover` handlers
- Kept existing child/root drop business rules unchanged and delegated scroll clamping to the existing store `updateViewport`
- Added pure helper coverage for edge-zone speed calculation and component coverage for row dragover auto-scroll plus dragend cancellation
- Refreshed `spec-docs/epic5.md` to document the `bodyRef` contract, `dragover` vs frame-loop responsibilities, and acceptance criteria for virtualized rows
- Verification passed with `cd spa && npm run test -- --run src/components/sidebar/sidebarAutoScroll.test.ts src/components/UiSidebar.test.tsx`
- Verification passed with `cd spa && npm run lint`
- Verification passed with `cd spa && npx tsc -b`
- Vitest logs still include jsdom canvas warnings (`HTMLCanvasElement.getContext()` not implemented), but the targeted tests passed

# Query refactor

- [x] Split backend query resolution responsibilities in `lib/redmine_canvas_gantt/query_state_resolver.rb`
- [x] Centralize store-to-query serialization in `spa/src/utils/queryParams.ts`
- [x] Remove unused `spa/src/stores/queryParamsWatcher.ts` and `spa/src/utils/businessQueryState.ts`
- [x] Add backend/frontend coverage for the refactored query-state helpers
- [x] Run targeted verification and record results

## Review

- Backend resolver now separates query resolution, query-derived state extraction, request overrides, and issue scope construction
- Query state now flows through `toResolvedQueryStateFromStore` for both URL sync and API refreshes
- Existing URL contract and backend payload shape were preserved
- Verification passed with `npm run lint`
- Verification passed with `npm run test -- --run src/utils/queryParams.test.ts src/api/client.test.ts src/components/GanttToolbar.test.tsx`
- Verification passed with `npx tsc -b`
- Ruby syntax checks passed for resolver and resolver spec
- Docker Redmine runtime still could not execute plugin RSpec because `rspec` is not installed in the container (`bundler: command not found: rspec`)

# Canvas Gantt query integration

- [x] Inspect current backend/frontend filter and persistence flow
- [x] Add backend query resolution for `query_id` and URL params
- [x] Return resolved shared filter state in `data.json`
- [x] Separate shared conditions from UI preferences in SPA
- [x] Sync shared filter changes back into the URL
- [x] Add controller/frontend tests for the new behavior
- [x] Run targeted backend/frontend verification

# Epic 4 Phase 1

- [x] Confirm Redmine issue index injection point in the runtime view
- [x] Add Canvas Gantt toolbar navigation to the standard Redmine query editor
- [x] Inject `Canvas Ganttで開く` action into the Redmine issue query form
- [x] Add i18n strings and frontend payload labels for the new query actions
- [x] Add targeted frontend/backend specs for the Phase 1 flow
- [x] Run targeted verification for the Phase 1 changes

## Review

- Frontend verification passed with `npm run lint`
- Frontend verification passed with targeted Vitest runs for API, query params, TaskStore, and toolbar flows
- Ruby syntax checks passed for controller, payload builder, resolver, and resolver spec
- Docker Redmine runtime did not have the `rspec` executable available, so backend RSpec could not be executed in this session
- Phase 1 verification passed with `npm run lint`
- Phase 1 targeted frontend verification passed with `npm run test -- --run src/components/GanttToolbar.test.tsx src/utils/queryParams.test.ts src/api/client.test.ts`
- Phase 1 Ruby syntax checks passed for the new hook, controller, and issue-index partial
- Phase 1 plugin load check passed with `docker compose exec -T redmine bundle exec rails runner "require Rails.root.join('plugins','redmine_canvas_gantt','init.rb'); puts 'plugin-init-ok'"`

# Mixed refactor wave 1

- [x] Refactor `spa/src/stores/TaskStore.ts` parent-move flows into shared helpers under `spa/src/stores/taskStore/`
- [x] Preserve `TaskStore` behavior for autosave off/on, rollback, and parent/root move results with focused frontend coverage
- [x] Refactor relation create/update orchestration in `app/controllers/canvas_gantts_controller.rb`
- [x] Preserve relation endpoint JSON/status behavior with focused controller coverage
- [x] Run targeted frontend/backend verification and record results

## Review

- Extracted `TaskStore` parent-move orchestration into `spa/src/stores/taskStore/parentMove.ts`, keeping optimistic updates, autosave branching, rollback, and `lockVersion` handling centralized
- Added focused `TaskStore` coverage for autosave ON/OFF, API failure rollback, and returned `parentId` / `siblingPosition` values
- Centralized relation create/update save orchestration in `CanvasGanttsController` without changing endpoint JSON or status behavior
- Verification passed with `cd spa && npm run test -- --run src/stores/TaskStore.test.ts`
- Verification passed with `cd spa && npx tsc -b`
- Verification passed with `cd spa && npm run lint`
- Ruby syntax checks passed for controller and controller spec
- Docker Redmine runtime still could not execute controller RSpec because `rspec` is not installed in the container (`bundler: command not found: rspec`)
