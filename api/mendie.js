const MENDIE_SYSTEM_PROMPT = `You are Kundai, a friendly repair assistant for Repair Hub in Harare, Zimbabwe. Be warm, concise (2-3 sentences max), and helpful. Use occasional emojis.

When discussing repairs, suggest next steps as action buttons. Format: [SUGGESTIONS:option 1|option 2|option 3]

Examples:
- User says "screen is cracked" → suggest brands: [SUGGESTIONS:iPhone|Samsung Galaxy|Tecno|Infinix]
- User says "iPhone screen" → suggest next steps: [SUGGESTIONS:How much will it cost?|Find a technician in Harare|Is it worth repairing?]
- User asks pricing → suggest actions: [SUGGESTIONS:Find a technician in Harare|Ask another question]

When recommending a technician, use: [TECH_CARD:id] where id is the technician's numeric id.`;

const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY || GEMINI_API_KEY.trim() === '') {
    console.error('GEMINI_API_KEY is not set or empty');
    return res.status(200).json({ reply: "I'm having trouble right now. Could you try again in a moment? 🔧", suggestions: ['My screen is cracked', 'Phone not charging', 'Battery draining fast'] });
  }

  const { messages, context } = req.body;

  const systemPrompt = MENDIE_SYSTEM_PROMPT + '\n\n' + (context || '');

  const trimmedMessages = (messages || []).slice(-10).map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }]
  }));

  const requestBody = {
    contents: trimmedMessages,
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 300
    }
  };

  for (const model of MODELS) {
    try {
      const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

      const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(30000)
      });

      const rawText = await response.text();
      let data;

      try {
        data = JSON.parse(rawText);
      } catch (parseErr) {
        console.error('Failed to parse Gemini response:', rawText.substring(0, 200));
        continue;
      }

      if (!response.ok) {
        const errorCode = data?.error?.code;
        const errorMsg = data?.error?.message || 'Unknown error';
        console.error(`Gemini ${model} error [${response.status}]: code=${errorCode} msg=${errorMsg}`);
        if (errorCode === 429) {
          console.warn(`Model ${model} quota exceeded, trying next...`);
          continue;
        }
        if (response.status === 400 && errorMsg.includes('API key')) {
          console.error('API key is invalid - check GEMINI_API_KEY env var');
          return res.status(200).json({ reply: "I'm having trouble right now. Could you try again in a moment? 🔧", suggestions: ['My screen is cracked', 'Phone not charging', 'Battery draining fast'] });
        }
        continue;
      }

      if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
        let reply = data.candidates[0].content.parts[0].text.trim();
        let suggestions = [];

        const suggestionsMatch = reply.match(/\[SUGGESTIONS:([^\]]+)\]/);
        if (suggestionsMatch) {
          suggestions = suggestionsMatch[1].split('|').map(s => s.trim()).filter(s => s.length > 0);
          reply = reply.replace(suggestionsMatch[0], '').trim();
        }

        return res.status(200).json({ reply, suggestions });
      }

      if (data.candidates && data.candidates[0] && data.candidates[0].finishReason === 'SAFETY') {
        return res.status(200).json({ reply: "I can't help with that topic, but I'm here to assist with device repairs! What device issue are you having? 🔧", suggestions: ['My screen is cracked', 'Phone not charging', 'Battery draining fast'] });
      }

      console.error('Unexpected Gemini response format:', JSON.stringify(data).substring(0, 500));
      continue;

    } catch (error) {
      console.error(`Model ${model} error:`, error.message);
      continue;
    }
  }

  return res.status(200).json({ reply: "I'm having trouble connecting right now. Please try again in a minute! 🔧", suggestions: ['My screen is cracked', 'Phone not charging', 'Battery draining fast', 'Water damage'] });
}