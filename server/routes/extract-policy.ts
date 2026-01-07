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
    // Use dynamic import for pdf-parse to handle ESM/CJS compatibility
    const pdfParseModule = await import('pdf-parse');
    const pdfParse = pdfParseModule.default || pdfParseModule;

    if (typeof pdfParse !== 'function') {
      console.error('pdf-parse module type:', typeof pdfParse);
      console.error('pdf-parse module keys:', Object.keys(pdfParseModule));
      throw new Error('pdf-parse is not a function');
    }

    console.log('Parsing PDF, buffer size:', buffer.length);
    const data = await pdfParse(buffer);
    console.log('PDF parsed successfully, text length:', data.text?.length || 0);

    if (!data.text || !data.text.trim()) {
      throw new Error('No text extracted from PDF');
    }

    return data.text;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('PDF parse error:', errorMsg, error);
    throw new Error(`Failed to extract text from PDF: ${errorMsg}`);
  }
}

// Helper to call OpenAI API
async function extractFieldsWithOpenAI(text: string): Promise<{ data: ExtractedPolicyData; confidence: Record<string, number>; missing: string[] }> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const prompt = `You are an insurance document analyzer. Extract policy details from this insurance document text.

IMPORTANT: Return ONLY a valid JSON object, nothing else. No explanation, no markdown code blocks.

Use this exact format. For missing values, use null (not empty string). Do not include any trailing commas.

{
  "deductible": "$1000" or null,
  "dwelling": "$378380" or null,
  "otherStructures": "$72000" or null,
  "personalProperty": "$138000" or null,
  "lossOfUse": "$50000" or null,
  "personalLiability": "$10000" or null,
  "medicalPayment": "$5000" or null,
  "annualPremium": "$2083.00" or null,
  "policyStartDate": "1/1/2024" or null,
  "policyEndDate": "12/31/2024" or null
}

DOCUMENT TEXT:
${text.substring(0, 4000)}`;

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

    // Parse the JSON response with better error handling
    let parsed: any;

    // Try to extract and parse JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('OpenAI response content:', content);
      throw new Error('Could not find JSON in OpenAI response');
    }

    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (jsonError) {
      // Try to fix common JSON issues
      let cleanedJson = jsonMatch[0];

      // Remove trailing commas
      cleanedJson = cleanedJson.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');

      // Try parsing again
      try {
        parsed = JSON.parse(cleanedJson);
      } catch (retryError) {
        console.error('Failed to parse JSON:', cleanedJson);
        console.error('Parse error:', retryError);
        throw new Error(`Invalid JSON in OpenAI response: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`);
      }
    }

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

    // Extract structured fields using OpenAI
    const { data, confidence, missing } = await extractFieldsWithOpenAI(extractedText);

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
