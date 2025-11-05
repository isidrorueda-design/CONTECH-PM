// src/components/GanttTabContent.jsx
import React from 'react';
import { useOutletContext } from 'react-router-dom';
import GanttChart from './GanttChart';

function GanttTabContent() {
  // Obtenemos los 'flatTasks' desde el Outlet
  const { flatTasks } = useOutletContext();
  
  return (
    // Reutilizamos el estilo que ya teníamos para el panel del Gantt
    <div className="gantt-chart-panel"> 
      <h2>Diagrama de Gantt</h2>
      <GanttChart tasks={flatTasks} />
    </div>
  );
}

export default GanttTabContent;