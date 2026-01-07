export interface FieldValue {
  value: string | number | null;
  confidence: number;
}

export interface ExtractionResponse {
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

export async function parseDocument(file: File): Promise<ExtractionResponse> {
  const formData = new FormData();
  formData.append("pdf", file);

  try {
    const response = await fetch("/api/extract-policy", {
      method: "POST",
      body: formData,
    });

    const result: ExtractionResponse = await response.json();

    if (result.status === "failed" && result.error) {
      throw new Error(result.error);
    }

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse document: ${message}`);
  }
}

// Legacy export for backward compatibility
export async function parsePDF(file: File): Promise<ExtractionResponse> {
  return parseDocument(file);
}
