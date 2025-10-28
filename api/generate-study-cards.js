// Vercel Serverless Function - Generate Study Cards
// Generates topic-based study cards with hierarchical relationships for mind mapping

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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, isPro, text, model, language, languageInstruction } = req.body;

    if (!userId || !text) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!isPro) {
      return res.status(403).json({ error: 'Pro membership required' });
    }

    const selectedModel = model || 'gpt-4o-mini';

    // Determine card count dynamically based on content complexity
    const wordCount = text.split(/\s+/).length;
    // Generate MORE study cards with deeper structure - better mindmap visualization
    const cardCount = Math.min(Math.ceil(wordCount / 40), 150); // ~1 card per 40 words, max 150 (increased from 80/100)

    const languageNote = languageInstruction || '';

    const prompt = `Analyze the study material below and create ${cardCount} hierarchical study cards for a mind map visualization.

${languageNote ? `IMPORTANT: ${languageNote}\n` : ''}
Return ONLY a JSON array with this exact structure:
[
  {
    "topic": "Overview",
    "content": "Brief overview of the entire topic (1-2 sentences)",
    "level": 0,
    "parentIndex": null,
    "category": "primary",
    "color": "#667eea"
  },
  {
    "topic": "Main Topic Name",
    "content": "Detailed explanation (2-3 sentences)",
    "level": 1,
    "parentIndex": 0,
    "category": "secondary",
    "color": "#f093fb"
  },
  {
    "topic": "Subtopic Name",
    "content": "Explanation of subtopic",
    "level": 2,
    "parentIndex": 1,
    "category": "tertiary",
    "color": "#4facfe"
  }
]

Available colors (choose intelligently based on topic theme and ensure variety):
- "#667eea" (purple-blue) - Use for overview, introductory, or foundational concepts
- "#f093fb" (pink) - Use for creative, design, or social topics
- "#4facfe" (light blue) - Use for technical, logical, or analytical topics
- "#43e97b" (green) - Use for nature, health, growth, or positive concepts
- "#fa709a" (coral) - Use for important warnings, key points, or emotional topics
- "#feca57" (yellow) - Use for energy, attention-grabbing, or important highlights
- "#ff6b6b" (red) - Use for critical concepts, errors, or urgent information
- "#48dbfb" (cyan) - Use for communication, flow, or process-related topics

Rules:
- FIRST CARD MUST BE: An "Overview" card at level 0 with parentIndex null - this is the root of the entire mind map
- Level 1 = main topics (3-5 cards, parentIndex: 0 (the Overview), category: "secondary")
- Level 2 = major subtopics (3-6 cards per level 1 parent, parentIndex: index of level 1 parent, category: "tertiary")
- Level 3 = detailed concepts (2-4 cards per level 2 parent, parentIndex: index of level 2 parent, category: "tertiary")
- Level 4 = specific details (1-2 cards per level 3 parent, parentIndex: index of level 3 parent, category: "tertiary")
- Create a DEEP tree structure with 4-5 levels for rich visualization
- Each card should have a clear, concise topic (3-8 words)
- Content should be educational and detailed (2-3 sentences)
- Ensure parentIndex correctly references the index of parent cards
- Choose colors that make semantic sense for the topic content (e.g., biology = green, technology = blue, warnings = red)
- Distribute colors evenly across branches to create visual distinction
- Children of the same parent can have different colors for better visual separation
- Make sure to create a balanced tree - each branch should have children
- Return ONLY the JSON array, no markdown formatting
${languageNote ? `- ALL content (topic, content fields) must be in the specified language\n` : ''}
Study Material:
${text}`;

    // GPT-5 Nano only supports default temperature (1), others can use 0.7
    const systemPrompt = languageNote
      ? `You are an educational content creator that structures information hierarchically for mind mapping. ${languageNote} Always return valid JSON arrays only with all text content in the specified language.`
      : 'You are an educational content creator that structures information hierarchically for mind mapping. Always return valid JSON arrays only.';

    const requestBody = {
      model: selectedModel,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_completion_tokens: 8000  // Increased from 4000 to accommodate more cards
    };

    // Only add temperature for non-5-nano models
    if (selectedModel !== 'gpt-5-nano') {
      requestBody.temperature = 1.0;
    }

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify(requestBody)
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
