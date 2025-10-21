// content/leadExtract.js
// Handles page interaction and lead extraction UI

(() => {
  // Prevent multiple initializations
  if (window.leadExtractInitialized) {
    return;
  }
  window.leadExtractInitialized = true;

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

    // Send to background script for AI processing
    const response = await chrome.runtime.sendMessage({
      action: 'extractLead',
      pageContent,
      selectedText
    });

    if (response.success) {
      // Save lead
      await chrome.runtime.sendMessage({
        action: 'saveLead',
        lead: response.data,
        url: window.location.href
      });

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
      throw new Error(response.error || 'Extraction failed');
    }
  } catch (error) {
    console.error('[Lead Extractor] Error:', error);
    showNotification(error.message || 'Failed to extract lead', 'error');
    extractButton.classList.remove('loading');
    resetButton();
  }

  isExtracting = false;
}

// Extract relevant content from page
function extractPageContent() {
  // Get text content from main areas
  const selectors = [
    'main',
    'article',
    '[role="main"]',
    '.profile',
    '.profile-section',
    '#profile',
    'body'
  ];

  let content = '';

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      content = element.innerText;
      break;
    }
  }

  // Limit content size (first 3000 chars should be enough)
  return content.substring(0, 3000);
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
