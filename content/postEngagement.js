// Post Engagement Extractor - Extract commenters and likers from LinkedIn posts
// Follows the same architecture pattern as leadExtract.js

let extractButton = null;
let isExtracting = false;

// Initialize the engagement extractor when DOM is ready
function init() {
  console.log('[PostEngagement] Initializing...');

  // Check if we're on a LinkedIn post page
  if (isLinkedInPostPage()) {
    console.log('[PostEngagement] LinkedIn post page detected');
    createExtractButton();
  } else {
    // Monitor for navigation changes (LinkedIn is SPA)
    observePageChanges();
  }
}

// Detect if we're on a LinkedIn post page
function isLinkedInPostPage() {
  const url = window.location.href;
  const isPostUrl = url.includes('/feed/update/') ||
                    url.includes('/posts/') ||
                    (url.includes('/feed/') && document.querySelector('[data-urn*="activity"]'));

  console.log('[PostEngagement] URL check:', url, 'Is post:', isPostUrl);
  return isPostUrl;
}

// Monitor for page changes in SPA
function observePageChanges() {
  let lastUrl = window.location.href;

  const observer = new MutationObserver(() => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;

      if (isLinkedInPostPage()) {
        console.log('[PostEngagement] Navigated to post page');
        if (!extractButton) {
          createExtractButton();
        }
      } else {
        // Remove button if navigated away from post
        if (extractButton) {
          extractButton.remove();
          extractButton = null;
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Create the floating extract button
function createExtractButton() {
  // Check if button already exists
  if (extractButton) {
    console.log('[PostEngagement] Button already exists');
    return;
  }

  const button = document.createElement('button');
  button.id = 'linkedva-engagement-extract-btn';
  button.className = 'linkedva-engagement-btn';
  button.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
    <span>Extract Engagement</span>
  `;

  button.addEventListener('click', handleExtractClick);
  document.body.appendChild(button);
  extractButton = button;

  // Make button draggable
  makeDraggable(button);

  console.log('[PostEngagement] Extract button created');
}

// Make button draggable
function makeDraggable(element) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

  element.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    // Only drag if clicking the button itself, not during extraction
    if (isExtracting) return;

    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
    element.style.cursor = 'grabbing';
  }

  function elementDrag(e) {
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    element.style.top = (element.offsetTop - pos2) + "px";
    element.style.left = (element.offsetLeft - pos1) + "px";
    element.style.right = 'auto';
    element.style.bottom = 'auto';
  }

  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
    element.style.cursor = 'grab';
  }
}

// Handle extract button click
async function handleExtractClick(e) {
  // Prevent drag behavior
  if (Math.abs(e.clientX - (e.target.pos3 || e.clientX)) > 5) return;

  if (isExtracting) {
    console.log('[PostEngagement] Already extracting, ignoring click');
    return;
  }

  isExtracting = true;
  updateButtonState('loading');

  try {
    console.log('[PostEngagement] Starting engagement extraction...');

    // Extract post engagement data
    const engagementData = await extractPostEngagement();

    if (!engagementData) {
      throw new Error('Failed to extract engagement data');
    }

    console.log('[PostEngagement] Extracted data:', engagementData);

    // Send to background worker
    const response = await chrome.runtime.sendMessage({
      action: 'savePostEngagement',
      engagement: engagementData,
      postUrl: window.location.href
    });

    if (response && response.success) {
      console.log('[PostEngagement] Successfully saved engagement data');
      updateButtonState('success');
      showNotification('Engagement data extracted successfully!', 'success');
    } else {
      throw new Error(response?.error || 'Failed to save engagement data');
    }
  } catch (error) {
    console.error('[PostEngagement] Extraction error:', error);
    updateButtonState('error');
    showNotification(`Error: ${error.message}`, 'error');
  } finally {
    isExtracting = false;
    setTimeout(() => updateButtonState('default'), 3000);
  }
}

// Update button visual state
function updateButtonState(state) {
  if (!extractButton) return;

  const button = extractButton;
  const span = button.querySelector('span');
  const svg = button.querySelector('svg');

  // Remove all state classes
  button.classList.remove('loading', 'success', 'error');

  switch (state) {
    case 'loading':
      button.classList.add('loading');
      span.textContent = 'Extracting...';
      svg.innerHTML = `
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"
                stroke-dasharray="31.4" stroke-dashoffset="10"
                style="animation: spin 1s linear infinite;">
          <animateTransform attributeName="transform" type="rotate"
                          from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
        </circle>
      `;
      break;

    case 'success':
      button.classList.add('success');
      span.textContent = 'Success!';
      svg.innerHTML = `
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" stroke-width="2" fill="none"></path>
        <polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" stroke-width="2" fill="none"></polyline>
      `;
      break;

    case 'error':
      button.classList.add('error');
      span.textContent = 'Error';
      svg.innerHTML = `
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"></circle>
        <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2"></line>
        <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2"></line>
      `;
      break;

    default:
      span.textContent = 'Extract Engagement';
      svg.innerHTML = `
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2" fill="none"></path>
        <circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2" fill="none"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" stroke-width="2" fill="none"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" stroke-width="2" fill="none"></path>
      `;
  }
}

// Extract engagement data from the current post
async function extractPostEngagement() {
  console.log('[PostEngagement] Starting extraction process...');

  // Get post metadata
  const postData = extractPostMetadata();
  console.log('[PostEngagement] Post metadata:', postData);

  // Expand all comments first
  await expandAllComments();

  // Extract commenters
  const commenters = await extractCommenters();
  console.log('[PostEngagement] Found commenters:', commenters.length);

  // Extract likers (this is more complex and may require modal interaction)
  const likers = await extractLikers();
  console.log('[PostEngagement] Found likers:', likers.length);

  // Compile engagement data
  const engagementData = {
    ...postData,
    commenters,
    likers,
    stats: {
      totalComments: commenters.length,
      totalLikes: likers.length,
      totalEngagement: commenters.length + likers.length
    },
    extractedAt: Date.now()
  };

  return engagementData;
}

// Extract post metadata
function extractPostMetadata() {
  const url = window.location.href;

  // Extract post URN from URL
  const urnMatch = url.match(/urn:li:activity:(\d+)/);
  const postId = urnMatch ? urnMatch[1] : url.split('/').pop();

  // Find post container
  const postContainer = document.querySelector('[data-urn*="activity"]') ||
                       document.querySelector('.feed-shared-update-v2') ||
                       document.querySelector('article[role="article"]');

  // Extract post content/title (first 100 chars)
  let postTitle = 'LinkedIn Post';
  let postAuthor = 'Unknown';

  if (postContainer) {
    const contentEl = postContainer.querySelector('.feed-shared-update-v2__description') ||
                     postContainer.querySelector('.feed-shared-text') ||
                     postContainer.querySelector('[data-test-id="main-feed-activity-card__commentary"]');

    if (contentEl) {
      postTitle = contentEl.textContent.trim().substring(0, 100);
    }

    // Extract post author
    const authorEl = postContainer.querySelector('.feed-shared-actor__name') ||
                    postContainer.querySelector('.update-components-actor__name');
    if (authorEl) {
      postAuthor = authorEl.textContent.trim();
    }
  }

  return {
    postId,
    postUrl: url,
    postTitle,
    postAuthor
  };
}

// Expand all comments by clicking "Load more" buttons
async function expandAllComments() {
  console.log('[PostEngagement] Expanding all comments...');

  const maxIterations = 20; // Prevent infinite loops
  let iteration = 0;

  while (iteration < maxIterations) {
    // Find "Show more comments" or "Load more" buttons
    const loadMoreButtons = Array.from(document.querySelectorAll('button')).filter(btn => {
      const text = btn.textContent.toLowerCase();
      return text.includes('show more') ||
             text.includes('load more') ||
             text.includes('see more') ||
             text.includes('previous comment');
    });

    if (loadMoreButtons.length === 0) {
      console.log('[PostEngagement] No more comments to load');
      break;
    }

    console.log(`[PostEngagement] Found ${loadMoreButtons.length} load more buttons, clicking...`);

    // Click all load more buttons
    for (const button of loadMoreButtons) {
      button.click();
      await sleep(500); // Wait for content to load
    }

    iteration++;
    await sleep(1000); // Wait for new content to render
  }

  console.log('[PostEngagement] Finished expanding comments');
}

// Extract all commenters
async function extractCommenters() {
  const commenters = [];
  const seenProfiles = new Set();

  // Multiple selectors for LinkedIn's changing DOM structure
  const commentSelectors = [
    '.comments-comment-item',
    '[data-test-id="comment"]',
    '.comment-item',
    '[data-view-name="comment"]',
    '.comments-comment-item-v2'
  ];

  let commentElements = [];
  for (const selector of commentSelectors) {
    commentElements = document.querySelectorAll(selector);
    if (commentElements.length > 0) {
      console.log(`[PostEngagement] Found ${commentElements.length} comments using selector: ${selector}`);
      break;
    }
  }

  console.log(`[PostEngagement] Processing ${commentElements.length} comment elements...`);

  commentElements.forEach((commentEl, index) => {
    try {
      const commenterData = extractCommenterData(commentEl);

      if (commenterData && commenterData.profileUrl) {
        // Deduplicate by profile URL
        if (!seenProfiles.has(commenterData.profileUrl)) {
          seenProfiles.add(commenterData.profileUrl);
          commenters.push(commenterData);
          console.log(`[PostEngagement] Extracted commenter ${index + 1}:`, commenterData.name);
        }
      }
    } catch (error) {
      console.error(`[PostEngagement] Error extracting commenter ${index}:`, error);
    }
  });

  return commenters;
}

// Extract data from a single comment element
function extractCommenterData(commentEl) {
  // Find profile link
  const profileLink = commentEl.querySelector('a[href*="/in/"]') ||
                     commentEl.querySelector('a[href*="linkedin.com/in/"]');

  if (!profileLink) {
    console.log('[PostEngagement] No profile link found in comment');
    return null;
  }

  // Extract clean profile URL
  const profileUrl = extractCleanLinkedInUrl(profileLink);

  if (!profileUrl) {
    console.log('[PostEngagement] Could not extract clean profile URL');
    return null;
  }

  // Extract name (clean it from accessibility text)
  const nameEl = commentEl.querySelector('.comments-post-meta__name-text') ||
                commentEl.querySelector('.feed-shared-actor__name') ||
                commentEl.querySelector('[data-test-id="comment-author-name"]') ||
                profileLink;
  const rawName = nameEl ? nameEl.textContent.trim() : 'Unknown';
  const name = cleanLinkedInName(rawName);

  // Extract title/headline - try multiple selectors
  const titleEl = commentEl.querySelector('.comments-post-meta__headline') ||
                 commentEl.querySelector('.feed-shared-actor__description') ||
                 commentEl.querySelector('[data-test-id="comment-author-headline"]') ||
                 commentEl.querySelector('.comments-post-meta__description') ||
                 commentEl.querySelector('.t-12.t-black--light.t-normal');

  const title = titleEl ? titleEl.textContent.trim() : '';

  // Extract comment text
  const commentTextEl = commentEl.querySelector('.comments-comment-item__main-content') ||
                       commentEl.querySelector('.comments-comment-item-content-body') ||
                       commentEl.querySelector('[data-test-id="comment-text"]') ||
                       commentEl.querySelector('.comments-comment-item__inline-show-more-text');
  const comment = commentTextEl ? commentTextEl.textContent.trim() : '';

  // Extract timestamp
  const timeEl = commentEl.querySelector('time') ||
                commentEl.querySelector('.comments-comment-meta__timestamp');
  const timestamp = timeEl ? timeEl.getAttribute('datetime') || timeEl.textContent.trim() : '';

  console.log('[PostEngagement] Extracted commenter:', { name, title: title || '(no title)', hasComment: !!comment });

  return {
    name,
    title,
    profileUrl,
    comment: comment.substring(0, 500), // Limit comment length
    timestamp,
    engagementType: 'comment'
  };
}

// Extract likers (requires opening reactions modal)
async function extractLikers() {
  console.log('[PostEngagement] Starting liker extraction...');

  const likers = [];

  try {
    // Find reactions button
    const reactionsButton = findReactionsButton();

    if (!reactionsButton) {
      console.log('[PostEngagement] Reactions button not found');
      return likers;
    }

    console.log('[PostEngagement] Found reactions button, clicking...');

    // Click to open reactions modal
    reactionsButton.click();
    await sleep(2000); // Wait for modal to open

    // Find modal
    const modal = document.querySelector('[role="dialog"]') ||
                 document.querySelector('.artdeco-modal');

    if (!modal) {
      console.log('[PostEngagement] Reactions modal not found');
      return likers;
    }

    console.log('[PostEngagement] Reactions modal opened, scrolling to load all...');

    // Scroll modal to load all likers
    await scrollModalToBottom(modal);

    // Extract liker profiles from modal - try multiple container selectors
    let likerElements = modal.querySelectorAll('li.artdeco-list__item');

    if (likerElements.length === 0) {
      likerElements = modal.querySelectorAll('li');
    }

    if (likerElements.length === 0) {
      likerElements = modal.querySelectorAll('[data-test-id="social-actions-modal-list-item"]');
    }

    if (likerElements.length === 0) {
      // Try looking for profile cards
      likerElements = modal.querySelectorAll('.scaffold-finite-scroll__content > div');
    }

    console.log(`[PostEngagement] Found ${likerElements.length} liker elements in modal`);

    const seenProfiles = new Set();

    likerElements.forEach((likerEl, index) => {
      try {
        const likerData = extractLikerData(likerEl);

        if (likerData && likerData.profileUrl) {
          if (!seenProfiles.has(likerData.profileUrl)) {
            seenProfiles.add(likerData.profileUrl);
            likers.push(likerData);
            console.log(`[PostEngagement] Extracted liker ${index + 1}:`, likerData.name);
          }
        }
      } catch (error) {
        console.error(`[PostEngagement] Error extracting liker ${index}:`, error);
      }
    });

    // Close modal
    const closeButton = modal.querySelector('button[aria-label*="Dismiss"]') ||
                       modal.querySelector('.artdeco-modal__dismiss');
    if (closeButton) {
      closeButton.click();
      await sleep(500);
    }

  } catch (error) {
    console.error('[PostEngagement] Error extracting likers:', error);
  }

  return likers;
}

// Find the reactions button
function findReactionsButton() {
  // Try different selectors
  const selectors = [
    'button[aria-label*="reaction"]',
    'button[aria-label*="Like"]',
    '.social-details-social-counts__reactions',
    '[data-test-id="social-actions__reaction-button"]'
  ];

  for (const selector of selectors) {
    const buttons = document.querySelectorAll(selector);
    for (const button of buttons) {
      const text = button.textContent.toLowerCase();
      // Look for buttons with reaction counts
      if (text.match(/\d+/) || button.getAttribute('aria-label')?.includes('reaction')) {
        return button;
      }
    }
  }

  // Fallback: find any button with "reaction" in aria-label
  const allButtons = document.querySelectorAll('button');
  for (const button of allButtons) {
    const label = button.getAttribute('aria-label') || '';
    if (label.toLowerCase().includes('reaction') ||
        label.toLowerCase().includes('like')) {
      return button;
    }
  }

  return null;
}

// Scroll modal to bottom to load all likers
async function scrollModalToBottom(modal) {
  const scrollContainer = modal.querySelector('.artdeco-modal__content') ||
                         modal.querySelector('[role="dialog"] > div') ||
                         modal;

  let lastHeight = 0;
  let currentHeight = scrollContainer.scrollHeight;
  let attempts = 0;
  const maxAttempts = 30;

  while (currentHeight > lastHeight && attempts < maxAttempts) {
    lastHeight = currentHeight;
    scrollContainer.scrollTop = scrollContainer.scrollHeight;
    await sleep(800);
    currentHeight = scrollContainer.scrollHeight;
    attempts++;
    console.log(`[PostEngagement] Scrolling modal... attempt ${attempts}`);
  }

  console.log('[PostEngagement] Finished scrolling modal');
}

// Extract data from a single liker element
function extractLikerData(likerEl) {
  // Find profile link - try multiple selectors
  const profileLink = likerEl.querySelector('a[href*="/in/"]') ||
                     likerEl.querySelector('a[href*="linkedin.com/in/"]') ||
                     Array.from(likerEl.querySelectorAll('a')).find(a => a.href.includes('/in/'));

  if (!profileLink) {
    console.log('[PostEngagement] No profile link found in liker element');
    return null;
  }

  // Extract clean profile URL
  const profileUrl = extractCleanLinkedInUrl(profileLink);

  if (!profileUrl) {
    console.log('[PostEngagement] Could not extract profile URL from liker');
    return null;
  }

  // Extract name (clean it from accessibility text)
  // Try multiple selectors for the modal structure
  const nameEl = likerEl.querySelector('.artdeco-entity-lockup__title') ||
                likerEl.querySelector('[data-test-id="member-name"]') ||
                likerEl.querySelector('.feed-shared-actor__name') ||
                likerEl.querySelector('span[aria-hidden="true"]') ||
                likerEl.querySelector('span[dir="ltr"]') ||
                profileLink.querySelector('span') ||
                profileLink;

  const rawName = nameEl ? nameEl.textContent.trim() : 'Unknown';
  const name = cleanLinkedInName(rawName);

  // Extract title/headline - try multiple selectors
  const titleEl = likerEl.querySelector('.artdeco-entity-lockup__subtitle') ||
                 likerEl.querySelector('[data-test-id="member-headline"]') ||
                 likerEl.querySelector('.artdeco-entity-lockup__caption') ||
                 likerEl.querySelector('.feed-shared-actor__description') ||
                 likerEl.querySelector('.t-12.t-black--light.t-normal');

  const title = titleEl ? titleEl.textContent.trim() : '';

  console.log('[PostEngagement] Extracted liker:', { name, title: title || '(no title)', profileUrl });

  return {
    name,
    title,
    profileUrl,
    engagementType: 'like'
  };
}

// Helper function: Clean LinkedIn name from accessibility text
function cleanLinkedInName(rawName) {
  if (!rawName) return 'Unknown';

  let cleanName = rawName;

  // Remove common LinkedIn accessibility patterns
  // Examples: "View Paul Roberts' profile", "View profile for John Doe"
  cleanName = cleanName.replace(/^View\s+/i, '');
  cleanName = cleanName.replace(/View\s+.*?\s+profile$/i, '');
  cleanName = cleanName.replace(/\s*'s?\s+profile$/i, '');
  cleanName = cleanName.replace(/View\s+profile\s+for\s+/i, '');
  cleanName = cleanName.replace(/\s+profile$/i, '');

  // Remove degree symbols and extra info that might be appended
  cleanName = cleanName.split('•')[0].trim();
  cleanName = cleanName.split('·')[0].trim();

  // Clean up extra whitespace
  cleanName = cleanName.replace(/\s+/g, ' ').trim();

  return cleanName || 'Unknown';
}

// Helper function: Extract clean LinkedIn vanity URL
function extractCleanLinkedInUrl(profileLink) {
  if (!profileLink || !profileLink.href) return null;

  const href = profileLink.href;

  try {
    const url = new URL(href);
    const pathname = url.pathname;

    // Extract the username from /in/username/ pattern
    const match = pathname.match(/\/in\/([^\/]+)/);

    if (!match) return null;

    const username = match[1];

    // Check if it's a clean vanity URL (not encrypted)
    // Encrypted URLs start with ACoAAA
    if (username.startsWith('ACoAAA') || username.startsWith('ACoAA')) {
      console.log('[PostEngagement] Detected encrypted URL, attempting to find vanity URL...');

      // Try to find the vanity URL in other attributes
      const vanityUrl = findVanityUrlInElement(profileLink);
      if (vanityUrl) {
        console.log('[PostEngagement] Found clean vanity URL:', vanityUrl);
        return vanityUrl;
      }

      // Use encrypted URL as fallback - it still works when logged in
      console.warn('[PostEngagement] Using encrypted URL as fallback:', href);
      return `https://www.linkedin.com/in/${username}/`;
    }

    // Return the clean vanity URL
    return `https://www.linkedin.com/in/${username}/`;
  } catch (error) {
    console.error('[PostEngagement] Error parsing LinkedIn URL:', error);
    return null;
  }
}

// Helper function: Try to find vanity URL in element or its parents
function findVanityUrlInElement(element) {
  // Check the element's aria-label which sometimes contains the vanity username
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) {
    // Sometimes the aria-label contains the vanity URL
    const match = ariaLabel.match(/linkedin\.com\/in\/([a-zA-Z0-9-]+)/);
    if (match && !match[1].startsWith('ACoAAA')) {
      return `https://www.linkedin.com/in/${match[1]}/`;
    }
  }

  // Check data attributes for public identifier
  const dataAttributes = element.getAttributeNames().filter(name => name.startsWith('data-'));
  for (const attr of dataAttributes) {
    const value = element.getAttribute(attr);
    if (value && value.includes('/in/')) {
      const match = value.match(/\/in\/([a-zA-Z0-9-]+)/);
      if (match && !match[1].startsWith('ACoAAA')) {
        return `https://www.linkedin.com/in/${match[1]}/`;
      }
    }
  }

  // Try to extract from data-entity-urn or similar LinkedIn URN attributes
  const urn = element.getAttribute('data-entity-urn') ||
              element.getAttribute('data-urn') ||
              element.getAttribute('data-member-urn');

  if (urn) {
    // LinkedIn URNs sometimes contain the public identifier
    // Format: urn:li:member:123456 or urn:li:fs_miniProfile:publicIdentifier
    const publicIdMatch = urn.match(/publicIdentifier[:\s]+([a-zA-Z0-9-]+)/);
    if (publicIdMatch) {
      return `https://www.linkedin.com/in/${publicIdMatch[1]}/`;
    }
  }

  // Check parent elements for additional context
  let parent = element.parentElement;
  let depth = 0;
  while (parent && depth < 3) {
    // Check parent's data attributes too
    if (parent.hasAttribute('data-entity-urn')) {
      const parentUrn = parent.getAttribute('data-entity-urn');
      if (parentUrn && parentUrn.includes('fs_miniProfile')) {
        const publicIdMatch = parentUrn.match(/publicIdentifier[:\s]+([a-zA-Z0-9-]+)/);
        if (publicIdMatch) {
          return `https://www.linkedin.com/in/${publicIdMatch[1]}/`;
        }
      }
    }

    // Check for links in parent that might have clean URLs
    const parentLinks = parent.querySelectorAll('a[href*="/in/"]');
    for (const link of parentLinks) {
      const linkHref = link.href;
      const match = linkHref.match(/\/in\/([a-zA-Z0-9-]+)/);
      if (match && !match[1].startsWith('ACoAAA') && match[1].length < 30) {
        return `https://www.linkedin.com/in/${match[1]}/`;
      }
    }

    parent = parent.parentElement;
    depth++;
  }

  return null;
}

// Show notification to user
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `linkedva-notification linkedva-notification-${type}`;
  notification.textContent = message;

  document.body.appendChild(notification);

  // Fade in
  setTimeout(() => notification.classList.add('show'), 100);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Utility: Sleep function
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

console.log('[PostEngagement] Script loaded');
