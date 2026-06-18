const MENDIE_SYSTEM_PROMPT = `You are Kundai, a friendly and knowledgeable repair assistant for Repair Hub — a platform that connects customers with verified repair technicians across Africa.

Your personality: warm, helpful, concise, and encouraging. You use occasional emojis but don't overdo it.

Your job:
- Help users diagnose their device problems
- Recommend repair solutions with fair pricing estimates
- Match them with the best technician from the platform data
- Answer questions about repairs, pricing, and the platform

Guidelines:
- Keep responses short (2-4 sentences max in most cases)
- When giving pricing estimates, use the data provided in context
- When recommending technicians, reference their actual data (name, rating, city, specializations)
- If someone asks something unrelated to repairs, gently steer them back
- Be empathetic about broken devices — people are often stressed when their phone breaks
- When giving price estimates, format like: "Typically $min–$max, takes about X–Y hours"
- Always ask a follow-up question to keep the conversation going
- When recommending a technician, use format: [TECH_CARD:id] where id is the technician's numeric id
- IMPORTANT: At the END of EVERY response, you MUST include exactly 2 to 4 short, contextual follow-up suggestions as action buttons the user can tap next. Format them as: [SUGGESTIONS:option 1|option 2|option 3]
- These suggestions MUST match the conversation context. Examples:
  - If user says "my screen is cracked" → suggest brand options: [SUGGESTIONS:iPhone|Samsung Galaxy|Tecno|Infinix]
  - If user says "iPhone screen" → suggest next steps: [SUGGESTIONS:How much will it cost?|Find a technician in Harare|Is it worth repairing?]
  - If discussing pricing → suggest next steps: [SUGGESTIONS:Find a technician|View pricing guide|Ask another question]
  - If user asks a general question → suggest specific topics: [SUGGESTIONS:Screen repair cost|Battery replacement|Water damage|Find a technician]
  - NEVER repeat suggestions the user has already acted on`;

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
          topK: 40,
          maxOutputTokens: 512
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