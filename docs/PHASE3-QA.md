# Phase 3 verification

Synthetic data only; API requests intercepted in a local static server. No real model request, client resume, inquiry or booking was submitted.

## Automated checks

`tests/next-steps.cjs` runs with Node.js and an available Playwright installation/browser. No production package dependency was added. Use `node tests/next-steps.cjs` when Playwright/Chromium are locally available. Alternatively set `PLAYWRIGHT_MODULE` to an installed module's absolute path and `BROWSER_CHANNEL=chrome` to use installed Chrome. The runner serves only the local checkout on `127.0.0.1:5204`; unhandled local API paths return 503 instead of reaching a real model. It downloads axe-core 4.10.3 from cdnjs for the accessibility checks. Generated screenshots/JSON are ignored under `.qa-output/`.

Baseline comparison uses commit `9d35b8875352f80e5909416c16ff214c1bed110f`, which must be available in local Git history.

- All five choices checked at 375, 768 and 1440px, including initial unselected state and exact guidance destinations.
- Self-help has only the Resources/ATS links; unsure has only Resources and the correctly labelled Calendly call. Other choices have their specified free links and one optional named service.
- Changing selection replaces prior guidance; arrow-key operation selects the next native radio. Focus remains on the control. Re-running resets all choices and leaves one result-container listener.
- All six original section HTML blocks match baseline exactly after a successful result and after every selected option. Assessment section definitions, normalization/parsing/escaping and the API source match baseline.
- Empty, whitespace, partial, unstructured, non-string and duplicate-heading results do not create paid-service choices. A complete result containing unsafe HTML is escaped without creating script/image nodes or executing injected text.
- HTTP error, malformed JSON, missing result and invalid resubmission after a successful selection clear the previous recommendations. Original error notices remain in use.
- Request payload retains `jobTitle`, `jobPosting`, `resumeText`. No analytics requests/GA function, localStorage/sessionStorage entries or JavaScript errors occur during the suite.
- No horizontal overflow in the tested states at 375/768/1440px.
- **27 whole-page axe checks:** two baseline states and seven current states per viewport. Existing baseline findings are compared by rule/target (normalizing positional selectors after insertion of the accessible results heading). No introduced violations. **18 additional panel-scoped checks:** complete/unselected plus five options per viewport; zero violations in the new panel.
- `node --check script.js`, `node --check tests/next-steps.cjs`, and `git diff --check` pass. No framework build/test command existed in the baseline; no package/build tooling was introduced.

## Existing accessibility findings

The original page reports low contrast for footer descriptive text, footer headings/copyright and pale decorative result numbers. It also reports `landmark-complementary-is-top-level` for the result aside nested within the main landmark. These are present in the baseline; the new panel introduces none of them. They remain documented for a separately scoped cleanup. The original result aside's label target disappeared after result rendering; the added hidden results heading now keeps that reference valid.

Automated checks are not a screen-reader or WCAG certification. Physical mobile-device and assistive-technology testing remains manual.

## Evidence and limits

Selected before/after mobile and desktop screenshots are in `docs/previews/`. They contain synthetic results. Sticky navigation/back-to-top controls are hidden only during result-panel screenshots to prevent screenshot stitching overlays; they are unchanged and remain visible in the actual page. Full machine-readable results and other screenshots are generated under `.qa-output/`.

- Mobile: [before](previews/before-results-375.png), [after selecting resume support](previews/after-resume-375.png).
- Desktop: [before](previews/before-results-1440.png), [after selecting resume support](previews/after-resume-1440.png).

All eight requested destination URLs returned HTTP 200 and the three package anchors matched their live sections. Calendly rendered the active 15-minute event/calendar; no booking was made. Destination availability should be reconfirmed before later deployment. No analytics or conversion improvement is claimed, and no production deployment was performed.
