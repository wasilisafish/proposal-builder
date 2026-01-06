import * as pdfjsLib from 'pdfjs-dist';

// Set up worker for pdf.js using jsdelivr CDN
if (typeof window !== 'undefined') {
  // Try multiple CDN sources for redundancy
  const version = pdfjsLib.version;
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.js`;
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
    const arrayBuffer = await file.arrayBuffer();

    // Disable worker temporarily to avoid worker loading issues
    pdfjsLib.GlobalWorkerOptions.workerSrc = null;

    const pdf = await pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useWorker: false, // Disable worker to avoid CORS issues
    }).promise;

    let fullText = '';

    // Extract text from all pages
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => (item as any).str || '')
        .join(' ');
      fullText += pageText + ' ';
    }

    if (!fullText || fullText.trim().length === 0) {
      throw new Error('No text content found in PDF');
    }

    return extractInsuranceData(fullText);
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw error;
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
