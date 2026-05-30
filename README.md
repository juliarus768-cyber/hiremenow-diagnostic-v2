# Hire Me Now Career Positioning Diagnostic

## Project overview

This repository contains a standalone Cloudflare Pages web application for Hire Me Now Resumes. The tool lets a visitor paste a target job title, an optional job posting, and resume text, then receive a structured career positioning diagnostic describing how a Canadian employer may interpret the resume for that role.

Production Pages URL after deployment:

- https://hiremenow-diagnostic-v2.pages.dev/

Main business website:

- https://hiremenowresumes.ca/

## File structure

```text
hiremenow-diagnostic-v2/
├── index.html                  # Main static page with navigation, hero, diagnostic form, result panel, CTA band, and footer.
├── styles.css                  # Complete visual system, responsive layout, form states, result panel styling, and accessibility helpers.
├── script.js                   # Vanilla JavaScript for mobile navigation, validation, API submission, result rendering, and back-to-top behavior.
├── functions/
│   └── api/
│       └── diagnostic.js       # Cloudflare Pages Function that handles POST /api/diagnostic and calls the OpenAI Responses API.
└── README.md                   # Project documentation, deployment steps, environment setup, and launch checklist.
```

## Local development

This project has no framework, package build step, or bundled frontend dependencies. To preview the static site and Pages Function locally, use Wrangler:

```bash
wrangler pages dev .
```

If you want the diagnostic endpoint to call the OpenAI API locally, provide the `OPENAI_API_KEY` environment variable through your local Wrangler workflow. Never commit the API key to the repository.

## Cloudflare Pages deployment

1. Push this repository to GitHub.
2. In the Cloudflare dashboard, go to **Workers & Pages**.
3. Choose **Create application**.
4. Select **Pages**.
5. Connect the GitHub repository.
6. Configure the project settings:
   - **Build command:** leave blank
   - **Output directory:** `/`
   - **Functions directory:** `functions`
7. Save and deploy.
8. After deployment, confirm the site loads at the assigned Cloudflare Pages URL.
9. Test the diagnostic form with a real target role and resume text after the environment variable is configured.

## Environment variable setup

The Cloudflare Pages Function requires one secret environment variable:

| Variable | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | Used server-side by the Pages Function to call the OpenAI Responses API. |

To add it in Cloudflare Pages:

1. Open the Cloudflare dashboard.
2. Go to **Workers & Pages**.
3. Select the Pages project.
4. Open **Settings**.
5. Open **Environment Variables**.
6. Under **Production**, add `OPENAI_API_KEY`.
7. Paste the API key value.
8. Save the variable.
9. Redeploy the site if Cloudflare prompts you to do so.

Never commit the API key to this repository. The frontend files do not contain or access the key.

## How the function works

Cloudflare Pages automatically maps `functions/api/diagnostic.js` to the `/api/diagnostic` route. The browser submits the form to that endpoint with a JSON body containing:

- `jobTitle`
- `jobPosting`
- `resumeText`

The Pages Function validates the required fields server-side, builds a diagnostic prompt, and calls the OpenAI Responses API. The request sets `store: false` so the diagnostic request is not stored by the API for model training or retention workflows controlled by that parameter. The function returns JSON to the browser in the shape:

```json
{
  "result": "Structured diagnostic text"
}
```

If validation fails or the upstream service returns an error, the function returns a JSON error response and the frontend displays an inline error banner.

## Customisation checklist

| Item | Current value or note | Status before go-live |
| --- | --- | --- |
| Update canonical URL once final domain is confirmed | `https://hiremenow-diagnostic-v2.pages.dev/` | Confirm |
| Replace `og-image.jpg` reference with a real hosted image | `https://hiremenowresumes.ca/og-image.jpg` | Confirm |
| Confirm OpenAI model | Currently `gpt-4o` | Confirm |
| Add Privacy Policy page link in footer if required | Not currently included | Confirm |
| Test on mobile before launch | Responsive breakpoints included | Confirm on devices |

## What this tool does not do

- It does not rewrite resumes.
- It does not create resume bullet points.
- It does not generate ready-to-use summaries or copy-paste resume content.
- It does not create ATS keyword lists.
- It does not promise interviews, job offers, or guaranteed outcomes.
- It does not optimize the resume directly.
- It does not store resume text in browser storage.

## Contact

For questions or support, contact:

- info@hiremenowresumes.ca
