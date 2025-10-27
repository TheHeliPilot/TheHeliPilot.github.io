// Vercel Serverless Function - Generate Study Cards
// Generates topic-based study cards with hierarchical relationships for mind mapping

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, isPro, text, model } = req.body;

    if (!userId || !text) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!isPro) {
      return res.status(403).json({ error: 'Pro membership required' });
    }

    const selectedModel = model || 'gpt-4o-mini';

    // Determine card count dynamically based on content complexity
    const wordCount = text.split(/\s+/).length;
    // Generate comprehensive study cards - more detailed coverage
    const cardCount = Math.min(Math.ceil(wordCount / 80), 100); // ~1 card per 80 words, max 100

    const prompt = `Analyze the study material below and create ${cardCount} hierarchical study cards for a mind map visualization.

Return ONLY a JSON array with this exact structure:
[
  {
    "topic": "Main Topic Name",
    "content": "Detailed explanation of the topic (2-4 sentences)",
    "level": 0,
    "parentIndex": null,
    "category": "primary"
  },
  {
    "topic": "Subtopic Name",
    "content": "Explanation of subtopic",
    "level": 1,
    "parentIndex": 0,
    "category": "secondary"
  }
]

Rules:
- Level 0 = main topics (3-5 cards, parentIndex: null, category: "primary")
- Level 1 = major subtopics (parentIndex: index of level 0 parent, category: "secondary")
- Level 2 = detailed concepts (parentIndex: index of level 1 parent, category: "tertiary")
- Create a logical tree structure with clear parent-child relationships
- Each card should have a clear, concise topic (3-8 words)
- Content should be educational and detailed (2-4 sentences)
- Ensure parentIndex correctly references the index of parent cards
- Return ONLY the JSON array, no markdown formatting

Study Material:
${text}`;

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
            content: 'You are an educational content creator that structures information hierarchically for mind mapping. Always return valid JSON arrays only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_completion_tokens: 4000
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
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }

    const cards = JSON.parse(content);

    if (!Array.isArray(cards)) {
      return res.status(500).json({ error: 'Invalid response format' });
    }

    // Validate each card
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      if (!card.topic || !card.content || card.level === undefined) {
        return res.status(500).json({ error: `Invalid card at index ${i}` });
      }
    }

    return res.status(200).json({
      cards,
      count: cards.length,
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
