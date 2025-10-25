(() => {
  if (window.replyBotInitialized) {
    return;
  }
  window.replyBotInitialized = true;

  // Only initialize on LinkedIn
  const hostname = window.location.hostname.toLowerCase();
  if (!hostname.includes('linkedin.com')) {
    return;
  }

  const BASE_SYSTEM_PROMPT = `You are LinkedVA, an on-device assistant that helps virtual assistants reply to conversations on LinkedIn.
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
    isDragging: false,
    hasDragged: false,
    dragOffset: { x: 0, y: 0 },
    customPosition: null,
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
    pill.textContent = 'LinkedVA';
    pill.style.cursor = 'grab';
    pill.addEventListener('mousedown', handleDragStart);
    pill.addEventListener('click', (event) => {
      // Only toggle panel if user didn't drag
      if (!state.hasDragged) {
        togglePanel();
      }
      // Reset flag for next interaction
      state.hasDragged = false;
    });

    state.panel = document.createElement('div');
    state.panel.className = 'replybot-panel replybot-hidden';

    const warning = document.createElement('div');
    warning.className = 'replybot-warning';
    warning.textContent = 'Set up a brand in the extension popup to unlock drafting.';
    state.panel.appendChild(warning);

    state.chips = document.createElement('div');
    state.chips.className = 'replybot-chips';
    state.chips.append(
      createChip('Draft', 'draft'),
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
    document.addEventListener('focusout', handleBlur, true);
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
    // Reset custom position when focusing a different field
    if (state.target !== target) {
      state.customPosition = null;
    }
    state.target = target;
    state.contextRoot = findContextRoot(target);
    showContainer();
    reposition();
  }

  function handleBlur(event) {
    // Use a small delay to allow focusin on another field to fire first
    setTimeout(() => {
      // Check if focus moved to another valid editable field
      const currentFocus = document.activeElement;
      
      // Check if the current focus is within the ReplyBot UI
      const focusedOnReplyBot = currentFocus && currentFocus.closest('[data-replybot-root]');
      
      // Don't hide if focus moved to ReplyBot or another valid editable field
      if (!isEditableField(currentFocus) && !focusedOnReplyBot) {
        // No valid field is focused and not interacting with ReplyBot, hide the container
        hideContainer();
        state.target = null;
        state.contextRoot = null;
      }
    }, 10);
  }

  function isMessengerChat(node) {
    // Check domain for standalone Messenger
    const hostname = window.location.hostname.toLowerCase();
    if (hostname.includes('messenger.com')) {
      return true;
    }

    // Check URL path for embedded Messenger on Facebook
    const pathname = window.location.pathname.toLowerCase();
    if (hostname.includes('facebook.com') && (pathname.includes('/messages') || pathname.includes('/t/'))) {
      return true;
    }

    // Check for Messenger-specific placeholders and attributes
    const placeholder = node.getAttribute('placeholder')?.toLowerCase() || '';
    const ariaLabel = node.getAttribute('aria-label')?.toLowerCase() || '';
    const combinedText = `${placeholder} ${ariaLabel}`;

    const messengerKeywords = [
      'aa',  // Facebook Messenger's common placeholder
      'message',
      'send a message',
      'type a message',
      'write a message',
      'start a conversation',
      'send message'
    ];

    // Check if in Messenger UI containers
    const messengerSelectors = [
      '[role="complementary"]',
      '[data-pagelet*="Messenger"]',
      '[aria-label*="Messenger"]',
      '[class*="messenger"]'
    ];

    const inMessengerContainer = messengerSelectors.some(selector => 
      node.closest(selector)
    );

    const hasMessengerKeyword = messengerKeywords.some(keyword => 
      combinedText.includes(keyword)
    );

    return inMessengerContainer || hasMessengerKeyword;
  }

  function isEditableField(node) {
    if (!(node instanceof HTMLElement)) {
      return false;
    }
    if (node.closest('[data-replybot-root]')) {
      return false;
    }

    // Block Messenger chats early before other validation
    if (isMessengerChat(node)) {
      return false;
    }

    // Only allow multi-line fields: textareas and contentEditable
    // Exclude all single-line INPUT elements
    const isTextarea = node.tagName === 'TEXTAREA';
    const isContentEditable = node.isContentEditable;
    const isTextbox = node.getAttribute('role') === 'textbox' && node.getAttribute('role') !== 'searchbox';

    if (!isTextarea && !isContentEditable && !isTextbox) {
      return false;
    }

    // Check for post creation indicators (exclude these)
    const placeholder = node.getAttribute('placeholder')?.toLowerCase() || '';
    const ariaLabel = node.getAttribute('aria-label')?.toLowerCase() || '';
    const combinedText = `${placeholder} ${ariaLabel}`;

    const postCreationKeywords = [
      'what\'s on your mind',
      'start a post',
      'share an update',
      'write a post',
      'create a post',
      'new post',
      'share something',
      'title',
      'document name',
      'file name',
      'untitled',
      'what do you want to talk about',
      'what\'s happening',
      'share your thoughts',
      'start writing',
      'compose'
    ];

    const hasPostCreationIndicator = postCreationKeywords.some(keyword => 
      combinedText.includes(keyword)
    );

    if (hasPostCreationIndicator) {
      return false;
    }

    // Check for comment/reply indicators (strong signals this IS a comment field)
    const commentKeywords = [
      'comment',
      'reply',
      'respond',
      'write a comment',
      'add a comment',
      'leave a comment',
      'your comment',
      'your reply',
      'write a reply',
      'add a reply'
    ];

    const hasCommentIndicator = commentKeywords.some(keyword => 
      combinedText.includes(keyword)
    );

    // Check if element is within a comment/reply context
    const contextRoot = findContextRoot(node);
    const hasCommentContext = contextRoot !== null && 
      contextRoot !== node.closest('section, div'); // Has specific context, not just a generic div

    // STRICT MODE: Only allow if has explicit comment indicators OR is within comment context
    // This prevents false positives on post creation fields
    if (hasCommentIndicator) {
      return true;
    }

    if (hasCommentContext && !hasPostCreationIndicator) {
      return true;
    }

    return false;
  }

  function showContainer() {
    state.container.classList.remove('replybot-hidden');
  }

  function hideContainer() {
    state.container.classList.add('replybot-hidden');
    hidePanel();
  }

  function togglePanel() {
    state.panel.classList.toggle('replybot-hidden');
  }

  function hidePanel() {
    state.panel.classList.add('replybot-hidden');
  }

  function handleDragStart(event) {
    // Prevent text selection during drag
    event.preventDefault();
    
    const pill = event.currentTarget;
    const rect = state.container.getBoundingClientRect();
    
    // Store offset from mouse to container top-left
    state.dragOffset = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
    
    state.isDragging = true;
    state.hasDragged = false; // Reset at start of potential drag
    pill.style.cursor = 'grabbing';
    
    // Add global event listeners
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
  }

  function handleDragMove(event) {
    if (!state.isDragging) return;
    
    // Mark that dragging has occurred
    state.hasDragged = true;
    
    // Calculate new position
    let newX = event.clientX - state.dragOffset.x + window.scrollX;
    let newY = event.clientY - state.dragOffset.y + window.scrollY;
    
    // Get container dimensions
    const rect = state.container.getBoundingClientRect();
    const containerWidth = rect.width;
    const containerHeight = rect.height;
    
    // Keep within viewport bounds with padding
    const minX = window.scrollX + 12;
    const maxX = window.scrollX + window.innerWidth - containerWidth - 12;
    const minY = window.scrollY + 12;
    const maxY = window.scrollY + window.innerHeight - containerHeight - 12;
    
    newX = Math.max(minX, Math.min(newX, maxX));
    newY = Math.max(minY, Math.min(newY, maxY));
    
    // Store custom position
    state.customPosition = { x: newX, y: newY };
    
    // Apply position
    state.container.style.top = `${newY}px`;
    state.container.style.left = `${newX}px`;
  }

  function handleDragEnd(event) {
    if (!state.isDragging) return;
    
    state.isDragging = false;
    
    // Reset cursor
    const pill = state.container.querySelector('.replybot-pill');
    if (pill) {
      pill.style.cursor = 'grab';
    }
    
    // Remove global event listeners
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
  }

  function reposition() {
    if (!state.target) {
      return;
    }
    
    // Use custom position if set (user dragged it)
    if (state.customPosition) {
      state.container.style.top = `${state.customPosition.y}px`;
      state.container.style.left = `${state.customPosition.x}px`;
      return;
    }
    
    // Default positioning relative to target field
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
    const draftLabels = [
      'Question/Follow-up',
      'Value-Add/Insight',
      'Warm/Casual'
    ];
    const fragment = document.createDocumentFragment();
    drafts.forEach((draft, index) => {
      const card = document.createElement('article');
      card.className = 'replybot-draft';

      const title = document.createElement('header');
      const label = draftLabels[index] || `Option ${index + 1}`;
      title.textContent = label;
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
    sections.push('Do NOT use em dashes (–) or en dashes (—). Use regular hyphens (-) or avoid dashes entirely.'); // ADD THIS
    sections.push('');
    sections.push('CRITICAL: You MUST return ONLY valid JSON in this EXACT format:');
    sections.push('{"drafts":["reply 1 text here","reply 2 text here","reply 3 text here"]}');
    sections.push('');
    sections.push('Do NOT include markdown code blocks, explanations, or any other text. ONLY the JSON object.');
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
      const prompt = `Evaluate the reply below. Fix grammar and punctuation. Reject or rewrite anything that sounds generic, spammy, off-topic, or violates the brand guardrails${brandFact ? `. Ensure any usage of the brand fact stays accurate: ${brandFact}` : ''}.\n\nThread summary:\n${summary}\n\nMessage to respond to:\n${context.primary}\n\nDraft reply:\n${draft}\n\nIMPORTANT: Escape all quotes and special characters in the reply text properly. Replace em dashes with regular hyphens.\n\nRespond with minified JSON {"status":"ok"|"reject","reply":"text here"}. If you reject and cannot fix it safely, return an empty string reply.`;
      const response = await callModel({
        temperature: 0.2,
        topK: 3,
        system: 'You are a proofreader enforcing clarity and brand-safe tone.',
        prompt,
      });
      const cleaned = sanitizeModelJson(response);

      // Try to parse, with fallback
      try {
        return JSON.parse(cleaned);
      } catch (parseError) {
        console.warn('JSON parse failed, trying to fix:', cleaned);
        // Try to extract status and reply manually
        const statusMatch = cleaned.match(/"status"\s*:\s*"(ok|reject)"/);
        const replyMatch = cleaned.match(/"reply"\s*:\s*"([^"]*)"/);

        if (statusMatch && replyMatch) {
          return {
            status: statusMatch[1],
            reply: replyMatch[1]
          };
        }

        // Last resort: just use the original draft
        throw parseError;
      }
    } catch (error) {
      console.warn('Safety filter failed', error);
      // Return original draft if safety check fails
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

  function getLanguageCode(languageName) {
    if (!languageName) {
      return 'en';
    }
    const normalized = languageName.toLowerCase().trim();
    const languageMap = {
      'english': 'en',
      'spanish': 'es',
      'español': 'es',
      'espanol': 'es',
      'japanese': 'ja',
      '日本語': 'ja',
      'ja': 'ja',
      'en': 'en',
      'es': 'es'
    };
    return languageMap[normalized] || 'en';
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
    const targetLanguage = state.brandProfile?.brandVoice?.targetLanguage;
    const languageCode = getLanguageCode(targetLanguage);
    const session = await LanguageModel.create({ 
      temperature, 
      topK, 
      initialPrompts,
      outputLanguage: languageCode
    });
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
    
    // Attempt 1: Try standard JSON.parse
    try {
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed.drafts) && parsed.drafts.length > 0) {
        return parsed.drafts.map((draft) => String(draft)).slice(0, 3);
      }
    } catch (error) {
      console.warn('Standard JSON parse failed, trying fallbacks', error);
    }
    
    // Attempt 2: Regex extraction of drafts array
    try {
      // Match "drafts":[...] or 'drafts':[...]
      const arrayMatch = cleaned.match(/["']drafts["']\s*:\s*\[(.*?)\]/s);
      if (arrayMatch && arrayMatch[1]) {
        const arrayContent = arrayMatch[1];
        // Extract strings within quotes
        const stringMatches = arrayContent.match(/["']([^"']*?)["']/g);
        if (stringMatches && stringMatches.length > 0) {
          const drafts = stringMatches.map(str => 
            str.slice(1, -1) // Remove surrounding quotes
              .replace(/\\n/g, ' ') // Replace escaped newlines with spaces
              .replace(/\\"/g, '"') // Unescape quotes
              .replace(/\\\\/g, '\\') // Unescape backslashes
              .trim()
          ).filter(Boolean);
          if (drafts.length > 0) {
            console.log('Regex extraction successful', drafts);
            return drafts.slice(0, 3);
          }
        }
      }
    } catch (error) {
      console.warn('Regex extraction failed', error);
    }
    
    // Attempt 3: Split by common delimiters and clean up
    try {
      // Remove common JSON artifacts
      let content = cleaned
        .replace(/^\{[^:]*:[\[\s]*/, '') // Remove {"drafts":[
        .replace(/[\]\s]*\}$/, '') // Remove ]}
        .replace(/\\n/g, ' ') // Replace escaped newlines
        .replace(/\\"/g, '"'); // Unescape quotes
      
      // Split by common separators: "," or newlines with quotes
      const lines = content
        .split(/"\s*,\s*"|\n+/)
        .map(line => 
          line.trim()
            .replace(/^["'\[\{]+/, '') // Remove leading quotes/brackets
            .replace(/["'\]\}]+$/, '') // Remove trailing quotes/brackets
            .replace(/^\d+\.\s*/, '') // Remove numbered list prefixes
            .trim()
        )
        .filter(line => 
          line.length > 10 && // Minimum meaningful length
          !line.match(/^(drafts?|reply|option|\{|\}|\[|\]|null|undefined)$/i) // Filter out artifacts
        );
      
      if (lines.length > 0) {
        console.log('Delimiter split successful', lines);
        return lines.slice(0, 3);
      }
    } catch (error) {
      console.warn('Delimiter split failed', error);
    }
    
    // Attempt 4: Last resort - return cleaned text as single draft
    const lastResort = cleaned
      .replace(/[\{\}\[\]"]/g, '') // Remove all JSON chars
      .replace(/drafts?:/gi, '') // Remove "drafts:" labels
      .trim();
    
    if (lastResort.length > 10) {
      console.warn('Using last resort parsing, returning single draft');
      return [lastResort];
    }
    
    // Complete failure
    console.error('All parsing attempts failed', { raw, cleaned });
    return ['Unable to generate drafts. Please try again.'];
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
