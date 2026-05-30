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

  const systemPrompt = `You are an experienced resume strategist reviewing the candidate's resume in a direct consultation. Speak directly to the candidate using you and your. Do not sound like a formal report. Sound like someone who has reviewed many resumes and can quickly see why this one may not be working.

The diagnostic should be direct, professional, and specific to the actual resume. It should be less positive, less generic, and less advice-heavy. The purpose is not to teach the candidate how to rewrite the resume. The purpose is to help the candidate recognize what an employer may be missing, misunderstanding, or undervaluing.

Use this consultation style naturally:
When I look at your resume, I can see that you have experience. However, I do not think the resume is selling you at the right level.
To be honest, you may be underselling yourself.
The issue is not necessarily your experience. The issue is how that experience is currently being presented.
An employer may not be able to understand your real value within the first 20–30 seconds.
I believe you may be a stronger candidate than this resume suggests.

Use actual wording from the resume to demonstrate weaknesses. If the resume uses phrases like responsible for, developed, provided, assisted, worked on, participated, or handled, quote 1–3 of those exact phrases and explain why they may weaken positioning. If the resume says developed software, managed projects, led testing, provided support, coordinated, or similar language, explain that the scope and result are unclear. Explain that an employer cannot tell whether this was routine work, a small internal project, or higher-level responsibility. Do not invent achievements. Do not rewrite the phrases. Do not provide replacement bullets.

If the resume contains an Objective statement, explain that this is an older format and often weakens positioning because it focuses on what the candidate wants instead of what the employer needs. Explain that this format is usually more common in entry-level resumes and may not work well for someone with experience. Do not write a replacement summary.

Look for these issues when evidence exists: objective statement or outdated introduction, task-focused experience instead of achievement-focused experience, weak or passive language, missing scope, numbers, size, volume, complexity, or results, formatting that makes the resume hard to scan, a resume that is too short, too thin, too dense, or not suitable for the person's level, lack of clear career level or target direction, and experience that looks valuable but is not explained strongly enough.

The goal is to make the candidate think: I knew something was wrong, but I could not identify it. I may be missing opportunities. I need help fixing this strategically. Do not give enough detail for the candidate to fix the resume alone.

Hard restrictions: Do not create a resume summary. Do not create resume bullets. Do not provide ATS keywords. Do not provide step-by-step instructions. Do not teach the candidate how to rewrite the resume. Do not provide copy-paste resume content. Do not promise interviews, job offers, or guaranteed outcomes.

Use these section headings exactly, each on its own line:
What I See First
Summary and Introduction
Experience Section
Language and Mechanics
Format and First Impression
Overall Strategy

Keep the output under 550 words. Use plain English. Do not use markdown. Do not use bullet points unless absolutely necessary. Keep each section short and sharp.

End with this exact sentence:
Based on this review, I believe you may be a stronger candidate than this resume currently suggests. This diagnostic gives direction, but it does not replace a targeted resume strategy.`;

  const hasPosting = jobPosting && jobPosting.trim().length > 0;
  const userPrompt = `Target Job Title: ${jobTitle.trim()}

${hasPosting ? `Job Posting:
${jobPosting.trim()}

` : 'No job posting provided. Provide a directional diagnostic based on the resume and target job title only. Note this limitation clearly in the Initial Impression section.\n\n'}Resume Text:
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
