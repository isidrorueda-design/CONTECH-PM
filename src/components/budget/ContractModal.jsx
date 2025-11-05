import React, { useState, useEffect } from 'react';

const API_URL = 'http://127.0.0.1:8000';

function ContractModal({ mode, projectId, initialData, onClose, onSave }) {
  const [formData, setFormData] = useState({
    contractor_id: '',
    work_item_id: '',
    numero_contrato: '',
    trabajos: '',
    contratado: 0,
    aditiva: 0,
    deductiva: 0,
    anticipo: 0,
    aplica_iva: true,
  });

  const [contractors, setContractors] = useState([]);
  const [workItems, setWorkItems] = useState([]);  
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/contractors/`)
      .then(res => res.json())
      .then(setContractors)
      .catch(err => setError('No se pudieron cargar los contratistas'));
      
    // Cargar Partidas (del Proyecto)
    fetch(`${API_URL}/projects/${projectId}/work_items/`)
      .then(res => res.json())
      .then(setWorkItems)
      .catch(err => setError('No se pudieron cargar las partidas'));
  }, [projectId]);

  // Rellenar formulario si es modo 'edit'
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setFormData({
        contractor_id: initialData.contractor_id,
        work_item_id: initialData.work_item_id,
        numero_contrato: initialData.numero_contrato || '',
        trabajos: initialData.trabajos || '',
        contratado: initialData.contratado || 0,
        aditiva: initialData.aditiva || 0,
        deductiva: initialData.deductiva || 0,
        anticipo: initialData.anticipo || 0,
        aplica_iva: initialData.aplica_iva,
      });
    } else {
      // Limpiar si es 'new'
      setFormData({
        contractor_id: '', work_item_id: '', numero_contrato: '', trabajos: '',
        contratado: 0, aditiva: 0, deductiva: 0, anticipo: 0, aplica_iva: true,
      });
    }
  }, [mode, initialData]);

  // Handler genérico para cambios en los inputs
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };
  
  // Handler para convertir números
  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.contractor_id || !formData.work_item_id || !formData.numero_contrato) {
      setError('Contratista, Partida y Número de Contrato son obligatorios.');
      return;
    }

    const contractData = {
      ...formData,
      contractor_id: parseInt(formData.contractor_id),
      work_item_id: parseInt(formData.work_item_id),
    };

    const isNew = mode === 'new';
    const url = isNew 
      ? `${API_URL}/projects/${projectId}/contracts/` 
      : `${API_URL}/contracts/${initialData.id}`;
    const method = isNew ? 'POST' : 'PUT';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contractData),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Error al guardar.');
      }
      
      const savedContract = await response.json();
      onSave(savedContract); // Avisa al padre
      onClose(); // Cierra el modal
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>{mode === 'new' ? 'Nuevo Contrato' : 'Editar Contrato'}</h3>
        
        <form onSubmit={handleSubmit} className="card-form">
          {error && <p style={{ color: 'red' }}>{error}</p>}
          
          <div className="form-group">
            <label>Contratista (Tabla 1):</label>
            <select name="contractor_id" value={formData.contractor_id} onChange={handleChange}>
              <option value="">-- Seleccione un Contratista --</option>
              {contractors.map(c => (
                <option key={c.id} value={c.id}>{c.razon_social}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Partida (Tabla 2):</label>
            <select name="work_item_id" value={formData.work_item_id} onChange={handleChange}>
              <option value="">-- Seleccione una Partida --</option>
              {workItems.map(w => (
                <option key={w.id} value={w.id}>{w.item_code} - {w.description}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Número de Contrato:</label>
            <input type="text" name="numero_contrato" value={formData.numero_contrato} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Trabajos (Descripción):</label>
            <input type="text" name="trabajos" value={formData.trabajos} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Monto Contratado ($):</label>
            <input type="number" name="contratado" value={formData.contratado} onChange={handleNumberChange} />
          </div>
          <div className="form-group">
            <label>Aditiva ($):</label>
            <input type="number" name="aditiva" value={formData.aditiva} onChange={handleNumberChange} />
          </div>
          <div className="form-group">
            <label>Deductiva ($):</label>
            <input type="number" name="deductiva" value={formData.deductiva} onChange={handleNumberChange} />
          </div>
          <div className="form-group">
            <label>Anticipo ($):</label>
            <input type="number" name="anticipo" value={formData.anticipo} onChange={handleNumberChange} />
          </div>
          <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center' }}>
            <input type="checkbox" id="aplica_iva" name="aplica_iva" checked={formData.aplica_iva} onChange={handleChange} />
            <label htmlFor="aplica_iva" style={{ marginBottom: 0, marginLeft: '8px' }}>¿Aplica IVA?</label>
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-save">Guardar Contrato</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ContractModal;