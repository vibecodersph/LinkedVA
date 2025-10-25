// background/service_worker.js
// Handles AI-powered lead extraction using Chrome's built-in Gemini Nano

async function extractLeadWithAI(pageContent, selectedText, pageUrl) {
  try {
    // Check if LanguageModel API is available (Chrome's built-in AI)
    if (typeof LanguageModel === 'undefined') {
      throw new Error('Chrome AI (Gemini Nano) is not available. Please check chrome://flags: enable "Prompt API for Gemini Nano" and "Optimization Guide On Device Model". Then download the model from chrome://components.');
    }

    console.log('[Lead Extractor] LanguageModel found, creating session...');

    // Create AI session directly (capabilities check is optional)
    // The Mail-Bot reference doesn't check capabilities, just creates the session
    const session = await LanguageModel.create({
      systemPrompt: `You are a lead information extraction assistant. Extract structured contact information from LinkedIn profiles.

Extract these fields from LinkedIn profiles:

BASIC INFO (top priority):
- Name: Full name at the top of the profile
- Role: Job title (e.g., "Software Engineer at Google")
- Company: Current company name
- Location: City and country (e.g., "San Francisco, CA")

ADDITIONAL INFO:
- LinkedIn URL: Will be provided as the page URL
- Industry: IMPORTANT - ALWAYS provide an industry classification
  * First, look for explicitly stated industry in the profile
  * If not found, INFER from company name and role (e.g., "Google" → "Technology", "Goldman Sachs" → "Financial Services", "McKinsey" → "Consulting")
  * Common industries: Technology, Software, Financial Services, Consulting, Healthcare, E-commerce, Marketing, Manufacturing, Real Estate, Education, etc.
  * NEVER return null for industry - always make an educated guess
- Education: Format as "Degree, School Name" (e.g., "PhD, Stanford University") - MUST be a string, NOT an object
- Skills: Array of 3-5 top skills if listed in Skills section
- About Summary: CRITICAL - Look for "About" or "Summary" section
  * Extract 2-3 sentences that describe what they do professionally
  * Focus on their value proposition, expertise, or mission
  * Look for text that starts with phrases like "I help...", "Passionate about...", "Experienced in...", "Focused on..."
  * Keep it concise (max 150 words)
- Email: Only if visible on profile
- Phone: Only if visible on profile

RETURN FORMAT - JSON only:
{
  "name": "Full Name",
  "role": "Job Title",
  "company": "Company Name",
  "location": "City, Country",
  "linkedinUrl": null,
  "industry": "Industry Name (REQUIRED - infer if not stated)",
  "education": "Degree, School",
  "skills": ["skill1", "skill2", "skill3"],
  "aboutSummary": "2-3 sentence professional summary from About section",
  "email": null,
  "phone": null
}

RULES:
- ALWAYS provide an industry (infer from company/role if needed)
- ALWAYS extract About section if it exists (look carefully!)
- Education is a STRING, never an object
- Skills is an ARRAY of strings or null
- No explanations, only JSON`
    });

    // Build extraction prompt
    const prompt = `Extract lead information from this LinkedIn profile:

Page URL: ${pageUrl || 'Not provided'}
${selectedText ? `Selected text: ${selectedText}\n\n` : ''}
Page content:
${pageContent}

EXTRACTION TIPS:
- Use the Page URL as the linkedinUrl field
- Name, role, and company are in the first few lines
- Industry: If not explicitly stated, infer from company (e.g., "Capgemini" → "Technology/Consulting", "PT Momentum Teknodata" → "Technology")
- About section: Look for keywords like "About", "Summary", or text describing "I help", "I am passionate about", "Focus on", etc.
- Skills: Look for a "Skills" section listing specific competencies
- Education: Just "Degree, School" as a string (e.g., "PhD, Nagoya University")

Return ONLY the JSON object. ALWAYS fill industry and aboutSummary if possible.`;

    // Debug: Log detailed content analysis
    console.log('='.repeat(80));
    console.log('[Lead Extractor] CONTENT ANALYSIS - START');
    console.log('='.repeat(80));
    console.log('[Lead Extractor] Page URL:', pageUrl);
    console.log('[Lead Extractor] Total content length:', pageContent.length, 'chars');
    console.log('[Lead Extractor] Selected text:', selectedText || 'None');

    // Log first 1000 chars
    console.log('\n--- FIRST 1000 CHARACTERS ---');
    console.log(pageContent.substring(0, 1000));

    // Check for key sections
    console.log('\n--- SECTION DETECTION ---');
    console.log('Contains "About":', pageContent.includes('About'));
    console.log('Contains "Skills":', pageContent.includes('Skills'));
    console.log('Contains "Experience":', pageContent.includes('Experience'));
    console.log('Contains "Education":', pageContent.includes('Education'));

    // Try to find About section
    const aboutIndex = pageContent.toLowerCase().indexOf('about');
    if (aboutIndex !== -1) {
      console.log('\n--- ABOUT SECTION (500 chars after "About") ---');
      console.log(pageContent.substring(aboutIndex, aboutIndex + 500));
    }

    // Try to find Skills section
    const skillsIndex = pageContent.toLowerCase().indexOf('skills');
    if (skillsIndex !== -1) {
      console.log('\n--- SKILLS SECTION (500 chars after "Skills") ---');
      console.log(pageContent.substring(skillsIndex, skillsIndex + 500));
    }

    console.log('\n--- FULL CONTENT (ALL ' + pageContent.length + ' CHARS) ---');
    console.log(pageContent);
    console.log('='.repeat(80));

    // Generate response
    const result = await session.prompt(prompt);

    // Debug: Log AI response
    console.log('\n--- AI RAW RESPONSE ---');
    console.log(result);
    console.log('='.repeat(80));
    console.log('[Lead Extractor] CONTENT ANALYSIS - END');
    console.log('='.repeat(80));

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
    extractLeadWithAI(message.pageContent, message.selectedText, message.pageUrl)
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
