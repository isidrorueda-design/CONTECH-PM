import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig'; // 1. Importar axios

function ContractorModal({ mode, initialData, onClose, onSave }) {
  const [razonSocial, setRazonSocial] = useState('');
  const [responsable, setResponsable] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [error, setError] = useState(null);

  // Rellena el formulario si estamos en modo 'edit'
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setRazonSocial(initialData.razon_social || '');
      setResponsable(initialData.responsable || '');
      setTelefono(initialData.telefono || '');
      setCorreo(initialData.correo_electronico || '');
    } else {
      // Limpia si es 'new'
      setRazonSocial('');
      setResponsable('');
      setTelefono('');
      setCorreo('');
    }
  }, [mode, initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!razonSocial) {
      setError('La Razón Social es obligatoria.');
      return;
    }

    const contractorData = {
      razon_social: razonSocial,
      responsable: responsable || null,
      telefono: telefono || null,
      correo_electronico: correo || null,
    };

    const isNew = mode === 'new';
    const url = isNew ? `/contractors/` : `/contractors/${initialData.id}`;

    try {
      let response;
      if (isNew) {
        response = await api.post(url, contractorData);
      } else {
        response = await api.put(url, contractorData);
      }
      
      const savedContractor = response.data;
      onSave(savedContractor); // Avisa al padre
      onClose(); // Cierra el modal
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>{mode === 'new' ? 'Nuevo Contratista' : 'Editar Contratista'}</h3>
        
        <form onSubmit={handleSubmit} className="card-form">
          {error && <p style={{ color: 'red' }}>{error}</p>}
          
          <div className="form-group">
            <label>Razón Social:</label>
            <input type="text" value={razonSocial} onChange={(e) => setRazonSocial(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Responsable (Opcional):</label>
            <input type="text" value={responsable} onChange={(e) => setResponsable(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Teléfono (Opcional):</label>
            <input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Correo (Opcional):</label>
            <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} />
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-save">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ContractorModal;