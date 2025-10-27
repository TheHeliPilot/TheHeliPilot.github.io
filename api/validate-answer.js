// Vercel Serverless Function - Validate Quiz Answers Securely
// This prevents users from inspecting client code to see correct answers

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
    const { projectId, cardId, selectedAnswer } = req.body;

    if (!projectId || !cardId || selectedAnswer === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Fetch the card from Firebase to get correct answer
    const firebaseUrl = `https://schizotests-default-rtdb.europe-west1.firebasedatabase.app/publicProjects/${projectId}/cards/${cardId}.json`;

    let response;
    try {
      response = await fetch(firebaseUrl);
    } catch (fetchError) {
      console.error('Firebase fetch error:', fetchError);
      return res.status(500).json({
        error: 'Failed to connect to Firebase',
        details: fetchError.message
      });
    }

    if (!response.ok) {
      console.error(`Firebase returned ${response.status} for ${firebaseUrl}`);
      return res.status(404).json({
        error: 'Card not found',
        projectId,
        cardId,
        status: response.status
      });
    }

    const card = await response.json();

    if (!card || card === null) {
      console.error('Card exists but is null/empty');
      return res.status(404).json({
        error: 'Card data is empty',
        projectId,
        cardId
      });
    }

    // Firebase sometimes returns arrays as objects {0: "a", 1: "b"}
    // Convert options object to array if needed
    if (card.options && typeof card.options === 'object' && !Array.isArray(card.options)) {
      card.options = Object.values(card.options);
    }

    // Check if answer is correct
    const isCorrect = parseInt(selectedAnswer) === parseInt(card.correctAnswer);

    // Return result without exposing the correct answer directly
    return res.status(200).json({
      isCorrect,
      explanation: card.explanation || '',
      correctAnswer: parseInt(card.correctAnswer) // Only sent after user answers
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
