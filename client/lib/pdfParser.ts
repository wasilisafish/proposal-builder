import * as pdfjsLib from 'pdfjs-dist';

// Set up worker for pdf.js using jsdelivr CDN
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
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
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;

  let fullText = '';

  // Extract text from all pages
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + ' ';
  }

  return extractInsuranceData(fullText);
}

function extractInsuranceData(text: string): ExtractedInsuranceData {
  const data: ExtractedInsuranceData = {};

  // Policy basics
  const policyNumberMatch = text.match(/Policy\s*Number[:\s]+([A-Z0-9\-]+)/i);
  if (policyNumberMatch) data.policyNumber = policyNumberMatch[1];

  const policyTermMatch = text.match(/Policy\s*Term[:\s]+(\d{2}\/\d{2}\/\d{4})\s*[–\-]\s*(\d{2}\/\d{2}\/\d{4})/i);
  if (policyTermMatch) {
    data.policyStartDate = policyTermMatch[1];
    data.policyEndDate = policyTermMatch[2];
  }

  const annualPremiumMatch = text.match(/Annual\s*Premium[:\s]*\$?([\d,]+(?:\.\d{2})?)/i);
  if (annualPremiumMatch) data.annualPremium = '$' + annualPremiumMatch[1];

  const insuredNameMatch = text.match(/Insured\s*Information\s+([A-Z][a-z]+\s+[A-Z]\.\s+[A-Z][a-z]+)/i);
  if (insuredNameMatch) data.insuredName = insuredNameMatch[1];

  // Deductibles
  const allPerilsDeductibleMatch = text.match(/All\s*Perils\s*Deductible[:\s]*\$?([\d,]+(?:\.\d{2})?)/i);
  if (allPerilsDeductibleMatch) data.deductible = '$' + allPerilsDeductibleMatch[1];

  // Coverage amounts - try multiple patterns
  const coveragePatterns = [
    { key: 'dwelling', patterns: [/Coverage\s*A\s*[–\-]?\s*Dwelling[:\s]*\$?([\d,]+(?:\.\d{2})?)/i] },
    { key: 'otherStructures', patterns: [/Coverage\s*B\s*[–\-]?\s*Other\s*Structures[:\s]*\$?([\d,]+(?:\.\d{2})?)/i] },
    { key: 'personalProperty', patterns: [/Coverage\s*C\s*[–\-]?\s*Personal\s*Property[:\s]*\$?([\d,]+(?:\.\d{2})?)/i] },
    { key: 'lossOfUse', patterns: [/Coverage\s*D\s*[–\-]?\s*Loss\s*of\s*Use[:\s]*\$?([\d,]+(?:\.\d{2})?)/i] },
    { key: 'personalLiability', patterns: [/Coverage\s*E\s*[–\-]?\s*Personal\s*Liability[:\s]*\$?([\d,]+(?:\.\d{2})?)/i] },
    { key: 'medicalPayment', patterns: [/Coverage\s*F\s*[–\-]?\s*Medical\s*Payments[:\s]*\$?([\d,]+(?:\.\d{2})?)/i, /Medical\s*Payment[:\s]*\$?([\d,]+(?:\.\d{2})?)/i] },
    { key: 'waterBackup', patterns: [/Water\s*back[\-\s]*up[:\s]*\$?([\d,]+(?:\.\d{2})?|Not\s*Included)/i] },
    { key: 'earthquakeCoverage', patterns: [/Earthquake\s*coverage[:\s]*\$?([\d,]+(?:\.\d{2})?|Not\s*Included)/i] },
    { key: 'moldPropertyDamage', patterns: [/Mold\s*property\s*damage[:\s]*\$?([\d,]+(?:\.\d{2})?|Not\s*Included)/i] },
  ];

  for (const coverage of coveragePatterns) {
    for (const pattern of coverage.patterns) {
      const match = text.match(pattern);
      if (match) {
        const value = match[1];
        if (value.toLowerCase().includes('not')) {
          data[coverage.key] = 'Not Included';
        } else {
          data[coverage.key] = '$' + value.replace(/\s+/g, '');
        }
        break;
      }
    }
  }

  return data;
}
