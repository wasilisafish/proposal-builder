export interface ExtractedInsuranceData {
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

export interface ExtractionResult {
  success: boolean;
  data?: ExtractedInsuranceData;
  confidence?: Record<string, number>;
  missingFields?: string[];
  error?: string;
}

export async function parsePDF(file: File): Promise<ExtractedInsuranceData> {
  const formData = new FormData();
  formData.append('pdf', file);

  try {
    const response = await fetch('/api/extract-policy', {
      method: 'POST',
      body: formData,
    });

    const result: ExtractionResult = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to extract policy data');
    }

    if (!result.data) {
      throw new Error('No data extracted from PDF');
    }

    return result.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse PDF: ${message}`);
  }
}
