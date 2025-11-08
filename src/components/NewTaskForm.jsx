// src/components/NewTaskForm.jsx
import React, { useState } from 'react';
import api from '../api/axiosConfig'; // <-- 1. Importa 'api'

// Recibe props para modo edición: mode, initialData
function NewTaskForm({ mode, initialData, projectId, flatTasks, companyUsers, onClose, onSave }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [parentId, setParentId] = useState('');
  const [priority, setPriority] = useState(2);
  const [responsibleUserId, setResponsibleUserId] = useState(''); // <-- 3. Estado para el responsable
  
  const [error, setError] = useState(null);

  React.useEffect(() => {
    if (mode === 'edit' && initialData) {
      setName(initialData.name || '');
      setDescription(initialData.description || '');
      setStartDate(formatDate(initialData.start_date));
      setEndDate(formatDate(initialData.end_date));
      setParentId(initialData.parent_id || '');
      setPriority(initialData.priority || 2);
      setResponsibleUserId(initialData.responsible_user_id || '');
    } else {
      // Resetea para el modo 'new'
      setName(''); setDescription(''); setStartDate(''); setEndDate('');
      setParentId(''); setPriority(2); setResponsibleUserId('');
    }
  }, [mode, initialData]);
  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toISOString().split('T')[0];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // 4. Validación de fechas
    if (!name || !startDate || !endDate) {
      setError('Nombre, Fecha de Inicio y Fecha de Fin son obligatorios.');
      return;
    }

    const taskData = {
      name,
      description: description || null,
      start_date: formatDate(startDate),
      end_date: formatDate(endDate),
      parent_id: parentId ? parseInt(parentId, 10) : null,
      priority: parseInt(priority, 10),
      // 5. Envía el ID del usuario responsable
      responsible_user_id: responsibleUserId ? parseInt(responsibleUserId, 10) : null,
    };

    const isNew = mode === 'new';
    const url = isNew ? `/projects/${projectId}/tasks/` : `/tasks/${initialData.id}/`;
    const method = isNew ? 'post' : 'put';

    try {
      const response = await api[method](url, taskData);
      
      onSave(response.data);
      onClose();
      
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        // Muestra el 404 o 401 que viene del backend
        setError(err.response.data.detail); 
      } else {
        setError("Error al crear la tarea.");
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{maxWidth: '700px'}} onClick={(e) => e.stopPropagation()}>
        <h3>Añadir Nueva Tarea</h3>
        <form onSubmit={handleSubmit} className="task-form">
          
          {error && (
            <p style={{ color: 'red', gridColumn: '1 / -1' }}>{error}</p>
          )}

          <div className="form-group full-width">
            <label htmlFor="taskName">Nombre Tarea:</label>
            <input type="text" id="taskName" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="form-group">
            <label htmlFor="taskStart">Fecha Inicio:</label>
            <input type="date" id="taskStart" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>

          <div className="form-group">
            <label htmlFor="taskEnd">Fecha Fin:</label>
            <input type="date" id="taskEnd" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>

          <div className="form-group">
            <label htmlFor="taskPriority">Prioridad:</label>
            <select id="taskPriority" value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value={3}>Alta</option>
              <option value={2}>Media</option>
              <option value={1}>Baja</option>
            </select>
          </div>
          
          {/* --- 7. CAMPO "USUARIO RESPONSABLE" --- */}
          <div className="form-group">
            <label htmlFor="taskUser">Usuario Responsable (Opcional):</label>
            <select id="taskUser" value={responsibleUserId} onChange={(e) => setResponsibleUserId(e.target.value)}>
              <option value="">-- Ninguno --</option>
              {/* 8. Mapea la lista de 'companyUsers' */}
              {companyUsers.map(user => (
                <option key={user.id} value={user.id}>
                  {user.email}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group full-width">
            <label htmlFor="taskParent">Tarea Padre (Opcional):</label>
            <select id="taskParent" value={parentId} onChange={(e) => setParentId(e.target.value)}>
              <option value="">-- Ninguna (Tarea Raíz) --</option>
              {flatTasks.map(task => (
                <option key={task.id} value={task.id}>{task.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group full-width">
            <label htmlFor="taskDesc">Descripción:</label>
            <textarea id="taskDesc" rows="3" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          
          <div className="form-actions" style={{ marginTop: '1rem' }}>
            <button type="button" className="btn-cancel" onClick={onClose} style={{ marginRight: '0.5rem' }}>Cancelar</button>
            <button type="submit" className="btn-save">Guardar Tarea</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewTaskForm;