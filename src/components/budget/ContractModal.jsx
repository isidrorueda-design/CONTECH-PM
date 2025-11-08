// src/components/budget/ContractModal.jsx
import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig'; // <-- 1. Importa 'api'

function ContractModal({ mode, projectId, initialData, onClose, onSave }) {
  // Estados para los campos del formulario
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
  
  // Estados para las listas de los desplegables
  const [contractors, setContractors] = useState([]);
  const [workItems, setWorkItems] = useState([]);
  
  const [error, setError] = useState(null);

  // Carga las listas para los <select> cuando el modal se abre
  useEffect(() => {
    // 2. Usa 'api.get' (ya está autenticado)
    api.get('/contractors/')
      .then(response => {
        setContractors(response.data); // Axios usa .data
      })
      .catch(err => setError('No se pudieron cargar los contratistas'));
      
    // 3. Usa 'api.get' (ya está autenticado)
    api.get(`/projects/${projectId}/work_items/`)
      .then(response => {
        setWorkItems(response.data); // Axios usa .data
      })
      .catch(err => setError('No se pudieron cargar las partidas'));
  }, [projectId]);

  // Rellenar formulario si es modo 'edit' (sin cambios)
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
      setFormData({
        contractor_id: '', work_item_id: '', numero_contrato: '', trabajos: '',
        contratado: 0, aditiva: 0, deductiva: 0, anticipo: 0, aplica_iva: true,
      });
    }
  }, [mode, initialData]);

  // Handlers de cambios (sin cambios)
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };
  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
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
      ? `/projects/${projectId}/contracts/` 
      : `/contracts/${initialData.id}`;
    const method = isNew ? 'post' : 'put'; // Métodos de Axios

    try {
      // 4. Usa 'api[method]' (ya está autenticado)
      const response = await api[method](url, contractData);
      
      onSave(response.data); // Avisa al padre
      onClose(); // Cierra el modal
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Error al guardar el contrato.');
      }
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
              {/* 5. Verificación de seguridad: 'workItems' ahora es un array vacío [] 
                   mientras carga, por lo que .map() funciona. */}
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

          {/* ... (Resto del formulario: No. Contrato, Montos, etc. sin cambios) ... */}
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