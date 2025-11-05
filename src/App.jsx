// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Importa tus páginas
import LoginPage from './components/LoginPage';
import HomePage from './components/HomePage'; // <-- 1. Importa el Home
import SuperAdminPage from './components/admin/SuperAdminPage'; // <-- 2. Importa la pág de Admin
import ProjectList from './components/ProjectList';
import ProjectDetail from './components/ProjectDetail';
// ... (todos tus otros imports de pestañas y páginas de presupuesto)
import TasksTabContent from './components/TasksTabContent';
import GanttTabContent from './components/GanttTabContent';
import DocumentosTabContent from './components/DocumentosTabContent';
import BimViewerTab from './components/BimViewerTab';
import BudgetDashboard from './components/budget/BudgetDashboard';
import ContractorPage from './components/budget/ContractorPage'; 
import WorkItemPage from './components/budget/WorkItemPage';
import ContractPage from './components/budget/ContractPage';
import EstimatePage from './components/budget/EstimatePage';


// Componente de Ruta Protegida (sin cambios)
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
        {/* --- Ruta Pública --- */}
        <Route 
          path="/login" 
          element={
            token ? <Navigate to="/" replace /> : <LoginPage />
          } 
        />
        
        {/* --- Rutas Protegidas --- */}
        
        {/* 3. Ruta Raíz: Llama al 'Redirigidor' */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } 
        />
        
        {/* 4. Ruta de Proyectos (para usuarios de compañía) */}
        <Route 
          path="/projects" 
          element={
            <ProtectedRoute>
              <ProjectList />
            </ProtectedRoute>
          } 
        />
        
        {/* 5. Ruta de Admin (para super_admin) */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <SuperAdminPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Rutas de Detalle de Proyecto (ya están protegidas) */}
        <Route 
          path="/projects/:projectId" 
          element={
            <ProtectedRoute>
              <ProjectDetail />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="tasks" replace />} />
          <Route path="tasks" element={<TasksTabContent />} />
          <Route path="gantt" element={<GanttTabContent />} />
          <Route path="documents" element={<DocumentosTabContent />} />
          <Route path="bim" element={<BimViewerTab />} />
          
          <Route path="budget" element={<BudgetDashboard />} />
          <Route path="budget/contractors" element={<ContractorPage />} />
          <Route path="budget/work-items" element={<WorkItemPage />} />
          <Route path="budget/contracts" element={<ContractPage />} />
          <Route path="budget/estimates" element={<EstimatePage />} />
        </Route>

        {/* Ruta por defecto */}
        <Route path="*" element={<Navigate to={token ? "/" : "/login"} replace />} />
        
      </Routes>
    </div>
  );
}

export default App;