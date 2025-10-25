// popup/tabs/leadManagement.js
// Handles popup UI interactions and lead management

export async function initLeadManagement() {
let leads = [];

// Initialize
await init();

async function init() {
  await loadLeads();
  setupEventListeners();
}

// Load leads from storage
async function loadLeads() {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'getStoredLeads'
    });

    if (response.success) {
      leads = response.leads;
      updateUI();
    }
  } catch (error) {
    console.error('Error loading leads:', error);
    showNotification('Failed to load leads', 'error');
  }
}

// Setup event listeners
function setupEventListeners() {
  const exportCsvBtn = document.getElementById('export-csv');
  const clearAllBtn = document.getElementById('clear-all');

  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', exportToCSV);
  }

  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', clearAllLeads);
  }
}

// Update UI with leads
function updateUI() {
  // Update total count
  const totalLeadsEl = document.getElementById('total-leads');
  if (totalLeadsEl) {
    totalLeadsEl.textContent = leads.length;
  }

  // Update leads list
  const leadsList = document.getElementById('leads-container');

  if (leads.length === 0) {
    leadsList.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <line x1="19" y1="8" x2="19" y2="14"></line>
          <line x1="22" y1="11" x2="16" y2="11"></line>
        </svg>
        <p>No leads extracted yet</p>
        <small>Visit any webpage and click "Extract Lead" button</small>
      </div>
    `;
    return;
  }

  leadsList.innerHTML = leads.map((lead, index) => `
    <div class="lead-card">
      <div class="lead-header">
        <div>
          <div class="lead-name">${escapeHtml(lead.name) || 'Unknown'}</div>
          <div class="lead-role">${escapeHtml(lead.role) || 'No role specified'}</div>
          ${lead.location ? `<div class="lead-location" style="font-size: 12px; color: #666; margin-top: 2px;">📍 ${escapeHtml(lead.location)}</div>` : ''}
        </div>
        <div class="lead-actions">
          <button class="icon-btn copy-lead-btn" data-index="${index}" title="Copy lead info">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
          <button class="icon-btn delete-lead-btn" data-index="${index}" title="Delete lead">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
      <div class="lead-info">
        ${lead.company ? `
          <div class="info-row">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            </svg>
            <span class="info-label">Company:</span>
            <span class="info-value">${escapeHtml(lead.company)}</span>
          </div>
        ` : ''}
        ${lead.industry ? `
          <div class="info-row">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
            <span class="info-label">Industry:</span>
            <span class="info-value">${escapeHtml(lead.industry)}</span>
          </div>
        ` : ''}
        ${lead.linkedinUrl ? `
          <div class="info-row">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
              <rect x="2" y="9" width="4" height="12"></rect>
              <circle cx="4" cy="4" r="2"></circle>
            </svg>
            <span class="info-label">LinkedIn:</span>
            <span class="info-value"><a href="${escapeHtml(lead.linkedinUrl)}" target="_blank" style="color: #0077b5; text-decoration: none;">View Profile</a></span>
          </div>
        ` : ''}
        ${lead.education ? `
          <div class="info-row">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
              <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
            </svg>
            <span class="info-label">Education:</span>
            <span class="info-value">${escapeHtml(lead.education)}</span>
          </div>
        ` : ''}
        ${lead.skills && lead.skills.length > 0 ? `
          <div class="info-row">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            <span class="info-label">Skills:</span>
            <span class="info-value">${lead.skills.map(s => escapeHtml(s)).join(', ')}</span>
          </div>
        ` : ''}
        ${lead.email ? `
          <div class="info-row">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            <span class="info-label">Email:</span>
            <span class="info-value">${escapeHtml(lead.email)}</span>
          </div>
        ` : ''}
        ${lead.phone ? `
          <div class="info-row">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
            <span class="info-label">Phone:</span>
            <span class="info-value">${escapeHtml(lead.phone)}</span>
          </div>
        ` : ''}
        ${lead.aboutSummary ? `
          <div class="info-row" style="flex-direction: column; align-items: flex-start; margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">
            <div style="display: flex; align-items: center; margin-bottom: 4px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px; margin-right: 6px;">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              <span class="info-label" style="font-weight: 600;">About:</span>
            </div>
            <span class="info-value" style="font-size: 12px; line-height: 1.4; color: #555; padding-left: 20px;">${escapeHtml(lead.aboutSummary)}</span>
          </div>
        ` : ''}
      </div>
      <div class="lead-meta">
        <span class="lead-url" title="${escapeHtml(lead.url)}">${escapeHtml(getHostname(lead.url))}</span>
        <span class="lead-date">${formatDate(lead.timestamp)}</span>
      </div>
    </div>
  `).join('');

  // Add event listeners to lead action buttons
  document.querySelectorAll('.copy-lead-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.dataset.index);
      copyLead(index);
    });
  });

  document.querySelectorAll('.delete-lead-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.dataset.index);
      deleteLead(index);
    });
  });
}

// Export to CSV
function exportToCSV() {
  if (leads.length === 0) {
    showNotification('No leads to export', 'error');
    return;
  }

  try {
    // Create CSV content with reliable fields only
    const headers = [
      'Name', 'Role', 'Company', 'Location', 'Industry',
      'LinkedIn URL', 'Education', 'Skills', 'About Summary',
      'Email', 'Phone', 'Source URL', 'Date'
    ];
    const rows = leads.map(lead => [
      lead.name || '',
      lead.role || '',
      lead.company || '',
      lead.location || '',
      lead.industry || '',
      lead.linkedinUrl || '',
      (typeof lead.education === 'object' && lead.education !== null) ? JSON.stringify(lead.education) : (lead.education || ''),
      (lead.skills && Array.isArray(lead.skills) && lead.skills.length > 0) ? lead.skills.join('; ') : '',
      lead.aboutSummary || '',
      lead.email || '',
      lead.phone || '',
      lead.url || '',
      new Date(lead.timestamp).toISOString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Create download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    showNotification(`Exported ${leads.length} leads to CSV`, 'success');
  } catch (error) {
    console.error('Error exporting CSV:', error);
    showNotification('Failed to export CSV', 'error');
  }
}

// Clear all leads
async function clearAllLeads() {
  if (leads.length === 0) return;

  if (!confirm(`Are you sure you want to delete all ${leads.length} leads?`)) {
    return;
  }

  try {
    await chrome.runtime.sendMessage({
      action: 'clearLeads'
    });

    leads = [];
    updateUI();
    showNotification('All leads cleared', 'success');
  } catch (error) {
    console.error('Error clearing leads:', error);
    showNotification('Failed to clear leads', 'error');
  }
}

// Copy single lead
async function copyLead(index) {
  const lead = leads[index];

  // Build lead text with available fields
  let text = `Name: ${lead.name || 'N/A'}
Role: ${lead.role || 'N/A'}
Company: ${lead.company || 'N/A'}`;

  if (lead.location) text += `\nLocation: ${lead.location}`;
  if (lead.industry) text += `\nIndustry: ${lead.industry}`;
  if (lead.linkedinUrl) text += `\nLinkedIn: ${lead.linkedinUrl}`;
  if (lead.education) text += `\nEducation: ${lead.education}`;
  if (lead.skills && lead.skills.length > 0) text += `\nSkills: ${lead.skills.join(', ')}`;
  if (lead.email) text += `\nEmail: ${lead.email}`;
  if (lead.phone) text += `\nPhone: ${lead.phone}`;
  if (lead.aboutSummary) text += `\n\nAbout:\n${lead.aboutSummary}`;

  text += `\n\nSource: ${lead.url || 'N/A'}`;

  try {
    await navigator.clipboard.writeText(text);
    showNotification('Lead copied to clipboard', 'success');
  } catch (error) {
    console.error('Error copying lead:', error);
    showNotification('Failed to copy lead', 'error');
  }
}

// Delete single lead
async function deleteLead(index) {
  if (!confirm('Delete this lead?')) return;

  leads.splice(index, 1);

  try {
    await chrome.storage.local.set({ leads });
    updateUI();
    showNotification('Lead deleted', 'success');
  } catch (error) {
    console.error('Error deleting lead:', error);
    showNotification('Failed to delete lead', 'error');
  }
}

// Utility functions
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function getHostname(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
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
  refreshLeads: loadLeads
};

} // End of initLeadManagement
