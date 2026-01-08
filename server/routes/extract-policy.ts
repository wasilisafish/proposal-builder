import { Router, Request, Response } from "express";
import multer from "multer";
import { createRequire } from "module";
import { writeFile, readFile, unlink, mkdir, readdir, rmdir } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { execSync } from "child_process";
import { existsSync } from "fs";

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

// Convert PDF pages to images for Vision API (Vision API only supports images, not PDFs)
async function convertPDFToImages(buffer: Buffer): Promise<string[]> {
  const tempDir = tmpdir();
  const pdfPath = join(tempDir, `pdf_${Date.now()}.pdf`);
  const outputDir = join(tempDir, `output_${Date.now()}`);

  try {
    // Write PDF buffer to temp file
    await writeFile(pdfPath, buffer);
    await mkdir(outputDir, { recursive: true });

    // Find pdftocairo - try which first, then common locations
    let pdftocairoPath = "pdftocairo";
    try {
      // Try to find pdftocairo in PATH
      const whichResult = execSync("which pdftocairo", { encoding: "utf-8", stdio: "pipe" }).trim();
      if (whichResult) {
        pdftocairoPath = whichResult;
      }
    } catch {
      // If not in PATH, try common locations
      const commonPaths = [
        "/usr/bin/pdftocairo",
        "/usr/local/bin/pdftocairo",
      ];
      for (const path of commonPaths) {
        if (existsSync(path)) {
          pdftocairoPath = path;
          break;
        }
      }
    }

    // Use system pdftocairo directly (more reliable)
    const outputPrefix = join(outputDir, "page");
    execSync(`${pdftocairoPath} -png -scale-to 2048 "${pdfPath}" "${outputPrefix}"`, {
      stdio: "pipe",
    });

    // Read all generated images
    const images: string[] = [];
    const files = await readdir(outputDir);
    const imageFiles = files
      .filter((f) => f.endsWith(".png"))
      .sort(); // Sort to maintain page order

    for (const file of imageFiles) {
      const imagePath = join(outputDir, file);
      const imageBuffer = await readFile(imagePath);
      const base64 = imageBuffer.toString("base64");
      images.push(`data:image/png;base64,${base64}`);
      // Clean up image file
      await unlink(imagePath);
    }

    // Clean up temp files
    await unlink(pdfPath);
    await rmdir(outputDir).catch(() => {}); // Ignore if dir not empty

    return images;
  } catch (error) {
    // Clean up on error
    try {
      await unlink(pdfPath).catch(() => {});
      await rmdir(outputDir).catch(() => {});
    } catch {}

    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("PDF to image conversion error:", errorMsg);
    throw new Error(`Failed to convert PDF to images: ${errorMsg}. Make sure poppler is installed: brew install poppler`);
  }
}

// Use OpenAI Vision API to directly extract coverages, deductibles, and premium from document
async function extractDataWithVisionAPI(
  contentItems: Array<{ type: string; [key: string]: any }>,
): Promise<{
  policy: {
    carrier?: FieldValue;
    effectiveDate?: FieldValue;
    expirationDate?: FieldValue;
    premium?: FieldValue;
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

  const prompt = `You are an expert insurance document analyzer. Analyze this insurance policy document image and extract:

1. CARRIER - The insurance company name (e.g., "Allstate", "State Farm", "Foremost")
2. EFFECTIVE DATE - The policy start date or effective date (look for "effective date", "policy start date", "policy term", "coverage begins", "inception date"). Extract the actual date from the document.
3. EXPIRATION DATE - The policy end date or expiration date (look for "expiration date", "policy end date", "coverage ends", "expires")
4. PREMIUM - The annual or total premium amount (look for "premium", "annual premium", "total premium", "policy premium")
5. DEDUCTIBLE - The deductible amount (look for "deductible", "deductible amount")
6. COVERAGES - All coverage limits including:
   - Dwelling coverage
   - Other structures
   - Personal property
   - Loss of use
   - Personal liability
   - Medical payments
   - Water backup
   - Earthquake (ONLY if INCLUDED with a coverage amount, NOT if excluded)
   - Mold coverage
   - Scheduled Personal Property (jewelry, art, collectibles, etc.) - ONLY if INCLUDED
   - Jewelry coverage - ONLY if INCLUDED with a coverage amount
   - Personal Articles Floater (PAF) - ONLY if INCLUDED
   - Electronic devices coverage (computers, laptops, tablets, smartphones, cameras, TVs, etc.) - ONLY if INCLUDED
   - Flood coverage - ONLY if INCLUDED with a coverage amount, NOT if excluded

CRITICAL RULES FOR COVERAGE EXTRACTION:
- Only extract coverage amounts if the coverage is EXPLICITLY INCLUDED in the policy
- If a coverage is mentioned but marked as "excluded", "not covered", "not included", or similar exclusion language, set its value to null AND add an exclusion note
- For earthquake, flood, and jewelry: ONLY include if they have actual coverage amounts/limits, NOT if they are excluded or not covered
- If you see "Earthquake coverage: Excluded" or "Flood: Not covered" or similar, set that coverage value to null

4. NOTES - In the "notes" array, include:
   - Scheduled Personal Property details ONLY if it's included (with amounts)
   - Jewelry coverage details ONLY if included
   - Personal Articles Floater (PAF) details ONLY if included
   - Electronic devices coverage details ONLY if included (computers, laptops, tablets, smartphones, cameras, TVs, etc.)
   - Any explicit exclusions with format: "EXCLUDED: [Coverage Name]" (e.g., "EXCLUDED: Earthquake", "EXCLUDED: Flood", "EXCLUDED: Jewelry")
   - Any other special coverages or endorsements that are INCLUDED

5. EXCLUSIONS - If you find explicit exclusions, add them to the notes array with the format "EXCLUDED: [Coverage Name]" so they can be properly displayed.

IMPORTANT: Return ONLY a valid JSON object, nothing else. No explanation, no markdown code blocks.

For each field, provide:
- value: The extracted value (string for text/dates, number for amounts, null if not found)
- confidence: Your confidence score (0.0 to 1.0) in the extraction accuracy

Use this exact format:
{
  "carrier": { "value": "Allstate", "confidence": 0.95 },
  "effectiveDate": { "value": "2026-01-01", "confidence": 0.90 },
  "expirationDate": { "value": "2027-01-01", "confidence": 0.90 },
  "premium": { "value": 2083.00, "confidence": 0.95 },
  "dwelling": { "value": 378380, "confidence": 0.95 },
  "otherStructures": { "value": 72000, "confidence": 0.90 },
  "personalProperty": { "value": 138000, "confidence": 0.90 },
  "lossOfUse": { "value": 50000, "confidence": 0.85 },
  "liability": { "value": 100000, "confidence": 0.80 },
  "medPay": { "value": 5000, "confidence": 0.85 },
  "deductible": { "value": 1000, "confidence": 0.95 },
  "waterBackup": { "value": 10000, "confidence": 0.75 },
  "earthquake": { "value": null, "confidence": 0.0 },
  "moldPropertyDamage": { "value": null, "confidence": 0.0 },
  "moldLiability": { "value": null, "confidence": 0.0 }
}

IMPORTANT: Extract the PREMIUM amount - this is critical for comparison.

CRITICAL: Extract the EFFECTIVE DATE (policy start date) from the actual document. Look for dates near terms like:
- "Effective Date", "Policy Start Date", "Policy Term", "Coverage Begins", "Inception Date"
- "Policy Period", "Term", "From", "Beginning"
- Dates in policy term sections

Return the ACTUAL date found in the document in YYYY-MM-DD format. Do NOT use placeholder dates like "2026-01-01" unless that is actually what's in the document.

CRITICAL: If you find ANY mention of "Scheduled Personal Property", "Scheduled Property", "Jewelry", "Jewellery", or any scheduled items, you MUST include this information in a "notes" array. The notes array should contain strings describing any additional coverages found, especially scheduled property or jewelry coverage.

Example notes array:
"notes": ["Scheduled Personal Property - Jewelry: $15,000", "Additional coverage: Scheduled items"]

Return the JSON with a "notes" array field containing any additional coverage information you find.`;

  // Prepare content array with prompt and document (PDF or image)
  const content: any[] = [{ type: "text", text: prompt }, ...contentItems];

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
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: content,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const result = (await response.json()) as any;
    const responseContent = result.choices?.[0]?.message?.content;

    if (!responseContent) {
      throw new Error("No response from OpenAI");
    }

    // Parse the JSON response
    let parsed: any;
    const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("OpenAI response content:", responseContent);
      throw new Error("Could not find JSON in OpenAI response");
    }

    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (jsonError) {
      let cleanedJson = jsonMatch[0];
      cleanedJson = cleanedJson.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");
      try {
        parsed = JSON.parse(cleanedJson);
      } catch (retryError) {
        console.error("Failed to parse JSON:", cleanedJson);
        throw new Error(
          `Invalid JSON in OpenAI response: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`,
        );
      }
    }

    // Extract structured data
    const policy: {
      carrier?: FieldValue;
      effectiveDate?: FieldValue;
      expirationDate?: FieldValue;
      premium?: FieldValue;
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
    const policyFields = ["carrier", "effectiveDate", "expirationDate", "premium"];
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
      } else {
        missingFields.push(field);
      }
    }

    // Extract notes array if present in the response
    if (parsed.notes && Array.isArray(parsed.notes)) {
      notes.push(...parsed.notes);
    } else if (parsed.notes && typeof parsed.notes === "string") {
      notes.push(parsed.notes);
    }

    // Also check for scheduled property or jewelry in any field values and add to notes
    const allExtractedText = JSON.stringify(parsed).toLowerCase();
    const hasScheduledProperty = allExtractedText.includes("scheduled personal property") || 
                                 allExtractedText.includes("scheduled property");
    const hasJewelry = allExtractedText.includes("jewelry") || allExtractedText.includes("jewellery");
    
    if (hasScheduledProperty || hasJewelry) {
      // Check if we already have this in notes
      const hasScheduledNote = notes.some(note => 
        note.toLowerCase().includes("scheduled") || 
        note.toLowerCase().includes("jewelry")
      );
      if (!hasScheduledNote) {
        // Try to extract the actual value from parsed fields
        let scheduledNote = "";
        if (parsed.scheduledPersonalProperty || parsed.scheduledProperty) {
          const scheduledData = parsed.scheduledPersonalProperty || parsed.scheduledProperty;
          if (scheduledData && scheduledData.value) {
            scheduledNote = `Scheduled Personal Property: ${scheduledData.value}`;
          } else {
            scheduledNote = "Scheduled Personal Property detected";
          }
        } else if (parsed.jewelry) {
          const jewelryData = parsed.jewelry;
          if (jewelryData && jewelryData.value) {
            scheduledNote = `Jewelry: ${jewelryData.value}`;
          } else {
            scheduledNote = "Jewelry coverage detected";
          }
        } else if (hasScheduledProperty && hasJewelry) {
          // If both scheduled property and jewelry are mentioned, create a combined note
          scheduledNote = "Scheduled Personal Property - Jewelry detected";
        } else if (hasScheduledProperty) {
          scheduledNote = "Scheduled Personal Property detected";
        } else if (hasJewelry) {
          scheduledNote = "Jewelry coverage detected";
        }
        
        if (scheduledNote) {
          notes.push(scheduledNote);
        }
      }
    }

    return { policy, coverages, missingFields, notes };
  } catch (error) {
    throw new Error(
      `Failed to extract data with Vision API: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

// Helper to call OpenAI API
async function extractFieldsWithOpenAI(text: string): Promise<{
  policy: {
    carrier?: FieldValue;
    effectiveDate?: FieldValue;
    expirationDate?: FieldValue;
    premium?: FieldValue;
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

  const prompt = `You are an expert insurance document analyzer. Your task is to read this insurance policy document and extract key information: COVERAGES, DEDUCTIBLES, and PREMIUM.

IMPORTANT: Return ONLY a valid JSON object, nothing else. No explanation, no markdown code blocks.

Focus on extracting:
1. PREMIUM - The annual or total premium amount (look for "premium", "annual premium", "total premium", "policy premium")
2. DEDUCTIBLE - The deductible amount (look for "deductible", "deductible amount")
3. COVERAGES - All coverage limits including:
   - Dwelling coverage
   - Other structures
   - Personal property
   - Loss of use
   - Personal liability
   - Medical payments
   - Water backup
   - Earthquake
   - Mold coverage

For each field, provide:
- value: The extracted value (string for text/dates, number for amounts, null if not found)
- confidence: Your confidence score (0.0 to 1.0) in the extraction accuracy

Use this exact format:
{
  "carrier": { "value": "Allstate", "confidence": 0.95 },
  "effectiveDate": { "value": "2026-01-01", "confidence": 0.90 },
  "expirationDate": { "value": "2027-01-01", "confidence": 0.90 },
  "premium": { "value": 2083.00, "confidence": 0.95 },
  "dwelling": { "value": 378380, "confidence": 0.95 },
  "otherStructures": { "value": 72000, "confidence": 0.90 },
  "personalProperty": { "value": 138000, "confidence": 0.90 },
  "lossOfUse": { "value": 50000, "confidence": 0.85 },
  "liability": { "value": 100000, "confidence": 0.80 },
  "medPay": { "value": 5000, "confidence": 0.85 },
  "deductible": { "value": 1000, "confidence": 0.95 },
  "waterBackup": { "value": 10000, "confidence": 0.75 },
  "earthquake": { "value": null, "confidence": 0.0 },
  "moldPropertyDamage": { "value": null, "confidence": 0.0 },
  "moldLiability": { "value": null, "confidence": 0.0 }
}

IMPORTANT: Extract the PREMIUM amount - look for terms like "annual premium", "total premium", "policy premium", "premium amount". This is critical for comparison.

DOCUMENT TEXT:
${text}`;

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
        max_tokens: 2000,
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
      premium?: FieldValue;
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

    // Extract policy fields (including premium)
    const policyFields = ["carrier", "effectiveDate", "expirationDate", "premium"];
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
  const maxSize = 50 * 1024 * 1024; // 50MB
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
      error: "File size exceeds 50MB limit",
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

// Convert image buffer to base64 data URL for Vision API
function imageBufferToDataURL(buffer: Buffer, mimeType: string): string {
  const base64 = buffer.toString("base64");
  return `data:${mimeType};base64,${base64}`;
}

router.post(
  "/extract-policy",
  upload.any(),
  async (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
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
          error: "No files provided",
        });
      }

      // Validate all files
      for (const file of files) {
        const validation = validateFile(file);
        if (!validation.valid) {
          return res.status(400).json({
            status: "failed",
            document: {
              id: file.originalname,
              fileName: file.originalname,
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
      }

      const documentId = `doc_${Date.now()}`;
      const uploadedAt = new Date().toISOString();

      // Prepare all documents for Vision API - convert PDFs to images and process all images
      let contentItems: Array<{ type: string; [key: string]: any }> = [];

      for (const file of files) {
        if (file.mimetype === "application/pdf") {
          console.log("Converting PDF to images for Vision API analysis...");
          // Vision API only supports images, so convert PDF pages to images
          const images = await convertPDFToImages(file.buffer);
          console.log(`Converted PDF to ${images.length} image(s)`);
          
          // Add all pages to content items
          const pdfContentItems = images.map((image) => ({
            type: "image_url",
            image_url: {
              url: image,
            },
          }));
          contentItems.push(...pdfContentItems);
        } else if (file.mimetype.startsWith("image/")) {
          console.log("Preparing image for Vision API analysis...");
          const dataURL = imageBufferToDataURL(file.buffer, file.mimetype);
          contentItems.push({
            type: "image_url",
            image_url: {
              url: dataURL,
            },
          });
        } else {
          throw new Error(`Unsupported file type: ${file.mimetype}`);
        }
      }

      console.log(`Analyzing ${contentItems.length} image(s) with OpenAI Vision API to extract coverages, deductibles, and premium...`);

      // Extract structured fields directly using Vision API (all images analyzed together)
      const {
        policy,
        coverages,
        missingFields,
        notes: extractionNotes,
      } = await extractDataWithVisionAPI(contentItems);

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
          fileName: files.length === 1 ? files[0].originalname : `${files.length} files`,
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
