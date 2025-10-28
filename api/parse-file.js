import { Readable } from 'stream';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';

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

  console.log('Parse file request received');

  try {
    // Parse multipart form data manually (since we're in a serverless function)
    const contentType = req.headers['content-type'] || '';

    if (!contentType.includes('multipart/form-data')) {
      return res.status(400).json({ error: 'Content-Type must be multipart/form-data' });
    }

    // Get boundary
    const boundary = contentType.split('boundary=')[1];
    if (!boundary) {
      return res.status(400).json({ error: 'No boundary found in Content-Type' });
    }

    // Read the request body
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Parse multipart data
    const parts = parseMultipart(buffer, boundary);

    if (!parts.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const file = parts.file;
    const filename = file.filename.toLowerCase();

    let text = '';

    // Parse based on file type
    if (filename.endsWith('.txt') || filename.endsWith('.md')) {
      // Plain text or markdown
      text = file.data.toString('utf-8');
    }
    else if (filename.endsWith('.pdf')) {
      // PDF parsing
      try {
        const pdfData = await pdfParse(file.data);
        text = pdfData.text;
      } catch (pdfError) {
        console.error('PDF parsing error:', pdfError);
        return res.status(500).json({
          error: 'Failed to parse PDF',
          details: pdfError.message
        });
      }
    }
    else if (filename.endsWith('.docx')) {
      // DOCX parsing
      try {
        const result = await mammoth.extractRawText({ buffer: file.data });
        text = result.value;
      } catch (docxError) {
        console.error('DOCX parsing error:', docxError);
        return res.status(500).json({
          error: 'Failed to parse DOCX',
          details: docxError.message
        });
      }
    }
    else {
      return res.status(400).json({ error: 'Unsupported file type' });
    }

    // Clean up whitespace
    text = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

    // Warn if text is very large
    const wordCount = text.split(/\s+/).length;
    console.log(`Extracted ${wordCount} words from ${filename}`);

    if (wordCount > 50000) {
      console.warn('Very large document extracted (50k+ words)');
    }

    res.status(200).json({
      text,
      wordCount,
      filename
    });

  } catch (error) {
    console.error('File parsing error:', error);
    res.status(500).json({
      error: 'Failed to parse file',
      details: error.message
    });
  }
}

// Simple multipart parser
function parseMultipart(buffer, boundary) {
  const parts = {};
  const boundaryBuffer = Buffer.from(`--${boundary}`);

  // Split by boundary
  let start = 0;
  while (true) {
    const boundaryIndex = buffer.indexOf(boundaryBuffer, start);
    if (boundaryIndex === -1) break;

    const nextBoundaryIndex = buffer.indexOf(boundaryBuffer, boundaryIndex + boundaryBuffer.length);
    if (nextBoundaryIndex === -1) break;

    const partBuffer = buffer.slice(boundaryIndex + boundaryBuffer.length, nextBoundaryIndex);

    // Find header/body split (double CRLF)
    const headerEndIndex = partBuffer.indexOf('\r\n\r\n');
    if (headerEndIndex === -1) {
      start = nextBoundaryIndex;
      continue;
    }

    const headers = partBuffer.slice(0, headerEndIndex).toString('utf-8');
    const data = partBuffer.slice(headerEndIndex + 4);

    // Extract filename from Content-Disposition header
    const filenameMatch = headers.match(/filename="([^"]+)"/);
    const nameMatch = headers.match(/name="([^"]+)"/);

    if (filenameMatch && nameMatch) {
      parts[nameMatch[1]] = {
        filename: filenameMatch[1],
        data: data.slice(0, -2) // Remove trailing CRLF
      };
    }

    start = nextBoundaryIndex;
  }

  return parts;
}
