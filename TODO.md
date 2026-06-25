# TODO - Stitch Design System Integration (Linguist CRM Dashboard)

## 1. globals.css token normalization
- [x] Align light palette tokens to the exact requested values from the Stitch scheme (syntax fixed; tokens restored)
- [x] Ensure radii (`--radius`, `--radius-lg`) match requested values
- [ ] Keep/adjust dark-mode overrides so builds remain consistent

## 2. src/app/page.module.css dashboard styling
- [x] Remove hardcoded color usage (e.g. `.phaseIndicatorCompleted`)
- [ ] Ensure sidebar/card backgrounds and borders match Stitch tokens

## 3. Subpages: table/input focus + status badges
- [ ] Standardize focus states to `2px solid var(--primary)` (leads/students/fees inputs/selects, attendance dateInput)
- [ ] Verify status badge/dropdown token mappings to existing class names
- [ ] Add missing ACTIVE/PENDING badge classes ONLY if corresponding JSX classes exist

## 4. Verification
- [ ] Run `npm run build`
- [ ] Manual sanity-check routes: `/`, `/leads`, `/students`, `/fees`, `/attendance`, `/reports`
