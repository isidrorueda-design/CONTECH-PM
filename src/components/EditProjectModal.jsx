// src/components/EditProjectModal.jsx
import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig'; // <-- ¡Usa el 'api' centralizado!

function EditProjectModal({ project, onClose, onProjectUpdated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || '');
      setError(null);
    }
  }, [project]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const updatedData = { name, description };

    try {
      const response = await api.put( // <-- Usa 'api.put'
        `/projects/${project.id}`,
        updatedData
      );
      onProjectUpdated(response.data);
      onClose();
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError(err.message);
      }
    }
  };

  if (!project) return null;

  // Estilos
  const inputStyle = { width: '95%', padding: '8px', marginBottom: '1rem', border: '1px solid #ccc', borderRadius: '4px' };
  const textareaStyle = { ...inputStyle, minHeight: '80px' };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Modificar Proyecto</h3>
        <form onSubmit={handleSubmit} className="card-form">
          {error && <p style={{ color: 'red' }}>{error}</p>}

          <div className="form-group">
            <label htmlFor="editProjectName" style={{fontWeight: 'bold'}}>Nombre:</label>
            <input type="text" id="editProjectName" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
          </div>

          <div className="form-group">
            <label htmlFor="editProjectDesc" style={{fontWeight: 'bold'}}>Descripción:</label>
            <textarea id="editProjectDesc" value={description} onChange={(e) => setDescription(e.target.value)} rows="4" style={textareaStyle} />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-save">Guardar Cambios</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProjectModal;