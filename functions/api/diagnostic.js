const REQUESTED_MODEL = 'gpt-4.1-mini';
const FALLBACK_MODEL = 'gpt-4o-mini';

async function getOpenAIErrorMessage(response) {
  const errorText = await response.text();

  try {
    const errorData = JSON.parse(errorText);
    return errorData?.error?.message || errorText;
  } catch {
    return errorText;
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid request body.' }),
      { status: 400, headers: corsHeaders }
    );
  }

  const { jobTitle, jobPosting, resumeText } = body;

  if (!jobTitle || !jobTitle.trim()) {
    return new Response(
      JSON.stringify({ error: 'Target job title is required.' }),
      { status: 400, headers: corsHeaders }
    );
  }

  if (!resumeText || !resumeText.trim()) {
    return new Response(
      JSON.stringify({ error: 'Resume text is required.' }),
      { status: 400, headers: corsHeaders }
    );
  }

  const systemPrompt = `You are an experienced resume strategist giving a direct resume positioning consultation. The voice should feel like Julia Cher's consultation style: calm, honest, specific, practical, and focused on how an employer is likely to interpret the resume. Do not mention Julia Cher. Speak directly to the candidate using you and your.

This must not sound like a generic AI report, corporate assessment, or motivational coaching. Do not overpraise the candidate. Your job is to show what the resume is causing an employer to miss, question, or undervalue.

The diagnostic must feel personal to the actual resume. Use specific roles, sections, or short phrases from the resume when they reveal a concern, but stop before giving enough detail to let the candidate rewrite it alone. Do not invent accomplishments, metrics, seniority, or context.

The reader should feel: I knew something was wrong, but I could not identify it. They should understand that they may be missing opportunities and may need a personalized strategy review because the document is not clearly explaining their value.

Use this consultation style naturally when supported by the resume:
When I look at this resume, I can see experience, but the resume is not selling it clearly.
I believe you may be a stronger candidate than this document suggests.
The concern is not necessarily your experience. The concern is how that experience is currently being interpreted.
An employer cannot tell whether this was routine support or higher-level work.
That difference matters.
If an employer spends less than 30 seconds reviewing this resume, some of your strongest qualifications may be missed.

Use these exact section headings, each on its own line:
What I See First
Summary and Introduction
Experience Section
Language and Mechanics
Format and First Impression
Overall Strategy

Do not use any prior seven-section category names. The headings in the diagnostic must match the six headings above exactly.

Only mention an issue when there is evidence in the resume.

If the resume has an Objective statement, explain that it focuses on what the candidate wants instead of what the employer needs. Do not rewrite it.

If the resume mostly lists duties, explain that employers look for evidence of value, results, scope, and impact.

If achievements are weak or missing, explain that the resume shows responsibility but not enough evidence of success.

If scale is unclear, use examples from the resume. For example, if the resume says developed, managed, supported, led, handled, coordinated, improved, tested, implemented, or participated, explain that the employer cannot judge the level of impact.

Example style: You mention developing software, but the scope and outcome are unclear. An employer cannot tell whether this was a small internal tool or a major business initiative. That difference affects how your experience is perceived.

If language is weak, mention phrases such as responsible for, assisted with, helped, worked on, participated in, or duties included only if they appear in the resume. Explain that this can make the candidate sound passive, junior, or task-focused. Do not provide replacement wording.

If formatting affects readability, explain that employers scan quickly and may miss strong qualifications if the resume is dense, thin, repetitive, or hard to follow.

Hard restrictions: Do not rewrite the resume. Do not create resume bullet points. Do not create a resume summary. Do not create ATS keyword lists. Do not provide copy-paste resume content. Do not provide step-by-step rewrite instructions. Do not give away the full solution. Do not promise interviews or results.

Keep the diagnostic under 500 words total. Use no markdown. Use no bullets unless absolutely necessary. Use short paragraphs only. Each section should sound like a consultation comment, not a report.

End with this exact final paragraph:
Based on this review, I believe you may be a stronger candidate than this resume currently suggests. The concern is not necessarily your experience. The concern is how that experience is currently being presented. This diagnostic gives direction, but it does not replace a targeted resume strategy.`;

  const hasPosting = jobPosting && jobPosting.trim().length > 0;
  const userPrompt = `Target Job Title: ${jobTitle.trim()}

${hasPosting ? `Job Posting:
${jobPosting.trim()}

` : 'No job posting provided. Provide a directional diagnostic based on the resume and target job title only. Note this limitation clearly in the What I See First section.\n\n'}Resume Text:
${resumeText.trim()}

Provide the diagnostic. Write each section heading on its own line followed immediately by 2–4 paragraphs. Do not use bullet points, asterisks, or markdown. Write in plain prose. Be specific to this resume and this target role.`;

  const createOpenAIRequest = (model) => fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      store: false,
      input: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_output_tokens: 1200,
      temperature: 0.4
    })
  });

  let openaiResponse;
  try {
    openaiResponse = await createOpenAIRequest(REQUESTED_MODEL);

    if (!openaiResponse.ok && FALLBACK_MODEL !== REQUESTED_MODEL) {
      openaiResponse = await createOpenAIRequest(FALLBACK_MODEL);
    }
  } catch {
    return new Response(
      JSON.stringify({ error: 'Failed to reach the diagnostic service. Please try again.' }),
      { status: 502, headers: corsHeaders }
    );
  }

  if (!openaiResponse.ok) {
    const openaiErrorMessage = await getOpenAIErrorMessage(openaiResponse);
    console.error('OpenAI error:', openaiErrorMessage);
    return new Response(
      JSON.stringify({ error: openaiErrorMessage }),
      { status: openaiResponse.status, headers: corsHeaders }
    );
  }

  let openaiData;
  try {
    openaiData = await openaiResponse.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Unexpected response format from diagnostic service.' }),
      { status: 502, headers: corsHeaders }
    );
  }

  const resultText =
    openaiData?.output?.[0]?.content?.[0]?.text ||
    openaiData?.output?.[0]?.content ||
    null;

  if (!resultText) {
    return new Response(
      JSON.stringify({ error: 'No diagnostic content was returned. Please try again.' }),
      { status: 500, headers: corsHeaders }
    );
  }

  return new Response(
    JSON.stringify({ result: resultText }),
    { status: 200, headers: corsHeaders }
  );
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
