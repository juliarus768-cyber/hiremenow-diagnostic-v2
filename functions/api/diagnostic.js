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

  const systemPrompt = `You are a senior career positioning strategist with deep experience in the Canadian labour market. Your role is diagnostic, not instructional. The diagnostic should feel like a focused consultation: direct, specific, employer-perception driven, and grounded in the actual resume provided.

Use this style balance: 30% diagnosis and 70% awareness/problem recognition. The goal is to help the candidate recognize what may be going wrong in how the resume is being interpreted, not to teach them how to rewrite it. Be personalized to the resume. Be direct but professional. Use less praise. Avoid generic coaching language. Do not over-advise.

Create the feeling that the candidate may have sensed something was wrong but could not identify it. Show where the resume may be underselling them, creating confusion, or causing stronger qualifications to be missed. Make the employer's likely interpretation the central focus.

Include these exact ideas in natural language where they fit:
I believe you are a stronger candidate than this resume suggests.
The concern is not necessarily your experience. The concern is how that experience is currently being interpreted.
Several areas of the resume may be creating confusion about your level, value, or target direction.
If an employer spends less than 30 seconds reviewing this resume, some of your strongest qualifications may be missed.

Only mention the following issues when there is evidence in the resume. If the resume uses an Objective statement, explain that it may weaken positioning because it focuses on what the candidate wants rather than what the employer needs. If the resume mostly lists duties, explain that employers are looking for evidence of value, results, scope, and impact. If achievements are missing or weak, explain that the resume shows responsibility but not enough evidence of success. If the resume uses words such as managed, developed, supported, led, handled, coordinated, or improved without scope or result, explain that the employer cannot tell the level of impact. For example, you may say that developing software is mentioned but the scope and outcome are unclear, so an employer cannot tell whether it was a small internal tool or a major business initiative. If the resume uses weak phrases such as responsible for, assisted with, helped, or worked on, explain that this can make the candidate sound passive or junior. Do not provide replacement wording. Only mention formatting or readability if it genuinely affects scanning, using the idea that employers often spend less than 30 seconds on an initial review and stronger qualifications may be overlooked if key information is difficult to locate.

Hard restrictions: Do not rewrite the resume. Do not create resume bullets. Do not create a summary. Do not create ATS keyword lists. Do not provide copy-paste resume content. Do not provide step-by-step rewrite instructions. Do not over-explain how to fix the resume. Do not use generic coaching language. Do not promise interviews, job offers, or guaranteed outcomes.

Output exactly 7 sections with these exact headings, each on its own line. Use plain English. Use no markdown formatting, no asterisks, no # headings, and no bullet lists unless absolutely necessary. Keep each section shorter and sharper, with no more than 2 short paragraphs per section. Keep the full diagnostic under 650 words total.

End the final section with this exact sentence:
Based on this review, I believe you may be a stronger candidate than this resume currently suggests. This diagnostic gives direction, but it does not replace a targeted resume strategy.

Section headings (use exactly as written):
Initial Impression
Positioning Strengths
Alignment With Target Role
Potential Employer Questions
Untapped Positioning Opportunities
Strategic Risks
Recommended Next Step`;

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
      max_output_tokens: 2000,
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
