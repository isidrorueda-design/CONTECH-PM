import React, { useState, useEffect } from 'react';

const API_URL = 'http://127.0.0.1:8000';

function EstimateModal({ mode, projectId, initialData, onClose, onSave }) {
  // Estados para los campos del formulario
  const [formData, setFormData] = useState({
    contract_id: '',
    estimado: 0,
    deductiva_estimacion: 0,
    amortizado: 0,
    fondo_garantia: 0,
    retenciones: 0,
  });

  const [contracts, setContracts] = useState([]);
  
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/projects/${projectId}/contracts/`)
      .then(res => res.json())
      .then(setContracts)
      .catch(err => setError('No se pudieron cargar los contratos'));
  }, [projectId]);

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setFormData({
        contract_id: initialData.contract_id,
        estimado: initialData.estimado || 0,
        deductiva_estimacion: initialData.deductiva_estimacion || 0,
        amortizado: initialData.amortizado || 0,
        fondo_garantia: initialData.fondo_garantia || 0,
        retenciones: initialData.retenciones || 0,
      });
    } else {
      setFormData({
        contract_id: '', estimado: 0, deductiva_estimacion: 0,
        amortizado: 0, fondo_garantia: 0, retenciones: 0,
      });
    }
  }, [mode, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

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

    if (!formData.contract_id) {
      setError('Debe seleccionar un contrato.');
      return;
    }

    const estimateData = {
      ...formData,
      contract_id: parseInt(formData.contract_id),
      estimado: parseFloat(formData.estimado),
      deductiva_estimacion: parseFloat(formData.deductiva_estimacion),
      amortizado: parseFloat(formData.amortizado),
      fondo_garantia: parseFloat(formData.fondo_garantia),
      retenciones: parseFloat(formData.retenciones),
    };

    const isNew = mode === 'new';
    const url = isNew 
      ? `${API_URL}/projects/${projectId}/estimates/` 
      : `${API_URL}/estimates/${initialData.id}`;
    const method = isNew ? 'POST' : 'PUT';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(estimateData),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Error al guardar.');
      }
      
      const savedEstimate = await response.json();
      onSave(savedEstimate); 
      onClose(); 
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>{mode === 'new' ? 'Nueva Estimación' : 'Editar Estimación'}</h3>
        
        <form onSubmit={handleSubmit} className="card-form">
          {error && <p style={{ color: 'red' }}>{error}</p>}
          
          <div className="form-group">
            <label>Contrato (Tabla 3):</label>
            <select name="contract_id" value={formData.contract_id} onChange={handleChange}>
              <option value="">-- Seleccione un Contrato --</option>
              {contracts.map(c => (
                <option key={c.id} value={c.id}>
                  {c.numero_contrato} ({c.contractor.razon_social})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Monto Estimado ($):</label>
            <input type="number" name="estimado" value={formData.estimado} onChange={handleNumberChange} />
          </div>
          <div className="form-group">
            <label>Deductivas ($):</label>
            <input type="number" name="deductiva_estimacion" value={formData.deductiva_estimacion} onChange={handleNumberChange} />
          </div>
          <div className="form-group">
            <label>Amortización de Anticipo ($):</label>
            <input type="number" name="amortizado" value={formData.amortizado} onChange={handleNumberChange} />
          </div>
          <div className="form-group">
            <label>Fondo de Garantía ($):</label>
            <input type="number" name="fondo_garantia" value={formData.fondo_garantia} onChange={handleNumberChange} />
          </div>
          <div className="form-group">
            <label>Retenciones ($):</label>
            <input type="number" name="retenciones" value={formData.retenciones} onChange={handleNumberChange} />
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-save">Guardar Estimación</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EstimateModal;