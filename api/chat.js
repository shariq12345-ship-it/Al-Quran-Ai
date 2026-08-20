export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body;
  const apiKey = process.env.GROQ_API_KEY; // Vercel Environment Variable se key uthayega

  if (!apiKey) {
    return res.status(500).json({ error: 'API key is missing in environment variables' });
  }

  const strictIslamicSystemPrompt = `
  You are an exclusive Islamic AI Assistant for a Quran application. 
  1. Detect prompt language (English, Roman Urdu, Urdu) and reply in the same language.
  2. Answer ONLY Islamic topics. Decline non-Islamic questions respectfully.
  `;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages: [
          { role: "system", content: strictIslamicSystemPrompt },
          { role: "user", content: prompt }
        ],
        temperature: 0.2
      })
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch AI response' });
  }
}