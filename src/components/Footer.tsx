import React from 'react';
import styled from 'styled-components';
import { theme } from '../styles/theme';
import { ArrowDropDown as ArrowDownIcon } from '@mui/icons-material';

const FooterBar = styled.footer`
  width: 100%;
  height: 72px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  background: #fff;
  border-top: 1px solid ${theme.colors.borders.light};
  box-shadow: 0 -1px 4px rgba(0, 0, 0, 0.04);
  padding: 0 ${theme.spacing.lg};
  box-sizing: border-box;
`;

const ButtonsContainer = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
`;

const ActionButton = styled.button`
  background: ${theme.colors.primary};
  color: ${theme.colors.background};
  border: none;
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  border-radius: 4px;
  font-size: ${theme.typography.h2.fontSize};
  font-weight: 700;
  line-height: ${theme.typography.h2.lineHeight};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};

  &:hover {
    opacity: 0.9;
  }
`;

const Footer: React.FC = () => (
  <FooterBar>
    <ButtonsContainer>
      <ActionButton>
        Finalize
        <ArrowDownIcon />
      </ActionButton>
      <ActionButton>
        Review with customer
      </ActionButton>
    </ButtonsContainer>
  </FooterBar>
);

export default Footer;
