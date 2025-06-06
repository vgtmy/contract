
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import ContractManagementPage from './pages/ContractManagementPage';
import ApprovalWorkflowPage from './pages/ApprovalWorkflowPage';
import ContractTemplatesPage from './pages/ContractTemplatesPage';
import PerformanceTrackingPage from './pages/PerformanceTrackingPage';
import DataAnalysisPage from './pages/DataAnalysisPage';
import SystemSettingsPage from './pages/SystemSettingsPage';
import { NAV_LINKS } from './constants';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to={NAV_LINKS[0].path} replace />} />
          <Route path={NAV_LINKS[0].path} element={<DashboardPage />} />
          <Route path={NAV_LINKS[1].path} element={<ContractManagementPage />} />
          <Route path={NAV_LINKS[2].path} element={<ApprovalWorkflowPage />} />
          <Route path={NAV_LINKS[3].path} element={<ContractTemplatesPage />} />
          <Route path={NAV_LINKS[4].path} element={<PerformanceTrackingPage />} />
          <Route path={NAV_LINKS[5].path} element={<DataAnalysisPage />} />
          <Route path={NAV_LINKS[6].path} element={<SystemSettingsPage />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
