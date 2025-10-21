// popup/popup.js
// Main tab navigation controller for ReplyBot + Lead Extractor

import { initBrandSetup } from './tabs/brandSetup.js';
import { initLeadManagement } from './tabs/leadManagement.js';

let currentTab = 'brand';
let tabModules = {
  brand: null,
  leads: null
};

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  setupTabNavigation();
  await loadDefaultTab();
});

// Setup tab navigation
function setupTabNavigation() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', async () => {
      const targetTab = button.dataset.tab;

      console.log('Tab clicked:', targetTab, 'Current tab:', currentTab);

      if (targetTab === currentTab) {
        console.log('Same tab clicked, ignoring');
        return;
      }

      // Update button states
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      // Update tab panes
      const tabPanes = document.querySelectorAll('.tab-pane');
      tabPanes.forEach(pane => pane.classList.remove('active'));

      const targetPane = document.getElementById(`${targetTab}-tab`);
      console.log('Target pane:', targetPane);
      if (targetPane) {
        targetPane.classList.add('active');
        console.log('Active class added to:', targetPane.id);
      } else {
        console.error('Target pane not found for tab:', targetTab);
      }

      // Load tab content
      await loadTab(targetTab);
      currentTab = targetTab;
    });
  });
}

// Load a specific tab
async function loadTab(tabName) {
  if (tabModules[tabName]) {
    // Tab already initialized
    if (tabName === 'leads' && typeof tabModules[tabName].refreshLeads === 'function') {
      await tabModules[tabName].refreshLeads();
    }
    return;
  }
  
  switch (tabName) {
    case 'brand':
      tabModules.brand = await initBrandSetup();
      break;
    case 'leads':
      tabModules.leads = await initLeadManagement();
      break;
    default:
      console.warn(`Unknown tab: ${tabName}`);
  }
}

// Load the default tab (brand setup)
async function loadDefaultTab() {
  await loadTab('brand');
}

// Export for debugging
window.switchTab = async (tabName) => {
  const button = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
  if (button) {
    button.click();
  }
};
