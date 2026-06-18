const MENDIE_SYSTEM_PROMPT = `You are Kundai, a friendly repair assistant for Repair Hub in Harare, Zimbabwe. Be warm, concise (2-3 sentences max), and helpful. Use occasional emojis.

When discussing repairs, suggest next steps as action buttons. Format: [SUGGESTIONS:option 1|option 2|option 3]

Examples:
- User says "screen is cracked" → suggest brands: [SUGGESTIONS:iPhone|Samsung Galaxy|Tecno|Infinix]
- User says "iPhone screen" → suggest next steps: [SUGGESTIONS:How much will it cost?|Find a technician in Harare|Is it worth repairing?]
- User asks pricing → suggest actions: [SUGGESTIONS:Find a technician in Harare|Ask another question]

When recommending a technician, use: [TECH_CARD:id] where id is the technician's numeric id.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const { messages, context } = req.body;

    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not set');
      return res.status(500).json({ error: 'API key not configured' });
    }

    const systemPrompt = MENDIE_SYSTEM_PROMPT + '\n\n' + (context || '');

    const formattedMessages = (messages || []).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: formattedMessages,
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
          temperature: 0.8,
          topP: 0.9,
          maxOutputTokens: 300
        }
      })
    });

    const data = await response.json();

    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      let reply = data.candidates[0].content.parts[0].text.trim();
      let suggestions = [];

      const suggestionsMatch = reply.match(/\[SUGGESTIONS:([^\]]+)\]/);
      if (suggestionsMatch) {
        suggestions = suggestionsMatch[1].split('|').map(s => s.trim()).filter(s => s.length > 0);
        reply = reply.replace(suggestionsMatch[0], '').trim();
      }

      return res.status(200).json({ reply, suggestions });
    } else {
      console.error('Gemini response missing candidates:', JSON.stringify(data).substring(0, 500));
      return res.status(200).json({ reply: "I'm having trouble connecting right now. Could you try again? 🔧" });
    }
  } catch (error) {
    console.error('Kundai API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}