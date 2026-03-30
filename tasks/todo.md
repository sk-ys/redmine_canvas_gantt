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
