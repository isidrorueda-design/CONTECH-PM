import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './components/LoginPage';
import HomePage from './components/HomePage';
import SuperAdminPage from './components/admin/SuperAdminPage';
import ProjectList from './components/ProjectList';
import ProjectDetail from './components/ProjectDetail';
import TasksTabContent from './components/TasksTabContent';
import GanttTabContent from './components/GanttTabContent';
import DocumentosTabContent from './components/DocumentosTabContent';
import BimViewerTab from './components/BimViewerTab';
import BimDataTab from './components/bim/BimDataTab'; 
import BudgetDashboard from './components/budget/BudgetDashboard';
import ContractorPage from './components/budget/ContractorPage'; 
import WorkItemPage from './components/budget/WorkItemPage';
import ContractPage from './components/budget/ContractPage';
import EstimatePage from './components/budget/EstimatePage';
import ContractDetailPage from './components/budget/ContractDetailPage';
import EstimateDetailPage from './components/budget/EstimateDetailPage';

function ProtectedRoute({ children }) {
  const { token } = useAuth();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  const { token } = useAuth();

  return (
    <div>
      <Routes>
        <Route path="/login" element={token ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/" element={<ProtectedRoute> <HomePage /> </ProtectedRoute>} />
        <Route path="/projects" element={<ProtectedRoute> <ProjectList /> </ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute> <SuperAdminPage /> </ProtectedRoute>} />
        <Route 
          path="/projects/:projectId" 
          element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>}
        >
          <Route index element={<Navigate to="tasks" replace />} />
          <Route path="tasks" element={<TasksTabContent />} />
          <Route path="gantt" element={<GanttTabContent />} />
          <Route path="documents" element={<DocumentosTabContent />} />
          <Route path="bim" element={<BimViewerTab />} />
          <Route path="bim-data" element={<BimDataTab />} />          
          <Route path="budget" element={<BudgetDashboard />} />
          <Route path="budget/contractors" element={<ContractorPage />} />
          <Route path="budget/work-items" element={<WorkItemPage />} />
          <Route path="budget/contracts" element={<ContractPage />} />
          <Route path="budget/contracts/:contractId" element={<ContractDetailPage />} />
          <Route path="budget/estimates" element={<EstimatePage />} />
          <Route path="budget/estimates/:estimateId" element={<EstimateDetailPage />} />
          </Route>
        <Route path="*" element={<Navigate to={token ? "/" : "/login"} replace />} />        
      </Routes>
    </div>
  );
}

export default App;