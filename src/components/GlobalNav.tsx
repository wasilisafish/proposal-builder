import React from 'react';
import styled from 'styled-components';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import SettingsIcon from '@mui/icons-material/Settings';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import HistoryIcon from '@mui/icons-material/History';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SecurityIcon from '@mui/icons-material/Security';
import PeopleIcon from '@mui/icons-material/People';
import NotificationsIcon from '@mui/icons-material/Notifications';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import AppsIcon from '@mui/icons-material/Apps';

const Nav = styled.nav`
  width: 64px;
  height: 100vh;
  background: linear-gradient(180deg, #156EEA 0%, #6A12AF 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 0 32px; /* ДОДАНО нижній відступ */
  overflow: visible;
  position: relative; /* ВАЖЛИВО: дозволяє абсолютне позиціонування нижче */
`;

const Logo = styled.div`
  width: 32px;
  height: 32px;
  background: white;
  border-radius: 50%;
  margin-bottom: 32px;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  margin: 12px 0;
  padding: 0;
  color: white;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.2s;
  &:hover {
    background: rgba(255,255,255,0.15);
  }
`;

const Spacer = styled.div`
  flex-grow: 1;
`;
const AvatarWrapper = styled.div`
  margin-top: 16px;
  margin-bottom: 8px; /* Щоб не впиралось в край */
  border: 2px solid #30e3ca;
  border-radius: 50%;
  padding: 2px;
  background: white;
  position: relative;
  z-index: 2;
`;


const Avatar = styled.img`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: block;
`;

const GlobalNav: React.FC = () => (
  <Nav>
    <Logo />
    <IconButton><SearchIcon /></IconButton>
    <IconButton><AttachMoneyIcon /></IconButton>
    <IconButton><HistoryIcon /></IconButton>
    <IconButton><CalendarTodayIcon /></IconButton>
    <IconButton><AssignmentIcon /></IconButton>
    <IconButton><SecurityIcon /></IconButton>
    <IconButton><PeopleIcon /></IconButton>

    <Spacer />

    <IconButton><NotificationsIcon /></IconButton>
    <IconButton><HelpOutlineIcon /></IconButton>
    <IconButton><AppsIcon /></IconButton>

    <AvatarWrapper>
    <Avatar src="https://randomuser.me/api/portraits/men/32.jpg" alt="User" />
    </AvatarWrapper>

  </Nav>
);

export default GlobalNav;
