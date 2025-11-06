// popup/tabs/engagementAnalysis.js
// Handles post engagement analytics and management

export async function initEngagementAnalysis() {
let engagements = [];
let expandedPostIds = new Set();

// Initialize
await init();

async function init() {
  await loadEngagements();
  setupEventListeners();
}

// Load engagements from storage
async function loadEngagements() {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'getStoredEngagements'
    });

    if (response.success) {
      engagements = response.engagements;
      updateUI();
    }
  } catch (error) {
    console.error('Error loading engagements:', error);
    showNotification('Failed to load engagements', 'error');
  }
}

// Setup event listeners
function setupEventListeners() {
  const exportCsvBtn = document.getElementById('export-engagements-csv');
  const clearAllBtn = document.getElementById('clear-all-engagements');

  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', exportToCSV);
  }

  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', clearAllEngagements);
  }
}

// Update UI with engagements
function updateUI() {
  // Update statistics
  updateStatistics();

  // Update engagements list
  const engagementsList = document.getElementById('engagements-container');

  if (engagements.length === 0) {
    engagementsList.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
        <p>No post engagements extracted yet</p>
        <small>Navigate to a LinkedIn post and click "Extract Engagement" button</small>
      </div>
    `;
    return;
  }

  engagementsList.innerHTML = engagements.map((engagement, index) => {
    const isExpanded = expandedPostIds.has(engagement.postId);
    const totalProfiles = engagement.commenters.length + engagement.likers.length;

    return `
      <div class="engagement-card" data-post-id="${escapeHtml(engagement.postId)}">
        <div class="engagement-header">
          <div class="engagement-title-section">
            <div class="engagement-post-title">${escapeHtml(engagement.postTitle) || 'LinkedIn Post'}</div>
            ${engagement.postAuthor ? `<div class="engagement-post-author">By ${escapeHtml(engagement.postAuthor)}</div>` : ''}
          </div>
          <div class="engagement-actions">
            <button class="icon-btn export-engagement-btn" data-index="${index}" title="Export this engagement">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </button>
            <button class="icon-btn delete-engagement-btn" data-index="${index}" title="Delete engagement">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>

        <div class="engagement-stats">
          <div class="stat-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>${engagement.commenters.length} Comments</span>
          </div>
          <div class="stat-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            <span>${engagement.likers.length} Likes</span>
          </div>
          <div class="stat-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <span>${totalProfiles} Total Profiles</span>
          </div>
        </div>

        <div class="engagement-meta">
          <a href="${escapeHtml(engagement.postUrl)}" target="_blank" class="engagement-link" title="View post">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
            View Post
          </a>
          <span class="engagement-date">${formatDate(engagement.extractedAt)}</span>
        </div>

        <button class="toggle-details-btn" data-index="${index}">
          <span>${isExpanded ? 'Hide' : 'View'} Details</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="transform: rotate(${isExpanded ? '180deg' : '0deg'}); transition: transform 0.3s;">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>

        ${isExpanded ? `
          <div class="engagement-details">
            ${engagement.commenters.length > 0 ? `
              <div class="engagement-section">
                <h4 class="section-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                  Commenters (${engagement.commenters.length})
                </h4>
                <div class="profiles-list">
                  ${engagement.commenters.slice(0, 50).map(commenter => `
                    <div class="profile-item">
                      <div class="profile-info">
                        <a href="${escapeHtml(commenter.profileUrl)}" target="_blank" class="profile-name">${escapeHtml(commenter.name)}</a>
                        ${commenter.title ? `<div class="profile-title">${escapeHtml(commenter.title)}</div>` : ''}
                        ${commenter.comment ? `<div class="profile-comment">"${escapeHtml(commenter.comment.substring(0, 150))}${commenter.comment.length > 150 ? '...' : ''}"</div>` : ''}
                      </div>
                      <a href="${escapeHtml(commenter.profileUrl)}" target="_blank" class="profile-link-btn" title="View profile">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                          <polyline points="15 3 21 3 21 9"></polyline>
                          <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                      </a>
                    </div>
                  `).join('')}
                  ${engagement.commenters.length > 50 ? `<div class="profiles-overflow">+${engagement.commenters.length - 50} more commenters</div>` : ''}
                </div>
              </div>
            ` : ''}

            ${engagement.likers.length > 0 ? `
              <div class="engagement-section">
                <h4 class="section-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                  Likers (${engagement.likers.length})
                </h4>
                <div class="profiles-list">
                  ${engagement.likers.slice(0, 50).map(liker => `
                    <div class="profile-item compact">
                      <div class="profile-info">
                        <a href="${escapeHtml(liker.profileUrl)}" target="_blank" class="profile-name">${escapeHtml(liker.name)}</a>
                        ${liker.title ? `<div class="profile-title">${escapeHtml(liker.title)}</div>` : ''}
                      </div>
                      <a href="${escapeHtml(liker.profileUrl)}" target="_blank" class="profile-link-btn" title="View profile">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                          <polyline points="15 3 21 3 21 9"></polyline>
                          <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                      </a>
                    </div>
                  `).join('')}
                  ${engagement.likers.length > 50 ? `<div class="profiles-overflow">+${engagement.likers.length - 50} more likers</div>` : ''}
                </div>
              </div>
            ` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  // Add event listeners
  document.querySelectorAll('.toggle-details-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.dataset.index);
      toggleDetails(index);
    });
  });

  document.querySelectorAll('.export-engagement-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.dataset.index);
      exportSingleEngagement(index);
    });
  });

  document.querySelectorAll('.delete-engagement-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.dataset.index);
      deleteEngagement(index);
    });
  });
}

// Update statistics dashboard
function updateStatistics() {
  const totalPostsEl = document.getElementById('total-posts');
  const totalProfilesEl = document.getElementById('total-profiles');
  const avgEngagementEl = document.getElementById('avg-engagement');

  if (totalPostsEl) {
    totalPostsEl.textContent = engagements.length;
  }

  const totalProfiles = engagements.reduce((sum, e) =>
    sum + e.commenters.length + e.likers.length, 0
  );

  if (totalProfilesEl) {
    totalProfilesEl.textContent = totalProfiles;
  }

  const avgEngagement = engagements.length > 0
    ? (totalProfiles / engagements.length).toFixed(1)
    : 0;

  if (avgEngagementEl) {
    avgEngagementEl.textContent = avgEngagement;
  }
}

// Toggle engagement details
function toggleDetails(index) {
  const engagement = engagements[index];

  if (expandedPostIds.has(engagement.postId)) {
    expandedPostIds.delete(engagement.postId);
  } else {
    expandedPostIds.add(engagement.postId);
  }

  updateUI();
}

// Export all engagements to CSV
function exportToCSV() {
  if (engagements.length === 0) {
    showNotification('No engagements to export', 'error');
    return;
  }

  try {
    const headers = [
      'Post URL', 'Post Title', 'Post Author', 'Engagement Type',
      'Name', 'Title', 'Profile URL', 'Comment', 'Date Extracted'
    ];

    const rows = [];

    engagements.forEach(engagement => {
      // Add commenters
      engagement.commenters.forEach(commenter => {
        rows.push([
          engagement.postUrl,
          engagement.postTitle || '',
          engagement.postAuthor || '',
          'Comment',
          commenter.name,
          commenter.title || '',
          commenter.profileUrl,
          commenter.comment || '',
          new Date(engagement.extractedAt).toISOString()
        ]);
      });

      // Add likers
      engagement.likers.forEach(liker => {
        rows.push([
          engagement.postUrl,
          engagement.postTitle || '',
          engagement.postAuthor || '',
          'Like',
          liker.name,
          liker.title || '',
          liker.profileUrl,
          '',
          new Date(engagement.extractedAt).toISOString()
        ]);
      });
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Create download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `post_engagements_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    showNotification(`Exported ${rows.length} profiles from ${engagements.length} posts`, 'success');
  } catch (error) {
    console.error('Error exporting CSV:', error);
    showNotification('Failed to export CSV', 'error');
  }
}

// Export single engagement to CSV
function exportSingleEngagement(index) {
  const engagement = engagements[index];

  if (!engagement) return;

  try {
    const headers = [
      'Engagement Type', 'Name', 'Title', 'Profile URL', 'Comment'
    ];

    const rows = [];

    // Add commenters
    engagement.commenters.forEach(commenter => {
      rows.push([
        'Comment',
        commenter.name,
        commenter.title || '',
        commenter.profileUrl,
        commenter.comment || ''
      ]);
    });

    // Add likers
    engagement.likers.forEach(liker => {
      rows.push([
        'Like',
        liker.name,
        liker.title || '',
        liker.profileUrl,
        ''
      ]);
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Create download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `engagement_${engagement.postId}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    showNotification(`Exported ${rows.length} profiles`, 'success');
  } catch (error) {
    console.error('Error exporting CSV:', error);
    showNotification('Failed to export CSV', 'error');
  }
}

// Clear all engagements
async function clearAllEngagements() {
  if (engagements.length === 0) return;

  if (!confirm(`Are you sure you want to delete all ${engagements.length} post engagements?`)) {
    return;
  }

  try {
    await chrome.runtime.sendMessage({
      action: 'clearEngagements'
    });

    engagements = [];
    expandedPostIds.clear();
    updateUI();
    showNotification('All engagements cleared', 'success');
  } catch (error) {
    console.error('Error clearing engagements:', error);
    showNotification('Failed to clear engagements', 'error');
  }
}

// Delete single engagement
async function deleteEngagement(index) {
  if (!confirm('Delete this post engagement?')) return;

  const engagement = engagements[index];

  try {
    await chrome.runtime.sendMessage({
      action: 'deleteEngagement',
      postId: engagement.postId
    });

    engagements.splice(index, 1);
    expandedPostIds.delete(engagement.postId);
    updateUI();
    showNotification('Engagement deleted', 'success');
  } catch (error) {
    console.error('Error deleting engagement:', error);
    showNotification('Failed to delete engagement', 'error');
  }
}

// Utility functions
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;

  return date.toLocaleDateString();
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
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

// Return API for tab controller
return {
  refreshEngagements: loadEngagements
};

} // End of initEngagementAnalysis
