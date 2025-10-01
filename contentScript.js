(() => {
  if (window.replyBotInitialized) {
    return;
  }
  window.replyBotInitialized = true;

  const BASE_SYSTEM_PROMPT = `You are ReplyBot, an on-device assistant that helps virtual assistants reply to conversations.
- Always respect the brand voice JSON shared via system prompts.
- Default to clear, concise, human-sounding writing.
- If you cannot complete a request, explain why.`;

  const COMMENT_SELECTORS = [
    '[data-testid*="comment"]',
    '[data-test-id*="comment"]',
    '[data-testid*="reply"]',
    '[data-test-id*="reply"]',
    '[role="comment"]',
    '[itemprop="comment"]',
    '[aria-label*="comment"]',
    '[aria-label*="Comment"]',
    'article',
    '[role="article"]',
    '[data-testid="tweet"]',
    '[data-testid*="post"]',
    '[data-test-id*="thread"]',
    '[aria-label*="Thread"]',
    '[aria-label*="Post"]',
  ];
  const COMMENT_SELECTOR = COMMENT_SELECTORS.join(',');

  const state = {
    container: null,
    panel: null,
    chips: null,
    results: null,
    target: null,
    contextRoot: null,
    brandProfile: null,
    activeTaskId: 0,
    isApiAvailable: 'LanguageModel' in self,
  };

  init();

  async function init() {
    createUI();
    attachListeners();
    await loadBrandProfile();
  }

  function createUI() {
    state.container = document.createElement('div');
    state.container.className = 'replybot-container replybot-hidden';
    state.container.setAttribute('data-replybot-root', '');

    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'replybot-pill';
    pill.textContent = 'ReplyBot';
    pill.addEventListener('click', togglePanel);

    state.panel = document.createElement('div');
    state.panel.className = 'replybot-panel replybot-hidden';

    const warning = document.createElement('div');
    warning.className = 'replybot-warning';
    warning.textContent = 'Set up a brand in the extension popup to unlock drafting.';
    state.panel.appendChild(warning);

    state.chips = document.createElement('div');
    state.chips.className = 'replybot-chips';
    state.chips.append(
      createChip('Draft 3', 'draft'),
      createChip('Translate', 'translate')
    );
    state.panel.appendChild(state.chips);

    state.results = document.createElement('div');
    state.results.className = 'replybot-results';
    state.panel.appendChild(state.results);

    state.container.append(pill, state.panel);
    document.documentElement.appendChild(state.container);
  }

  function attachListeners() {
    document.addEventListener('focusin', handleFocus, true);
    document.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    document.addEventListener('click', handleContextClick, true);

    document.addEventListener('click', (event) => {
      if (!(event.target instanceof Element)) {
        return;
      }
      if (event.target.closest('[data-replybot-root]')) {
        return;
      }
      if (state.panel && !state.panel.classList.contains('replybot-hidden')) {
        const withinTarget = state.target && state.target.contains(event.target);
        const clickedPill = event.target.closest('.replybot-pill');
        if (!withinTarget && !clickedPill) {
          hidePanel();
        }
      }
    });

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.brandProfile) {
        state.brandProfile = changes.brandProfile.newValue;
        refreshWarning();
      }
    });

    chrome.runtime.onMessage.addListener((message) => {
      if (message?.type === 'brandProfileUpdated') {
        loadBrandProfile();
      }
    });
  }

  async function loadBrandProfile() {
    const stored = await chrome.storage.local.get('brandProfile');
    state.brandProfile = stored.brandProfile || null;
    refreshWarning();
  }

  function refreshWarning() {
    const hasBrand = Boolean(state.brandProfile && state.brandProfile.masterPrompt);
    const warning = state.panel.querySelector('.replybot-warning');
    if (warning) {
      warning.classList.toggle('replybot-hidden', hasBrand);
    }
    state.chips.querySelectorAll('button').forEach((chip) => {
      const action = chip.dataset.action;
      const requiresBrand = action === 'draft';
      chip.disabled = !state.isApiAvailable || (requiresBrand && !hasBrand);
    });
    if (!state.isApiAvailable) {
      setResults(`<p class="replybot-error">Chrome LanguageModel API unavailable in this tab.</p>`);
    }
  }

  function createChip(label, action) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'replybot-chip';
    button.dataset.action = action;
    button.textContent = label;
    button.addEventListener('click', () => handleChip(action));
    return button;
  }

  function handleFocus(event) {
    const target = event.target;
    if (!isEditableField(target)) {
      return;
    }
    state.target = target;
    state.contextRoot = findContextRoot(target);
    showContainer();
    reposition();
  }

  function isEditableField(node) {
    if (!(node instanceof HTMLElement)) {
      return false;
    }
    if (node.closest('[data-replybot-root]')) {
      return false;
    }
    if (node.isContentEditable) {
      return true;
    }
    if (node.tagName === 'TEXTAREA') {
      return true;
    }
    if (node.tagName === 'INPUT') {
      const type = node.getAttribute('type')?.toLowerCase() || 'text';
      return ['text', 'search', 'email', 'url'].includes(type);
    }
    if (node.getAttribute('role') === 'textbox') {
      return true;
    }
    return false;
  }

  function showContainer() {
    state.container.classList.remove('replybot-hidden');
  }

  function togglePanel() {
    state.panel.classList.toggle('replybot-hidden');
  }

  function hidePanel() {
    state.panel.classList.add('replybot-hidden');
  }

  function reposition() {
    if (!state.target) {
      return;
    }
    const rect = state.target.getBoundingClientRect();
    const top = Math.max(rect.top + window.scrollY - 40, window.scrollY + 12);
    const left = Math.min(rect.right + window.scrollX - 160, window.scrollX + window.innerWidth - 170);
    state.container.style.top = `${top}px`;
    state.container.style.left = `${Math.max(left, 12 + window.scrollX)}px`;
  }

  function handleChip(action) {
    if (!state.isApiAvailable) {
      return;
    }
    switch (action) {
      case 'draft':
        runDraft();
        break;
      case 'translate':
        runTranslate();
        break;
      default:
        break;
    }
  }

  function handleContextClick(event) {
    if (!(event.target instanceof Element)) {
      return;
    }
    if (event.target.closest('[data-replybot-root]')) {
      return;
    }
    const contextNode = findContextRoot(event.target);
    if (contextNode) {
      state.contextRoot = contextNode;
    }
  }

  function setResults(html) {
    state.results.innerHTML = html;
  }

  function setLoading(message) {
    const taskId = ++state.activeTaskId;
    setResults(`<div class="replybot-loading"><span class="replybot-spinner"></span>${message}</div>`);
    return taskId;
  }

  async function runDraft() {
    if (!state.brandProfile) {
      setResults('<p class="replybot-error">Set up a brand first.</p>');
      return;
    }
    const taskId = setLoading('Drafting replies...');
    try {
      const context = collectThreadContext();
      const brandFact = getBrandFact();
      const summary = await summarizeContext(context);
      const prompt = buildDraftPrompt(context, summary, brandFact);
      const raw = await callModel({
        temperature: 0.7,
        prompt,
      });
      if (taskId === state.activeTaskId) {
        const drafts = parseDrafts(raw);
        const safeDrafts = await applySafetyFilter(drafts, context, summary, brandFact);
        if (safeDrafts.length) {
          renderDrafts(safeDrafts);
        } else {
          setResults('<p class="replybot-error">No safe drafts generated. Try tweaking the brand voice or context.</p>');
        }
      }
    } catch (error) {
      if (taskId === state.activeTaskId) {
        setResults(`<p class="replybot-error">${escapeHtml(error.message)}</p>`);
      }
    }
  }

  async function runTranslate() {
    const text = getDraftText();
    if (!text) {
      setResults('<p class="replybot-error">Add text to translate first.</p>');
      return;
    }
    const targetLanguage = state.brandProfile?.brandVoice?.targetLanguage || 'English';
    const brandFact = getBrandFact();
    const taskId = setLoading(`Translating to ${targetLanguage}...`);
    try {
      const prompt = `Auto-detect the language of this reply and translate it into ${targetLanguage}. Preserve the brand tone${brandFact ? ' and keep this brand fact intact when relevant: ' + brandFact : ''}.\n\n${text}`;
      const response = await callModel({
        temperature: 0.3,
        prompt,
      });
      if (taskId === state.activeTaskId) {
        renderSingle(response.trim());
      }
    } catch (error) {
      if (taskId === state.activeTaskId) {
        setResults(`<p class="replybot-error">${escapeHtml(error.message)}</p>`);
      }
    }
  }

  function getDraftText() {
    if (!state.target) {
      return '';
    }
    if (state.target instanceof HTMLTextAreaElement || state.target instanceof HTMLInputElement) {
      return state.target.value.trim();
    }
    if (state.target.isContentEditable) {
      return state.target.innerText.trim();
    }
    return '';
  }

  function renderDrafts(drafts) {
    if (!drafts.length) {
      setResults('<p class="replybot-error">No drafts returned.</p>');
      return;
    }
    const fragment = document.createDocumentFragment();
    drafts.forEach((draft, index) => {
      const card = document.createElement('article');
      card.className = 'replybot-draft';

      const title = document.createElement('header');
      title.textContent = `Option ${index + 1}`;
      card.appendChild(title);

      const body = document.createElement('p');
      body.textContent = draft;
      card.appendChild(body);

      const actions = document.createElement('div');
      actions.className = 'replybot-draft-actions';

      const insertButton = document.createElement('button');
      insertButton.type = 'button';
      insertButton.className = 'replybot-insert';
      insertButton.textContent = 'Insert';
      insertButton.addEventListener('click', () => insertText(draft));
      actions.appendChild(insertButton);

      const copyButton = document.createElement('button');
      copyButton.type = 'button';
      copyButton.className = 'replybot-copy';
      copyButton.textContent = 'Copy';
      copyButton.addEventListener('click', () => navigator.clipboard.writeText(draft));
      actions.appendChild(copyButton);

      card.appendChild(actions);
      fragment.appendChild(card);
    });
    state.results.innerHTML = '';
    state.results.appendChild(fragment);
  }

  function renderSingle(text) {
    const card = document.createElement('article');
    card.className = 'replybot-draft';

    const body = document.createElement('p');
    body.textContent = text;
    card.appendChild(body);

    const actions = document.createElement('div');
    actions.className = 'replybot-draft-actions';

    const insertButton = document.createElement('button');
    insertButton.type = 'button';
    insertButton.className = 'replybot-insert';
    insertButton.textContent = 'Insert';
    insertButton.addEventListener('click', () => insertText(text));

    const copyButton = document.createElement('button');
    copyButton.type = 'button';
    copyButton.className = 'replybot-copy';
    copyButton.textContent = 'Copy';
    copyButton.addEventListener('click', () => navigator.clipboard.writeText(text));

    actions.append(insertButton, copyButton);
    card.appendChild(actions);
    state.results.innerHTML = '';
    state.results.appendChild(card);
  }

  function insertText(text) {
    if (!state.target) {
      return;
    }
    state.target.focus();
    if (state.target instanceof HTMLTextAreaElement || state.target instanceof HTMLInputElement) {
      const start = state.target.selectionStart ?? state.target.value.length;
      const end = state.target.selectionEnd ?? state.target.value.length;
      const original = state.target.value;
      state.target.value = `${original.slice(0, start)}${text}${original.slice(end)}`;
      const cursor = start + text.length;
      state.target.setSelectionRange(cursor, cursor);
      state.target.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }
    if (state.target.isContentEditable) {
      const selection = window.getSelection();
      if (!selection) {
        state.target.innerText = text;
        return;
      }
      selection.removeAllRanges();
      const range = document.createRange();
      range.selectNodeContents(state.target);
      range.collapse(false);
      selection.addRange(range);
      document.execCommand('insertText', false, text);
    }
  }

  function getCurrentContextRoot() {
    if (state.contextRoot && document.contains(state.contextRoot)) {
      return state.contextRoot;
    }
    const fallback = findContextRoot(state.target);
    if (fallback) {
      state.contextRoot = fallback;
      return fallback;
    }
    return null;
  }

  function findContextRoot(start) {
    if (!start || !(start instanceof Element)) {
      return null;
    }
    const match = start.closest(COMMENT_SELECTOR);
    if (match) {
      return match;
    }
    return start.closest('section, div') || null;
  }

  function summarizeInputFromContext(context) {
    const parts = [`Primary message: ${context.primary}`];
    if (context.replies.length) {
      parts.push('Recent replies:');
      context.replies.forEach((reply, index) => {
        parts.push(`${index + 1}. ${reply}`);
      });
    }
    return parts.join('\n');
  }

  async function summarizeContext(context) {
    try {
      const summaryInput = summarizeInputFromContext(context);
      const prompt = `Summarize the conversation so an assistant can draft a reply. Focus on tone, key asks, and sentiment. Limit to 4 concise bullet points.\n\n${summaryInput}`;
      const response = await callModel({
        temperature: 0.2,
        topK: 3,
        system: 'You turn discussions into concise bullet summaries for downstream drafting.',
        prompt,
      });
      return response.trim();
    } catch (error) {
      console.warn('Summarization failed', error);
      return summarizeInputFromContext(context);
    }
  }

  function buildDraftPrompt(context, summary, brandFact) {
    const sections = [];
    sections.push('Use the context below to craft reply options.');
    sections.push(`Summary of thread:\n${summary}`);
    sections.push(`Primary message to respond to:\n${context.primary}`);
    if (context.replies.length) {
      sections.push(`Recent visible replies:\n- ${context.replies.join('\n- ')}`);
    }
    if (brandFact) {
      sections.push(`Weave this brand fact naturally when it helps: ${brandFact}`);
    }
    sections.push('Produce three distinct options tailored to the situation:');
    sections.push('1. A question-led follow-up that invites further conversation.');
    sections.push('2. A value-add reply offering help, insight, or direction.');
    sections.push('3. A warm or witty take that still respects all brand guardrails.');
    sections.push('Keep each reply under 600 characters, grounded in the thread details, and human in tone.');
    sections.push('Return minified JSON only: {"drafts":[string,string,string]}');
    return sections.join('\n\n');
  }

  async function applySafetyFilter(drafts, context, summary, brandFact) {
    const results = [];
    for (const draft of drafts) {
      if (!draft || !draft.trim()) {
        continue;
      }
      const outcome = await reviewDraftWithGuardrail(draft, context, summary, brandFact);
      if (outcome && outcome.reply && outcome.reply.trim()) {
        results.push(outcome.reply.trim());
      }
    }
    return Array.from(new Set(results)).slice(0, 3);
  }

  async function reviewDraftWithGuardrail(draft, context, summary, brandFact) {
    try {
      const prompt = `Evaluate the reply below. Fix grammar and punctuation. Reject or rewrite anything that sounds generic, spammy, off-topic, or violates the brand guardrails${brandFact ? `. Ensure any usage of the brand fact stays accurate: ${brandFact}` : ''}.\n\nThread summary:\n${summary}\n\nMessage to respond to:\n${context.primary}\n\nDraft reply:\n${draft}\n\nRespond with minified JSON {"status":"ok"|"reject","reply":string}. If you reject and cannot fix it safely, return an empty string reply.`;
      const response = await callModel({
        temperature: 0.2,
        topK: 3,
        system: 'You are a proofreader enforcing clarity and brand-safe tone.',
        prompt,
      });
      const cleaned = sanitizeModelJson(response);
      return JSON.parse(cleaned);
    } catch (error) {
      console.warn('Safety filter failed', error);
      return { status: 'ok', reply: draft };
    }
  }

  function getRecentReplies(root, max = 3) {
    if (!root) {
      return [];
    }
    const texts = [];
    const candidates = Array.from(document.querySelectorAll(COMMENT_SELECTOR));
    const index = candidates.indexOf(root);
    if (index > 0) {
      for (let i = Math.max(0, index - max); i < index; i += 1) {
        const text = extractText(candidates[i]);
        if (text) {
          texts.push(text);
        }
      }
    }
    if (texts.length < max) {
      const parent = root.parentElement;
      if (parent) {
        const siblings = Array.from(parent.querySelectorAll(COMMENT_SELECTOR));
        for (const node of siblings) {
          if (texts.length >= max || node === root) {
            continue;
          }
          const text = extractText(node);
          if (text && !texts.includes(text)) {
            texts.push(text);
          }
        }
      }
    }
    return texts.slice(-max);
  }

  function extractText(node) {
    if (!node) {
      return '';
    }
    const text = (node.innerText || node.textContent || '').replace(/\s+/g, ' ').trim();
    if (!text) {
      return '';
    }
    return text.length > 600 ? `${text.slice(0, 600)}…` : text;
  }

  function getBrandFact() {
    const fact = state.brandProfile?.brandVoice?.brandFact || state.brandProfile?.brandFact || '';
    return typeof fact === 'string' ? fact.trim() : '';
  }

  async function callModel({ system, prompt, temperature = 0.7, topK = 5 }) {
    if (!state.isApiAvailable) {
      throw new Error('LanguageModel API unavailable.');
    }
    const systemSegments = [BASE_SYSTEM_PROMPT];
    if (state.brandProfile?.brandVoice) {
      systemSegments.push(`Brand voice JSON: ${JSON.stringify(state.brandProfile.brandVoice)}`);
    }
    if (state.brandProfile?.masterPrompt) {
      systemSegments.push(state.brandProfile.masterPrompt);
    }
    if (system) {
      systemSegments.push(system);
    }
    const initialPrompts = [
      { role: 'system', content: systemSegments.join('\n\n') },
    ];
    const session = await LanguageModel.create({ temperature, topK, initialPrompts });
    try {
      return await runPrompt(session, prompt);
    } finally {
      session.destroy?.();
    }
  }

  async function runPrompt(session, prompt) {
    if (session.prompt) {
      return session.prompt(prompt);
    }
    if (session.promptStreaming) {
      const stream = await session.promptStreaming(prompt);
      let result = '';
      let previous = '';
      for await (const chunk of stream) {
        const fragment = chunk.startsWith(previous) ? chunk.slice(previous.length) : chunk;
        result += fragment;
        previous = chunk;
      }
      return result;
    }
    throw new Error('Prompt API shape unsupported.');
  }

  function parseDrafts(raw) {
    const cleaned = sanitizeModelJson(raw);
    try {
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed.drafts)) {
        return parsed.drafts.map((draft) => String(draft));
      }
    } catch (error) {
      console.warn('Draft JSON parse failed', error, { raw, cleaned });
    }
    return cleaned
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 3);
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

  function collectThreadContext() {
    if (!state.target) {
      return {
        primary: document.title,
        replies: [],
        title: document.title,
        url: location.href,
      };
    }
    const contextNode = getCurrentContextRoot();
    const targetValue = (state.target instanceof HTMLTextAreaElement || state.target instanceof HTMLInputElement)
      ? state.target.value.trim()
      : '';
    const primaryText = extractText(contextNode) || extractText(state.target) || targetValue || document.title;
    const recentReplies = getRecentReplies(contextNode, 3);
    return {
      primary: primaryText,
      replies: recentReplies,
      title: document.title,
      url: location.href,
    };
  }

  function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value;
    return div.innerHTML;
  }
})();
