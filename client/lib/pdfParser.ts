import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min?url';

let workerInitialized = false;

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

// Initialize the PDF.js worker
function initializeWorker() {
  if (workerInitialized) return;
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
    workerInitialized = true;
    console.log('PDF worker initialized');
  } catch (error) {
    console.error('Failed to initialize worker:', error);
  }
}

export async function parsePDF(file: File): Promise<ExtractedInsuranceData> {
  initializeWorker();

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfData = new Uint8Array(arrayBuffer);

    // Load the PDF document
    const pdf = await pdfjsLib.getDocument(pdfData).promise;

    if (!pdf) {
      throw new Error('Failed to load PDF document');
    }

    let fullText = '';

    // Extract text from all pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = (textContent.items || [])
          .map((item: any) => item.str || '')
          .join(' ');
        fullText += pageText + ' ';
      } catch (error) {
        console.warn(`Could not extract page ${pageNum}`);
      }
    }

    if (!fullText.trim()) {
      throw new Error('No text content found in PDF');
    }

    return extractInsuranceData(fullText);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse PDF: ${message}`);
  }
}

function extractInsuranceData(text: string): ExtractedInsuranceData {
  const data: ExtractedInsuranceData = {};

  // Normalize whitespace
  const normalized = text.replace(/\s+/g, ' ').trim();

  // Helper function to find amounts with $ prefix
  const findAmount = (pattern: RegExp): string | undefined => {
    const match = normalized.match(pattern);
    if (match) {
      const value = match[1].trim();
      if (value.toLowerCase().includes('not included')) return 'Not Included';
      return value.startsWith('$') ? value : '$' + value;
    }
    return undefined;
  };

  // Policy details
  data.deductible = findAmount(/Deductible[:\s]+\$?([\d,]+(?:\.\d{2})?)/i);
  data.dwelling = findAmount(/Dwelling[:\s]+\$?([\d,]+(?:\.\d{2})?)/i);
  data.otherStructures = findAmount(/Other\s+[Ss]tructures[:\s]+\$?([\d,]+(?:\.\d{2})?)/i);
  data.personalProperty = findAmount(/Personal\s+[Pp]roperty[:\s]+\$?([\d,]+(?:\.\d{2})?)/i);
  data.lossOfUse = findAmount(/Loss\s+of\s+[Uu]se[:\s]+\$?([\d,]+(?:\.\d{2})?)/i);
  data.personalLiability = findAmount(/Personal\s+[Ll]iability[:\s]+\$?([\d,]+(?:\.\d{2})?)/i);
  data.medicalPayment = findAmount(/Medical\s+[Pp]ayment[:\s]+\$?([\d,]+(?:\.\d{2})?)/i);
  data.annualPremium = findAmount(/[Aa]nnual\s+[Pp]remium[:\s]+\$?([\d,]+(?:\.\d{2})?)/i);

  // Policy dates
  const dateMatch = normalized.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/g);
  if (dateMatch && dateMatch.length > 0) {
    data.policyStartDate = dateMatch[0];
    if (dateMatch.length > 1) {
      data.policyEndDate = dateMatch[1];
    }
  }

  return data;
}
