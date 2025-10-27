// Vercel Serverless Function - Validate Quiz Answers Securely
// This prevents users from inspecting client code to see correct answers

export default async function handler(req, res) {
  // CORS headers
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
    const { projectId, cardId, selectedAnswer } = req.body;

    if (!projectId || !cardId || selectedAnswer === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Fetch the card from Firebase to get correct answer
    const firebaseUrl = `https://schizotests-default-rtdb.europe-west1.firebasedatabase.app/publicProjects/${projectId}/cards/${cardId}.json`;
    const response = await fetch(firebaseUrl);

    if (!response.ok) {
      return res.status(404).json({ error: 'Card not found' });
    }

    const card = await response.json();

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    // Check if answer is correct
    const isCorrect = parseInt(selectedAnswer) === parseInt(card.correctAnswer);

    // Return result without exposing the correct answer directly
    return res.status(200).json({
      isCorrect,
      explanation: card.explanation || '',
      correctAnswer: card.correctAnswer // Only sent after user answers
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
