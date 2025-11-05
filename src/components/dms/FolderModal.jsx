// src/components/dms/FolderModal.jsx
import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig'; // Importa la instancia de axios configurada
 
// Props:
// - mode: 'new' o 'rename'
// - projectId: (necesario para 'new')
// - parentId: (necesario para 'new')
// - folderToEdit: (necesario para 'rename')
// - onClose: función para cerrar
// - onSave: función para avisar al padre que se guardó
function FolderModal({ mode, projectId, parentId, folderToEdit, onClose, onSave }) {
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  
  const isNewMode = mode === 'new';

  // Rellena el formulario si estamos en modo 'rename'
  useEffect(() => {
    if (!isNewMode && folderToEdit) {
      setName(folderToEdit.name);
    } else {
      setName('');
    }
  }, [mode, folderToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!name) {
      setError('El nombre de la carpeta es obligatorio.');
      return;
    }

    let url = '';
    let method = '';
    let body = {};

    if (isNewMode) {
      // Lógica de CREAR
      url = `/projects/${projectId}/folders/`; // Ruta relativa
      method = 'POST';
      body = { name: name, parent_id: parentId };
    } else {
      // Lógica de RENOMBRAR
      url = `/folders/${folderToEdit.id}/rename`; // Ruta relativa
      method = 'PUT';
      body = { name: name }; // El backend solo espera el nombre
    }

    try {
      let response; // Usa la instancia 'api'
      if (isNewMode) {
        response = await api.post(url, body);
      } else {
        response = await api.put(url, body);
      }
      onSave(response.data); // Avisa al padre
      onClose(); // Cierra el modal
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al guardar la carpeta.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>{isNewMode ? 'Nueva Carpeta' : 'Renombrar Carpeta'}</h3>
        <form onSubmit={handleSubmit} className="card-form">
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <div className="form-group">
            <label>Nombre de la Carpeta:</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              autoFocus
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-save">
              {isNewMode ? 'Crear' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FolderModal;