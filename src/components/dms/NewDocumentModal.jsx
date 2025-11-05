// src/components/dms/NewDocumentModal.jsx
import React, { useState, useRef } from 'react';
import api from '../../api/axiosConfig'; // Importa la instancia de axios configurada
 
function NewDocumentModal({ projectId, folderId, onClose, onUploadSuccess }) {
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  
  // 1. Creamos una referencia al input del archivo
  const fileInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const file = fileInputRef.current.files[0];

    if (!name || !file) {
      setError('El Nombre y el Archivo (v1) son obligatorios.');
      return;
    }

    try {
      // --- PASO 1: Crear el "Contenedor" del Documento ---
      const docConceptData = { name, folder_id: folderId };      
      const conceptResponse = await api.post('/documents/', docConceptData); // Usa la instancia 'api'
      const newDocument = conceptResponse.data;
      const newDocumentId = newDocument.id;

      // --- PASO 2: Subir el Archivo (Versión 1) ---
      const formData = new FormData();
      formData.append('file', file); // 'file' debe coincidir con la API
      await api.post(`/documents/${newDocumentId}/upload_version/`, formData, { // Usa la instancia 'api'
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // ¡Éxito en ambos pasos!
      onUploadSuccess(); // Avisa al padre para que refresque
      onClose(); // Cierra el modal

    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Ocurrió un error al subir el documento.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Subir Nuevo Documento</h3>
        <form onSubmit={handleSubmit} className="card-form">
          {error && <p style={{ color: 'red' }}>{error}</p>}
          
          <div className="form-group">
            <label>Nombre del Documento (Conceptual):</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              autoFocus
            />
          </div>
          
          <div className="form-group">
            <label>Archivo (Versión 1):</label>
            <input 
              type="file" 
              ref={fileInputRef} // 2. Conectamos la referencia
            />
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-save">Subir y Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewDocumentModal;