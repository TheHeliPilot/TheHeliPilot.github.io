import { state } from './state.js';

export async function generateWithClaude(text, apiKey) {
    const response = await fetch('https://api.anthropic.com/v1/complete', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey
        },
        body: JSON.stringify({
            prompt: `Generate multiple choice questions from this text:\n\n${text}\n\nFormat as JSON array with "question", "options" (array), "correctIndex", and "explanation" fields.`,
            max_tokens_to_sample: 1000,
            temperature: 0.7,
            model: 'claude-2'
        })
    });

    if (!response.ok) {
        throw new Error('Claude API error: ' + response.statusText);
    }

    const data = await response.json();
    return JSON.parse(data.completion);
}

export async function generateWithOpenAI(text, apiKey) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [{
                role: "system",
                content: "Generate multiple choice questions. Output as JSON array with question, options array, correctIndex, and explanation fields."
            }, {
                role: "user",
                content: text
            }],
            temperature: 0.7
        })
    });

    if (!response.ok) {
        throw new Error('OpenAI API error: ' + response.statusText);
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
}

export async function evaluateWithClaude(question, userAnswer, expectedAnswer, apiKey) {
    const response = await fetch('https://api.anthropic.com/v1/complete', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey
        },
        body: JSON.stringify({
            prompt: `Question: ${question}\nUser answer: ${userAnswer}\nExpected answer: ${expectedAnswer}\n\nEvaluate if the user's answer is correct and provide feedback.`,
            max_tokens_to_sample: 200,
            temperature: 0.3,
            model: 'claude-2'
        })
    });

    const data = await response.json();
    return data.completion;
}

export async function evaluateWithOpenAI(question, userAnswer, expectedAnswer, apiKey) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [{
                role: "system",
                content: "Evaluate if the user's answer matches the expected answer and provide feedback."
            }, {
                role: "user",
                content: `Question: ${question}\nUser answer: ${userAnswer}\nExpected answer: ${expectedAnswer}`
            }],
            temperature: 0.3
        })
    });

    const data = await response.json();
    return data.choices[0].message.content;
}
