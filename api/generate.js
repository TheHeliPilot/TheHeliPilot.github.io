// Vercel Serverless Function for Pro API
// Deploy this to Vercel (free)

export default async function handler(req, res) {
  // CORS headers - Allow your GitHub Pages domain
  const allowedOrigins = [
    'https://thehelipilot.github.io',
    'http://localhost:5500',
    'http://localhost:3000',
    'http://127.0.0.1:5500'
  ];

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin) || origin?.includes('localhost')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, isPro, text, count, model } = req.body;

    // Validate
    if (!userId || !text || !count) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!isPro) {
      return res.status(403).json({ error: 'Pro membership required' });
    }

    const selectedModel = model || 'gpt-5-nano-2025-08-07';

    // Create prompt
    const prompt = `Generate ${count} multiple-choice quiz questions from the study material below. Return ONLY a JSON array, no markdown formatting.

Format: [{"question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": 0, "explanation": "..."}]

Rules:
- Each question must have exactly 4 options
- correctAnswer is the index (0-3) of the correct option
- Make questions challenging and educational
- Provide clear explanations
- Return ONLY the JSON array

Study Material:
${text}`;

    // Call OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that generates quiz questions. Always return valid JSON arrays only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 1.0,
        max_completion_tokens: 2000
      })
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.json();
      return res.status(openaiResponse.status).json({
        error: error.error?.message || 'OpenAI API error'
      });
    }

    const data = await openaiResponse.json();
    let content = data.choices[0].message.content.trim();

    // Remove markdown if present
    if (content.startsWith('```')) {
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    }

    // Remove any leading/trailing non-JSON content
    const jsonStart = content.indexOf('[');
    const jsonEnd = content.lastIndexOf(']');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      content = content.substring(jsonStart, jsonEnd + 1);
    }

    // Parse and validate
    let cards;
    try {
      cards = JSON.parse(content);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Content that failed to parse:', content);
      return res.status(500).json({
        error: 'Failed to parse AI response',
        details: parseError.message,
        rawContent: content.substring(0, 500) // First 500 chars for debugging
      });
    }

    if (!Array.isArray(cards)) {
      return res.status(500).json({ error: 'Invalid response format' });
    }

    // Validate each card
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      if (!card.question || !Array.isArray(card.options) || card.options.length !== 4) {
        return res.status(500).json({ error: `Invalid card at index ${i}` });
      }
      if (typeof card.correctAnswer !== 'number' || card.correctAnswer < 0 || card.correctAnswer > 3) {
        return res.status(500).json({ error: `Invalid correctAnswer at index ${i}` });
      }
    }

    return res.status(200).json({
      cards,
      generated: cards.length,
      model: selectedModel
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
