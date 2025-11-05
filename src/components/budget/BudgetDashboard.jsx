import React from 'react';
// 1. Importa Link para la navegación
import { Link, useParams } from 'react-router-dom';

function BudgetDashboard() {
  // 2. Obtenemos el ID del proyecto de la URL
  const { projectId } = useParams();
  
  // 3. Definimos la base de la URL del presupuesto
  const baseUrl = `/projects/${projectId}/budget`;

  return (
    <div className="budget-dashboard-nav">
      
      {/* 4. Tarjetas que son Links */}
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