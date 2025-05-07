// Types for YourProposal

export type QuoteOption = {
  id: number;
  deductible: string;
  logo: string;
  company: string;
  updated: string;
  price: string;
};

export type SelectedDetails = {
  price: string;
  company: string;
  deductible: string;
  address: string;
  portalLink: string;
  premium: string;
  effectiveDate: string;
  coverages: {
    dwelling: string;
    otherStructures: string;
    personalProperty: string;
    lossOfUse: string;
    personalLiability: string;
    medicalPayments: string;
    liability?: string;
    uninsuredMotorist?: string;
  };
  included: string[];
  excluded: string[];
};

export type InsuranceProduct = {
  id: number;
  type: string;
  label: string;
  address: string;
  quotes: QuoteOption[];
  selectedQuote: QuoteOption | null;
  savedDetails: SelectedDetails | null;
}; 