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

function renderInlineCta() {
  return `
    <div class="result-cta">
      <p class="result-cta-kicker">Next step</p>
      <h3>Need Help Fixing These Issues?</h3>
      <p>This diagnostic identifies patterns and opportunities, but it does not rewrite your resume or build a job search strategy.</p>
      <p>If you would like a personalized resume review and strategy consultation, book a free 15-minute fit call.</p>
      <a class="btn result-cta-button" href="https://hiremenowresumes.ca/contact.html">Book a Free 15-Minute Fit Call</a>
    </div>
  `;
}

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
      ${sectionMarkup}
      ${renderInlineCta()}
    </div>
  `;

  const diagnosticResult = document.getElementById('diagnosticResult');
  if (diagnosticResult) {
    window.scrollTo({
      top: diagnosticResult.offsetTop - 100,
      behavior: 'smooth'
    });
  }
}

async function handleFormSubmit(event) {
  event.preventDefault();
  hideApiError();

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
