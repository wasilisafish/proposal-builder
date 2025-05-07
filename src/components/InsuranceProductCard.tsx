import React, { useState, useRef, useEffect } from 'react';
import { InsuranceProduct, QuoteOption, SelectedDetails } from './YourProposal.types';
import * as S from './YourProposal.styled';
import { ChevronDownIcon, ChevronUpIcon, ExternalLinkIcon, EditIcon, CloseIcon, TrashIcon, CarIcon, CalendarIcon } from './YourProposalIcons';

interface Props {
  product: InsuranceProduct;
  onSelectQuote: (productId: number, quote: QuoteOption) => void;
  onSaveDetails: (productId: number, details: SelectedDetails) => void;
}

const CARRIER_OPTIONS = [
  { label: 'Foremost', value: 'Foremost' },
  { label: 'Mercury', value: 'Mercury' },
  { label: 'Lemonade', value: 'Lemonade' },
];

const COVERAGE_OPTIONS = [
  'Wind/Hail',
  'Water Backup',
  'Earthquake Coverage',
  'Flood Coverage',
  'Identity Theft Protection',
  'Equipment Breakdown',
  'Service Line Coverage',
  'Personal Injury',
  'Valuable Items or Scheduled Personal Property',
  'Ordinance or Law',
  'Extended Replacement Cost on Dwelling',
  'Extended Replacement Cost on Contents',
  'Inflation Guard',
  'Loss Assessment',
  'Green Home Coverage',
  'Home Cyber Protection',
  'Replacement Cost on Personal Property',
];

// Add dropdown options for auto insurance
const AUTO_CARRIER_OPTIONS = [
  { label: 'Progressive', value: 'Progressive' },
  { label: 'GEICO', value: 'GEICO' },
  { label: 'Allstate', value: 'Allstate' },
  { label: 'State Farm', value: 'State Farm' },
  { label: 'Liberty Mutual', value: 'Liberty Mutual' },
];
const BI_PD_PERSON_OPTIONS = ['$15,000', '$25,000', '$50,000', '$100,000'];
const BI_PD_ACCIDENT_OPTIONS = ['$30,000', '$50,000', '$100,000', '$300,000'];
const BI_PD_PROPERTY_OPTIONS = ['$25,000', '$50,000', '$100,000', '$250,000'];
const PIP_OPTIONS = ['None', '$2,500', '$5,000', '$10,000'];
const MED_PAY_OPTIONS = ['None', '$1,000', '$5,000', '$10,000'];
const DEDUCTIBLE_OPTIONS = ['$250', '$500', '$1,000'];
const VEHICLE_INCLUDED_COVERAGES = [
  'Trip Collision',
  'Roadside Assistance',
  'Rental Reimbursement',
  'Gap Coverage',
  'Glass Coverage',
  'New Car Replacement',
  'Custom Equipment Coverage',
  'OEM Parts Replacement',
  'Rideshare Coverage',
  'Accident Forgiveness',
  'Deductible Waiver',
  'Personal Injury Protection (PIP)',
  'Uninsured/Underinsured Motorist Coverage',
];
const VEHICLE_EXCLUDED_COVERAGES: string[] = [
  'Trip Collision',
  'Roadside Assistance',
  'Rental Reimbursement',
  'Gap Coverage',
  'Glass Coverage',
  'New Car Replacement',
  'Custom Equipment Coverage',
  'OEM Parts Replacement',
  'Rideshare Coverage',
  'Accident Forgiveness',
  'Deductible Waiver',
  'Personal Injury Protection (PIP)',
  'Uninsured/Underinsured Motorist Coverage',
];

const QUICK_FILL_PRESETS = [
  { label: '25K/50K/25K', person: '$25,000', accident: '$50,000', property: '$25,000' },
  { label: '50K/100K/50K', person: '$50,000', accident: '$100,000', property: '$50,000' },
  { label: '100K/300K/100K', person: '$100,000', accident: '$300,000', property: '$100,000' },
];

function MultiSelectDropdown({ options, selected, onChange, placeholder, disabled, onAddCoverageClick, withCheckboxes }: { options: string[]; selected: string[]; onChange: (opts: string[]) => void; placeholder?: string, disabled?: boolean, onAddCoverageClick?: (name: string) => void, withCheckboxes?: boolean }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);
  const filtered = options.filter(opt => opt.toLowerCase().includes(search.toLowerCase()) && !selected.includes(opt));
  return (
    <div ref={ref} style={{ position: 'relative', width: '100%', opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
      <div
        style={{
          border: '1px solid #ccc',
          borderRadius: 8,
          minHeight: 36,
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          padding: '4px 8px',
          background: '#fff',
          cursor: disabled ? 'not-allowed' : 'text',
        }}
        onClick={() => !disabled && setOpen(true)}
      >
        {selected.map(opt => (
          <span key={opt} style={{ background: '#e8f5e9', color: '#2e7d32', borderRadius: 16, padding: '4px 10px', fontWeight: 500, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6, margin: '2px 4px 2px 0' }}>
            {opt}
            <span
              style={{ cursor: 'pointer', fontWeight: 700, marginLeft: 4 }}
              onClick={e => { e.stopPropagation(); if (!disabled) onChange(selected.filter(o => o !== opt)); }}
            >×</span>
          </span>
        ))}
        <input
          style={{ border: 'none', outline: 'none', flex: 1, minWidth: 60, fontSize: 15, background: 'transparent', padding: 4 }}
          value={search}
          onChange={e => setSearch(e.target.value)}
          onFocus={() => !disabled && setOpen(true)}
          placeholder={selected.length === 0 ? placeholder : ''}
          disabled={disabled}
        />
      </div>
      {open && !disabled && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #ccc', borderRadius: 8, zIndex: 10, maxHeight: 220, overflowY: 'auto', marginTop: 2 }}>
          {filtered.length > 0 && filtered.map(opt => (
            <div
              key={opt}
              style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 15, color: '#222', background: selected.includes(opt) ? '#e8f5e9' : '#fff' }}
              onClick={() => { if (!disabled) { onChange([...selected, opt]); setSearch(''); setOpen(true); } }}
            >
              {opt}
            </div>
          ))}
          {/* Always show + Add coverage at the bottom */}
          <div
            style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 15, color: '#156eea', fontWeight: 500, borderTop: filtered.length > 0 ? '1px solid #eee' : undefined }}
            onClick={() => {
              if (!disabled) {
                if (onAddCoverageClick) {
                  onAddCoverageClick(search.trim());
                  setSearch('');
                  setOpen(false);
                }
              }
            }}
          >
            + Add coverage{search.trim() ? ` "${search.trim()}"` : ''}
          </div>
        </div>
      )}
    </div>
  );
}

// Add date formatting helpers at the top
function toDateInputValue(dateStr: string) {
  // Accepts MM/DD/YYYY or YYYY-MM-DD, returns YYYY-MM-DD
  if (!dateStr) return '';
  if (/\d{4}-\d{2}-\d{2}/.test(dateStr)) return dateStr;
  const [mm, dd, yyyy] = dateStr.split(/[\/\-]/);
  if (yyyy && mm && dd) return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  return dateStr;
}
function toDisplayDate(dateStr: string) {
  // Accepts YYYY-MM-DD, returns MM/DD/YYYY
  if (!dateStr) return '';
  if (/\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    const [yyyy, mm, dd] = dateStr.split('-');
    return `${mm}/${dd}/${yyyy}`;
  }
  return dateStr;
}

// Define a shared style for all input/select fields in the edit form
const fieldStyle = { width: '100%', height: 36, fontSize: 16, padding: 10, borderRadius: 8, border: '1px solid #ccc', boxSizing: 'border-box' as const };

// Helper to format money as 000,000.00
function formatMoney(val: string) {
  if (!val) return '';
  // Remove all $ and commas, then parse
  const num = parseFloat(val.replace(/[^\d.\-]/g, ''));
  if (isNaN(num)) return '';
  return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const InsuranceProductCard: React.FC<Props> = ({ product, onSelectQuote, onSaveDetails }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [editOpen, setEditOpen] = useState(product.type === '');
  const [showCustomCoverage, setShowCustomCoverage] = useState(false);
  const [customCoverage, setCustomCoverage] = useState({ name: '', value: '' });
  const [customCoverageError, setCustomCoverageError] = useState('');
  const [form, setForm] = useState<{
    type: string;
    carrier: string;
    portal: string;
    premium: string;
    effective: string;
    deductible: string;
    dwelling: string;
    otherStructures: string;
    personalProperty: string;
    lossOfUse: string;
    personalLiability: string;
    medicalPayments: string;
    included: string[];
    includedAmounts: { [k: string]: string };
    excluded: string[];
    downpayment?: string;
    monthlyPayment?: string;
    biPerson: string;
    biAccident: string;
    biProperty: string;
    umPerson: string;
    umAccident: string;
    umProperty: string;
    paymentType: string;
    period: string;
    umpd?: string;
    pip?: string;
    medPay?: string;
  }>({
    type: product.type || '',
    carrier: product.type === 'home' ? 'Foremost' : (product.type === 'auto' ? 'Progressive' : ''),
    portal: 'https://recommendations-engine-live.matic.com/quoting/bridge?...',
    premium: product.type === 'home' ? '1480' : (product.type === 'auto' ? '980' : ''),
    effective: '2025-05-01',
    deductible: '$1,000',
    dwelling: '$356,000',
    otherStructures: '$35,600',
    personalProperty: '$178,000',
    lossOfUse: '$71,200',
    personalLiability: '$300,000',
    medicalPayments: '$5,000',
    included: ['Wind/Hail'],
    includedAmounts: { 'Wind/Hail': '5000' },
    excluded: [],
    downpayment: '',
    monthlyPayment: '',
    biPerson: '$25,000',
    biAccident: '$50,000',
    biProperty: '$25,000',
    umPerson: '$25,000',
    umAccident: '$50,000',
    umProperty: '$25,000',
    paymentType: 'Installments',
    period: '6 months',
    umpd: '',
    pip: '',
    medPay: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [selectedIncluded, setSelectedIncluded] = useState('');
  const [selectedExcluded, setSelectedExcluded] = useState<string[]>([]);
  const [excludedDropdownOpen, setExcludedDropdownOpen] = useState(false);
  const [detailsToShow, setDetailsToShow] = useState<SelectedDetails>({
    price: product.type === 'home' ? '$1,480' : (product.type === 'auto' ? '$980' : '$0'),
    company: product.type === 'home' ? 'Foremost' : (product.type === 'auto' ? 'Progressive' : ''),
    deductible: '$1,000',
    address: product.address,
    portalLink: 'https://recommendations-engine-live.matic.com/quoting/bridge?...',
    premium: product.type === 'home' ? '$1,480' : (product.type === 'auto' ? '$980' : '$0'),
    effectiveDate: '05/01/2025',
    coverages: {
      dwelling: '$356,000',
      otherStructures: '$35,600',
      personalProperty: '$178,000',
      lossOfUse: '$71,200',
      personalLiability: '$300,000',
      medicalPayments: '$5,000',
      liability: product.type === 'auto' ? '$25,000/$50,000/$25,000' : undefined,
      uninsuredMotorist: product.type === 'auto' ? '$25,000/$50,000/$25,000' : undefined,
    },
    included: ['Wind/Hail – $5,000'],
    excluded: [],
  });
  const initialVehicles = [
    { id: 1, name: '2017 Ford Explorer XLT' },
    { id: 2, name: '2021 Mercedes-benz A-class' },
  ];
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [deletedVehicle, setDeletedVehicle] = useState<null | { id: number; name: string }>(null);
  // Multi-select state for each vehicle
  const [vehicleIncluded, setVehicleIncluded] = useState<{ [id: number]: string[] }>({});
  const [vehicleExcluded, setVehicleExcluded] = useState<{ [id: number]: string[] }>({});
  // Add state for applySameCoverage
  const [applySameCoverage, setApplySameCoverage] = useState(true);
  // Add state for vehicle deductibles
  const [vehicleDeductibles, setVehicleDeductibles] = useState<{ [id: number]: { collision: string; comprehensive: string } }>(
    Object.fromEntries(initialVehicles.map(v => [v.id, { collision: DEDUCTIBLE_OPTIONS[0], comprehensive: DEDUCTIBLE_OPTIONS[0] }]))
  );
  // In InsuranceProductCard, add state for custom coverage form outside the dropdown
  const [customCoverageForm, setCustomCoverageForm] = useState({ name: '', value: '', open: false });
  const customCoverageInputRef = useRef<HTMLInputElement>(null);
  // Track if the user has manually edited the field
  const [monthlyEdited, setMonthlyEdited] = useState(false);
  // Add state for custom included and excluded coverage input for home
  const [customIncluded, setCustomIncluded] = useState<{ name: string; amount: string; open: boolean }>({ name: '', amount: '', open: false });
  const [customExcluded, setCustomExcluded] = useState<{ name: string; open: boolean }>({ name: '', open: false });
  // Add per-vehicle state for custom included/excluded coverage input for auto
  const [vehicleCustomIncluded, setVehicleCustomIncluded] = useState<{ [id: number]: { name: string; amount: string; open: boolean } }>({});
  const [vehicleCustomExcluded, setVehicleCustomExcluded] = useState<{ [id: number]: { name: string; open: boolean } }>({});

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  // Calculation logic for default values
  useEffect(() => {
    // Only update calculated fields if not editing them
    setForm(f => {
      const dwelling = parseFloat(f.dwelling.replace(/[^\d.]/g, '')) || 0;
      return {
        ...f,
        otherStructures: dwelling ? (dwelling * 0.1).toFixed(0) : f.otherStructures,
        personalProperty: dwelling ? (dwelling * 0.5).toFixed(0) : f.personalProperty,
        lossOfUse: dwelling ? (dwelling * 0.2).toFixed(0) : f.lossOfUse,
      };
    });
  }, [form.dwelling]);

  useEffect(() => {
    if (!monthlyEdited && form.paymentType === 'Installments' && form.period && form.premium && form.downpayment) {
      const months = form.period === '6 months' ? 6 : 12;
      const premium = parseFloat(form.premium.replace(/[$,]/g, ''));
      const down = parseFloat(form.downpayment.replace(/[$,]/g, ''));
      if (!isNaN(premium) && !isNaN(down) && months > 1) {
        const monthly = (premium - down) / (months - 1);
        setForm(f => ({ ...f, monthlyPayment: monthly > 0 ? monthly.toFixed(2) : '' }));
      }
    }
    // Reset manual edit if premium/period/downpayment changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.paymentType, form.period, form.premium, form.downpayment]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSave = () => {
    const newErrors: { [key: string]: string } = {};
    if (!form.carrier) newErrors.carrier = 'Required';
    if (!form.premium) newErrors.premium = 'Required';
    if (!form.effective) newErrors.effective = 'Required';
    if (product.type === 'home') {
      if (!form.deductible) newErrors.deductible = 'Required';
      if (!form.dwelling) newErrors.dwelling = 'Required';
      if (!form.otherStructures) newErrors.otherStructures = 'Required';
      if (!form.personalProperty) newErrors.personalProperty = 'Required';
      if (!form.lossOfUse) newErrors.lossOfUse = 'Required';
      if (!form.personalLiability) newErrors.personalLiability = 'Required';
      if (!form.medicalPayments) newErrors.medicalPayments = 'Required';
    }
    if (product.type === 'auto') {
      if (!form.period) newErrors.period = 'Required';
      if (!form.paymentType) newErrors.paymentType = 'Required';
      if (form.paymentType === 'Installments' && !form.downpayment) newErrors.downpayment = 'Required';
      if (form.paymentType === 'Installments' && !form.monthlyPayment) newErrors.monthlyPayment = 'Required';
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    let details: SelectedDetails;
    if (product.type === 'home') {
      details = {
        price: `$${form.premium}`,
        company: form.carrier,
        deductible: `$${form.deductible}`,
        address: product.address,
        portalLink: form.portal,
        premium: `$${form.premium}`,
        effectiveDate: toDisplayDate(form.effective),
        coverages: {
          dwelling: `$${form.dwelling}`,
          otherStructures: `$${form.otherStructures}`,
          personalProperty: `$${form.personalProperty}`,
          lossOfUse: `$${form.lossOfUse}`,
          personalLiability: `$${form.personalLiability}`,
          medicalPayments: `$${form.medicalPayments}`,
        },
        included: form.included.map(c => `${c} – $${form.includedAmounts[c] || ''}`),
        excluded: form.excluded,
      };
    } else {
      details = {
        price: `$${form.premium}`,
        company: form.carrier,
        deductible: '', // TODO: add auto-specific logic if needed
        address: product.address,
        portalLink: form.portal,
        premium: `$${form.premium}`,
        effectiveDate: toDisplayDate(form.effective),
        coverages: {
          dwelling: '',
          otherStructures: '',
          personalProperty: '',
          lossOfUse: '',
          personalLiability: '',
          medicalPayments: '',
          liability: `$${form.biPerson}/${form.biAccident}/${form.biProperty}`,
          uninsuredMotorist: `$${form.umPerson}/${form.umAccident}/${form.umProperty}`,
        },
        included: [],
        excluded: [],
      };
    }
    setDetailsToShow(details);
    onSaveDetails(product.id, details);
    setEditOpen(false);
  };

  const handleAddCustomCoverage = () => {
    if (!customCoverage.name.trim() || !customCoverage.value.trim()) {
      setCustomCoverageError('Both fields are required');
      return;
    }
    setForm(f => ({
      ...f,
      included: [...f.included, customCoverage.name],
      includedAmounts: { ...f.includedAmounts, [customCoverage.name]: customCoverage.value },
    }));
    setCustomCoverage({ name: '', value: '' });
    setShowCustomCoverage(false);
    setCustomCoverageError('');
  };

  const handleIncludedAmountChange = (coverage: string, value: string) => {
    setForm(f => ({
      ...f,
      includedAmounts: { ...f.includedAmounts, [coverage]: value },
    }));
  };

  const handleExcludedSelect = (val: string) => {
    setSelectedExcluded(prev =>
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
    );
  };

  return (
    <S.Card style={editOpen ? { border: '2px solid #1976d2', background: '#f8fbff' } : {}}>
      <S.CardHeader
        style={editOpen && product.type === '' ? { background: '#f7f9fc', borderRadius: '12px 12px 0 0', border: '1.5px solid #1976d2', borderBottom: 'none', padding: '28px 32px 0 32px', minHeight: 64 } : { cursor: 'pointer', userSelect: 'none', padding: '28px 32px 0 32px', minHeight: 64 }}
        onClick={() => {
          if (!editOpen) setExpanded(exp => !exp);
        }}
      >
        <S.HeaderLeft style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontWeight: 700, fontSize: 20, color: '#111' }}>
            {editOpen && product.type === '' ? 'Add insurance product' : product.label}
          </span>
          {/* Always show premium and carrier */}
          {product.selectedQuote && !editOpen && (
            <span style={{ fontWeight: 400, fontSize: 16, color: '#444', marginLeft: 16 }}>
              {detailsToShow.company} &bull; {formatMoney(detailsToShow.premium)}
            </span>
          )}
        </S.HeaderLeft>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {!editOpen && (
            <span style={{ transition: 'transform 0.2s', display: 'flex', alignItems: 'center', fontSize: 28, transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              <ChevronDownIcon />
            </span>
          )}
          {editOpen && (
            <button
              onClick={e => { e.stopPropagation(); setEditOpen(false); }}
              style={{ background: 'none', border: 'none', fontSize: 28, cursor: 'pointer', color: '#222', padding: 0, marginLeft: 12 }}
              aria-label="Close"
            >
              ×
            </button>
          )}
        </div>
      </S.CardHeader>
      {expanded && (
        <S.ContentSection>
          {!product.selectedQuote && !editOpen && (
            <>
              <S.QuoteButtonsContainer>
                <S.SelectQuoteButton
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  disabled={!!product.selectedQuote}
                >
                  {product.selectedQuote ? 'Quote selected' : 'Select quote'} {!product.selectedQuote && <ChevronDownIcon />}
                </S.SelectQuoteButton>
              </S.QuoteButtonsContainer>
              <S.DropdownWrapper ref={dropdownRef}>
                {dropdownOpen && !product.selectedQuote && (
                  <S.DropdownContainer>
                    {product.quotes.map((option) => (
                      <S.DropdownOption
                        key={option.id}
                        onClick={() => {
                          onSelectQuote(product.id, option);
                          setDropdownOpen(false);
                        }}
                      >
                        <S.DropdownLeft>
                          <S.DropdownDeductible>Deductible: {option.deductible}</S.DropdownDeductible>
                          <S.DropdownLogo src={option.logo} alt={option.company} />
                        </S.DropdownLeft>
                        <S.DropdownRight>
                          <S.DropdownUpdated>Updated {option.updated}</S.DropdownUpdated>
                          <S.DropdownPrice>{option.price}</S.DropdownPrice>
                        </S.DropdownRight>
                      </S.DropdownOption>
                    ))}
                    <S.DropdownOption
                      style={{ color: '#156eea', fontWeight: 500, justifyContent: 'flex-start' }}
                      onClick={() => {
                        // Placeholder for manual entry logic
                        setDropdownOpen(false);
                      }}
                    >
                      Enter manually
                    </S.DropdownOption>
                  </S.DropdownContainer>
                )}
              </S.DropdownWrapper>
            </>
          )}
          {product.selectedQuote && expanded && !editOpen && (
            <>
              {product.type === 'auto' ? (
                <>
                  {/* Carrier Portal Link */}
                  <S.SectionTitle style={{ marginTop: 16 }}>Carrier Portal Link</S.SectionTitle>
                  <S.PortalLink href={detailsToShow.portalLink} target="_blank">
                    {detailsToShow.portalLink} <ExternalLinkIcon />
                  </S.PortalLink>
                  {/* Insured drivers (mock for now) */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '24px 0 0 0', fontWeight: 600, fontSize: 18 }}>
                    <span>Insured drivers</span>
                    <span>Elliot McMahon, Jennifer McMahon</span>
                  </div>
                  {/* Payment info */}
                  <S.InfoBox>
                    <S.InfoBoxTitle>Payment info</S.InfoBoxTitle>
                    <S.InfoGrid>
                      <S.InfoItem>
                        <S.InfoLabel>Down Payment</S.InfoLabel>
                        <S.InfoValue>$295.77</S.InfoValue>
                      </S.InfoItem>
                      <S.InfoItem>
                        <S.InfoLabel>Monthly Payment</S.InfoLabel>
                        <S.InfoValue>$154.46</S.InfoValue>
                      </S.InfoItem>
                      <S.InfoItem>
                        <S.InfoLabel>Total premium (6 months)</S.InfoLabel>
                        <S.InfoValue>$980</S.InfoValue>
                      </S.InfoItem>
                      <S.InfoItem>
                        <S.InfoLabel>Effective date</S.InfoLabel>
                        <S.InfoValue>05/01/2025</S.InfoValue>
                      </S.InfoItem>
                    </S.InfoGrid>
                  </S.InfoBox>
                  {/* Coverage details as two-column grid */}
                  <S.CoverageTitle>Coverage details</S.CoverageTitle>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                    <div style={{ fontWeight: 600 }}>Liability</div>
                    <div style={{ textAlign: 'right', fontWeight: 700 }}>{detailsToShow.coverages.liability || '-'}</div>
                    <div style={{ color: '#444', fontSize: 15 }}>Bodily injury each person/each accident/property damage</div>
                    <div></div>
                    <div style={{ fontWeight: 600 }}>Uninsured motorist</div>
                    <div style={{ textAlign: 'right', fontWeight: 700 }}>{detailsToShow.coverages.uninsuredMotorist || '-'}</div>
                    <div style={{ color: '#444', fontSize: 15 }}>Bodily injury each person/each accident/property damage</div>
                    <div></div>
                    <div style={{ fontWeight: 600 }}>Medical payments</div>
                    <div style={{ textAlign: 'right', fontWeight: 700 }}>$5,000</div>
                  </div>
                  {/* Per-vehicle breakdown (mock for now) */}
                  <div style={{ fontWeight: 700, fontSize: 17, margin: '24px 0 8px 0' }}>2017 Ford Explorer XLT <span style={{ background: '#ede7f6', color: '#7c4dff', borderRadius: 12, padding: '2px 12px', fontSize: 14, marginLeft: 8 }}>Vehicle 1</span></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 8 }}>
                    <div style={{ color: '#444', fontSize: 15 }}>Collision/Comprehensive deductibles</div>
                    <div style={{ textAlign: 'right', fontWeight: 700 }}>$500/$500</div>
                  </div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Coverages included</div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <span style={{ background: '#e8f5e9', color: '#2e7d32', borderRadius: 16, padding: '6px 12px', fontWeight: 500 }}>Roadside assistance coverage</span>
                  </div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Coverages excluded</div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    <span style={{ background: '#ffebee', color: '#c62828', borderRadius: 16, padding: '6px 12px', fontWeight: 500 }}>Full glass</span>
                    <span style={{ background: '#ffebee', color: '#c62828', borderRadius: 16, padding: '6px 12px', fontWeight: 500 }}>Rental car reimbursement</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 17, margin: '24px 0 8px 0' }}>2008 Chevrolet Impala 231 <span style={{ background: '#ede7f6', color: '#7c4dff', borderRadius: 12, padding: '2px 12px', fontSize: 14, marginLeft: 8 }}>Vehicle 2</span></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 8 }}>
                    <div style={{ color: '#444', fontSize: 15 }}>Collision/Comprehensive deductibles</div>
                    <div style={{ textAlign: 'right', fontWeight: 700 }}>$500/$500</div>
                  </div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Coverages included</div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <span style={{ background: '#e8f5e9', color: '#2e7d32', borderRadius: 16, padding: '6px 12px', fontWeight: 500 }}>Roadside assistance coverage</span>
                  </div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Coverages excluded</div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    <span style={{ background: '#ffebee', color: '#c62828', borderRadius: 16, padding: '6px 12px', fontWeight: 500 }}>Full glass</span>
                    <span style={{ background: '#ffebee', color: '#c62828', borderRadius: 16, padding: '6px 12px', fontWeight: 500 }}>Rental car reimbursement</span>
                  </div>
                  {/* Edit button bottom right */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
                    <S.EditButton onClick={() => setEditOpen(true)}>
                      <EditIcon /> Edit
                    </S.EditButton>
                  </div>
                </>
              ) : (
                <>
                  <S.SectionTitle style={{ marginTop: 16 }}>Carrier Portal Link</S.SectionTitle>
                  <S.PortalLink href={detailsToShow.portalLink} target="_blank">
                    {detailsToShow.portalLink} <ExternalLinkIcon />
                  </S.PortalLink>
                  <S.InfoBox>
                    <S.InfoBoxTitle>Payment info</S.InfoBoxTitle>
                    <S.InfoGrid>
                      <S.InfoItem>
                        <S.InfoLabel>Total premium (12 months)</S.InfoLabel>
                        <S.InfoValue>{detailsToShow.premium}</S.InfoValue>
                      </S.InfoItem>
                      <S.InfoItem>
                        <S.InfoLabel>Effective date</S.InfoLabel>
                        <S.InfoValue>{detailsToShow.effectiveDate}</S.InfoValue>
                      </S.InfoItem>
                    </S.InfoGrid>
                  </S.InfoBox>
                  <S.CoverageTitle>Coverage details</S.CoverageTitle>
                  <S.CoverageGrid>
                    <S.CoverageLabel>
                      <S.StarBadge>⭐</S.StarBadge>
                      <div>Deductible</div>
                    </S.CoverageLabel>
                    <S.CoverageValue>{formatMoney(detailsToShow.deductible)}</S.CoverageValue>
                    <S.CoverageLabel>
                      <S.CoverageBadge>A</S.CoverageBadge>
                      <S.CoverageText>Dwelling</S.CoverageText>
                    </S.CoverageLabel>
                    <S.CoverageValue><span>{formatMoney(detailsToShow.coverages.dwelling)}</span></S.CoverageValue>
                    <S.CoverageLabel>
                      <S.CoverageBadge>B</S.CoverageBadge>
                      <S.CoverageText>Other structures <S.SubText>(10%)</S.SubText></S.CoverageText>
                    </S.CoverageLabel>
                    <S.CoverageValue><span>{formatMoney(detailsToShow.coverages.otherStructures)}</span></S.CoverageValue>
                    <S.CoverageLabel>
                      <S.CoverageBadge>C</S.CoverageBadge>
                      <S.CoverageText>Personal property <S.SubText>(50%)</S.SubText></S.CoverageText>
                    </S.CoverageLabel>
                    <S.CoverageValue><span>{formatMoney(detailsToShow.coverages.personalProperty)}</span></S.CoverageValue>
                    <S.CoverageLabel>
                      <S.CoverageBadge>D</S.CoverageBadge>
                      <S.CoverageText>Loss of use <S.SubText>(20% of A)</S.SubText></S.CoverageText>
                    </S.CoverageLabel>
                    <S.CoverageValue><span>{formatMoney(detailsToShow.coverages.lossOfUse)}</span></S.CoverageValue>
                    <S.CoverageLabel>
                      <S.CoverageBadge>E</S.CoverageBadge>
                      <S.CoverageText>Personal liability</S.CoverageText>
                    </S.CoverageLabel>
                    <S.CoverageValue><span>{formatMoney(detailsToShow.coverages.personalLiability)}</span></S.CoverageValue>
                    <S.CoverageLabel>
                      <S.CoverageBadge>F</S.CoverageBadge>
                      <S.CoverageText>Medical payment</S.CoverageText>
                    </S.CoverageLabel>
                    <S.CoverageValue><span>{formatMoney(detailsToShow.coverages.medicalPayments)}</span></S.CoverageValue>
                  </S.CoverageGrid>
                  <S.CoverageTitle>Coverage included</S.CoverageTitle>
                  <S.TagsContainer>
                    {detailsToShow.included && detailsToShow.included.length > 0 &&
                      detailsToShow.included.map((item, index) => (
                        <S.IncludedTag key={index}>{item}</S.IncludedTag>
                      ))}
                  </S.TagsContainer>
                  <S.CoverageTitle>Coverages excluded</S.CoverageTitle>
                  <S.TagsContainer>
                    {detailsToShow.excluded.map((item, index) => (
                      <S.ExcludedTag key={index}>{item}</S.ExcludedTag>
                    ))}
                  </S.TagsContainer>
                  <S.EditButton onClick={() => setEditOpen(true)}>
                    <EditIcon /> Edit
                  </S.EditButton>
                </>
              )}
            </>
          )}
          {product.selectedQuote && expanded && editOpen && (
            <S.EditFormContainer style={{ padding: 24, background: '#f7f9fc', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              {/* Section Title */}
              <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 20 }}>{product.type === '' ? 'Add insurance product' : product.label}</div>
              {/* Product Info Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 15, marginBottom: 4 }}>Product type</div>
                  <input
                    name="type"
                    value={form.type || ''}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    placeholder=""
                    style={{ ...fieldStyle, background: '#fff' }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 15, marginBottom: 4 }}>Carrier</div>
                  <select name="carrier" value={form.carrier} onChange={handleInput} style={{ ...fieldStyle, background: '#fff' }} required>
                    <option value="">Select</option>
                    {[...CARRIER_OPTIONS, ...AUTO_CARRIER_OPTIONS].map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: '1/3' }}>
                  <div style={{ fontSize: 15, marginBottom: 4 }}>Carrier portal URL</div>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 12, top: 10, color: '#888' }}><ExternalLinkIcon /></span>
                    <input
                      name="portal"
                      value={form.portal}
                      onChange={handleInput}
                      placeholder="Select"
                      style={{ ...fieldStyle, background: '#fff', paddingLeft: 36 }}
                    />
                  </div>
                </div>
              </div>
              {/* Divider */}
              <div style={{ borderTop: '1px solid #e0e4ea', margin: '20px 0' }} />
              {/* Payment Details Title */}
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Payment details</div>
              {/* Payment Details Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 15, marginBottom: 4 }}>Premium (full period) <span style={{ color: 'red' }}>*</span></div>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 12, top: 10, color: '#888', fontWeight: 700 }}>$</span>
                    <input
                      name="premium"
                      value={form.premium}
                      onChange={handleInput}
                      placeholder="000,00.00"
                      style={{ ...fieldStyle, background: '#fff', paddingLeft: 32 }}
                      required
                    />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 15, marginBottom: 4 }}>Effective date <span style={{ color: 'red' }}>*</span></div>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 12, top: 10, color: '#888' }}><CalendarIcon /></span>
                    <input
                      name="effective"
                      value={form.effective}
                      onChange={handleInput}
                      type="date"
                      placeholder="mm/dd/yyyy"
                      style={{ ...fieldStyle, background: '#fff', paddingLeft: 36 }}
                      required
                    />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 15, marginBottom: 4 }}>Period <span style={{ color: 'red' }}>*</span></div>
                  <select name="period" value={form.period} onChange={handleInput} style={{ ...fieldStyle, background: '#fff' }} required>
                    <option value="6 months">6 month</option>
                    <option value="12 months">12 month</option>
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 15, marginBottom: 4 }}>Payment type <span style={{ color: 'red' }}>*</span></div>
                  <select name="paymentType" value={form.paymentType} onChange={handleInput} style={{ ...fieldStyle, background: '#fff' }} required>
                    <option value="Installments">Installments</option>
                    <option value="Full payment">Full payment</option>
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 15, marginBottom: 4 }}>First month <span style={{ color: 'red' }}>*</span></div>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 12, top: 10, color: '#888', fontWeight: 700 }}>$</span>
                    <input name="downpayment" value={form.downpayment || ''} onChange={handleInput} placeholder="000,00.00" style={{ ...fieldStyle, background: '#fff', paddingLeft: 32 }} required />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 15, marginBottom: 4 }}>Monthly Payment <span style={{ color: 'red' }}>*</span></div>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 12, top: 10, color: '#888', fontWeight: 700 }}>$</span>
                    <input name="monthlyPayment" value={form.monthlyPayment || ''} onChange={e => { setForm(f => ({ ...f, monthlyPayment: e.target.value })); setMonthlyEdited(true); }} placeholder="000,00.00" style={{ ...fieldStyle, background: '#fff', paddingLeft: 32 }} required />
                  </div>
                </div>
              </div>
              {/* Coverage Details */}
              {product.type === 'home' && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>Coverage details</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 14 }}>Deductible<span style={{ color: 'red' }}>*</span></div>
                      <input name="deductible" value={form.deductible} onChange={handleInput} style={fieldStyle} required />
                    </div>
                    <div>
                      <div style={{ fontSize: 14 }}>Dwelling<span style={{ color: 'red' }}>*</span></div>
                      <input name="dwelling" value={form.dwelling} onChange={handleInput} style={fieldStyle} required />
                    </div>
                    <div>
                      <div style={{ fontSize: 14 }}>Other structures (10%)<span style={{ color: 'red' }}>*</span></div>
                      <input name="otherStructures" value={form.otherStructures} onChange={handleInput} style={fieldStyle} required />
                    </div>
                    <div>
                      <div style={{ fontSize: 14 }}>Personal property (50%)<span style={{ color: 'red' }}>*</span></div>
                      <input name="personalProperty" value={form.personalProperty} onChange={handleInput} style={fieldStyle} required />
                    </div>
                    <div>
                      <div style={{ fontSize: 14 }}>Loss of use (20%)<span style={{ color: 'red' }}>*</span></div>
                      <input name="lossOfUse" value={form.lossOfUse} onChange={handleInput} style={fieldStyle} required />
                    </div>
                    <div>
                      <div style={{ fontSize: 14 }}>Personal liability<span style={{ color: 'red' }}>*</span></div>
                      <input name="personalLiability" value={form.personalLiability} onChange={handleInput} style={fieldStyle} required />
                    </div>
                    <div>
                      <div style={{ fontSize: 14 }}>Medical payments<span style={{ color: 'red' }}>*</span></div>
                      <input name="medicalPayments" value={form.medicalPayments} onChange={handleInput} style={fieldStyle} required />
                    </div>
                  </div>
                  {/* Additional coverages included (multi-select with amount) */}
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Additional coverages included</div>
                    <MultiSelectDropdown
                      options={COVERAGE_OPTIONS.filter(opt => !form.included.includes(opt))}
                      selected={form.included}
                      onChange={opts => setForm(f => ({ ...f, included: opts }))}
                      placeholder="Select coverages"
                      onAddCoverageClick={name => {
                        setCustomIncluded({ name: name || '', amount: '', open: true });
                      }}
                    />
                    {/* Custom included coverage input row */}
                    {customIncluded.open && (
                      <div style={{ marginTop: 8, background: '#fff', border: '1px solid #e0e0e0', borderRadius: 10, padding: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input
                            type="text"
                            value={customIncluded.name}
                            onChange={e => setCustomIncluded(ci => ({ ...ci, name: e.target.value }))}
                            placeholder="Coverage name"
                            style={{ ...fieldStyle, width: 180 }}
                          />
                          <input
                            type="number"
                            min={0}
                            value={customIncluded.amount}
                            onChange={e => setCustomIncluded(ci => ({ ...ci, amount: e.target.value }))}
                            placeholder="Amount"
                            style={{ ...fieldStyle, width: 120 }}
                          />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                          <button
                            type="button"
                            style={{ background: 'none', color: '#c62828', border: 'none', borderRadius: 8, padding: '8px 12px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}
                            onClick={() => setCustomIncluded({ name: '', amount: '', open: false })}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}
                            onClick={() => {
                              if (!customIncluded.name.trim() || !customIncluded.amount.trim()) return;
                              setForm(f => ({
                                ...f,
                                included: f.included.includes(customIncluded.name) ? f.included : [...f.included, customIncluded.name],
                                includedAmounts: { ...f.includedAmounts, [customIncluded.name]: customIncluded.amount },
                              }));
                              setCustomIncluded({ name: '', amount: '', open: false });
                            }}
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    )}
                    {/* Amounts for each included coverage */}
                    {form.included.map(cov => (
                      <div key={cov} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                        <span style={{ minWidth: 120 }}>{cov}</span>
                        <input
                          type="number"
                          min={0}
                          value={form.includedAmounts[cov] || ''}
                          onChange={e => handleIncludedAmountChange(cov, e.target.value)}
                          placeholder="Amount"
                          style={fieldStyle}
                          required
                        />
                      </div>
                    ))}
                  </div>
                  {/* Coverages excluded (multi-select) */}
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Coverages excluded</div>
                    <MultiSelectDropdown
                      options={COVERAGE_OPTIONS.filter(opt => !form.excluded.includes(opt))}
                      selected={form.excluded}
                      onChange={opts => setForm(f => ({ ...f, excluded: opts }))}
                      placeholder="Select coverages"
                      onAddCoverageClick={name => {
                        setCustomExcluded({ name: name || '', open: true });
                      }}
                    />
                  </div>
                </div>
              )}
              {product.type === 'auto' && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', padding: '20px 0 0 0', fontWeight: 700, fontSize: 22 }}>
                    <span style={{ fontWeight: 700, fontSize: 22 }}>Vehicle coverages</span>
                    <span style={{ fontWeight: 400, fontSize: 16, marginLeft: 18, color: '#222' }}>Apply the same coverage for each vehicle</span>
                    <label style={{ marginLeft: 12 }}>
                      <input type="checkbox" checked={applySameCoverage} onChange={e => setApplySameCoverage(e.target.checked)} style={{ width: 0, height: 0, opacity: 0, position: 'absolute' }} />
                      <span style={{ display: 'inline-block', width: 44, height: 24, background: applySameCoverage ? '#1976d2' : '#ccc', borderRadius: 12, position: 'relative', verticalAlign: 'middle', transition: 'background 0.2s', marginLeft: 4, cursor: 'pointer' }}>
                        <span style={{ position: 'absolute', left: applySameCoverage ? 22 : 2, top: 2, width: 20, height: 20, background: '#fff', borderRadius: '50%', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', transition: 'left 0.2s' }} />
                      </span>
                    </label>
                  </div>
                  <div style={{ padding: '0 0 24px 0' }}>
                    {vehicles.map((vehicle, idx) => (
                      <div key={vehicle.id} style={{ background: '#fff', borderRadius: 12, margin: '24px 0 0 0', padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.03)', border: '1px solid #e0e4ea', position: 'relative' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                          <span style={{ fontWeight: 700, fontSize: 20 }}>{vehicle.name}</span>
                          <button
                            type="button"
                            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#c62828', fontSize: 26, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                            onClick={() => setVehicles(vs => vs.filter(v => v.id !== vehicle.id))}
                            aria-label="Remove vehicle"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                        <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
                          <div style={{ flex: 1 }}>
                            <div>Collision deductible<span style={{ color: 'red' }}>*</span></div>
                            <div style={{ position: 'relative' }}>
                              <span style={{ position: 'absolute', left: 12, top: 10, color: '#888', fontWeight: 700 }}>$</span>
                              <select
                                value={applySameCoverage && idx > 0 ? vehicleDeductibles[vehicles[0].id]?.collision : vehicleDeductibles[vehicle.id]?.collision}
                                onChange={e => {
                                  const value = e.target.value;
                                  if (applySameCoverage) {
                                    const firstId = vehicles[0].id;
                                    setVehicleDeductibles(vd => {
                                      const updated = { ...vd };
                                      vehicles.forEach(vh => { updated[vh.id] = { ...updated[vh.id], collision: value }; });
                                      return updated;
                                    });
                                  } else {
                                    setVehicleDeductibles(vd => ({ ...vd, [vehicle.id]: { ...vd[vehicle.id], collision: value } }));
                                  }
                                }}
                                style={{ ...fieldStyle, paddingLeft: 32 }}
                                required
                                disabled={applySameCoverage && idx > 0}
                              >
                                {DEDUCTIBLE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt.replace('$', '')}</option>)}
                              </select>
                            </div>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div>Comprehensive deductible<span style={{ color: 'red' }}>*</span></div>
                            <div style={{ position: 'relative' }}>
                              <span style={{ position: 'absolute', left: 12, top: 10, color: '#888', fontWeight: 700 }}>$</span>
                              <select
                                value={applySameCoverage && idx > 0 ? vehicleDeductibles[vehicles[0].id]?.comprehensive : vehicleDeductibles[vehicle.id]?.comprehensive}
                                onChange={e => {
                                  const value = e.target.value;
                                  if (applySameCoverage) {
                                    const firstId = vehicles[0].id;
                                    setVehicleDeductibles(vd => {
                                      const updated = { ...vd };
                                      vehicles.forEach(vh => { updated[vh.id] = { ...updated[vh.id], comprehensive: value }; });
                                      return updated;
                                    });
                                  } else {
                                    setVehicleDeductibles(vd => ({ ...vd, [vehicle.id]: { ...vd[vehicle.id], comprehensive: value } }));
                                  }
                                }}
                                style={{ ...fieldStyle, paddingLeft: 32 }}
                                required
                                disabled={applySameCoverage && idx > 0}
                              >
                                {DEDUCTIBLE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt.replace('$', '')}</option>)}
                              </select>
                            </div>
                          </div>
                        </div>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>Coverages included</div>
                        <MultiSelectDropdown
                          options={VEHICLE_INCLUDED_COVERAGES.filter(opt => !(vehicleIncluded[vehicle.id] || []).includes(opt))}
                          selected={applySameCoverage && idx > 0 ? (vehicleIncluded[vehicles[0].id] || []) : (vehicleIncluded[vehicle.id] || [])}
                          onChange={opts => {
                            if (applySameCoverage) {
                              const firstId = vehicles[0].id;
                              setVehicleIncluded(v => {
                                const updated = { ...v, [firstId]: opts };
                                vehicles.forEach(vh => { updated[vh.id] = opts; });
                                return updated;
                              });
                            } else {
                              setVehicleIncluded(v => ({ ...v, [vehicle.id]: opts }));
                            }
                          }}
                          placeholder="Select"
                          disabled={applySameCoverage && idx > 0}
                        />
                        <div style={{ fontWeight: 600, marginBottom: 4, marginTop: 16 }}>Coverages excluded</div>
                        <MultiSelectDropdown
                          options={VEHICLE_EXCLUDED_COVERAGES.filter(opt => !(vehicleExcluded[vehicle.id] || []).includes(opt))}
                          selected={applySameCoverage && idx > 0 ? (vehicleExcluded[vehicles[0].id] || []) : (vehicleExcluded[vehicle.id] || [])}
                          onChange={opts => {
                            if (applySameCoverage) {
                              const firstId = vehicles[0].id;
                              setVehicleExcluded(v => {
                                const updated = { ...v, [firstId]: opts };
                                vehicles.forEach(vh => { updated[vh.id] = opts; });
                                return updated;
                              });
                            } else {
                              setVehicleExcluded(v => ({ ...v, [vehicle.id]: opts }));
                            }
                          }}
                          placeholder="Select"
                          disabled={applySameCoverage && idx > 0}
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}
              {form.type && form.type !== 'home' && form.type !== 'auto' && (
                <div style={{ marginBottom: 24 }}>
                  {/* ...new flexible UI for non-standard products... */}
                </div>
              )}
              {/* Save/Discard buttons as before */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
                <S.SaveButton onClick={handleSave}>Save</S.SaveButton>
              </div>
            </S.EditFormContainer>
          )}
        </S.ContentSection>
      )}
    </S.Card>
  );
};

export default InsuranceProductCard; 