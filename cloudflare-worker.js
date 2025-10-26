// Cloudflare Worker for Secure Pro API
// This file should be deployed to Cloudflare Workers

export default {
  async fetch(request, env) {
    // CORS headers - CHANGE THIS TO YOUR DOMAIN IN PRODUCTION!
    const corsHeaders = {
      'Access-Control-Allow-Origin': 'https://thehelipilot.github.io',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle preflight OPTIONS request
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders,
        status: 204
      });
    }

    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      // Parse request body
      const body = await request.json();
      const { userId, isPro, text, count, model } = body;

      // Validate required fields
      if (!userId || !text || !count) {
        return new Response(JSON.stringify({
          error: 'Missing required fields: userId, text, count'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Use provided model or default to gpt-5-nano
      const selectedModel = model || 'gpt-5-nano-2025-08-07';

      // Verify user is Pro
      if (!isPro) {
        return new Response(JSON.stringify({
          error: 'Pro membership required'
        }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Rate limiting check (optional but recommended)
      const rateLimitKey = `rate_limit_${userId}`;
      const currentCount = await env.RATE_LIMIT?.get(rateLimitKey) || 0;

      if (parseInt(currentCount) > 50) { // 50 requests per hour
        return new Response(JSON.stringify({
          error: 'Rate limit exceeded. Please try again later.'
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Create the prompt
      const prompt = `Generate ${count} multiple-choice quiz questions from the study material below. Return ONLY a JSON array, no markdown formatting, no explanatory text.

Format: [{"question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": 0, "explanation": "..."}]

Rules:
- Each question must have exactly 4 options
- correctAnswer is the index (0-3) of the correct option
- Make questions challenging and educational
- Provide clear explanations
- Return ONLY the JSON array

Study Material:
${text}`;

      // Call OpenAI API with secure key from environment variable
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.OPENAI_API_KEY}` // Secure key from Cloudflare dashboard
        },
        body: JSON.stringify({
          model: selectedModel, // Use the model selected by the user
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that generates quiz questions. Always return valid JSON arrays only, with no markdown formatting.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!openaiResponse.ok) {
        const errorData = await openaiResponse.json();
        console.error('OpenAI API Error:', errorData);

        return new Response(JSON.stringify({
          error: errorData.error?.message || 'OpenAI API request failed'
        }), {
          status: openaiResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const openaiData = await openaiResponse.json();
      let content = openaiData.choices[0].message.content;

      // Clean up response (remove markdown if present)
      content = content.trim();
      if (content.startsWith('```')) {
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      }

      // Parse and validate the JSON
      let cards;
      try {
        cards = JSON.parse(content);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        return new Response(JSON.stringify({
          error: 'Failed to parse AI response as JSON',
          details: content.substring(0, 200)
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Validate card format
      if (!Array.isArray(cards)) {
        return new Response(JSON.stringify({
          error: 'AI response must be a JSON array'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Validate each card
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        if (!card.question || !Array.isArray(card.options) || card.options.length !== 4) {
          return new Response(JSON.stringify({
            error: `Invalid card format at index ${i}`
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        if (typeof card.correctAnswer !== 'number' || card.correctAnswer < 0 || card.correctAnswer > 3) {
          return new Response(JSON.stringify({
            error: `Invalid correctAnswer at index ${i}`
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // Update rate limit counter (if KV namespace is configured)
      if (env.RATE_LIMIT) {
        await env.RATE_LIMIT.put(rateLimitKey, (parseInt(currentCount) + 1).toString(), {
          expirationTtl: 3600 // 1 hour
        });
      }

      // Return successful response
      return new Response(JSON.stringify({
        cards: cards,
        generated: cards.length,
        model: selectedModel // Return which model was used
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Worker Error:', error);

      return new Response(JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};
