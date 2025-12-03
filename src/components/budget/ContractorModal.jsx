import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';

function ContractorModal({ mode, initialData, onClose, onSave, projectId }) {
  const [formData, setFormData] = useState({
    razon_social: '',
    responsable: '',
    telefono: '',
    correo_electronico: ''
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setFormData({
        razon_social: initialData.razon_social || '',
        responsable: initialData.responsable || '',
        telefono: initialData.telefono || '',
        correo_electronico: initialData.correo_electronico || ''
      });
    }
  }, [mode, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.razon_social) {
      setError("La Razón Social es obligatoria.");
      return;
    }

    try {
      let response;
      if (mode === 'new') {
        // --- ¡AQUÍ ESTÁ EL CAMBIO IMPORTANTE! ---
        // La URL ahora incluye el projectId para la creación.
        response = await api.post(`/projects/${projectId}/contractors/`, formData);
      } else {
        // La edición utiliza el ID del contratista específico.
        response = await api.put(`/contractors/${initialData.id}/`, formData);
      }
      onSave(response.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || `Error al ${mode === 'new' ? 'crear' : 'actualizar'} el contratista.`);
      console.error(err);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{mode === 'new' ? 'Nuevo Contratista' : 'Editar Contratista'}</h2>
          <button onClick={onClose} className="modal-close-btn">&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <div className="form-group">
              <label>Razón Social *</label>
              <input type="text" name="razon_social" value={formData.razon_social} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Responsable</label>
              <input type="text" name="responsable" value={formData.responsable} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Teléfono</label>
              <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Correo Electrónico</label>
              <input type="email" name="correo_electronico" value={formData.correo_electronico} onChange={handleChange} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-save">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ContractorModal;