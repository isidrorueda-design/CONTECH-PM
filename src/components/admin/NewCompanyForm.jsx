// src/components/admin/NewCompanyForm.jsx
import React, { useState } from 'react';
import api from '../../api/axiosConfig';

function NewCompanyForm({ onCompanyCreated }) {
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name) {
      setError('El nombre de la compañía es obligatorio.');
      return;
    }

    try {
      const response = await api.post('/companies/', { name });

      setSuccess(`Compañía "${response.data.name}" creada con ID: ${response.data.id}`);
      setName(''); // Limpia el formulario
      if (onCompanyCreated) {
        onCompanyCreated(response.data); // Avisa al padre (opcional)
      }

    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Error al crear la compañía.');
      }
    }
  };

  return (
    <div className="dashboard-card">
      <h3>Crear Nueva Compañía</h3>
      <form onSubmit={handleSubmit} className="card-form">
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {success && <p style={{ color: 'green' }}>{success}</p>}

        <div className="form-group">
          <label htmlFor="companyName">Nombre de la Compañía:</label>
          <input
            type="text"
            id="companyName"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-save">Crear Compañía</button>
        </div>
      </form>
    </div>
  );
}

export default NewCompanyForm;