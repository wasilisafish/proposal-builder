import * as pdfjsLib from 'pdfjs-dist';

// Note: We don't configure a worker here to avoid CORS/CDN issues
// pdf.js will use its built-in fallback for parsing without a worker

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
    const pdfData = new Uint8Array(arrayBuffer);

    let fullText = '';
    let pdf;

    try {
      // Try loading with default worker setup
      const loadingTask = pdfjsLib.getDocument(pdfData);
      pdf = await loadingTask.promise;
    } catch (workerError) {
      console.warn('Worker loading failed, trying alternative parsing method:', workerError);

      // If worker fails, try disabling worker and using inline parsing
      pdfjsLib.GlobalWorkerOptions.workerSrc = undefined;
      try {
        const loadingTask = pdfjsLib.getDocument({
          data: pdfData,
          useWorker: false,
          cMapUrl: undefined, // Disable cmap to simplify
          disableFontFace: true, // Don't try to use system fonts
        } as any);
        pdf = await loadingTask.promise;
      } catch (fallbackError) {
        throw new Error(`Failed to load PDF with both worker and fallback method: ${fallbackError}`);
      }
    }

    if (!pdf) {
      throw new Error('Failed to load PDF document');
    }

    // Extract text from all pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        if (!page) continue;

        const textContent = await page.getTextContent();
        const pageText = (textContent.items || [])
          .map((item: any) => item.str || '')
          .filter(Boolean)
          .join(' ');

        fullText += pageText + ' ';
      } catch (pageError) {
        console.warn(`Could not extract page ${pageNum}:`, pageError);
      }
    }

    // Clean up text
    fullText = fullText.trim();

    if (!fullText) {
      throw new Error('No text content found in PDF - it may be a scanned image or encrypted');
    }

    return extractInsuranceData(fullText);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('PDF parsing error:', errorMessage);
    throw new Error(errorMessage);
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
