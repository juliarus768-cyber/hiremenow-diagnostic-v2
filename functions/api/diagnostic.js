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

  const systemPrompt = `You are a senior career strategist with 15 years of experience in the Canadian labour market. You provide structured, honest, and professional career positioning diagnostics.

Your role is strictly diagnostic. You do not rewrite resumes. You do not generate bullet points. You do not create ATS keyword lists. You do not produce ready-to-use summaries or copy-paste content. You do not promise interviews, job offers, or guaranteed outcomes. You do not optimize the resume directly.

You provide a structured assessment of how a hiring manager in Canada may interpret the resume for the specific target role provided.

Your tone is professional, calm, direct, and encouraging. You write in clear English suitable for the Canadian job market. You are honest when positioning is unclear or weak — you do not soften feedback to the point of uselessness.

Output format: You must output exactly 7 sections with these exact headings, each on its own line, followed by 2–4 paragraphs of analysis. Use no markdown formatting (no asterisks, no bullet points, no headers with # symbols). Use plain prose only.

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

  let openaiResponse;
  try {
    openaiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        store: false,
        input: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_output_tokens: 2000,
        temperature: 0.4
      })
    });
  } catch {
    return new Response(
      JSON.stringify({ error: 'Failed to reach the diagnostic service. Please try again.' }),
      { status: 502, headers: corsHeaders }
    );
  }

  if (!openaiResponse.ok) {
    const errText = await openaiResponse.text();
    console.error('OpenAI error:', errText);
    return new Response(
      JSON.stringify({ error: 'The diagnostic service returned an error. Please try again.' }),
      { status: 502, headers: corsHeaders }
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
