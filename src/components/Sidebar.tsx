import React from 'react';
import styled from 'styled-components';
import { theme } from '../styles/theme';
import {
  Person as UserIcon,
  Note as NoteIcon,
  Task as TaskIcon,
  Shield as ShieldIcon,
  AccessTime as ClockIcon,
  AttachMoney as DollarIcon,
  AttachFile as FileIcon,
  Help as HelpIcon,
} from '@mui/icons-material';

const SidebarContainer = styled.div`
  width: 60px;
  height: 100vh;
  background: ${theme.colors.background};
  border-left: 1px solid ${theme.colors.borders.light};
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: ${theme.spacing.xl};
  gap: 24px; /* Ось тут — головне! */
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 2;
`;


const MenuItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  color: ${theme.colors.text.primary};
  font-size: 12px;
  transition: color 0.2s;

  &:hover {
    color: ${theme.colors.primary};
  }

  svg {
    font-size: 24px;
  }
`;

const MenuText = styled.span`
  font-size: 11px;
  font-weight: 500;
  line-height: 1;
`;

const menuItems = [
  { icon: UserIcon, text: 'Info' },
  { icon: NoteIcon, text: 'Notes' },
  { icon: TaskIcon, text: 'Tasks' },
  { icon: ShieldIcon, text: 'Policies' },
  { icon: ClockIcon, text: 'Feed' },
  { icon: DollarIcon, text: 'Loans' },
  { icon: FileIcon, text: 'Files' },
  { icon: HelpIcon, text: 'Help' },
];

const Sidebar: React.FC = () => (
  <SidebarContainer>
    {menuItems.map(({ icon: Icon, text }, index) => (
      <MenuItem key={index}>
        <Icon />
        <MenuText>{text}</MenuText>
      </MenuItem>
    ))}
  </SidebarContainer>
);

export default Sidebar;
