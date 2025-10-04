const form = document.getElementById('brand-form');
const statusEl = document.getElementById('status');
const brandOutput = document.getElementById('brand-output');
const masterPromptEl = document.getElementById('master-prompt');
const copyMasterBtn = document.getElementById('copy-master');
const exportBtn = document.getElementById('export');
const importInput = document.getElementById('import');
const adjectivesInput = document.getElementById('adjectives');
const missionInput = document.getElementById('mission');
const brandFactInput = document.getElementById('brandFact');
const dosInput = document.getElementById('dos');
const dontsInput = document.getElementById('donts');
const sampleInputs = [
  document.getElementById('sample1'),
  document.getElementById('sample2'),
  document.getElementById('sample3')
];
const targetLanguageInput = document.getElementById('targetLanguage');
const generateBtn = document.getElementById('generate');

const STORAGE_KEY = 'brandProfile';
const DEFAULT_LANGUAGE = 'English';
const SUGGESTED_DOS = [
  'Keep it casual and conversational',
  'Add a little enthusiasm (but not over the top)',
  'Be clear',
  'Be simple',
  'Be human (avoid jargon unless the audience is technical)',
];

const SUGGESTED_DONTS = [
  "Don't be robotic or stiff",
  "Don't be negative or dismissive",
  "Don't touch on porn or NSFW content",
];
const SYSTEM_PROMPT = `You are ReplyBot, an assistant that creates structured brand voice JSON.
- Always answer with JSON only when instructed.
- JSON must be minified, UTF-8, and valid.
- Avoid markdown fences.
`;

let session = null;

init();

async function init() {
  applyDefaultSuggestions();

  if (!('LanguageModel' in self)) {
    showStatus(`Chrome's LanguageModel API is unavailable. Join the Early Preview Program to enable it.`, true);
    disableGeneration();
  }

  const stored = await chrome.storage.local.get(STORAGE_KEY);
  if (stored[STORAGE_KEY]) {
    hydrateUI(stored[STORAGE_KEY]);
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!('LanguageModel' in self)) {
    showStatus(`Chrome's LanguageModel API is unavailable.`, true);
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
    showStatus('Brand voice saved locally. You can tweak anytime.');
  } catch (error) {
    console.error('Brand generation failed', error);
    showStatus(`Failed to build brand voice: ${error.message}`, true);
  } finally {
    toggleForm(false);
  }
});

copyMasterBtn.addEventListener('click', async () => {
  if (!masterPromptEl.value) {
    return;
  }
  await navigator.clipboard.writeText(masterPromptEl.value);
  showStatus('Master prompt copied.');
});

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
  a.download = 'replybot-brand.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showStatus('Brand voice exported.');
});

importInput.addEventListener('change', async (event) => {
  const [file] = event.target.files;
  if (!file) {
    return;
  }

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

function buildPayloadFromForm() {
  const adjectives = adjectivesInput.value
    .split(',')
    .map((word) => word.trim())
    .filter(Boolean)
    .slice(0, 3);

  const samples = sampleInputs
    .map((input) => input.value.trim())
    .filter(Boolean)
    .slice(0, 3);

  return {
    mission: missionInput.value.trim(),
    brandFact: brandFactInput.value.trim(),
    adjectives,
    dos: bulletize(dosInput.value),
    donts: bulletize(dontsInput.value),
    samples,
    targetLanguage: targetLanguageInput.value.trim() || DEFAULT_LANGUAGE,
  };
}

function bulletize(text) {
  return text
    .split(/\n|,|\u2022/g)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function applyDefaultSuggestions() {
  if (!dosInput.value.trim()) {
    dosInput.value = SUGGESTED_DOS.join('\n');
  }
  if (!dontsInput.value.trim()) {
    dontsInput.value = SUGGESTED_DONTS.join('\n');
  }
}

async function generateBrandVoice(payload) {
  const prompt = `You will create a compact brand voice profile and a reusable master prompt for drafting replies.
Input fields:
- Mission: ${payload.mission}
- Brand fact: ${payload.brandFact || 'none provided'}
- Adjectives: ${payload.adjectives.join(', ')}
- Do's: ${payload.dos.join('; ')}
- Don'ts: ${payload.donts.join('; ')}
- Sample replies: ${payload.samples.length ? payload.samples.join(' || ') : 'none provided'}
- Default reply language: ${payload.targetLanguage}

Respond with minified JSON only, following this schema exactly:
{
  "brandVoice": {
    "mission": string,
    "brandFact": string,
    "tone": string[],
    "dos": string[],
    "donts": string[],
    "sampleReplies": string[],
    "targetLanguage": string
  },
  "masterPrompt": string,
  "createdAt": string
}

Rules:
- Keep arrays <= 5 items.
- Use the provided inputs faithfully; enrich only when helpful.
- masterPrompt should instruct future calls how to respond in this brand voice when given context.
- createdAt must be an ISO 8601 timestamp.
`;

  const session = await ensureSession();
  return runPrompt(session, prompt);
}

function parseBrandResponse(raw) {
  const cleaned = sanitizeModelJson(raw);
  try {
    return JSON.parse(cleaned);
  } catch (error) {
    console.warn('Failed to parse model JSON', { raw, cleaned }, error);
    throw new Error('Model returned malformed JSON. Try again or adjust the inputs.');
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
  const normalized = {
    brandVoice: {
      mission: brand.mission || payload.mission,
      brandFact: typeof brand.brandFact === 'string' ? brand.brandFact.trim() : (payload.brandFact || ''),
      tone: ensureArray(brand.tone, payload.adjectives),
      dos: ensureArray(brand.dos, payload.dos),
      donts: ensureArray(brand.donts, payload.donts),
      sampleReplies: ensureArray(brand.sampleReplies, payload.samples),
      targetLanguage: brand.targetLanguage || payload.targetLanguage,
    },
    masterPrompt: profile.masterPrompt || '',
    createdAt: profile.createdAt || now,
    updatedAt: now,
  };
  return normalized;
}

function ensureArray(value, fallback = []) {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    return [value.trim()];
  }
  return fallback;
}

function validateImportedProfile(profile) {
  if (!profile || typeof profile !== 'object') {
    throw new Error('JSON must be an object.');
  }
  if (!profile.brandVoice || !profile.masterPrompt) {
    throw new Error('Missing brandVoice or masterPrompt fields.');
  }
  if (!Array.isArray(profile.brandVoice.tone)) {
    throw new Error('brandVoice.tone must be an array.');
  }
  if (profile.brandVoice.brandFact && typeof profile.brandVoice.brandFact !== 'string') {
    throw new Error('brandVoice.brandFact must be a string when provided.');
  }
}

function hydrateUI(profile) {
  brandOutput.hidden = false;
  masterPromptEl.value = profile.masterPrompt || '';

  missionInput.value = profile.brandVoice.mission || '';
  brandFactInput.value = profile.brandVoice.brandFact || '';
  adjectivesInput.value = profile.brandVoice.tone?.join(', ') || '';
  dosInput.value = profile.brandVoice.dos?.join('\n') || '';
  dontsInput.value = profile.brandVoice.donts?.join('\n') || '';
  targetLanguageInput.value = profile.brandVoice.targetLanguage || DEFAULT_LANGUAGE;

  sampleInputs.forEach((input, index) => {
    input.value = profile.brandVoice.sampleReplies?.[index] || '';
  });

  applyDefaultSuggestions();
}

async function ensureSession() {
  if (session) {
    return session;
  }
  
  const config = {
    temperature: 0.6,
    topK: 5,
    outputLanguage: 'en',
    initialPrompts: [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      }
    ],
  };
  
  console.log('Creating session with config:', config);
  session = await LanguageModel.create(config);
  return session;
}

async function runPrompt(modelSession, prompt) {
  if (modelSession.prompt) {
    return modelSession.prompt(prompt);
  }
  if (modelSession.promptStreaming) {
    const stream = await modelSession.promptStreaming(prompt);
    let result = '';
    let previous = '';
    for await (const chunk of stream) {
      const fragment = chunk.startsWith(previous) ? chunk.slice(previous.length) : chunk;
      result += fragment;
      previous = chunk;
    }
    return result;
  }
  throw new Error('Prompt API shape not supported.');
}

function showStatus(message, isError = false) {
  statusEl.hidden = false;
  statusEl.textContent = message;
  statusEl.classList.toggle('error', Boolean(isError));
}

function toggleForm(isBusy) {
  generateBtn.disabled = isBusy;
  Array.from(form.elements).forEach((element) => {
    if (element.id !== 'import') {
      element.disabled = isBusy;
    }
  });
}

function disableGeneration() {
  generateBtn.disabled = true;
}

window.addEventListener('unload', () => {
  if (session?.destroy) {
    session.destroy();
  }
});
