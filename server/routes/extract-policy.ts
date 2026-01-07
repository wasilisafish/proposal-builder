import { Router, Request, Response } from "express";
import multer from "multer";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

interface FieldValue {
  value: string | number | null;
  confidence: number;
}

interface ExtractionResponse {
  status: "complete" | "partial" | "failed";
  document: {
    id: string;
    fileName: string;
    uploadedAt: string;
  };
  policy: {
    carrier?: FieldValue;
    effectiveDate?: FieldValue;
    expirationDate?: FieldValue;
  };
  coverages: {
    dwelling?: FieldValue;
    otherStructures?: FieldValue;
    personalProperty?: FieldValue;
    lossOfUse?: FieldValue;
    liability?: FieldValue;
    medPay?: FieldValue;
    waterBackup?: FieldValue;
    earthquake?: FieldValue;
    moldPropertyDamage?: FieldValue;
    moldLiability?: FieldValue;
    deductible?: FieldValue;
  };
  missingFields: string[];
  notes: string[];
  extractionId: string;
  error?: string;
}

// Helper to extract text from PDF
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // Use pdfjs-dist/legacy for Node.js environment (avoids DOMMatrix errors)
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

    console.log("Parsing PDF, buffer size:", buffer.length);
    const pdf = await pdfjsLib.getDocument(buffer).promise;

    let fullText = "";

    // Extract text from all pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();

        const pageText = (textContent.items || [])
          .map((item: any) => item.str || "")
          .join(" ");

        fullText += pageText + " ";
      } catch (pageError) {
        console.warn(`Could not extract text from page ${pageNum}`);
      }
    }

    fullText = fullText.trim();

    if (!fullText) {
      throw new Error("No text extracted from PDF");
    }

    console.log("PDF parsed successfully, text length:", fullText.length);
    return fullText;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("PDF parse error:", errorMsg, error);
    throw new Error(`Failed to extract text from PDF: ${errorMsg}`);
  }
}

// Helper to call OpenAI API
async function extractFieldsWithOpenAI(text: string): Promise<{
  policy: {
    carrier?: FieldValue;
    effectiveDate?: FieldValue;
    expirationDate?: FieldValue;
  };
  coverages: {
    dwelling?: FieldValue;
    otherStructures?: FieldValue;
    personalProperty?: FieldValue;
    lossOfUse?: FieldValue;
    liability?: FieldValue;
    medPay?: FieldValue;
    waterBackup?: FieldValue;
    earthquake?: FieldValue;
    moldPropertyDamage?: FieldValue;
    moldLiability?: FieldValue;
    deductible?: FieldValue;
  };
  missingFields: string[];
  notes: string[];
}> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const prompt = `You are an expert insurance document analyzer. Extract all policy details from this insurance document text.

IMPORTANT: Return ONLY a valid JSON object, nothing else. No explanation, no markdown code blocks.

For each field, provide:
- value: The extracted value (string for text/dates, number for amounts, null if not found)
- confidence: Your confidence score (0.0 to 1.0) in the extraction accuracy

Use this exact format:
{
  "carrier": { "value": "Allstate", "confidence": 0.95 },
  "effectiveDate": { "value": "2026-01-01", "confidence": 0.90 },
  "expirationDate": { "value": "2027-01-01", "confidence": 0.90 },
  "dwelling": { "value": 378380, "confidence": 0.95 },
  "otherStructures": { "value": 72000, "confidence": 0.90 },
  "personalProperty": { "value": 138000, "confidence": 0.90 },
  "lossOfUse": { "value": 50000, "confidence": 0.85 },
  "liability": { "value": 10000, "confidence": 0.80 },
  "medPay": { "value": 5000, "confidence": 0.85 },
  "deductible": { "value": 1000, "confidence": 0.95 },
  "waterBackup": { "value": 10000, "confidence": 0.75 },
  "earthquake": { "value": null, "confidence": 0.0 },
  "moldPropertyDamage": { "value": null, "confidence": 0.0 },
  "moldLiability": { "value": null, "confidence": 0.0 }
}

If you find unusually low amounts (e.g., liability < $100,000 for HO3), include a note.

DOCUMENT TEXT (first 5000 chars):
${text.substring(0, 5000)}`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0,
        max_tokens: 800,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const result = (await response.json()) as any;
    const content = result.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from OpenAI");
    }

    // Parse the JSON response with better error handling
    let parsed: any;

    // Try to extract and parse JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("OpenAI response content:", content);
      throw new Error("Could not find JSON in OpenAI response");
    }

    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (jsonError) {
      // Try to fix common JSON issues
      let cleanedJson = jsonMatch[0];

      // Remove trailing commas
      cleanedJson = cleanedJson.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");

      // Try parsing again
      try {
        parsed = JSON.parse(cleanedJson);
      } catch (retryError) {
        console.error("Failed to parse JSON:", cleanedJson);
        console.error("Parse error:", retryError);
        throw new Error(
          `Invalid JSON in OpenAI response: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`,
        );
      }
    }

    // Extract structured data with confidence scores
    const policy: {
      carrier?: FieldValue;
      effectiveDate?: FieldValue;
      expirationDate?: FieldValue;
    } = {};
    const coverages: {
      dwelling?: FieldValue;
      otherStructures?: FieldValue;
      personalProperty?: FieldValue;
      lossOfUse?: FieldValue;
      liability?: FieldValue;
      medPay?: FieldValue;
      waterBackup?: FieldValue;
      earthquake?: FieldValue;
      moldPropertyDamage?: FieldValue;
      moldLiability?: FieldValue;
      deductible?: FieldValue;
    } = {};
    const missingFields: string[] = [];
    const notes: string[] = [];

    // Extract policy fields
    const policyFields = ["carrier", "effectiveDate", "expirationDate"];
    for (const field of policyFields) {
      const fieldData = parsed[field];
      if (
        fieldData &&
        fieldData.value !== null &&
        fieldData.value !== undefined
      ) {
        policy[field as keyof typeof policy] = {
          value: fieldData.value,
          confidence: fieldData.confidence || 0.8,
        };
      } else {
        missingFields.push(field);
      }
    }

    // Extract coverage fields
    const coverageFields = [
      "dwelling",
      "otherStructures",
      "personalProperty",
      "lossOfUse",
      "liability",
      "medPay",
      "waterBackup",
      "earthquake",
      "moldPropertyDamage",
      "moldLiability",
      "deductible",
    ];
    for (const field of coverageFields) {
      const fieldData = parsed[field];
      if (
        fieldData &&
        fieldData.value !== null &&
        fieldData.value !== undefined
      ) {
        coverages[field as keyof typeof coverages] = {
          value: fieldData.value,
          confidence: fieldData.confidence || 0.8,
        };

        // Add notes for unusual values
        if (
          field === "liability" &&
          typeof fieldData.value === "number" &&
          fieldData.value < 100000
        ) {
          notes.push("Liability looks unusually low; verify.");
        }
      } else {
        missingFields.push(field);
      }
    }

    return { policy, coverages, missingFields, notes };
  } catch (error) {
    throw new Error(
      `Failed to extract fields: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

// Helper to validate file type and size
function validateFile(file: Express.Multer.File): {
  valid: boolean;
  error?: string;
} {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedMimeTypes = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/heic",
  ];

  if (file.size > maxSize) {
    return {
      valid: false,
      error: "File size exceeds 10MB limit",
    };
  }

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return {
      valid: false,
      error:
        "File type not supported. Please upload a PDF or image (JPG, PNG, HEIC).",
    };
  }

  return { valid: true };
}

// Helper to extract text from image using OpenAI
async function extractTextFromImage(
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const base64 = buffer.toString("base64");
  const mediaType = mimeType as "image/jpeg" | "image/png" | "image/heic";

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract all text from this insurance document image. Return the complete text content.",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mediaType};base64,${base64}`,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const result = (await response.json()) as any;
    const text = result.choices?.[0]?.message?.content;

    if (!text) {
      throw new Error("No text extracted from image");
    }

    return text;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to extract text from image: ${errorMsg}`);
  }
}

router.post(
  "/extract-policy",
  upload.single("pdf"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          status: "failed",
          document: {
            id: "",
            fileName: "",
            uploadedAt: new Date().toISOString(),
          },
          policy: {},
          coverages: {},
          missingFields: [],
          notes: [],
          extractionId: "",
          error: "No file provided",
        });
      }

      // Validate file
      const validation = validateFile(req.file);
      if (!validation.valid) {
        return res.status(400).json({
          status: "failed",
          document: {
            id: req.file.originalname,
            fileName: req.file.originalname,
            uploadedAt: new Date().toISOString(),
          },
          policy: {},
          coverages: {},
          missingFields: [],
          notes: [],
          extractionId: "",
          error: validation.error,
        });
      }

      const documentId = `doc_${Date.now()}`;
      const uploadedAt = new Date().toISOString();

      // Extract text based on file type
      let extractedText: string;

      if (req.file.mimetype === "application/pdf") {
        extractedText = await extractTextFromPDF(req.file.buffer);
      } else if (req.file.mimetype.startsWith("image/")) {
        extractedText = await extractTextFromImage(
          req.file.buffer,
          req.file.mimetype,
        );
      } else {
        throw new Error("Unsupported file type");
      }

      if (!extractedText.trim()) {
        return res.status(400).json({
          status: "failed",
          document: {
            id: documentId,
            fileName: req.file.originalname,
            uploadedAt,
          },
          policy: {},
          coverages: {},
          missingFields: [],
          notes: ["No text content found in document. Try a clearer image."],
          extractionId: `extr_${Date.now()}`,
          error: "No text content found",
        });
      }

      // Extract structured fields using OpenAI
      const {
        policy,
        coverages,
        missingFields,
        notes: extractionNotes,
      } = await extractFieldsWithOpenAI(extractedText);

      // Determine overall status
      const totalFields =
        Object.keys(coverages).length + Object.keys(policy).length;
      const extractedFieldsCount =
        Object.keys(coverages).length - missingFields.length;
      const status =
        extractedFieldsCount === 0
          ? "failed"
          : extractedFieldsCount < totalFields * 0.5
            ? "partial"
            : "complete";

      res.json({
        status,
        document: {
          id: documentId,
          fileName: req.file.originalname,
          uploadedAt,
        },
        policy,
        coverages,
        missingFields,
        notes: extractionNotes,
        extractionId: `extr_${Date.now()}`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Extraction error:", error);
      res.status(500).json({
        status: "failed",
        document: {
          id: "",
          fileName: "",
          uploadedAt: new Date().toISOString(),
        },
        policy: {},
        coverages: {},
        missingFields: [],
        notes: [],
        extractionId: "",
        error: message,
      });
    }
  },
);

export default router;
