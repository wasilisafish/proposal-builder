import { Router, Request, Response } from 'express';
import multer from 'multer';

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
    // Dynamically import pdf-parse to handle ESM
    const pdfParseModule = await import('pdf-parse/lib/index.mjs');
    const pdfParse = pdfParseModule.default || pdfParseModule;

    const data = await pdfParse(buffer);
    return data.text || '';
  } catch (error) {
    console.error('PDF parse error:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

// Helper to call Claude API
async function extractFieldsWithClaude(text: string): Promise<{ data: ExtractedPolicyData; confidence: Record<string, number>; missing: string[] }> {
  const apiKey = process.env.CLAUDE_API_KEY;
  
  if (!apiKey) {
    throw new Error('CLAUDE_API_KEY not configured');
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

Also estimate confidence (0-1) for each field found.

Document text:
${text}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
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
      throw new Error(`Claude API error: ${response.status} - ${error}`);
    }

    const result = await response.json() as any;
    const content = result.content?.[0]?.text;
    
    if (!content) {
      throw new Error('No response from Claude');
    }

    // Parse the JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from Claude response');
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
        confidence[field] = parsed[`${field}_confidence`] || 0.85;
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
