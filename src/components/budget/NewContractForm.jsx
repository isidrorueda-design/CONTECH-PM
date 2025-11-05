import React, { useState } from 'react';

const API_URL = 'http://127.0.0.1:8000';

function NewContractForm({ projectId, contractors, workItems, onContractAdded }) {
  // Estados para los campos
  const [contractorId, setContractorId] = useState('');
  const [workItemId, setWorkItemId] = useState('');
  const [numeroContrato, setNumeroContrato] = useState('');
  const [trabajos, setTrabajos] = useState('');
  const [contratado, setContratado] = useState(0);
  const [aditiva, setAditiva] = useState(0);
  const [deductiva, setDeductiva] = useState(0);
  const [anticipo, setAnticipo] = useState(0);
  const [aplicaIva, setAplicaIva] = useState(true);
  
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!contractorId || !workItemId || !numeroContrato) {
      setError('Contratista, Partida y Número de Contrato son obligatorios.');
      return;
    }

    const contractData = {
      numero_contrato: numeroContrato,
      trabajos,
      contratado: parseFloat(contratado),
      aditiva: parseFloat(aditiva),
      deductiva: parseFloat(deductiva),
      anticipo: parseFloat(anticipo),
      aplica_iva: aplicaIva,
      contractor_id: parseInt(contractorId),
      work_item_id: parseInt(workItemId),
    };

    try {
      const response = await fetch(`${API_URL}/projects/${projectId}/contracts/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contractData),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'No se pudo crear el contrato.');
      }
      
      const newContract = await response.json();
      setSuccess(`Contrato "${newContract.numero_contrato}" creado.`);
      onContractAdded(newContract); // Avisa al padre

      // Limpiar formulario
      setContractorId(''); setWorkItemId(''); setNumeroContrato(''); setTrabajos('');
      setContratado(0); setAditiva(0); setDeductiva(0); setAnticipo(0); setAplicaIva(true);

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="dashboard-card">
      <h3>Crear Nuevo Contrato</h3>
      <form onSubmit={handleSubmit} className="card-form">
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {success && <p style={{ color: 'green' }}>{success}</p>}
        
        {/* --- Menús Desplegables --- */}
        <div className="form-group">
          <label>Contratista (Tabla 1):</label>
          <select value={contractorId} onChange={(e) => setContractorId(e.target.value)}>
            <option value="">-- Seleccione un Contratista --</option>
            {contractors.map(c => (
              <option key={c.id} value={c.id}>{c.razon_social}</option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label>Partida (Tabla 2):</label>
          <select value={workItemId} onChange={(e) => setWorkItemId(e.target.value)}>
            <option value="">-- Seleccione una Partida --</option>
            {workItems.map(w => (
              <option key={w.id} value={w.id}>{w.item_code} - {w.description}</option>
            ))}
          </select>
        </div>

        {/* --- Otros Campos --- */}
        <div className="form-group">
          <label>Número de Contrato:</label>
          <input type="text" value={numeroContrato} onChange={(e) => setNumeroContrato(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Trabajos (Descripción):</label>
          <input type="text" value={trabajos} onChange={(e) => setTrabajos(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Monto Contratado ($):</label>
          <input type="number" value={contratado} onChange={(e) => setContratado(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Aditiva ($):</label>
          <input type="number" value={aditiva} onChange={(e) => setAditiva(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Deductiva ($):</label>
          <input type="number" value={deductiva} onChange={(e) => setDeductiva(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Anticipo ($):</label>
          <input type="number" value={anticipo} onChange={(e) => setAnticipo(e.target.value)} />
        </div>
        <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center' }}>
          <input type="checkbox" id="aplicaIva" checked={aplicaIva} onChange={(e) => setAplicaIva(e.target.checked)} />
          <label htmlFor="aplicaIva" style={{ marginBottom: 0, marginLeft: '8px' }}>¿Aplica IVA?</label>
        </div>
        
        <div className="form-actions">
          <button type="submit" className="btn-save">Guardar Contrato</button>
        </div>
      </form>
    </div>
  );
}

export default NewContractForm;