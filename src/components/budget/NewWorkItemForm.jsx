import React, { useState } from 'react';

const API_URL = 'http://127.0.0.1:8000';

function NewWorkItemForm({ projectId, onWorkItemAdded }) {
  const [itemCode, setItemCode] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('pza');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!itemCode || !description) {
      setError('El Código y la Descripción son obligatorios.');
      return;
    }

    const itemData = { item_code: itemCode, description, unit };

    try {
      const response = await fetch(`${API_URL}/projects/${projectId}/work_items/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'No se pudo crear la partida.');
      }

      const newItem = await response.json();
      setSuccess(`Partida "${newItem.item_code}" creada.`);
      onWorkItemAdded(newItem); // Avisa al padre

      // Limpiar formulario
      setItemCode('');
      setDescription('');
      setUnit('pza');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="dashboard-card">
      <h3>Catálogo de Partidas (del Proyecto)</h3>
      <form onSubmit={handleSubmit} className="card-form">
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {success && <p style={{ color: 'green' }}>{success}</p>}
        
        <div className="form-group">
          <label>Código de Partida (ej: A-1.1):</label>
          <input type="text" value={itemCode} onChange={(e) => setItemCode(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Descripción:</label>
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Unidad (pza, m2, m3, kg):</label>
          <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} />
        </div>
        
        <div className="form-actions">
          <button type="submit" className="btn-save">Añadir Partida</button>
        </div>
      </form>
    </div>
  );
}

export default NewWorkItemForm;