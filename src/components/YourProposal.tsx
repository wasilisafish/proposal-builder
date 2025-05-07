import React, { useState, useEffect, useRef } from 'react';
import {
  HomeIcon,
  CarIcon,
  ExternalLinkIcon,
  EditIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  CalendarIcon,
  LinkIcon,
  CloseIcon,
  AddIcon,
} from './YourProposalIcons';
import * as S from './YourProposal.styled';
import { QuoteOption, SelectedDetails, InsuranceProduct } from './YourProposal.types';
import { formatCurrency } from './YourProposal.helpers';
import InsuranceProductCard from './InsuranceProductCard';

// Coverage options
const COVERAGE_OPTIONS = [
  'Earthquake',
  'Extended Replacement Cost',
  'Flood',
  'Foundational replacement cost',
  'Hurricane',
  'Water backup',
  'Wind/Hail',
];

const defaultSelectedDetails: SelectedDetails = {
  price: '$1,180',
  company: 'Foremost',
  deductible: '$1,000',
  address: '12522 W Sunnyside Dr, El Mirage, AZ, 85335...',
  portalLink: 'https://recommendations-engine-live.matic.com/quoting/bridge?...',
  premium: '$1,180',
  effectiveDate: '05/01/2025',
  coverages: {
    dwelling: '$356,000',
    otherStructures: '$356,000',
    personalProperty: '$35,000',
    lossOfUse: '$15,000',
    personalLiability: '$300,000',
    medicalPayments: '$300,000',
  },
  included: ['Wind Hail – $2,500(1%)', 'Water backup– $10,000(1%)'],
  excluded: ['Flood', 'Earthquake'],
};

const quoteOptions: QuoteOption[] = [
  {
    id: 1,
    deductible: '$2,500',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Foremost_Insurance_logo.svg',
    company: 'Foremost',
    updated: '07/03/2024 at 11:56 am',
    price: '$2,083/yr',
  },
  {
    id: 2,
    deductible: '$1,000',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/Mercury_Insurance_logo.svg',
    company: 'Mercury',
    updated: '07/03/2024 at 11:50 am',
    price: '$2,187.00/yr',
  },
];

const initialProducts: InsuranceProduct[] = [
  {
    id: 1,
    type: 'home',
    label: 'Primary home',
    address: '12522 W Sunnyside Dr, El Mirage, AZ, 85335...',
    quotes: quoteOptions,
    selectedQuote: null,
    savedDetails: null,
  },
  {
    id: 2,
    type: 'auto',
    label: 'Auto',
    address: '2017 Ford Explorer XLT, 2008 Chevrolet Impala..',
    quotes: quoteOptions,
    selectedQuote: null,
    savedDetails: null,
  },
];

const YourProposal: React.FC = () => {
  const [products, setProducts] = useState<InsuranceProduct[]>(initialProducts);

  const handleSelectQuote = (productId: number, quote: QuoteOption) => {
    setProducts(products =>
      products.map(p =>
        p.id === productId ? { ...p, selectedQuote: quote } : p
      )
    );
  };

  const handleSaveDetails = (productId: number, details: SelectedDetails) => {
    setProducts(products =>
      products.map(p =>
        p.id === productId ? { ...p, savedDetails: details } : p
      )
    );
  };

  const handleAddProduct = () => {
    setProducts(products => [
      ...products,
      {
        id: Date.now(),
        type: '',
        label: 'New product',
        address: '',
        quotes: [],
        selectedQuote: null,
        savedDetails: null,
      },
    ]);
  };

  return (
    <S.Container>
      <S.HeaderRow>
        <S.Title>
          Your proposal <S.StatusChip>Draft</S.StatusChip>
        </S.Title>
        <S.SelectProposal>
          Select proposal <ChevronDownIcon />
        </S.SelectProposal>
      </S.HeaderRow>
      {products.map(product => (
        <InsuranceProductCard
          key={product.id}
          product={product}
          onSelectQuote={handleSelectQuote}
          onSaveDetails={handleSaveDetails}
        />
      ))}
      <S.AddProductButton onClick={handleAddProduct}>
        <AddIcon /> Add insurance product
      </S.AddProductButton>
    </S.Container>
  );
};

export default YourProposal;