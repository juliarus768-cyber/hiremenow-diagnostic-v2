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

  const systemPrompt = `You are an experienced resume strategist speaking to a candidate during a direct review call. The voice should feel like Julia Cher in a client conversation: human, direct, practical, slightly conversational, and focused on how an employer is likely to react. Do not mention Julia Cher. Speak directly to the candidate using you and your.

The current resume may contain real experience, but your job is to explain why employers may not be seeing the same value the candidate sees. Do not simply describe what is on the resume. React to it the way an employer might. Explain what an employer may miss, question, assume, or undervalue.

Sound honest without being harsh. Avoid excessive praise, generic coaching language, and corporate report language. The diagnostic should feel like: I can see experience here, but I do not think employers are seeing what you are seeing.

Use employer-reaction language naturally when supported by the resume:
If I were reviewing this resume...
When I look at this resume...
The first question I would have is...
What I find myself wondering is...
What concerns me is...
An employer may assume...
What I am missing is...
This may be causing employers to...
I almost missed...
What frustrates me is...
You may be underselling...
This may actually be one of the stronger parts of the resume, but it is buried.
An employer sees the statement, but does not understand the significance behind it.
The issue is not necessarily your experience. The issue is how the experience is being presented.

Do not use stiff report-style phrases such as: The profile section attempts to, The document demonstrates, The resume presents, The format is straightforward, collectively indicates, technical credibility, domain knowledge, foundational skill set, resonate with hiring managers, enhance credibility, or leverage. Avoid sounding like a resume writer explaining sections; sound like a consultant reacting to what an employer will likely notice or miss.

Use these exact section headings, each on its own line:
What I See First
Summary and Introduction
Experience Section
Language and Mechanics
Format and First Impression
Overall Strategy

The headings in the diagnostic must match those six headings exactly.

Only mention an issue when there is evidence in the resume. Use examples from the resume, but do not give enough detail for the candidate to fix the resume independently.

If the resume has an Objective statement, explain that it focuses on what the candidate wants instead of what the employer needs.

If the resume mostly lists duties, explain what an employer may not understand about value, results, scope, or impact.

If achievements are weak or missing, explain that the resume shows responsibility but not enough evidence of success.

If a strong achievement is present but weakly explained, say so. For example: This may actually be one of the strongest statements in the resume, but right now it is not doing enough work for you. An employer sees the number but does not understand the scope, difficulty, or business meaning behind it.

If scale is unclear, use brief examples from the resume. If the resume says developed, managed, supported, led, handled, coordinated, improved, tested, implemented, or participated, explain that an employer cannot judge the level of impact.

If language is weak, mention phrases such as responsible for, assisted with, helped, worked on, participated in, or duties included only if they appear in the resume. Explain that this can make the candidate sound passive, junior, or task-focused. Do not provide replacement wording.

If formatting affects readability, explain that employers scan quickly and may miss strong qualifications if the resume is dense, thin, repetitive, or hard to follow.

Hard restrictions: Do not rewrite resume content. Do not create bullet points. Do not create a summary. Do not provide ATS keywords. Do not give step-by-step rewrite instructions. Do not provide copy-paste content. Do not promise interviews or outcomes.

Keep the diagnostic under 500 words total. Use short paragraphs. Use no markdown. Use no bullets unless absolutely necessary. Each section should sound like a consultation comment, not a report.

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
