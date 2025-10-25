// background/service_worker.js
// Handles AI-powered lead extraction using Chrome's built-in Gemini Nano

async function extractLeadWithAI(pageContent, selectedText) {
  try {
    // Check if LanguageModel API is available (Chrome's built-in AI)
    if (typeof LanguageModel === 'undefined') {
      throw new Error('Chrome AI (Gemini Nano) is not available. Please check chrome://flags: enable "Prompt API for Gemini Nano" and "Optimization Guide On Device Model". Then download the model from chrome://components.');
    }

    console.log('[Lead Extractor] LanguageModel found, creating session...');

    // Create AI session directly (capabilities check is optional)
    // The Mail-Bot reference doesn't check capabilities, just creates the session
    const session = await LanguageModel.create({
      systemPrompt: `You are a lead information extraction assistant. Extract structured contact information from web pages.
Your task is to identify and extract:
- Name (full name of the person)
- Role/Title (job title or position)
- Company (company or organization name)
- Email (email address if available)

Return ONLY a valid JSON object in this exact format:
{
  "name": "extracted name or null",
  "role": "extracted role or null",
  "company": "extracted company or null",
  "email": "extracted email or null"
}

If a field cannot be found, use null. Do not include any explanation, just the JSON object.`
    });

    // Build extraction prompt
    const prompt = `Extract lead information from this content:

${selectedText ? `Selected text: ${selectedText}\n\n` : ''}
Page content: ${pageContent}

Return only the JSON object with name, role, company, and email fields.`;

    // Generate response
    const result = await session.prompt(prompt);

    // Clean up session
    session.destroy();

    // Parse JSON response
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const leadData = JSON.parse(jsonMatch[0]);
      return {
        success: true,
        data: leadData
      };
    } else {
      throw new Error('Failed to extract structured data');
    }

  } catch (error) {
    console.error('[Lead Extractor] Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Message listener for handling extraction requests
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'extractLead') {
    extractLeadWithAI(message.pageContent, message.selectedText)
      .then(result => {
        sendResponse(result);
      })
      .catch(error => {
        sendResponse({
          success: false,
          error: error.message
        });
      });

    return true; // Async response
  }

  if (message.action === 'getStoredLeads') {
    chrome.storage.local.get(['leads'], (result) => {
      sendResponse({
        success: true,
        leads: result.leads || []
      });
    });

    return true; // Async response
  }

  if (message.action === 'saveLead') {
    chrome.storage.local.get(['leads'], (result) => {
      const leads = result.leads || [];
      leads.unshift({
        ...message.lead,
        timestamp: Date.now(),
        url: message.url
      });

      chrome.storage.local.set({ leads }, () => {
        sendResponse({
          success: true,
          totalLeads: leads.length
        });
      });
    });

    return true; // Async response
  }

  if (message.action === 'clearLeads') {
    chrome.storage.local.set({ leads: [] }, () => {
      sendResponse({ success: true });
    });

    return true; // Async response
  }

  // ReplyBot: Handle brand profile updates
  if (message.type === 'brandProfileUpdated') {
    console.log('[ReplyBot] Brand profile updated');
    // No response needed, just acknowledge
    return false;
  }
});

console.log('[ReplyBot + Lead Extractor] Service worker activated');
