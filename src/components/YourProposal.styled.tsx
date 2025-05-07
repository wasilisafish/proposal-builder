import styled from 'styled-components';

// Move all styled-components from YourProposal.tsx here
// Example:
export const Container = styled.div`
  width: 100%;
  max-width: 860px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
`;

export const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

export const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
`;

export const StatusChip = styled.span`
  background: #FFF9E5;
  color: #B89A00;
  font-size: 0.9rem;
  font-weight: 600;
  border-radius: 8px;
  padding: 2px 12px;
  margin-left: 12px;
`;

export const SelectProposal = styled.button`
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 1rem;
  font-weight: 500;
  color: #333;
  display: flex;
  align-items: center;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
`;

export const Card = styled.div`
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  overflow: visible;
  margin-bottom: 16px;
`;

export const CardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #eee;
`;

export const HeaderLeft = styled.div`
  display: flex;
  flex-direction: column;
`;

export const HeaderTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.25rem;
  font-weight: 700;
  color: #000;
`;

export const HeaderAddress = styled.div`
  color: #666;
  font-size: 1rem;
  margin-top: 4px;
`;

export const HeaderRight = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
`;

export const Price = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
`;

export const CompanyName = styled.div`
  font-size: 1.25rem;
  font-weight: 700;
`;

export const CollapseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 4px;
`;

export const ContentSection = styled.div`
  padding: 16px;
`;

export const SectionTitle = styled.div`
  font-size: 1rem;
  color: #666;
  margin-bottom: 4px;
`;

export const PortalLink = styled.a`
  color: #4285F4;
  text-decoration: none;
  font-size: 1rem;
  display: flex;
  align-items: center;
  margin-top: 4px;

  &:hover {
    text-decoration: underline;
  }
`;

export const InfoBox = styled.div`
  background: #f5f5f5;
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
`;

export const InfoBoxTitle = styled.div`
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 16px;
`;

export const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
`;

export const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
`;

export const InfoLabel = styled.div`
  font-size: 1rem;
  color: #333;
`;

export const InfoValue = styled.div`
  font-size: 1.125rem;
  font-weight: 700;
  color: #000;
`;

export const CoverageTitle = styled.div`
  font-size: 1.25rem;
  font-weight: 700;
  margin: 24px 0 16px;
`;

export const CoverageGrid = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px 16px;
  margin-bottom: 16px;
`;

export const CoverageLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const CoverageBadge = styled.div`
  background: #e8e3f7;
  color: #674ea7;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
`;

export const StarBadge = styled.div`
  background: #fff9e5;
  color: #f9a825;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
`;

export const CoverageText = styled.div`
  color: #222;
  font-size: 1rem;
`;

export const CoverageValue = styled.div`
  font-size: 1rem;
  font-weight: 700;
  color: #000;
  text-align: right;
`;

export const SubText = styled.span`
  color: #999;
  font-weight: normal;
`;

export const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
`;

export const IncludedTag = styled.div`
  background: #e8f5e9;
  color: #2e7d32;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 0.875rem;
  font-weight: 500;
`;

export const ExcludedTag = styled.div`
  background: #ffebee;
  color: #c62828;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 0.875rem;
  font-weight: 500;
`;

export const EditButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 12px;
  background: white;
  color: #1565c0;
  border: 1px solid #1565c0;
  border-radius: 8px;
  font-size: 1.125rem;
  font-weight: 600;
  cursor: pointer;
  gap: 8px;
  margin-top: 16px;
  
  &:hover {
    background: #f5f9ff;
  }
`;

export const QuoteButtonsContainer = styled.div`
  display: flex;
  align-items: center;
  margin-top: 8px;
`;

export const SelectQuoteButton = styled.button`
  width: 100%;
  padding: 10px 16px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  font-size: 1rem;
  color: #333;
  
  &:hover {
    background: #f5f7fa;
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: default;
    
    &:hover {
      background: white;
    }
  }
`;

export const ClearButton = styled.button`
  margin-left: 8px;
  padding: 8px 12px;
  background: #f5f5f5;
  color: #c62828;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  &:hover {
    background: #ffebee;
    color: #b71c1c;
  }
`;

export const DropdownWrapper = styled.div`
  position: relative;
  overflow: visible;
`;

export const DropdownContainer = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
  z-index: 100;
  margin-top: 8px;
  overflow: hidden;
`;

export const DropdownOption = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  
  &:hover {
    background: #f5f7fa;
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

export const DropdownLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const DropdownRight = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
`;

export const DropdownDeductible = styled.div`
  font-size: 1rem;
  color: #222;
  font-weight: 500;
`;

export const DropdownLogo = styled.img`
  height: 32px;
  margin-top: 8px;
`;

export const DropdownUpdated = styled.div`
  font-size: 0.9rem;
  color: #666;
`;

export const DropdownPrice = styled.div`
  font-size: 1.35rem;
  font-weight: 700;
  color: #111;
`;

export const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 32px;
`;

export const EditFormContainer = styled.div`
  background: #f8f9ff;
  border-radius: 12px;
  padding: 24px;
  margin-top: 4px;
  position: relative;
`;

export const DiscardButton = styled.button`
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  background: #ffebee;
  color: #c62828;
  border: none;
  cursor: pointer;
  
  &:hover {
    background: #ffcdd2;
  }
`;

export const SaveButton = styled.button`
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  background: #1976d2;
  color: #fff;
  border: none;
  cursor: pointer;
  
  &:hover {
    background: #1565c0;
  }
`;

export const AddProductButton = styled.button`
  width: 100%;
  margin: 32px 0 0 0;
  padding: 16px 0;
  background: #fff;
  border: 2px dashed #156eea;
  color: #156eea;
  font-size: 1.15rem;
  font-weight: 600;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: background 0.2s, border 0.2s;
  &:hover {
    background: #f5f7fa;
    border-color: #0d47a1;
  }
`;

// ... (continue for all other styled-components used in YourProposal.tsx) ... 