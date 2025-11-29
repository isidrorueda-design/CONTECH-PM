import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api/axiosConfig';

const formatCurrency = (value) => {
  if (typeof value !== 'number') value = 0;
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
};

function CurrencyInput({ label, value, onValueChange, placeholder }) {
  const [displayValue, setDisplayValue] = useState(value ? String(value) : '');
  useEffect(() => {
    setDisplayValue(value ? String(value) : '');
  }, [value]);

  const handleInputChange = (e) => {
    const rawValue = e.target.value;
    if (/^\d*\.?\d{0,2}$/.test(rawValue)) {
      setDisplayValue(rawValue);
      onValueChange(rawValue);
    }
  };
  const handleBlur = () => {
    const numericValue = parseFloat(value) || 0;
    setDisplayValue(numericValue > 0 ? numericValue.toFixed(2) : '');
  };

  return (
    <div className="form-group">
      <label>{label}</label>
      <div className="currency-input-wrapper">
        <span className="currency-symbol">$</span>
        <input type="text" value={displayValue} onChange={handleInputChange} onBlur={handleBlur} placeholder={placeholder} className="currency-input" />
      </div>
    </div>
  );
}

function ContractModal({ mode, projectId, initialData, onClose, onSave }) {  
  const [formData, setFormData] = useState({
    contractor_id: '',
    numero_contrato: '',
    trabajos: '',
    monto_contratado_manual: '',
    aplica_iva: true,
    status: 'Borrador',
    external_url: '',
    dms_folder_id: '',
    work_item_id: '',
    anticipo: '',
  });
  
  const [contractors, setContractors] = useState([]);
  const [folders, setFolders] = useState([]);
  const [workItems, setWorkItems] = useState([]);  
  const [error, setError] = useState(null);
  const calculatedValues = useMemo(() => {
    const monto = parseFloat(formData.monto_contratado_manual) || 0;
    const aplicaIVA = formData.aplica_iva;
    const iva = aplicaIVA ? (monto * 0.16) : 0;
    const totalConIVA = monto + iva;
    return { iva, totalConIVA };
  }, [formData.monto_contratado_manual, formData.aplica_iva]);

  useEffect(() => {
    api.get('/contractors/')
      .then(res => setContractors(res.data))
      .catch(err => setError('No se pudieron cargar los contratistas'));
      
    api.get(`/projects/${projectId}`)
      .then(res => setFolders(res.data.folders))
      .catch(err => setError('No se pudieron cargar las carpetas'));

    api.get(`/projects/${projectId}/work_items/`)
      .then(res => setWorkItems(res.data))
      .catch(err => setError('No se pudieron cargar las Partidas (WorkItems)'));

  }, [projectId]);

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      const montoBase = (initialData.total_contratado_vigente > 0)
        ? initialData.total_contratado_vigente
        : initialData.monto_contratado_manual;
      setFormData({
        contractor_id: initialData.contractor_id,
        numero_contrato: initialData.numero_contrato || '',
        trabajos: initialData.trabajos || '',
        monto_contratado_manual: montoBase || '',
        aplica_iva: initialData.aplica_iva,
        status: initialData.status || 'Borrador',
        external_url: initialData.external_url || '',
        dms_folder_id: initialData.dms_folder_id || '',
        work_item_id: initialData.work_item_id || '',
        anticipo: initialData.anticipo || '',
      });
    } else {
      setFormData({
        contractor_id: '', numero_contrato: '', trabajos: '',
        monto_contratado_manual: '', aplica_iva: true, status: 'Borrador', 
        external_url: '', dms_folder_id: '', work_item_id: '', anticipo: ''
      });
    }
  }, [mode, initialData]);
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCurrencyChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.contractor_id || !formData.numero_contrato) {
      setError('Contratista y Número de Contrato son obligatorios.');
      return;
    }

    const contractData = {
      ...formData,
      monto_contratado_manual: parseFloat(formData.monto_contratado_manual) || 0,
      dms_folder_id: formData.dms_folder_id ? parseInt(formData.dms_folder_id) : null,
      work_item_id: formData.work_item_id ? parseInt(formData.work_item_id) : null,
      anticipo: parseFloat(formData.anticipo) || 0,
      iva: calculatedValues.iva,
      total_con_iva: calculatedValues.totalConIVA,
    };

    const isNew = mode === 'new';
    const url = isNew 
      ? `/projects/${projectId}/contracts/` 
      : `/contracts/${initialData.id}`;
    const method = isNew ? 'post' : 'put';

    try {
      const response = await api[method](url, contractData);
      onSave(response.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al guardar el contrato.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>{mode === 'new' ? 'Nuevo Contrato' : 'Editar Contrato'}</h3>        
        <form onSubmit={handleSubmit} className="card-form">
          {error && <p style={{ color: 'red' }}>{error}</p>}          
          <div className="form-group">
            <label>Contratista:</label>
            <select name="contractor_id" value={formData.contractor_id} onChange={handleChange} required>
              <option value="">-- Seleccione un Contratista --</option>
              {contractors.map(c => (
                <option key={c.id} value={c.id}>{c.razon_social}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Partida (Clasificación, ej: Cimentación):</label>
            <select name="work_item_id" value={formData.work_item_id} onChange={handleChange}>
              <option value="">-- Sin asignar --</option>
              {workItems.map(w => (
                <option key={w.id} value={w.id}>{w.item_code} - {w.description}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Número de Contrato:</label>
            <input type="text" name="numero_contrato" value={formData.numero_contrato} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Trabajos (Descripción):</label>
            <input type="text" name="trabajos" value={formData.trabajos} onChange={handleChange} />
          </div>

          <CurrencyInput
            label="Monto Contratado:"
            value={formData.monto_contratado_manual}
            onValueChange={(val) => handleCurrencyChange('monto_contratado_manual', val)}
            placeholder="0.00"
          />
          
          <CurrencyInput
            label="Anticipo:"
            value={formData.anticipo}
            onValueChange={(val) => handleCurrencyChange('anticipo', val)}
            placeholder="0.00"
          />

          <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center' }}>
            <input type="checkbox" id="aplica_iva" name="aplica_iva" checked={formData.aplica_iva} onChange={handleChange} />
            <label htmlFor="aplica_iva" style={{ marginBottom: 0, marginLeft: '8px' }}>¿Aplica IVA?</label>
          </div>          
          <div className="form-group"><label>IVA:</label><input type="text" value={formatCurrency(calculatedValues.iva)} readOnly disabled /></div>          
          <div className="form-group"><label>Total con IVA:</label><input type="text" value={formatCurrency(calculatedValues.totalConIVA)} readOnly disabled /></div>
          <div className="form-group">
            <label>Carpeta de Documentos (Opcional):</label>
            <select name="dms_folder_id" value={formData.dms_folder_id} onChange={handleChange}>
              <option value="">-- Sin vincular --</option>
              {folders.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>URL Externa (Opcional):</label>
            <input type="text" name="external_url" value={formData.external_url} onChange={handleChange} placeholder="https://drive.google.com/..." />
          </div>
          
          <div className="form-group">
            <label>Status:</label>
            <select name="status" value={formData.status} onChange={handleChange}>
              <option value="Borrador">Borrador</option>
              <option value="Contratado">Contratado</option>
              <option value="En Proceso">En Proceso</option>
              <option value="Terminado">Terminado</option>
              <option value="Cerrado">Cerrado</option>
            </select>
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