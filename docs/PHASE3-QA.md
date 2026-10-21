# Phase 3 verification

Synthetic data only; API requests intercepted in a local static server. No real model request, client resume, inquiry or booking was submitted.

## Automated checks

`tests/next-steps.cjs` runs with Node.js and an available Playwright installation/browser. No production package dependency was added. Use `node tests/next-steps.cjs` when Playwright/Chromium are locally available. Alternatively set `PLAYWRIGHT_MODULE` to an installed module's absolute path and `BROWSER_CHANNEL=chrome` to use installed Chrome. The runner serves only the local checkout on `127.0.0.1:5204`; unhandled local API paths return 503 instead of reaching a real model. It downloads axe-core 4.10.3 from cdnjs for the accessibility checks. Generated screenshots/JSON are ignored under `.qa-output/`.

Run `node tests/focus.cjs` with the same environment for the additional skip-link/back-to-top focus states. This uses a local server on port 5206, blocks API requests and generates focused-state results/footer screenshots. The existing menu/focus transitions are allowed to finish before scanning visible states.

Baseline comparison uses commit `9d35b8875352f80e5909416c16ff214c1bed110f`, which must be available in local Git history.

- All five choices checked at 375, 768 and 1440px, including initial unselected state and exact guidance destinations.
- Self-help has only the Resources/ATS links; unsure has only Resources and the correctly labelled Calendly call. Other choices have their specified free links and one optional named service.
- Changing selection replaces prior guidance; arrow-key operation selects the next native radio. Focus remains on the control. Re-running resets all choices and leaves one result-container listener.
- Final accessibility cleanup also checks native Enter operation of the mobile menu, visible keyboard focus, Tab from the selected radio into the guidance links and Shift+Tab back, the named results region/radio group, and scoped polite/atomic guidance announcements. Accessibility-tree snapshots are generated for each width; audible output with physical assistive technology remains a manual check.
- All six original section HTML blocks match baseline exactly after a successful result and after every selected option. Assessment section definitions, normalization/parsing/escaping and the API source match baseline.
- Empty, whitespace, partial, unstructured, non-string and duplicate-heading results do not create paid-service choices. A complete result containing unsafe HTML is escaped without creating script/image nodes or executing injected text.
- HTTP error, malformed JSON, missing result and invalid resubmission after a successful selection clear the previous recommendations. Original error notices remain in use.
- Request payload retains `jobTitle`, `jobPosting`, `resumeText`. No analytics requests/GA function, localStorage/sessionStorage entries or JavaScript errors occur during the suite.
- No horizontal overflow in the tested states at 375/768/1440px.
- **Strict whole-page axe checks:** **29 current-page states plus six targeted focus states passed with zero violations**, at 375/768/1440px. Current states cover initial, complete/unselected, all five options, partial results, API errors and the fully open mobile menu where visible; focused states cover the visible skip link and back-to-top control. **21 panel-scoped checks also passed with zero violations**, covering complete/unselected, all choices and partial-result fallback. Six historical baseline checks are recorded separately to demonstrate the correction; they do not waive any current-page violations.
- `node --check script.js`, `node --check tests/next-steps.cjs`, `node --check tests/focus.cjs`, and `git diff --check` pass. No framework build/test command existed in the baseline; no package/build tooling was introduced.

## Accessibility cleanup results

The previously reported footer/number contrast findings and nested-complementary-landmark warning are corrected. Footer descriptions, links and copyright use a readable light slate; headings retain light gold. Section numbers use darker gold. The result wrapper is a labelled `section` (region) within `main`, preserving the heading reference and live-region behavior without a nested complementary landmark. Neither the original six section elements nor assessment/service content changed.

Focused-state testing additionally exposed the original white-on-gold skip-link text; it is now navy on gold. Focus indicators use navy on light content and light gold on dark surfaces. A dark backing ring keeps the floating back-to-top focus indicator distinct, and keyboard focus makes that otherwise scroll-dependent control fully visible. Navigation destinations and behavior remain unchanged.

Computed WCAG contrast ratios for the changed colours:

| Element | Foreground/background | Ratio |
| --- | --- | --- |
| Footer text and links | `#cbd5e1` / `#162444` | 10.32:1 |
| Footer headings | `#E8B655` / `#162444` | 8.21:1 |
| Result section numbers | `#865b14` / `#F0EAE0` | 4.99:1 |
| Focus on light content | `#0C1B33` / `#FAF7F2` | 16.10:1 |
| Focus on dark navigation | `#E8B655` / `#0C1B33` | 9.22:1 |

No remaining automated accessibility violations are accepted in the tested current states. Historical baseline violations in generated JSON describe the old version only, not the final branch.

Automated checks are not a screen-reader or WCAG certification. Physical mobile-device and assistive-technology testing remains manual.

## Evidence and limits

Selected before/after mobile and desktop screenshots are in `docs/previews/`. They contain synthetic results. Sticky navigation/back-to-top controls are hidden only during result-panel screenshots to prevent screenshot stitching overlays; they remain available in the actual page, including the improved keyboard-focus treatment. Full machine-readable results and other screenshots are generated under `.qa-output/`.

- Mobile: [before](previews/before-results-375.png), [after selecting resume support](previews/after-resume-375.png).
- Desktop: [before](previews/before-results-1440.png), [after selecting resume support](previews/after-resume-1440.png).
- Final footer contrast: [mobile](previews/footer-final-375.png), [desktop](previews/footer-final-1440.png).

All eight requested destination URLs returned HTTP 200 and the three package anchors matched their live sections. Calendly rendered the active 15-minute event/calendar; no booking was made. Destination availability should be reconfirmed before later deployment. No analytics or conversion improvement is claimed, and no production deployment was performed.
