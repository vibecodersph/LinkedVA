// content/leadExtract.js
// Handles page interaction and lead extraction UI

(() => {
  // Prevent multiple initializations
  if (window.leadExtractInitialized) {
    return;
  }
  window.leadExtractInitialized = true;

  // Only initialize on LinkedIn
  const hostname = window.location.hostname.toLowerCase();
  if (!hostname.includes('linkedin.com')) {
    return;
  }

let extractButton = null;
let isExtracting = false;

// Create floating extraction button
function createExtractButton() {
  if (extractButton) return;

  extractButton = document.createElement('div');
  extractButton.id = 'lead-extract-button';
  extractButton.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <line x1="19" y1="8" x2="19" y2="14"></line>
      <line x1="22" y1="11" x2="16" y2="11"></line>
    </svg>
    <span>Extract Lead</span>
  `;

  extractButton.addEventListener('click', handleExtractClick);

  // Make button draggable
  makeDraggable(extractButton);

  document.body.appendChild(extractButton);
}

// Make element draggable
function makeDraggable(element) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

  element.addEventListener('mousedown', dragMouseDown);

  function dragMouseDown(e) {
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.addEventListener('mouseup', closeDragElement);
    document.addEventListener('mousemove', elementDrag);
  }

  function elementDrag(e) {
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    element.style.top = (element.offsetTop - pos2) + 'px';
    element.style.left = (element.offsetLeft - pos1) + 'px';
  }

  function closeDragElement() {
    document.removeEventListener('mouseup', closeDragElement);
    document.removeEventListener('mousemove', elementDrag);
  }
}

// Handle extract button click
async function handleExtractClick() {
  if (isExtracting) return;

  isExtracting = true;
  extractButton.classList.add('loading');
  extractButton.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin">
      <circle cx="12" cy="12" r="10"></circle>
    </svg>
    <span>Extracting...</span>
  `;

  try {
    // Get selected text if any
    const selectedText = window.getSelection().toString().trim();

    // Get page content
    const pageContent = extractPageContent();

    // Get current page URL for LinkedIn profile URL
    const currentUrl = window.location.href;

    // Send to background script for AI processing
    let response;
    try {
      response = await chrome.runtime.sendMessage({
        action: 'extractLead',
        pageContent,
        selectedText,
        pageUrl: currentUrl
      });
    } catch (err) {
      if (err.message && err.message.includes('Extension context invalidated')) {
        throw new Error('Extension was reloaded. Please refresh this page and try again.');
      }
      throw err;
    }

    if (response && response.success) {
      // Save lead
      try {
        await chrome.runtime.sendMessage({
          action: 'saveLead',
          lead: response.data,
          url: window.location.href
        });
      } catch (err) {
        if (err.message && err.message.includes('Extension context invalidated')) {
          throw new Error('Extension was reloaded. Please refresh this page and try again.');
        }
        throw err;
      }

      // Show success
      showNotification('Lead extracted successfully!', 'success');

      // Update button
      extractButton.classList.remove('loading');
      extractButton.classList.add('success');
      extractButton.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <span>Extracted!</span>
      `;

      setTimeout(() => {
        extractButton.classList.remove('success');
        resetButton();
      }, 2000);
    } else {
      throw new Error((response && response.error) || 'Extraction failed');
    }
  } catch (error) {
    console.error('[Lead Extractor] Error:', error);
    showNotification(error.message || 'Failed to extract lead', 'error');
    extractButton.classList.remove('loading');
    resetButton();
  }

  isExtracting = false;
}

// Extract relevant content from page - SMART extraction to avoid posts/activity
function extractPageContent() {
  console.log('='.repeat(80));
  console.log('[Lead Extractor] SMART CONTENT EXTRACTION');
  console.log('='.repeat(80));

  let extractedSections = [];

  // 1. HEADER SECTION - Name, Role, Company, Location
  const headerSelectors = [
    '.pv-text-details__left-panel',
    '.ph5.pb5',
    '.pv-top-card',
    'section.artdeco-card:first-of-type',
    '.profile-header'
  ];

  for (const selector of headerSelectors) {
    const header = document.querySelector(selector);
    if (header) {
      const headerText = header.innerText;
      extractedSections.push('=== HEADER ===');
      extractedSections.push(headerText);
      console.log('✅ Found header section:', selector, '(', headerText.length, 'chars)');
      break;
    }
  }

  // 2. ABOUT SECTION - Professional summary
  const aboutSelectors = [
    '#about',
    '[id*="about"]',
    'section:has(#about)',
    'section.artdeco-card.pv-profile-card'
  ];

  for (const selector of aboutSelectors) {
    try {
      const aboutSection = document.querySelector(selector);
      if (aboutSection && aboutSection.innerText.toLowerCase().includes('about')) {
        const aboutText = aboutSection.innerText;
        extractedSections.push('\n=== ABOUT ===');
        extractedSections.push(aboutText);
        console.log('✅ Found about section:', selector, '(', aboutText.length, 'chars)');
        break;
      }
    } catch (e) {
      // Skip invalid selectors
    }
  }

  // 3. EXPERIENCE SECTION - Work history (but limit to avoid too much text)
  const experienceSection = document.querySelector('#experience, [id*="experience"]');
  if (experienceSection) {
    const expText = experienceSection.innerText.substring(0, 1000); // Limit experience to 1000 chars
    extractedSections.push('\n=== EXPERIENCE (limited) ===');
    extractedSections.push(expText);
    console.log('✅ Found experience section (limited to 1000 chars)');
  }

  // 4. EDUCATION SECTION
  const educationSection = document.querySelector('#education, [id*="education"]');
  if (educationSection) {
    const eduText = educationSection.innerText.substring(0, 800); // Limit to 800 chars
    extractedSections.push('\n=== EDUCATION ===');
    extractedSections.push(eduText);
    console.log('✅ Found education section');
  }

  // 5. SKILLS SECTION
  const skillsSelectors = [
    '#skills',
    '[id*="skills"]',
    'section:has(#skills)'
  ];

  for (const selector of skillsSelectors) {
    try {
      const skillsSection = document.querySelector(selector);
      if (skillsSection && skillsSection.innerText.toLowerCase().includes('skill')) {
        const skillsText = skillsSection.innerText.substring(0, 1000); // Limit skills
        extractedSections.push('\n=== SKILLS ===');
        extractedSections.push(skillsText);
        console.log('✅ Found skills section:', selector);
        break;
      }
    } catch (e) {
      // Skip invalid selectors
    }
  }

  // Combine all sections
  const content = extractedSections.join('\n');

  console.log('\n--- EXTRACTION SUMMARY ---');
  console.log('Total sections found:', extractedSections.filter(s => s.startsWith('===')).length);
  console.log('Total content length:', content.length, 'chars');

  // Check what we got
  console.log('\n--- SECTION DETECTION ---');
  console.log('Contains "About":', content.includes('About'));
  console.log('Contains "Skills":', content.includes('Skills') || content.includes('skill'));
  console.log('Contains "Experience":', content.includes('Experience'));
  console.log('Contains "Education":', content.includes('Education'));

  console.log('\n--- EXTRACTED CONTENT ---');
  console.log(content);
  console.log('='.repeat(80));

  return content;
}

// Reset button to initial state
function resetButton() {
  extractButton.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <line x1="19" y1="8" x2="19" y2="14"></line>
      <line x1="22" y1="11" x2="16" y2="11"></line>
    </svg>
    <span>Extract Lead</span>
  `;
}

// Show notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `lead-extract-notification ${type}`;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('show');
  }, 100);

  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createExtractButton);
} else {
  createExtractButton();
}

console.log('[Lead Extractor] Content script loaded');

})(); // End of IIFE wrapper
