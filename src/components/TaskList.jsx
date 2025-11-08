// src/components/TaskList.jsx
import React, { useState } from 'react';

// --- Función helper para prioridad (sin cambios) ---
const getPriorityText = (priority) => {
  switch (priority) {
    case 3: return 'Alta';
    case 1: return 'Baja';
    default: return 'Media';
  }
};

// --- Componente de Encabezado (ACTUALIZADO) ---
function TaskListHeader() {
  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    paddingLeft: '30px',
    marginBottom: '0.5rem',
    fontWeight: 'bold',
  };
  
  // Estilos de columna
  const colName = { flexGrow: 1, minWidth: '200px' };
  const colSmall = { width: '120px', minWidth: '120px' };
  const colPercent = { width: '80px', minWidth: '80px' };

  return (
    <div style={headerStyle}>
      <div style={colName}>Tarea</div>
      <div style={colSmall}>Status</div>
      <div style={colPercent}>Avance %</div>
      <div style={colSmall}>Prioridad</div>
      <div style={colSmall}>Inicio (Planeado)</div>
      <div style={colSmall}>Fin (Planeado)</div>
      <div style={colSmall}>Inicio (Real)</div>
      <div style={colSmall}>Fin (Real)</div>
    </div>
  );
}

// --- Componente de Fila (TaskItem) (ACTUALIZADO) ---
function TaskItem({ task }) {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = task.subtasks && task.subtasks.length > 0;

  const toggleOpen = () => setIsOpen(!isOpen);
  
  // Estilos para las columnas
  const itemStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #eee'
  };
  const colName = { flexGrow: 1, minWidth: '200px', display: 'flex', alignItems: 'center' };
  const colSmall = { width: '120px', minWidth: '120px', fontSize: '0.9rem' };
  const colPercent = { width: '80px', minWidth: '80px', fontSize: '0.9rem', fontWeight: 'bold' };

  return (
    <li style={{ listStyleType: 'none', marginLeft: '-20px' }}>
      {/* --- Fila principal con columnas --- */}
      <div style={itemStyle}>
        
        {/* Columna de Tarea (con botón +/-) */}
        <div style={colName}>
          {hasChildren ? (
            <button onClick={toggleOpen} style={{ marginRight: '5px', width: '25px', cursor: 'pointer', border: '1px solid #ccc' }}>
              {isOpen ? '−' : '+'}
            </button>
          ) : (
            <span style={{ marginRight: '5px', display: 'inline-block', width: '25px' }}></span>
          )}
          <strong>{task.name}</strong>
        </div>
        
        {/* --- NUEVAS COLUMNAS --- */}
        <div style={colSmall}>{task.status}</div>
        <div style={colPercent}>{task.progress}%</div>
        {/* --- FIN NUEVAS COLUMNAS --- */}

        <div style={colSmall}>{getPriorityText(task.priority)}</div>
        <div style={colSmall}>{task.start_date}</div>
        <div style={colSmall}>{task.end_date}</div>
        <div style={colSmall}>{task.actual_start_date || '--'}</div>
        <div style={colSmall}>{task.actual_end_date || '--'}</div>
        {/* --- FIN NUEVAS COLUMNAS --- */}

      </div>
      
      {/* Descripción y Sub-lista (sin cambios) */}
      {task.description && (
         <p style={{ marginLeft: '30px', color: '#555', fontSize: '0.9rem', padding: '0', margin: '4px 0' }}>
          {task.description}
         </p>
      )}
      
      {hasChildren && isOpen && (
        <TaskList tasks={task.subtasks} />
      )}
    </li>
  );
}

// --- Componente Principal (TaskList) (ACTUALIZADO) ---
function TaskList({ tasks }) {
  if (!tasks || tasks.length === 0) {
    return null;
  }

  // Detecta si esta es la lista 'raíz'
  const isRootList = tasks.some(t => !t.parent_id);

  return (
    // Aplicamos 'overflow-x' al contenedor de la lista/tabla
    <div style={{ overflowX: 'auto', padding: '2px' }}>
      <ul style={{ paddingLeft: '20px', minWidth: '1000px' }}>
        
        {/* Muestra el encabezado solo en la lista raíz */}
        {isRootList && <TaskListHeader />}
        
        {tasks.map(task => (
          <TaskItem key={task.id} task={task} />
        ))}
      </ul>
    </div>
  );
}

export default TaskList;