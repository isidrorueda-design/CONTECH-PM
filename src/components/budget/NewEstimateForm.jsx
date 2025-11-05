import React, { useState } from 'react';

const API_URL = 'http://127.0.0.1:8000';

function NewEstimateForm({ projectId, contracts, onEstimateAdded }) {
  // Estados
  const [contractId, setContractId] = useState('');
  const [estimado, setEstimado] = useState(0);
  const [deductiva, setDeductiva] = useState(0);
  const [amortizado, setAmortizado] = useState(0);
  const [fondoGarantia, setFondoGarantia] = useState(0);
  const [retenciones, setRetenciones] = useState(0);
  
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contractId) {
      setError('Debe seleccionar un contrato.');
      return;
    }
    
    const estimateData = {
      estimado: parseFloat(estimado),
      deductiva_estimacion: parseFloat(deductiva),
      amortizado: parseFloat(amortizado),
      fondo_garantia: parseFloat(fondoGarantia),
      retenciones: parseFloat(retenciones),
      contract_id: parseInt(contractId),
    };

    try {
      const response = await fetch(`${API_URL}/projects/${projectId}/estimates/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(estimateData),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'No se pudo crear la estimación.');
      }
      
      const newEstimate = await response.json();
      setSuccess(`Estimación creada para el contrato ${newEstimate.contract.numero_contrato}.`);
      onEstimateAdded(newEstimate);

      // Limpiar formulario
      setContractId(''); setEstimado(0); setDeductiva(0); setAmortizado(0); setFondoGarantia(0); setRetenciones(0);

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="dashboard-card">
      <h3>Crear Nueva Estimación</h3>
      <form onSubmit={handleSubmit} className="card-form">
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {success && <p style={{ color: 'green' }}>{success}</p>}
        
        <div className="form-group">
          <label>Contrato (Tabla 3):</label>
          <select value={contractId} onChange={(e) => setContractId(e.target.value)}>
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
          <input type="number" value={estimado} onChange={(e) => setEstimado(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Deductivas ($):</label>
          <input type="number" value={deductiva} onChange={(e) => setDeductiva(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Amortización de Anticipo ($):</label>
          <input type="number" value={amortizado} onChange={(e) => setAmortizado(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Fondo de Garantía ($):</label>
          <input type="number" value={fondoGarantia} onChange={(e) => setFondoGarantia(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Retenciones ($):</label>
          <input type="number" value={retenciones} onChange={(e) => setRetenciones(e.target.value)} />
        </div>
        
        <div className="form-actions">
          <button type="submit" className="btn-save">Guardar Estimación</button>
        </div>
      </form>
    </div>
  );
}

export default NewEstimateForm;