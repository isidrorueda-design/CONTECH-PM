import React from 'react';
import { Link, useParams } from 'react-router-dom';
function BudgetDashboard() {
  const { projectId } = useParams();
  const baseUrl = `/projects/${projectId}/budget`;
  return (
    <div className="budget-dashboard-nav">      
      <Link to={`${baseUrl}/contractors`} className="nav-card">
        Directorio de Contratistas
      </Link>      
      <Link to={`${baseUrl}/work-items`} className="nav-card">
        Catálogo de Partidas
      </Link>      
      <Link to={`${baseUrl}/contracts`} className="nav-card">
        Contratos
      </Link>      
      <Link to={`${baseUrl}/estimates`} className="nav-card">
        Estimaciones
      </Link>      
    </div>
  );
}
export default BudgetDashboard;