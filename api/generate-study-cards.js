// Vercel Serverless Function - Generate Study Cards
// Generates topic-based study cards with hierarchical relationships for mind mapping

export default async function handler(req, res) {
  // CORS headers - Allow all origins for development
  const origin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin', origin || '*');

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

    // Fixed card counts for consistent experience
    const wordCount = text.split(/\s+/).length;
    const studyCardCount = Math.max(15, Math.min(30, Math.ceil(wordCount / 100))); // 15-30 study cards
    const testCardCount = Math.max(20, Math.min(30, Math.ceil(wordCount / 80))); // 20-30 test cards

    const languageNote = languageInstruction || '';

    const prompt = `Analyze the study material below and create exactly ${studyCardCount} hierarchical study cards for a mind map visualization, followed by ${testCardCount} test/quiz cards.

${languageNote ? `IMPORTANT: ${languageNote}\n` : ''}
Return ONLY a JSON object with this exact structure:
{
  "studyCards": [
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
    }
  ],
  "testCards": [
    {
      "question": "What is the main concept of [topic]?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Brief explanation of the answer",
      "relatedStudyCard": 0,
      "difficulty": "medium"
    }
  ]
}

Available colors (choose intelligently based on topic theme and ensure variety):
- "#667eea" (purple-blue) - Use for overview, introductory, or foundational concepts
- "#f093fb" (pink) - Use for creative, design, or social topics
- "#4facfe" (light blue) - Use for technical, logical, or analytical topics
- "#43e97b" (green) - Use for nature, health, growth, or positive concepts
- "#fa709a" (coral) - Use for important warnings, key points, or emotional topics
- "#feca57" (yellow) - Use for energy, attention-grabbing, or important highlights
- "#ff6b6b" (red) - Use for critical concepts, errors, or urgent information
- "#48dbfb" (cyan) - Use for communication, flow, or process-related topics

STUDY CARDS Rules (create exactly ${studyCardCount} cards):
- FIRST CARD MUST BE: An "Overview" card at level 0 with parentIndex null - this is the root
- Level 1 = main topics (3-5 cards, parentIndex: 0)
- Level 2 = major subtopics (2-4 cards per level 1 parent)
- Level 3 = detailed concepts (1-3 cards per level 2 parent)
- Level 4 = specific details (1-2 cards per level 3 parent)
- Create a balanced tree structure with 3-4 levels
- Each card: clear topic (3-8 words), educational content (2-3 sentences)
- Choose colors semantically (biology=green, tech=blue, etc.)
- Distribute colors for visual distinction

TEST CARDS Rules (create exactly ${testCardCount} cards):
- Each test card MUST have "relatedStudyCard" field with the index (0 to ${studyCardCount - 1}) of the study card it tests
- Spread test cards across ALL study topics (don't test only one topic)
- Question types: multiple choice with 4 options
- "correctAnswer" is the index (0-3) of the correct option
- Include "explanation" for why the answer is correct
- Difficulty levels: "easy", "medium", "hard" (distribute evenly)
- Questions should test understanding, not just memorization

General:
- Return ONLY valid JSON object with "studyCards" and "testCards" arrays
- No markdown formatting, no extra text
${languageNote ? `- ALL content must be in the specified language\n` : ''}
Study Material:
${text}`;

    // GPT-5 Nano only supports default temperature (1), others can use 0.7
    const systemPrompt = languageNote
      ? `You are an educational content creator that structures information hierarchically for mind mapping and creates linked test questions. ${languageNote} Always return valid JSON objects with "studyCards" and "testCards" arrays, with all text content in the specified language.`
      : 'You are an educational content creator that structures information hierarchically for mind mapping and creates linked test questions. Always return valid JSON objects with "studyCards" and "testCards" arrays.';

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

    // Extract JSON object bounds
    const jsonStart = content.indexOf('{');
    const jsonEnd = content.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      content = content.substring(jsonStart, jsonEnd + 1);
    }

    const result = JSON.parse(content);

    if (!result.studyCards || !result.testCards) {
      return res.status(500).json({ error: 'Invalid response format - missing studyCards or testCards' });
    }

    if (!Array.isArray(result.studyCards) || !Array.isArray(result.testCards)) {
      return res.status(500).json({ error: 'studyCards and testCards must be arrays' });
    }

    // Validate study cards
    for (let i = 0; i < result.studyCards.length; i++) {
      const card = result.studyCards[i];
      if (!card.topic || !card.content || card.level === undefined) {
        return res.status(500).json({ error: `Invalid study card at index ${i}` });
      }
    }

    // Validate test cards
    for (let i = 0; i < result.testCards.length; i++) {
      const card = result.testCards[i];
      if (!card.question || !card.options || !Array.isArray(card.options) || card.correctAnswer === undefined) {
        return res.status(500).json({ error: `Invalid test card at index ${i}` });
      }
      if (card.relatedStudyCard === undefined || card.relatedStudyCard < 0 || card.relatedStudyCard >= result.studyCards.length) {
        return res.status(500).json({ error: `Test card ${i} has invalid relatedStudyCard reference` });
      }
    }

    return res.status(200).json({
      studyCards: result.studyCards,
      testCards: result.testCards,
      studyCardCount: result.studyCards.length,
      testCardCount: result.testCards.length,
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
