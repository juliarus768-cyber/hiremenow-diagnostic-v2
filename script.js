const SECTIONS = [
  { num: '01', title: 'What I See First' },
  { num: '02', title: 'Summary and Introduction' },
  { num: '03', title: 'Experience Section' },
  { num: '04', title: 'Language and Mechanics' },
  { num: '05', title: 'Format and First Impression' },
  { num: '06', title: 'Overall Strategy' }
];

const diagnosticForm = document.getElementById('diagnosticForm');
const submitBtn = document.getElementById('submitBtn');
const resultPanel = document.getElementById('resultPanel');
const apiError = document.getElementById('apiError');
const loadingStatus = document.getElementById('loadingStatus');
const navToggle = document.querySelector('.nav-toggle');
const mobileMenu = document.getElementById('mobileMenu');
const backToTop = document.querySelector('.back-to-top');

const originalButtonHtml = submitBtn.innerHTML;

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = value;
  return div.innerHTML;
}

function setupMobileNavigation() {
  if (!navToggle || !mobileMenu) {
    return;
  }

  navToggle.addEventListener('click', () => {
    const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!isExpanded));
    navToggle.setAttribute('aria-label', isExpanded ? 'Open navigation menu' : 'Close navigation menu');
    mobileMenu.classList.toggle('open', !isExpanded);
    document.body.classList.toggle('nav-open', !isExpanded);
  });

  mobileMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Open navigation menu');
      mobileMenu.classList.remove('open');
      document.body.classList.remove('nav-open');
    });
  });
}

function clearFieldError(field) {
  const fieldGroup = field.closest('.field-group');
  if (!fieldGroup) {
    return;
  }

  fieldGroup.classList.remove('field-error');
  const existingError = fieldGroup.querySelector('.error-msg');
  if (existingError) {
    existingError.remove();
  }
}

function showFieldError(field) {
  const fieldGroup = field.closest('.field-group');
  if (!fieldGroup) {
    return;
  }

  clearFieldError(field);
  fieldGroup.classList.add('field-error');
  const error = document.createElement('p');
  error.className = 'error-msg';
  error.setAttribute('role', 'alert');
  error.textContent = 'This field is required.';
  fieldGroup.appendChild(error);
}

function validateRequiredFields() {
  const requiredFields = [
    document.getElementById('jobTitle'),
    document.getElementById('resumeText')
  ];

  let isValid = true;

  requiredFields.forEach((field) => {
    clearFieldError(field);
    if (!field.value.trim()) {
      showFieldError(field);
      isValid = false;
    }
  });

  if (!isValid) {
    const firstError = diagnosticForm.querySelector('.field-error input, .field-error textarea');
    if (firstError) {
      firstError.focus();
    }
  }

  return isValid;
}

function setLoadingState(isLoading) {
  submitBtn.disabled = isLoading;

  if (isLoading) {
    submitBtn.innerHTML = '<span class="spinner" aria-hidden="true"></span>Running Diagnostic…';
    loadingStatus.textContent = 'Generating your diagnostic. This may take up to 30 seconds.';
    return;
  }

  submitBtn.innerHTML = originalButtonHtml;
  loadingStatus.textContent = '';
}

function hideApiError() {
  apiError.hidden = true;
}

function showApiError(message) {
  apiError.textContent = message || 'Something went wrong. Please try again in a moment.';
  apiError.hidden = false;
}

function normalizeResultText(rawText) {
  return String(rawText || '')
    .replaceAll('**', '')
    .replace(/\r\n/g, '\n')
    .trim();
}

function getSectionBody(text, sectionIndex) {
  const currentTitle = SECTIONS[sectionIndex].title;
  const nextTitle = SECTIONS[sectionIndex + 1]?.title;
  const currentPattern = new RegExp(`(?:^|\\n)\\s*${currentTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\n`, 'i');
  const currentMatch = text.match(currentPattern);

  if (!currentMatch || typeof currentMatch.index !== 'number') {
    return '';
  }

  const start = currentMatch.index + currentMatch[0].length;
  let end = text.length;

  if (nextTitle) {
    const nextPattern = new RegExp(`\\n\\s*${nextTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\n`, 'i');
    const nextMatch = text.slice(start).match(nextPattern);
    if (nextMatch && typeof nextMatch.index === 'number') {
      end = start + nextMatch.index;
    }
  }

  return text.slice(start, end).trim();
}

function paragraphize(sectionBody) {
  const cleanedBody = sectionBody.trim();
  if (!cleanedBody) {
    return '<p>No analysis was returned for this section. Please run the diagnostic again.</p>';
  }

  return cleanedBody
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\n+/g, ' ').trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join('');
}

function parseSections(rawText) {
  const text = normalizeResultText(rawText);

  return SECTIONS.map((section, index) => ({
    ...section,
    body: getSectionBody(text, index)
  }));
}

// Presentation choices only: never infer a service from diagnostic prose.
const NEXT_STEPS = new Map([
  ['direction', {
    label: 'I am not sure which jobs to target',
    guidance: 'Before updating your resume, it may help to clarify which roles match your experience, strengths and current goals.',
    resources: [['Adapt international work experience for a Canadian resume', 'https://hiremenowresumes.ca/international-work-experience-canadian-resume.html']],
    service: ['Career Clarity Session', 'https://hiremenowresumes.ca/services.html#career-clarity'],
    scope: 'This service helps with direction and planning. It does not include resume writing.'
  }],
  ['resume', {
    label: 'I know which job I want, but my resume needs improvement',
    guidance: 'If your target is clear, the next step is to make sure your resume demonstrates the experience and skills that matter for that role.',
    resources: [
      ['Adapt international work experience for a Canadian resume', 'https://hiremenowresumes.ca/international-work-experience-canadian-resume.html'],
      ['Explain foreign job titles to Canadian employers', 'https://hiremenowresumes.ca/explain-foreign-job-titles-canadian-resume.html']
    ],
    service: ['Resume Strategy Package', 'https://hiremenowresumes.ca/services.html#resume-strategy'],
    scope: 'Review the package for documents tailored to one agreed job title. The main website explains the current inclusions and terms.'
  }],
  ['two-directions', {
    label: 'I am considering two different career directions',
    guidance: 'Different career directions may require different ways of presenting your experience. Start by comparing the requirements and identifying which achievements support each target.',
    resources: [['Explore free career and resume resources', 'https://hiremenowresumes.ca/resources.html']],
    service: ['Multi-Path Career Strategy', 'https://hiremenowresumes.ca/services.html#multi-path'],
    scope: 'Compare this service if two agreed directions need separate positioning and documents. Applying for two job titles does not always mean you need two separate resumes.'
  }],
  ['self-help', {
    label: 'I want to improve my resume myself',
    guidance: 'You can use the diagnostic findings to identify what needs attention first. Start with the areas most relevant to your target role.',
    resources: [
      ['Explore free career and resume resources', 'https://hiremenowresumes.ca/resources.html'],
      ['Read ATS resume tips for Canadian job seekers', 'https://hiremenowresumes.ca/ats-resume-tips-canadian-job-seekers.html']
    ]
  }],
  ['unsure', {
    label: 'I am still not sure what I need',
    guidance: 'If your next step is not clear, you can review the free resources or discuss your situation briefly before choosing a service.',
    resources: [['Explore free career and resume resources', 'https://hiremenowresumes.ca/resources.html']],
    call: true
  }]
]);

function nextStepElement(tag, text) {
  const element = document.createElement(tag);
  if (text) element.textContent = text;
  return element;
}

function nextStepLink(label, url) {
  const link = nextStepElement('a', label);
  link.href = url; // Only fixed URLs from NEXT_STEPS or the call constant are used.
  return link;
}

function hasCompleteResult(rawText, sections) {
  if (typeof rawText !== 'string' || sections.some(section => !section.body.trim())) return false;
  // Validate structure only, not the meaning, sentiment or score of the prose.
  const expected = SECTIONS.map(section => section.title.toLowerCase());
  const headings = normalizeResultText(rawText).split('\n')
    .map(line => line.trim().toLowerCase()).filter(line => expected.includes(line));
  return headings.length === expected.length && headings.every((title, index) => title === expected[index]);
}

function createNextSteps(complete) {
  const panel = nextStepElement('section');
  panel.className = 'result-cta result-next-steps';
  // Override the result panel's inherited live region; only guidance changes are announced.
  panel.setAttribute('aria-live', 'off');
  if (!complete) {
    panel.append(nextStepElement('h3', 'Free resources while you review your result'));
    panel.append(nextStepElement('p', 'Some diagnostic sections are missing or could not be read. You can review free resources or try again.'));
    panel.append(nextStepLink('Explore free career and resume resources', 'https://hiremenowresumes.ca/resources.html'));
    return panel;
  }

  const heading = nextStepElement('h3', 'What would you like to work on next?');
  heading.id = 'next-steps-heading';
  panel.setAttribute('aria-labelledby', heading.id);
  panel.append(heading);
  panel.append(nextStepElement('p', 'Your diagnostic is a starting point. Choose the situation that best describes what you would like help with, and explore practical next steps.'));
  const clarification = nextStepElement('p', 'These options are for your own planning. They are not additional diagnostic findings.');
  clarification.id = 'next-steps-clarification';
  panel.append(clarification);

  const choices = nextStepElement('fieldset');
  choices.className = 'next-step-choices';
  choices.setAttribute('aria-describedby', clarification.id);
  choices.append(nextStepElement('legend', 'Choose an optional next step'));
  NEXT_STEPS.forEach((option, key) => {
    const label = nextStepElement('label');
    label.className = 'next-step-choice';
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'diagnostic-next-step';
    input.value = key;
    input.setAttribute('aria-controls', 'next-step-guidance');
    label.append(input, nextStepElement('span', option.label));
    choices.append(label);
  });
  panel.append(choices);
  const guidance = nextStepElement('div');
  guidance.id = 'next-step-guidance';
  guidance.className = 'next-step-guidance';
  guidance.setAttribute('aria-live', 'polite');
  guidance.setAttribute('aria-atomic', 'true');
  panel.append(guidance);
  return panel;
}

// Register once on the stable result container, including after repeated assessments.
resultPanel.addEventListener('change', event => {
  const input = event.target;
  if (!input.matches('input[name="diagnostic-next-step"]') || !input.checked) return;
  const option = NEXT_STEPS.get(input.value);
  const guidance = resultPanel.querySelector('#next-step-guidance');
  if (!option || !guidance) return;
  const content = document.createDocumentFragment();
  content.append(nextStepElement('h4', option.label), nextStepElement('p', option.guidance));
  content.append(nextStepElement('h4', 'Start with free resources'));
  const resources = nextStepElement('ul');
  option.resources.forEach(([label, url]) => {
    const item = nextStepElement('li');
    item.append(nextStepLink(label, url));
    resources.append(item);
  });
  content.append(resources);
  if (option.service) {
    content.append(nextStepElement('h4', 'Optional paid support'), nextStepElement('p', option.scope));
    content.append(nextStepLink(...option.service));
  }
  if (option.call) {
    content.append(nextStepElement('h4', 'Optional introductory call'));
    content.append(nextStepElement('p', 'The introductory call is an opportunity to discuss your situation and see whether a service is a good fit. It does not include a resume rewrite or a full career-coaching session.'));
    const call = nextStepLink('Book a Free 15-Minute Introductory Call', 'https://calendly.com/hire-me-now-resumes/15');
    call.className = 'btn result-cta-button';
    content.append(call);
  }
  guidance.replaceChildren(content);
});

function renderResult(rawText) {
  const sections = parseSections(rawText);
  const sectionMarkup = sections.map((section) => `
    <div class="result-section">
      <div class="result-section-header">
        <span class="result-section-num">${section.num}</span>
        <h3 class="result-section-title">${escapeHtml(section.title)}</h3>
      </div>
      <div class="result-section-body">
        ${paragraphize(section.body)}
      </div>
    </div>
  `).join('');

  resultPanel.innerHTML = `
    <div id="diagnosticResult" class="result-wrap">
      <h2 id="result-panel-heading" class="sr-only">Your diagnostic results</h2>
      ${sectionMarkup}
    </div>
  `;

  const diagnosticResult = document.getElementById('diagnosticResult');
  if (diagnosticResult) {
    diagnosticResult.append(createNextSteps(hasCompleteResult(rawText, sections)));
    window.scrollTo({
      top: diagnosticResult.offsetTop - 100,
      behavior: 'smooth'
    });
  }
}

async function handleFormSubmit(event) {
  event.preventDefault();
  hideApiError();
  // Previous next steps must not survive a failed or unfinished new attempt.
  resultPanel.querySelector('.result-next-steps')?.remove();

  if (!validateRequiredFields()) {
    return;
  }

  const payload = {
    jobTitle: document.getElementById('jobTitle').value.trim(),
    jobPosting: document.getElementById('jobPosting').value.trim(),
    resumeText: document.getElementById('resumeText').value.trim()
  };

  setLoadingState(true);

  try {
    const response = await fetch('/api/diagnostic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok || !data.result) {
      showApiError(data.error || 'Something went wrong. Please try again in a moment.');
      return;
    }

    renderResult(data.result);
  } catch {
    showApiError('Something went wrong. Please try again in a moment.');
  } finally {
    setLoadingState(false);
  }
}

function setupFieldErrorClearing() {
  diagnosticForm.querySelectorAll('input[required], textarea[required]').forEach((field) => {
    field.addEventListener('input', () => {
      if (field.value.trim()) {
        clearFieldError(field);
      }
    });
  });
}

function setupBackToTop() {
  if (!backToTop) {
    return;
  }

  window.addEventListener('scroll', () => {
    backToTop.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

setupMobileNavigation();
setupFieldErrorClearing();
setupBackToTop();
diagnosticForm.addEventListener('submit', handleFormSubmit);
