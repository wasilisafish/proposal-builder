import React from 'react';
import styled from 'styled-components';
import { theme } from './styles/theme';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Footer from './components/Footer';
import GlobalNav from './components/GlobalNav';
import VerticalWizard from './components/VerticalWizard';
import YourProposal from './components/YourProposal'; // додано

const AppContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background: ${theme.colors.background};
  overflow: visible;
`;

const GlobalNavWrapper = styled.div`
  width: 64px;
  flex-shrink: 0;
  z-index: 1;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  overflow: visible;
`;

const VerticalWizardWrapper = styled.div`
  width: 60px;
  flex-shrink: 0;
  z-index: 2;
  height: 100vh;
  position: fixed;
  left: 64px;
  top: 0;
  bottom: 0;
  background: #fff; // або theme.colors.background, якщо потрібно
  border-right: 1px solid ${theme.colors.borders.light};
`;

const SidebarWrapper = styled.div`
  width: 60px;
  flex-shrink: 0;
  z-index: 2;
  height: 100vh;
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  @media (max-width: 900px) {
    display: none;
  }
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  margin-left: 124px; /* 64 + 60 */
  margin-right: 60px;
  min-height: 100vh;

  @media (max-width: 900px) {
    margin-left: 0;
    margin-right: 0;
  }
`;

const ContentArea = styled.div`
  flex: 1;
  padding: ${theme.spacing.lg};
  max-width: 100vw;
  box-sizing: border-box;
  display: flex;
  justify-content: flex-start;

  @media (max-width: 900px) {
    padding: ${theme.spacing.sm};
    justify-content: center;
  }
`;

const ProposalContainer = styled.div`
  width: 460px;
`;

const FooterWrapper = styled.div`
  position: fixed;
  left: 64px;
  right: 60px;
  bottom: 0;
  height: 72px;
  background: ${theme.colors.background};
  z-index: 10;
  display: flex;
  align-items: center;
  box-shadow: 0 -1px 4px rgba(0, 0, 0, 0.03);
  @media (max-width: 900px) {
    left: 0;
    right: 0;
  }
`;

function App() {
  return (
    <AppContainer>
      <GlobalNavWrapper>
        <GlobalNav />
      </GlobalNavWrapper>

      <VerticalWizardWrapper>
        <VerticalWizard activeStep={1} />
      </VerticalWizardWrapper>

      <SidebarWrapper>
        <Sidebar />
      </SidebarWrapper>

      <MainContent>
        <Header />
        <ContentArea>
          <ProposalContainer>
            <YourProposal />
          </ProposalContainer>
        </ContentArea>
        <FooterWrapper>
          <Footer />
        </FooterWrapper>
      </MainContent>
    </AppContainer>
  );
}

export default App;
