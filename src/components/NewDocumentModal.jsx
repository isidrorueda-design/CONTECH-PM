// src/components/NewDocumentModal.jsx
import React, { useState } from 'react';
// 1. Asegúrate de importar 'api' desde tu archivo de configuración, NO 'axios' directamente.
import api from '../api/axiosConfig'; 

function NewDocumentModal({ folderId, onDocumentUploaded, onClose }) { // The prop name was already correct here.
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState('');
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Por favor, seleccione un archivo.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', description);
    formData.append('folder_id', folderId);

    try {
      // 2. Usa 'api.post' en lugar de 'axios.post'.
      // 'api' ya tiene el token de autorización configurado.
      const response = await api.post('/documents/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      onDocumentUploaded(response.data); // Make sure this function is called.
      onClose(); // Cierra el modal

    } catch (err) {
      // El error 401 debería aparecer aquí si algo sigue mal.
      setError(err.response?.data?.detail || 'Error al subir el documento.');
      console.error("Error al subir:", err.response || err);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Subir Nuevo Documento</h3>
        <form onSubmit={handleSubmit}>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <div className="form-group">
            <label>Archivo:</label>
            <input type="file" onChange={handleFileChange} required />
          </div>
          <div className="form-group">
            <label>Descripción (Opcional):</label>
            <input 
              type="text" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-save">Subir</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewDocumentModal;
