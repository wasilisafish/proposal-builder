import { Router, Request, Response } from 'express';
import multer from 'multer';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse/dist/node/cjs/index.cjs');

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

interface ExtractedPolicyData {
  deductible?: string;
  dwelling?: string;
  otherStructures?: string;
  personalProperty?: string;
  lossOfUse?: string;
  personalLiability?: string;
  medicalPayment?: string;
  annualPremium?: string;
  policyStartDate?: string;
  policyEndDate?: string;
  [key: string]: string | undefined;
}

interface ExtractionResponse {
  success: boolean;
  data?: ExtractedPolicyData;
  confidence?: Record<string, number>;
  missingFields?: string[];
  error?: string;
}

// Helper to extract text from PDF
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    return data.text || '';
  } catch (error) {
    console.error('PDF parse error:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

// Helper to call OpenAI API
async function extractFieldsWithOpenAI(text: string): Promise<{ data: ExtractedPolicyData; confidence: Record<string, number>; missing: string[] }> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const prompt = `Extract insurance policy details from the following document text. Return ONLY a valid JSON object with the following fields (use null for missing fields):

{
  "deductible": "value as string (e.g., '$1,000')",
  "dwelling": "value as string (e.g., '$378,380')",
  "otherStructures": "value as string",
  "personalProperty": "value as string",
  "lossOfUse": "value as string",
  "personalLiability": "value as string",
  "medicalPayment": "value as string",
  "annualPremium": "value as string (yearly premium)",
  "policyStartDate": "date as string (e.g., '1/1/2024')",
  "policyEndDate": "date as string"
}

Document text:
${text}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0,
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const result = await response.json() as any;
    const content = result.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from OpenAI response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Extract data and confidence
    const data: ExtractedPolicyData = {};
    const confidence: Record<string, number> = {};
    const missing: string[] = [];

    const fields = [
      'deductible',
      'dwelling',
      'otherStructures',
      'personalProperty',
      'lossOfUse',
      'personalLiability',
      'medicalPayment',
      'annualPremium',
      'policyStartDate',
      'policyEndDate',
    ];

    for (const field of fields) {
      const value = parsed[field];
      if (value && value !== 'null' && value !== null) {
        data[field] = value;
        confidence[field] = 0.85;
      } else {
        missing.push(field);
        confidence[field] = 0;
      }
    }

    return { data, confidence, missing };
  } catch (error) {
    throw new Error(`Failed to extract fields: ${error instanceof Error ? error.message : String(error)}`);
  }
}

router.post('/extract-policy', upload.single('pdf'), async (req: Request, res: Response<ExtractionResponse>) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No PDF file provided',
      });
    }

    // Extract text from PDF
    const extractedText = await extractTextFromPDF(req.file.buffer);

    if (!extractedText.trim()) {
      return res.status(400).json({
        success: false,
        error: 'No text content found in PDF',
      });
    }

    // Extract structured fields using Claude
    const { data, confidence, missing } = await extractFieldsWithClaude(extractedText);

    res.json({
      success: true,
      data,
      confidence,
      missingFields: missing,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Extraction error:', error);
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

export default router;
