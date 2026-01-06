import * as pdfjsLib from 'pdfjs-dist';

// Initialize PDF.js
let pdfInitialized = false;

async function initializePDF() {
  if (pdfInitialized) return;

  if (typeof window !== 'undefined') {
    // Set worker source before first use
    const version = pdfjsLib.version;
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.js`;
    pdfInitialized = true;
  }
}

export interface ExtractedInsuranceData {
  policyStartDate?: string;
  policyEndDate?: string;
  deductible?: string;
  dwelling?: string;
  otherStructures?: string;
  personalProperty?: string;
  lossOfUse?: string;
  personalLiability?: string;
  medicalPayment?: string;
  waterBackup?: string;
  earthquakeCoverage?: string;
  moldPropertyDamage?: string;
  policyNumber?: string;
  insuredName?: string;
  annualPremium?: string;
  [key: string]: string | undefined;
}

export async function parsePDF(file: File): Promise<ExtractedInsuranceData> {
  try {
    // Initialize PDF.js
    await initializePDF();

    const arrayBuffer = await file.arrayBuffer();

    // Load PDF document
    let pdf;
    try {
      pdf = await pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuffer),
      }).promise;
    } catch (docError) {
      console.error('Failed to load PDF document:', docError);
      throw new Error(`Failed to load PDF: ${(docError as Error).message}`);
    }

    if (!pdf) {
      throw new Error('PDF document is null or undefined');
    }

    let fullText = '';
    const numPages = pdf.numPages;

    // Extract text from all pages
    for (let i = 1; i <= numPages; i++) {
      try {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        const pageText = (textContent.items || [])
          .map((item: any) => {
            if (item.str) return item.str;
            return '';
          })
          .join(' ');

        fullText += pageText + ' ';
      } catch (pageError) {
        console.warn(`Warning: Could not extract text from page ${i}:`, pageError);
        // Continue with next page
      }
    }

    if (!fullText || fullText.trim().length === 0) {
      throw new Error('No text content found in PDF. The PDF may be scanned or image-based.');
    }

    const data = extractInsuranceData(fullText);

    // If no data was extracted, it might be a valid PDF but not an insurance document
    if (Object.keys(data).every(key => !data[key as keyof ExtractedInsuranceData])) {
      console.warn('No insurance data found in PDF text');
    }

    return data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('PDF parsing error:', errorMessage);
    throw new Error(`PDF parsing failed: ${errorMessage}`);
  }
}

function extractInsuranceData(text: string): ExtractedInsuranceData {
  const data: ExtractedInsuranceData = {};

  // Normalize whitespace and special characters
  const normalizedText = text.replace(/\s+/g, ' ').trim();

  // Policy basics
  const policyNumberMatch = normalizedText.match(/Policy\s+Number\s+([A-Z0-9\-]+)/i);
  if (policyNumberMatch) data.policyNumber = policyNumberMatch[1].trim();

  const policyTermMatch = normalizedText.match(/Policy\s+Term\s+(\d{2}\/\d{2}\/\d{4})\s*[–\-–]\s*(\d{2}\/\d{2}\/\d{4})/i);
  if (policyTermMatch) {
    data.policyStartDate = policyTermMatch[1];
    data.policyEndDate = policyTermMatch[2];
  }

  const annualPremiumMatch = normalizedText.match(/Annual\s+Premium\s+\$?([\d,]+(?:\.\d{2})?)/i);
  if (annualPremiumMatch) data.annualPremium = '$' + annualPremiumMatch[1];

  const insuredNameMatch = normalizedText.match(/Insured\s+Information\s+([A-Z][a-z]+\s+[A-Z][a-z]+\s+[A-Z][a-z]+)/i);
  if (insuredNameMatch) data.insuredName = insuredNameMatch[1].trim();

  // Deductibles
  const allPerilsDeductibleMatch = normalizedText.match(/All\s+Perils\s+Deductible[:\s]+\$?([\d,]+(?:\.\d{2})?)/i);
  if (allPerilsDeductibleMatch) data.deductible = '$' + allPerilsDeductibleMatch[1];

  // Coverage amounts - more flexible patterns
  const coveragePatterns = [
    { key: 'dwelling', patterns: [/Coverage\s+A\s*[–\-–]?\s*Dwelling\s+\$?([\d,]+)/i, /Dwelling\s+\$?([\d,]+)/i] },
    { key: 'otherStructures', patterns: [/Coverage\s+B\s*[–\-–]?\s*Other\s+Structures\s+\$?([\d,]+)/i, /Other\s+Structures\s+\$?([\d,]+)/i] },
    { key: 'personalProperty', patterns: [/Coverage\s+C\s*[–\-–]?\s*Personal\s+Property\s+\$?([\d,]+)/i, /Personal\s+Property\s+\$?([\d,]+)/i] },
    { key: 'lossOfUse', patterns: [/Coverage\s+D\s*[–\-–]?\s*Loss\s+of\s+Use\s+\$?([\d,]+)/i, /Loss\s+of\s+Use\s+\$?([\d,]+)/i] },
    { key: 'personalLiability', patterns: [/Coverage\s+E\s*[–\-–]?\s*Personal\s+Liability\s+\$?([\d,]+)/i, /Personal\s+Liability\s+\$?([\d,]+)/i] },
    { key: 'medicalPayment', patterns: [/Coverage\s+F\s*[–\-–]?\s*Medical\s+Payments?\s+\$?([\d,]+)/i, /Medical\s+Payments?\s+\$?([\d,]+)/i] },
    { key: 'waterBackup', patterns: [/Water\s+back[\-\s]*up\s+\$?([\d,]+|Not\s+Included)/i] },
    { key: 'earthquakeCoverage', patterns: [/Earthquake\s+coverage?\s+\$?([\d,]+|Not\s+Included)/i] },
    { key: 'moldPropertyDamage', patterns: [/Mold\s+property\s+damage\s+\$?([\d,]+|Not\s+Included)/i] },
  ];

  for (const coverage of coveragePatterns) {
    for (const pattern of coverage.patterns) {
      const match = normalizedText.match(pattern);
      if (match) {
        const value = match[1].trim();
        if (value.toLowerCase().includes('not')) {
          data[coverage.key] = 'Not Included';
        } else {
          // Remove spaces from numbers
          data[coverage.key] = '$' + value.replace(/\s+/g, '');
        }
        break;
      }
    }
  }

  return data;
}
