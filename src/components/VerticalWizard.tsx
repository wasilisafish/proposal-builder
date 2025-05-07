import React from 'react';
import styled from 'styled-components';
import PersonIcon from '@mui/icons-material/Person';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import GavelIcon from '@mui/icons-material/Gavel';
import DescriptionIcon from '@mui/icons-material/Description';
import ShieldIcon from '@mui/icons-material/Shield';

const WizardContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #f6f6f6;
  width: 60px;
  height: 100vh;
  border-right: 1px solid #e6e6e6;
  padding: 24px 0;
`;

const StepWrapper = styled.div<{ isLast: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  min-height: 72px;

  &:not(:last-child)::after {
    content: '';
    position: absolute;
    top: 44px;
    left: 50%;
    transform: translateX(-50%);
    width: 2px;
    height: calc(100% - 44px);
    background: #e6e6e6;
    z-index: 0;
  }
`;

const StepIcon = styled.div<{ active?: boolean; completed?: boolean }>`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: ${({ active }) => (active ? '2px solid #156EEA' : 'none')};
  background: ${({ active }) => (active ? 'transparent' : 'transparent')};
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;

  svg {
    font-size: 22px;
    color: ${({ active, completed }) =>
      active ? '#156EEA' : completed ? '#000' : '#B0B0B0'};
  }

  &::after {
    content: '';
    display: ${({ active }) => (active ? 'block' : 'none')};
    width: 8px;
    height: 8px;
    background-color: #2ecc40; /* зелена крапка */
    border-radius: 50%;
    position: absolute;
    top: 0;
    right: 0;
  }
`;

const steps = [
  { icon: <PersonIcon />, label: 'Info' },
  { icon: <CalendarMonthIcon />, label: 'Calendar' },
  { icon: <GavelIcon />, label: 'Policies' },
  { icon: <DescriptionIcon />, label: 'Docs' },
  { icon: <ShieldIcon />, label: 'Security' },
];

const VerticalWizard: React.FC<{ activeStep?: number }> = ({ activeStep = 0 }) => (
  <WizardContainer>
    {steps.map((step, idx) => (
      <StepWrapper key={step.label} isLast={idx === steps.length - 1}>
        <StepIcon active={idx === activeStep} completed={idx < activeStep}>
          {step.icon}
        </StepIcon>
      </StepWrapper>
    ))}
  </WizardContainer>
);

export default VerticalWizard;
