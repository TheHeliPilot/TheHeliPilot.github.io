import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// CORS headers
const allowedOrigins = [
  'https://thehelipilot.github.io',
  'http://localhost:5500',
  'http://localhost:3000',
  'http://127.0.0.1:5500'
];

export default async function handler(req, res) {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, userId } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    const wordCount = text.split(/\s+/).length;

    if (text.length > 200000) {
      return res.status(400).json({ error: 'Text is too long (max 200,000 characters). Try breaking it into smaller sections.' });
    }

    console.log(`Cleaning notes for user ${userId || 'anonymous'} - ${wordCount} words...`);

    // Use OpenAI to clean and format the notes
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant that cleans and formats study notes. Your job is to:

1. Fix spelling and grammar errors
2. Organize content into clear sections with headings
3. Remove redundant or unclear information
4. Format lists and bullet points properly
5. Add structure using markdown (headings, lists, emphasis)
6. Preserve all important information and details
7. Make the notes clear, concise, and easy to study from

Return ONLY the cleaned and formatted notes in markdown format. Do not add any commentary or explanations.`
        },
        {
          role: 'user',
          content: `Please clean and format these notes:\n\n${text}`
        }
      ],
      max_tokens: 4000,
      temperature: 0.3
    });

    const cleanedText = completion.choices[0].message.content.trim();

    console.log(`Successfully cleaned notes (${text.length} → ${cleanedText.length} chars)`);

    res.status(200).json({ cleanedText });

  } catch (error) {
    console.error('Clean notes error:', error);

    if (error.code === 'insufficient_quota') {
      return res.status(503).json({
        error: 'Service temporarily unavailable',
        details: 'OpenAI API quota exceeded'
      });
    }

    res.status(500).json({
      error: 'Failed to clean notes',
      details: error.message
    });
  }
}
