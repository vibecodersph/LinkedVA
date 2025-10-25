// popup/tabs/brandSetup.js
// Brand voice setup module

export async function initBrandSetup() {
const form = document.getElementById('brand-setup-form');
const statusEl = document.getElementById('status');
const brandOutput = document.getElementById('brand-output');
const masterPromptEl = document.getElementById('master-prompt');
const copyMasterBtn = document.getElementById('copy-master');
const exportBtn = document.getElementById('export');
const importInput = document.getElementById('import');

// Map to actual HTML IDs from popup.html
const businessNameInput = document.getElementById('business-name');
const taglineInput = document.getElementById('tagline');
const descriptionInput = document.getElementById('description');
const toneInput = document.getElementById('tone');
const valuesInput = document.getElementById('values');
const audienceInput = document.getElementById('audience');
const dosInput = document.getElementById('dos');
const dontsInput = document.getElementById('donts');

const STORAGE_KEY = 'brandProfile';
const DEFAULT_LANGUAGE = 'English';
const SUGGESTED_DOS = [
  'Be professional and friendly',
  'Focus on value and benefits',
  'Use clear, simple language',
];

const SUGGESTED_DONTS = [
  "Don't be overly salesy",
  "Don't use excessive jargon",
  "Don't make unrealistic promises",
];

const SYSTEM_PROMPT = `You are LinkedVA brand voice assistant.
- Create structured brand voice JSON profiles
- Always return valid, minified JSON
- No markdown fences`;

let session = null;

await init();

async function init() {
  applyDefaultSuggestions();

  // Check if AI API is available
  if (!('LanguageModel' in self)) {
    showStatus(`Chrome's AI API is unavailable. Please enable required flags.`, true);
    disableGeneration();
    return;
  }

  const stored = await chrome.storage.local.get(STORAGE_KEY);
  if (stored[STORAGE_KEY]) {
    hydrateUI(stored[STORAGE_KEY]);
  }
}

if (!form) {
  console.error('Brand setup form not found');
  return { refresh: init };
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!('LanguageModel' in self)) {
    showStatus(`Chrome's AI API is unavailable.`, true);
    return;
  }

  const payload = buildPayloadFromForm();
  toggleForm(true);
  showStatus('Generating brand voice with on-device AI...');

  try {
    const response = await generateBrandVoice(payload);
    const parsed = parseBrandResponse(response);
    const profile = normalizeBrandProfile(parsed, payload);
    await chrome.storage.local.set({ [STORAGE_KEY]: profile });
    chrome.runtime.sendMessage({ type: 'brandProfileUpdated' }).catch(() => {});
    hydrateUI(profile);
    showStatus('Brand voice saved locally.');
  } catch (error) {
    console.error('Brand generation failed', error);
    showStatus(`Failed: ${error.message}`, true);
  } finally {
    toggleForm(false);
  }
});

if (copyMasterBtn) {
  copyMasterBtn.addEventListener('click', async () => {
    if (!masterPromptEl.value) return;
    await navigator.clipboard.writeText(masterPromptEl.value);
    showStatus('Master prompt copied.');
  });
}

if (exportBtn) {
  exportBtn.addEventListener('click', async () => {
    const stored = await chrome.storage.local.get(STORAGE_KEY);
    const profile = stored[STORAGE_KEY];
    if (!profile) {
      showStatus('Nothing to export yet.', true);
      return;
    }
    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'linkedva-brand.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showStatus('Brand voice exported.');
  });
}

if (importInput) {
  importInput.addEventListener('change', async (event) => {
    const [file] = event.target.files;
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      validateImportedProfile(parsed);
      await chrome.storage.local.set({ [STORAGE_KEY]: parsed });
      chrome.runtime.sendMessage({ type: 'brandProfileUpdated' }).catch(() => {});
      hydrateUI(parsed);
      showStatus('Brand voice imported.');
    } catch (error) {
      console.error('Import failed', error);
      showStatus(`Import failed: ${error.message}`, true);
    } finally {
      event.target.value = '';
    }
  });
}

function buildPayloadFromForm() {
  return {
    businessName: businessNameInput?.value.trim() || '',
    tagline: taglineInput?.value.trim() || '',
    description: descriptionInput?.value.trim() || '',
    tone: toneInput?.value.trim() || '',
    values: bulletize(valuesInput?.value || ''),
    audience: audienceInput?.value.trim() || '',
    dos: bulletize(dosInput?.value || ''),
    donts: bulletize(dontsInput?.value || ''),
    targetLanguage: DEFAULT_LANGUAGE,
  };
}

function bulletize(text) {
  return text
    .split(/\n|,|\u2022/g)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function applyDefaultSuggestions() {
  if (dosInput && !dosInput.value.trim()) {
    dosInput.value = SUGGESTED_DOS.join('\n');
  }
  if (dontsInput && !dontsInput.value.trim()) {
    dontsInput.value = SUGGESTED_DONTS.join('\n');
  }
}

async function generateBrandVoice(payload) {
  const prompt = `Create a brand voice profile for LinkedIn Virtual Assistant work.

Business: ${payload.businessName}
Tagline: ${payload.tagline || 'N/A'}
Description: ${payload.description}
Tone: ${payload.tone}
Core Values: ${payload.values.join('; ')}
Target Audience: ${payload.audience}
Do's: ${payload.dos.join('; ')}
Don'ts: ${payload.donts.join('; ')}
Language: ${payload.targetLanguage}

Return ONLY valid JSON in this format:
{
  "brandVoice": {
    "businessName": "${payload.businessName}",
    "tagline": "${payload.tagline}",
    "description": "${payload.description}",
    "tone": "${payload.tone}",
    "values": ${JSON.stringify(payload.values)},
    "audience": "${payload.audience}",
    "dos": ${JSON.stringify(payload.dos)},
    "donts": ${JSON.stringify(payload.donts)},
    "targetLanguage": "${payload.targetLanguage}"
  },
  "masterPrompt": "A concise prompt describing this brand voice for future use",
  "createdAt": "${new Date().toISOString()}"
}`;

  const session = await ensureSession();
  return runPrompt(session, prompt);
}

function parseBrandResponse(raw) {
  const cleaned = sanitizeModelJson(raw);
  try {
    return JSON.parse(cleaned);
  } catch (error) {
    console.warn('Failed to parse model JSON', { raw, cleaned }, error);
    throw new Error('Model returned invalid JSON. Try again.');
  }
}

function sanitizeModelJson(text) {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1).trim();
  }
  return cleaned;
}

function normalizeBrandProfile(profile, payload) {
  const now = new Date().toISOString();
  const brand = profile.brandVoice ?? {};
  return {
    brandVoice: {
      businessName: brand.businessName || payload.businessName,
      tagline: brand.tagline || payload.tagline,
      description: brand.description || payload.description,
      tone: brand.tone || payload.tone,
      values: ensureArray(brand.values, payload.values),
      audience: brand.audience || payload.audience,
      dos: ensureArray(brand.dos, payload.dos),
      donts: ensureArray(brand.donts, payload.donts),
      targetLanguage: brand.targetLanguage || payload.targetLanguage,
    },
    masterPrompt: profile.masterPrompt || '',
    createdAt: profile.createdAt || now,
    updatedAt: now,
  };
}

function ensureArray(value, fallback = []) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return fallback;
}

function validateImportedProfile(profile) {
  if (!profile || typeof profile !== 'object') {
    throw new Error('JSON must be an object.');
  }
  if (!profile.brandVoice || !profile.masterPrompt) {
    throw new Error('Missing brandVoice or masterPrompt fields.');
  }
}

function hydrateUI(profile) {
  if (!brandOutput || !masterPromptEl) return;

  brandOutput.hidden = false;
  masterPromptEl.value = profile.masterPrompt || '';

  if (profile.brandVoice) {
    if (businessNameInput) businessNameInput.value = profile.brandVoice.businessName || '';
    if (taglineInput) taglineInput.value = profile.brandVoice.tagline || '';
    if (descriptionInput) descriptionInput.value = profile.brandVoice.description || '';
    if (toneInput) toneInput.value = profile.brandVoice.tone || '';
    if (valuesInput) valuesInput.value = profile.brandVoice.values?.join('\n') || '';
    if (audienceInput) audienceInput.value = profile.brandVoice.audience || '';
    if (dosInput) dosInput.value = profile.brandVoice.dos?.join('\n') || '';
    if (dontsInput) dontsInput.value = profile.brandVoice.donts?.join('\n') || '';
  }

  applyDefaultSuggestions();
}

async function ensureSession() {
  if (session) return session;

  // Create session with output language
  session = await LanguageModel.create({
    temperature: 0.7,
    topK: 5,
    outputLanguage: 'en',
  });

  return session;
}

async function runPrompt(modelSession, prompt) {
  return await modelSession.prompt(prompt);
}

function showStatus(message, isError = false) {
  if (!statusEl) return;
  statusEl.hidden = false;
  statusEl.textContent = message;
  statusEl.classList.toggle('error', Boolean(isError));
}

function toggleForm(isBusy) {
  if (!form) return;
  Array.from(form.elements).forEach((element) => {
    if (element.id !== 'import') {
      element.disabled = isBusy;
    }
  });
}

function disableGeneration() {
  const submitBtn = form?.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;
}

window.addEventListener('unload', () => {
  if (session?.destroy) {
    session.destroy();
  }
});

// Return API for tab controller
return {
  refresh: init
};

} // End of initBrandSetup
