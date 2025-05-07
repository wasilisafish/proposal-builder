import React from 'react';
import styled from 'styled-components';
import { theme } from '../styles/theme';
import { OpenInNew as OpenInNewIcon, AccessTime as TimeIcon } from '@mui/icons-material';

const HeaderContainer = styled.div`
  width: 100%;
  border-bottom: 1px solid ${theme.colors.borders.medium};
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${theme.spacing.sm} ${theme.spacing.lg};
  gap: ${theme.spacing.md};
  box-sizing: border-box;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  flex: 1;
  min-width: 0;
  flex-wrap: nowrap;
  overflow: hidden;
`;

const UserBlock = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  white-space: nowrap;
  overflow: hidden;
`;

const TagsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  flex-wrap: nowrap;
  overflow: hidden;
  min-width: 0;
`;

const UserTopRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  flex-wrap: wrap;
`;

const UserName = styled.h1`
  font-size: ${theme.typography.h1.fontSize};
  font-weight: ${theme.typography.h1.fontWeight};
  line-height: ${theme.typography.h1.lineHeight};
  color: ${theme.colors.text.primary};
  margin: 0;
  white-space: nowrap;
`;

const UserId = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  color: ${theme.colors.text.secondary};
  font-size: ${theme.typography.h1.fontSize};
  font-weight: ${theme.typography.h1.fontWeight};
  line-height: ${theme.typography.h1.lineHeight};
  white-space: nowrap;
`;

const TimeAndTags = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  flex-wrap: wrap;
  margin-top: ${theme.spacing.xs};
`;

const TimeInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  color: ${theme.colors.text.light};
  font-size: ${theme.typography.body1.fontSize};
  font-weight: ${theme.typography.body1.fontWeight};
  line-height: ${theme.typography.body1.lineHeight};
  white-space: nowrap;
`;

const Tag = styled.div<{ color: string }>`
  background: ${props => props.color};
  color: ${theme.colors.background};
  padding: ${theme.spacing.xs} ${theme.spacing.md} ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: 40px;
  font-size: ${theme.typography.body2.fontSize};
  font-weight: ${theme.typography.body2.fontWeight};
  line-height: ${theme.typography.body2.lineHeight};
  white-space: nowrap;
`;

const RightActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  flex-shrink: 0;
`;

const ActionButton = styled.button`
  background: transparent;
  border: 2px solid ${theme.colors.primary};
  color: ${theme.colors.primary};
  padding: ${theme.spacing.sm} ${theme.spacing.lg};
  border-radius: 4px;
  font-size: ${theme.typography.body1.fontSize};
  font-weight: 700;
  line-height: ${theme.typography.body1.lineHeight};
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    background: ${theme.colors.primary};
    color: ${theme.colors.background};
  }
`;

const Header: React.FC = () => (
  <HeaderContainer>
    <UserInfo>
      <UserTopRow>
        <UserName>Elliot McMahon</UserName>
        <UserId>
          ID:6762 <OpenInNewIcon fontSize="small" />
        </UserId>
      </UserTopRow>
      <TimeAndTags>
        <TimeInfo>
          <TimeIcon fontSize="small" />
          2:30PM EST
        </TimeInfo>
        <Tag color={theme.colors.tags.purple}>Roundpoint</Tag>
        <Tag color={theme.colors.tags.pink}>New business</Tag>
        <Tag color={theme.colors.tags.green}>Completed data collection</Tag>
      </TimeAndTags>
    </UserInfo>

    <RightActions>
      <span style={{ color: theme.colors.text.primary }}>Qualified by Bertram Kust</span>
      <ActionButton>Schedule call</ActionButton>
    </RightActions>
  </HeaderContainer>
);

export default Header;
