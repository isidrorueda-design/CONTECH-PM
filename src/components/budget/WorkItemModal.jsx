import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig'; // 1. Importar la instancia de axios

function WorkItemModal({ mode, projectId, initialData, onClose, onSave }) {
  const [itemCode, setItemCode] = useState('');
  const [description, setDescription] = useState('');
  const [presupuestoBase, setPresupuestoBase] = useState(0); 
  const [error, setError] = useState(null);

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setItemCode(initialData.item_code || '');
      setDescription(initialData.description || '');
      setPresupuestoBase(initialData.presupuesto_base || 0); // 
    } else {
      setItemCode('');
      setDescription('');
      setPresupuestoBase(0);
    }
  }, [mode, initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!itemCode || !description) {
      setError('El Código y la Descripción son obligatorios.');
      return;
    }

    const workItemData = { 
      item_code: itemCode, 
      description, 
      presupuesto_base: parseFloat(presupuestoBase)
    };

    const isNew = mode === 'new';
    const url = isNew 
      ? `/projects/${projectId}/work_items/` 
      : `/work_items/${initialData.id}`;

    try {
      let response;
      if (isNew) {
        response = await api.post(url, workItemData);
      } else {
        response = await api.put(url, workItemData);
      }
      const savedItem = response.data;
      onSave(savedItem);
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>{mode === 'new' ? 'Nueva Partida de Presupuesto' : 'Editar Partida'}</h3>
        
        <form onSubmit={handleSubmit} className="card-form">
          {error && <p style={{ color: 'red' }}>{error}</p>}
          
          <div className="form-group">
            <label>Código de Partida:</label>
            <input type="text" value={itemCode} onChange={(e) => setItemCode(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Descripción:</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          {/* --- 8. CAMBIA EL CAMPO 'UNIDAD' POR 'PRESUPUESTO BASE' --- */}
          <div className="form-group">
            <label>Presupuesto Base ($):</label>
            <input 
              type="number" 
              value={presupuestoBase} 
              onChange={(e) => setPresupuestoBase(e.target.value)} 
            />
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

export default WorkItemModal;