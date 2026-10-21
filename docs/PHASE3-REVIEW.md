# Phase 3: optional diagnostic next steps

Prepared October 20, 2026. Base: `main` at `9d35b8875352f80e5909416c16ff214c1bed110f`. Branch: `codex/phase3-diagnostic-next-steps`. No merge or deployment was performed.

## Audit and changes

Reviewed `index.html`, `styles.css`, `script.js`, the API source, navigation/footer, privacy copy and the website repository's `docs/PHASE2-DIAGNOSTIC-SPEC.md`. The existing API returns prose split into six fixed sections; there are no reliable service categories. The old generic results CTA labelled a contact-page link as a booking and was appended regardless of result completeness.

Replaced it with an optional five-choice planning panel after the six result sections. No choice is selected initially. Free resources precede optional paid-service information. The self-help option contains only free links; the unsure option offers resources and the direct introductory call. Nothing classifies result prose or presumes every visitor needs a paid service.

The panel uses native labelled radios in a fieldset, fixed allowlisted destinations and DOM/textContent construction. Changing choices replaces one guidance area, keeps focus on the radio, and announces the guidance through a scoped polite live region. A single delegated change listener stays on the stable result container. Selections exist in the current DOM only and reset when the assessment is re-run.

A structural guard checks only that all six expected section headings occur once, in order, with non-empty parsed bodies. It does not inspect sentiment, keywords or meaning. Partial/malformed results retain the original six-section rendering and receive a free-resources fallback without service choices. Empty/API-error/invalid resubmissions clear earlier next-step guidance. An existing missing accessible label after rendering was addressed with a hidden results heading; the six original section elements/content remain unchanged.

The persistent optional call banner now explains the introductory scope and uses “Book a Free 15-Minute Introductory Call” with the existing Calendly destination. Footer service labels/anchors now match Career Clarity Session, Resume Strategy Package and Multi-Path Career Strategy. No pricing is copied into the diagnostic; current main-site scope and terms remain the source of truth.

### Files

- `script.js`: fixed choices, safe DOM builders, structural completeness gate, one delegated listener, result-footer insertion and stale-guidance reset.
- `styles.css`: scoped radio/guidance styles reusing the existing navy/gold/cream CTA panel, fonts and buttons.
- `index.html`: introductory-call copy, specific footer service destinations and semantic labelled results section.
- `tests/next-steps.cjs` and `tests/focus.cjs`: browser regression/accessibility suites, local synthetic API interception and screenshots, including focused controls.
- `.gitignore`: generated QA output and optional local test dependencies.
- This review record and `docs/PHASE3-QA.md`; selected screenshots under `docs/previews/`.

## Assessment and privacy invariants

`functions/api/diagnostic.js` is unchanged. No prompt, model setting, scoring, interpretation, API contract, input field or resume-processing instruction was changed. The three submitted fields and existing trimming/request behavior are preserved. `SECTIONS`, normalization, parsing and escaping functions are unchanged; tests compare the six rendered section HTML blocks exactly against the baseline.

No analytics, credentials, localStorage, sessionStorage, cookies, model call or new dependency was added to the production implementation. The existing privacy notice about third-party processing remains unchanged. Results and selections are not persisted or sent anywhere by the new UI. No real client resume was used in tests. Test-only environment variables configure Playwright/browser paths; they are not API credentials.

## Destination verification before implementation

Direct browser checks returned HTTP 200 for both new articles, Resources, the ATS article, and all three service anchors. Each anchor resolves to the expected named package. Calendly returned HTTP 200 and rendered Julia Cher's “Free 15-Minute Fit Call,” its 15-minute duration and calendar. No appointment was created. Service scope was compared with the live website: Career Clarity is direction/review/planning without resume writing; Resume Strategy addresses one agreed target; Multi-Path addresses two agreed directions. The UI explicitly avoids assuming that two job titles always need two resumes.

All UI destinations are fixed public links from the brief. No contact form is labelled as a direct booking. Navigation and the original assessment remain available independently of the optional panel.

## Before deployment

Review all five guidance states, mobile screenshots and wording. Manually check screen-reader announcements/focus and physical iOS/Android radio behavior. Reconfirm destination availability if deployment occurs later. Public HTTP/Calendly checks do not prove successful appointment creation, email delivery or service availability for a particular client. No such transaction was performed.

The final focused cleanup resolves the old footer/number contrast issues and replaces the nested complementary landmark with a labelled results section. Focus colours adapt to light and dark surfaces. The test suite now requires zero current-page axe violations, rather than allowing existing ones; the QA record includes keyboard/focus/live-region assertions and contrast ratios. Physical screen-reader/device review remains a manual limitation, and automated success is not a complete WCAG certification.

The visible skip link also uses navy-on-gold text, and the back-to-top control becomes fully visible on keyboard focus with a contrasting backing ring. All 35 tested current-page/focused states and 21 panel-scoped checks pass with zero remaining automated violations. Historical baseline findings are retained only as before-state evidence.

Cloudflare production/preview settings were not changed. Approval and deployment are separate actions outside this task. There is no new analytics or assessment change to activate after merge.
