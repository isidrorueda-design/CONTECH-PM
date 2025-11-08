// src/components/TaskTree.jsx
import React, { useState, useMemo, useEffect } from 'react';

/**
 * Componente recursivo para renderizar una sola tarea y sus subtareas.
 */
function TaskNode({ task, level, collapsedState, onToggle, selectedId, onSelectTask, onUpdateTask }) {
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const isCollapsed = collapsedState[task.id];

  useEffect(() => {
    // --- INICIO DE LA MODIFICACIÓN: Lógica de Estatus Automático ---
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Comparar solo fechas
    const startDate = task.start_date ? new Date(task.start_date) : null;

    // Si la tarea está 'pending' y su fecha de inicio ya pasó, se marca como 'delayed'.
    if (task.status === 'pending' && startDate && today > startDate) {
      onUpdateTask(task.id, { status: 'delayed' });
    }
    // --- FIN DE LA MODIFICACIÓN ---
  }, [task.id, task.start_date, task.status, onUpdateTask]);

  const handleToggle = () => {
    if (hasSubtasks) {
      onToggle(task.id);
    }
  };

  const progressOptions = useMemo(() => 
    Array.from({ length: 21 }, (_, i) => i * 5), 
  []);

  const handleFieldChange = (field, value) => {
    // Evita llamadas a la API si el valor no ha cambiado
    if (task[field] === value && field !== 'progress' && field !== 'actual_start_date') return;

    let updatedFields = { [field]: value };

    // Lógica de automatización de estatus
    if (field === 'progress' && value === 100) {
      updatedFields.status = 'completed';
    } else if (field === 'actual_start_date' && value) {
      // Si no está completada, pasa a 'in_progress'
      if (task.status !== 'completed') {
        updatedFields.status = 'in_progress';
      }
    }

    onUpdateTask(task.id, updatedFields);
  };

  return (
    <>
      <div 
        className={`task-row ${task.id === selectedId ? 'selected' : ''}`} 
        onClick={() => onSelectTask(task.id)}
        // El doble clic ahora podría ser para editar en un modal, así que lo dejamos solo con un clic
      >
        <div className="task-cell task-name" style={{ paddingLeft: `${level * 25 + 10}px` }}>
          {hasSubtasks && (
            <button onClick={(e) => { e.stopPropagation(); handleToggle(); }} className="task-toggle-btn">
              {isCollapsed ? '▸' : '▾'}
            </button>
          )}
          <span style={{ 
            marginLeft: hasSubtasks ? '0' : '20px',
            fontWeight: hasSubtasks ? '600' : 'normal',
            // Aplica color rojo si está retrasada
            color: task.status === 'delayed' ? '#dc3545' : 'inherit'
          }}>
            {task.name}
          </span>
        </div>
        <div className="task-cell">
          <select
            value={task.status || 'pending'}
            onChange={(e) => handleFieldChange('status', e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="inline-edit-select"
          >
            <option value="pending">Programada</option> 
            <option value="in_progress">Iniciada</option> 
            <option value="completed">Terminada</option> 
            <option value="delayed">Retrasada</option>
          </select>
        </div>
        <div className="task-cell progress-cell">
          <select 
            value={task.progress || 0} 
            onChange={(e) => handleFieldChange('progress', parseInt(e.target.value, 10))}
            onClick={(e) => e.stopPropagation()} // Evita que la fila se seleccione al hacer clic en el select
            className="inline-edit-select"
          >
            {progressOptions.map(p => (
              <option key={p} value={p}>{p}%</option>
            ))}
          </select>
          <div className="progress-bar-container">
            <div
              className="progress-bar-fill"
              style={{
                width: `${task.progress || 0}%`,
                backgroundColor: task.status === 'delayed' ? '#dc3545' // Rojo si está retrasada
                                 : task.status === 'completed' ? '#28a745' // Verde si está completada
                                 : '#007bff' // Azul para el resto
              }}
            ></div>
          </div>
        </div>
        <div className="task-cell">{task.start_date || '--'}</div>
        <div className="task-cell">{task.end_date || '--'}</div>
        <div className="task-cell">
          <input 
            type="date" 
            value={task.actual_start_date || ''}
            onChange={(e) => handleFieldChange('actual_start_date', e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="inline-edit-date"
          />
        </div>
        <div className="task-cell">
          <input 
            type="date" 
            value={task.actual_end_date || ''}
            onChange={(e) => handleFieldChange('actual_end_date', e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="inline-edit-date"
          />
        </div>
        <div className="task-cell">{task.responsible_user?.email || 'N/A'}</div>
      </div>

      {hasSubtasks && !isCollapsed && (
        task.subtasks.map(subtask => (
          <TaskNode
            key={subtask.id}
            task={subtask}
            level={level + 1}
            collapsedState={collapsedState}
            onToggle={onToggle}
            selectedId={selectedId}
            onSelectTask={onSelectTask}
            onUpdateTask={onUpdateTask}
          />
        ))
      )}
    </>
  );
}

/**
 * Componente principal que inicia el renderizado del árbol de tareas.
 */
function TaskTree({ tasks, selectedId, onSelectTask, onUpdateTask }) {
  const [collapsed, setCollapsed] = useState({});

  const toggleNode = (taskId) => {
    setCollapsed(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  if (!tasks || tasks.length === 0) {
    return <p>No hay tareas en este proyecto.</p>;
  }

  return (
    <div className="task-tree-grid">
      <div className="task-row header">
        <div className="task-cell task-name">Nombre de Tarea</div>
        <div className="task-cell">Status</div>
        <div className="task-cell">Avance</div>
        <div className="task-cell">Fecha Inicio</div>
        <div className="task-cell">Fecha Fin</div>
        <div className="task-cell">Inicio real</div>
        <div className="task-cell">Fin real</div>
        <div className="task-cell">Responsable</div>
      </div>
      {tasks.map(task => (
        <TaskNode 
          key={task.id} 
          task={task} 
          level={0} 
          collapsedState={collapsed} 
          onToggle={toggleNode}
          selectedId={selectedId}
          onSelectTask={onSelectTask}
          onUpdateTask={onUpdateTask}
        />
      ))}
    </div>
  );
}

export default TaskTree;