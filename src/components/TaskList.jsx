// src/components/TaskList.jsx
import React, { useState } from 'react';

// --- Función helper para mostrar prioridad ---
const getPriorityText = (priority) => {
  switch (priority) {
    case 3: return 'Alta';
    case 1: return 'Baja';
    default: return 'Media';
  }
};

// --- Componente de Encabezado ---
function TaskListHeader() {
  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    paddingLeft: '30px', // Alinear con el primer item
    marginBottom: '0.5rem',
    fontWeight: 'bold',
  };
  const colStyle = { minWidth: '120px' };

  return (
    <div style={headerStyle}>
      <div style={{ flexGrow: 1 }}>Tarea</div>
      <div style={colStyle}>Prioridad</div>
      <div style={colStyle}>Inicio</div>
      <div style={colStyle}>Fin</div>
    </div>
  );
}


function TaskItem({ task }) {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = task.subtasks && task.subtasks.length > 0;

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };
  
  // Estilos para las columnas
  const itemStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #eee'
  };
  const colStyle = { minWidth: '120px' };

  return (
    <li style={{ listStyleType: 'none', marginLeft: '-20px' }}>
      {/* --- Fila principal con columnas --- */}
      <div style={itemStyle}>
        <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
          {hasChildren && (
            <button onClick={toggleOpen} style={{ marginRight: '5px', width: '25px', cursor: 'pointer', border: '1px solid #ccc' }}>
              {isOpen ? '−' : '+'}
            </button>
          )}
          {!hasChildren && <span style={{ marginRight: '5px', display: 'inline-block', width: '25px' }}></span>}
          <strong>{task.name}</strong>
        </div>
        
        <div style={colStyle}>{getPriorityText(task.priority)}</div>
        <div style={colStyle}>{task.start_date}</div>
        <div style={colStyle}>{task.end_date}</div>
      </div>
      
      {/* Descripción (opcional) y Sub-lista */}
      {task.description && (
         <p style={{ marginLeft: '30px', color: '#555' }}>{task.description}</p>
      )}
      
      {hasChildren && isOpen && (
        <TaskList tasks={task.subtasks} />
      )}
    </li>
  );
}

function TaskList({ tasks }) {
  if (!tasks || tasks.length === 0) {
    return null;
  }

  return (
    <ul style={{ paddingLeft: '20px' }}>
      {/* --- ¡Añadimos el encabezado! --- */}
      {/* (Solo lo mostramos una vez) */}
      {tasks.some(t => !t.parent_id) && <TaskListHeader />}
      
      {tasks.map(task => (
        <TaskItem key={task.id} task={task} />
      ))}
    </ul>
  );
}

export default TaskList;