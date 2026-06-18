const MENDIE_SYSTEM_PROMPT = `You are Kundai, a friendly repair assistant for Repair Hub in Harare, Zimbabwe. Be warm, concise (2-3 sentences max), and helpful. Use occasional emojis.

When discussing repairs, suggest next steps as action buttons. Format: [SUGGESTIONS:option 1|option 2|option 3]

Examples:
- User says "screen is cracked" → suggest brands: [SUGGESTIONS:iPhone|Samsung Galaxy|Tecno|Infinix]
- User says "iPhone screen" → suggest next steps: [SUGGESTIONS:How much will it cost?|Find a technician in Harare|Is it worth repairing?]
- User asks pricing → suggest actions: [SUGGESTIONS:Find a technician in Harare|Ask another question]

When recommending a technician, use: [TECH_CARD:id] where id is the technician's numeric id.`;

const MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY || GROQ_API_KEY.trim() === '') {
    console.error('GROQ_API_KEY is not set or empty');
    return res.status(200).json({ reply: "I'm having trouble right now. Could you try again in a moment? 🔧", suggestions: ['My screen is cracked', 'Phone not charging', 'Battery draining fast'] });
  }

  const { messages, context } = req.body;

  const systemPrompt = MENDIE_SYSTEM_PROMPT + '\n\n' + (context || '');

  const trimmedMessages = (messages || []).slice(-10).map(msg => ({
    role: msg.role === 'user' ? 'user' : 'assistant',
    content: msg.text
  }));

  for (const model of MODELS) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            ...trimmedMessages
          ],
          temperature: 0.8,
          max_tokens: 300
        }),
        signal: AbortSignal.timeout(30000)
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data?.error?.message || 'Unknown error';
        const errorCode = data?.error?.code || data?.error?.type || '';
        console.error(`Groq ${model} error [${response.status}]: ${errorMsg}`);
        if (response.status === 429) {
          console.warn(`Model ${model} rate limited, trying next...`);
          continue;
        }
        if (response.status === 401) {
          console.error('GROQ_API_KEY is invalid');
          return res.status(200).json({ reply: "I'm having trouble right now. Could you try again in a moment? 🔧", suggestions: ['My screen is cracked', 'Phone not charging', 'Battery draining fast'] });
        }
        continue;
      }

      if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
        let reply = data.choices[0].message.content.trim();
        let suggestions = [];

        const suggestionsMatch = reply.match(/\[SUGGESTIONS:([^\]]+)\]/);
        if (suggestionsMatch) {
          suggestions = suggestionsMatch[1].split('|').map(s => s.trim()).filter(s => s.length > 0);
          reply = reply.replace(suggestionsMatch[0], '').trim();
        }

        return res.status(200).json({ reply, suggestions });
      }

      console.error('Unexpected Groq response format:', JSON.stringify(data).substring(0, 500));
      continue;

    } catch (error) {
      console.error(`Model ${model} error:`, error.message);
      continue;
    }
  }

  return res.status(200).json({ reply: "I'm having trouble connecting right now. Please try again in a minute! 🔧", suggestions: ['My screen is cracked', 'Phone not charging', 'Battery draining fast', 'Water damage'] });
}