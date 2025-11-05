import React, { useState } from 'react';

const API_URL = 'http://127.0.0.1:8000';

// onContractorAdded es un "callback" para avisar al padre
function NewContractorForm({ onContractorAdded }) {
  const [razonSocial, setRazonSocial] = useState('');
  const [responsable, setResponsable] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

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

    try {
      const response = await fetch(`${API_URL}/contractors/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contractorData),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'No se pudo crear el contratista.');
      }

      const newContractor = await response.json();
      setSuccess(`Contratista "${newContractor.razon_social}" creado.`);
      onContractorAdded(newContractor); // Avisa al padre

      // Limpiar formulario
      setRazonSocial('');
      setResponsable('');
      setTelefono('');
      setCorreo('');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="dashboard-card">
      <h3>Directorio de Contratistas</h3>
      <form onSubmit={handleSubmit} className="card-form">
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {success && <p style={{ color: 'green' }}>{success}</p>}
        
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
        
        <div className="form-actions">
          <button type="submit" className="btn-save">Añadir Contratista</button>
        </div>
      </form>
    </div>
  );
}

export default NewContractorForm;