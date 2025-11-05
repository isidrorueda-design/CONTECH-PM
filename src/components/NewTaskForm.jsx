import React, { useState } from 'react';

const API_URL = 'http://127.0.0.1:8000';

// Recibe el ID del proyecto, la lista plana de tareas, y la función callback
function NewTaskForm({ projectId, flatTasks, onTaskCreated }) {
  // Estados para los campos
  const [priority, setPriority] = useState(2);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [parentId, setParentId] = useState(''); // El ID del padre seleccionado
  const [error, setError] = useState(null);

  // Función para formatear las fechas (la API espera YYYY-MM-DD)
  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toISOString().split('T')[0];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!name || !startDate || !endDate) {
      setError('Nombre, Fecha de Inicio y Fecha de Fin son obligatorios.');
      return;
    }

    const taskData = {
      name,
      description,
      start_date: formatDate(startDate),
      end_date: formatDate(endDate),  
      parent_id: parentId ? parseInt(parentId, 10) : null,
      priority: parseInt(priority, 10),
    };

    try {      
      const response = await fetch(`${API_URL}/projects/${projectId}/tasks/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        throw new Error('No se pudo crear la tarea.');
      }

      const createdTask = await response.json();

      setName('');
      setDescription('');
      setStartDate('');
      setEndDate('');
      setParentId('');
      setPriority(2); 
      onTaskCreated(createdTask);

      onTaskCreated(createdTask);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="task-form-container">
      <h3>Añadir Nueva Tarea</h3>
      <form onSubmit={handleSubmit} className="task-form">
        
        {error && (
          <p style={{ color: 'red', gridColumn: '1 / -1' }}>{error}</p>
        )}

        <div className="form-group full-width">
          <label htmlFor="taskName">Nombre Tarea:</label>
          <input
            type="text"
            id="taskName"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="taskStart">Fecha Inicio:</label>
          <input
            type="date"
            id="taskStart"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="taskEnd">Fecha Fin:</label>
          <input
            type="date"
            id="taskEnd"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div className="form-group full-width">
          <label htmlFor="taskParent">Tarea Padre (Opcional):</label>
          <select
            id="taskParent"
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
          >
            {/* La primera opción es "Ninguna" (tarea raíz) */}
            <option value="">-- Ninguna (Tarea Raíz) --</option>
            
            {/* Mapeamos la lista plana de tareas */}
            {flatTasks.map(task => (
              <option key={task.id} value={task.id}>
                {task.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group full-width">
          <label htmlFor="taskDesc">Descripción:</label>
          <textarea
            id="taskDesc"
            rows="3"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        
        <div className="form-actions">
          <button type="submit" className="btn-save">Guardar Tarea</button>
        </div>
        
        <div className="form-group">
          <label htmlFor="taskPriority">Prioridad:</label>
          <select
            id="taskPriority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value={3}>Alta</option>
            <option value={2}>Media</option>
            <option value={1}>Baja</option>
          </select>
        </div>

      </form>
    </div>
  );
}

export default NewTaskForm;