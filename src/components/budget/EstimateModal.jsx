// src/components/budget/EstimateModal.jsx
import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api/axiosConfig'; // <-- 1. Importa 'api'

// Helper para formatear moneda
const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(value);
};

// --- INICIO: Componente de Input de Moneda ---
function CurrencyInput({ label, value, onValueChange }) {
  const [displayValue, setDisplayValue] = useState(value === 0 ? '' : String(value));

  useEffect(() => {
    // Actualiza el display si el valor inicial cambia (ej. al editar)
    setDisplayValue(value === 0 ? '' : String(value));
  }, [value]);

  const handleInputChange = (e) => {
    const rawValue = e.target.value;
    // Permite solo números y un punto decimal
    if (/^\d*\.?\d*$/.test(rawValue)) {
      setDisplayValue(rawValue);
      const numericValue = parseFloat(rawValue) || 0;
    onValueChange(numericValue);
    }
  };

  const handleBlur = () => {
    setDisplayValue(value === 0 ? '' : formatCurrency(value).replace(/[^\d,.-]/g, ''));
  };

  return (
    <div className="form-group">
      <label>{label}</label>
      <div className="currency-input-wrapper">
        <span className="currency-symbol">$</span>
        <input type="text" value={displayValue} onChange={handleInputChange} onBlur={handleBlur} className="currency-input" />
      </div>
    </div>
  );
}
// --- FIN: Componente de Input de Moneda ---

function EstimateModal({ mode, projectId, initialData, onClose, onSave }) {
  // Estados del formulario
  const [formData, setFormData] = useState({
    contract_id: '',
    numero_estimacion: '',
    estimado: 0,
    deductiva_estimacion: 0,
    amortizado: 0,
    fondo_garantia: 0,
    retenciones: 0,
  });

  const [contracts, setContracts] = useState([]); // <-- Se inicializa como array vacío
  // --- INICIO DE LA MODIFICACIÓN ---
  const [selectedContractorId, setSelectedContractorId] = useState('');
  // --- FIN DE LA MODIFICACIÓN ---
  const [error, setError] = useState(null);

  // Carga la lista de Contratos cuando el modal se abre
  useEffect(() => {
    // 2. Usa 'api.get' (ya está autenticado)
    api.get(`/projects/${projectId}/contracts/`)
      .then(response => {
        setContracts(response.data); // Axios usa .data
      })
      .catch(err => {
        if (err.response && err.response.status === 404) {
          setError('No se encontraron contratos para este proyecto. Por favor, cree uno primero.');
        } else if (err.response && err.response.status === 403) {
          setError('No tiene permiso para ver los contratos de este proyecto.');
        } else {
          setError('No se pudieron cargar los contratos.');
        }
      });
  }, [projectId]);

  // Rellenar formulario si es modo 'edit' (sin cambios)
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setFormData({
        contract_id: initialData.contract_id,
        numero_estimacion: initialData.numero_estimacion || '',
        estimado: initialData.estimado || 0,
        deductiva_estimacion: initialData.deductiva_estimacion || 0,
        amortizado: initialData.amortizado || 0,
        fondo_garantia: initialData.fondo_garantia || 0,
        retenciones: initialData.retenciones || 0,
      });
      setSelectedContractorId(initialData.contract?.contractor_id || '');
    } else {
      setFormData({
        contract_id: '', numero_estimacion: '', estimado: 0, deductiva_estimacion: 0,
        amortizado: 0, fondo_garantia: 0, retenciones: 0,
      });
    }
  }, [mode, initialData]);

  // --- INICIO DE LA MODIFICACIÓN: Lógica de filtros ---
  const uniqueContractors = useMemo(() => {
    const contractorMap = new Map();
    contracts.forEach(c => {
      if (c.contractor && !contractorMap.has(c.contractor.id)) {
        contractorMap.set(c.contractor.id, c.contractor);
      }
    });
    return Array.from(contractorMap.values());
  }, [contracts]);

  const availableContracts = useMemo(() => {
    if (!selectedContractorId) return [];
    return contracts.filter(c => c.contractor && c.contractor.id == selectedContractorId);
  }, [contracts, selectedContractorId]);

  const handleContractorChange = (e) => {
    const newContractorId = e.target.value;
    setSelectedContractorId(newContractorId);
    // Resetea la selección de contrato cuando cambia el contratista
    setFormData(prev => ({ ...prev, contract_id: '' }));
  };
  const selectedContract = useMemo(() => {
    if (!formData.contract_id) return null;
    return contracts.find(c => c.id == formData.contract_id);
  }, [formData.contract_id, contracts]);

  const calculatedTotals = useMemo(() => {
    const subtotal = 
      formData.estimado - 
      formData.deductiva_estimacion - 
      formData.amortizado - 
      formData.fondo_garantia - 
      formData.retenciones;

    const ivaAplica = selectedContract?.aplica_iva ?? false;
    const ivaRate = 0.16; // 16%
    
    const iva = ivaAplica ? subtotal * ivaRate : 0;
    const totalConIva = subtotal + iva;

    return { iva, totalConIva };
  }, [formData, selectedContract]);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value, }));
  }; 
  // Actualiza el estado del formulario desde el CurrencyInput
  const handleCurrencyChange = (name, numericValue) => {
    setFormData(prev => ({ ...prev, [name]: numericValue }));
  }; 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.contract_id || !formData.numero_estimacion) {
      setError('Debe seleccionar un contrato y proporcionar un número de estimación.');
      return;
    }

    const estimateData = {
      ...formData,
      contract_id: parseInt(formData.contract_id, 10),
    };

    const isNew = mode === 'new';
    const url = isNew 
      ? `/projects/${projectId}/estimates/` 
      : `/estimates/${initialData.id}/`; // <-- CORRECCIÓN: URL para editar
    const method = isNew ? 'post' : 'put'; // Métodos de Axios

    try {
      // 3. Usa 'api[method]' (ya está autenticado)
      const response = await api[method](url, estimateData);
      
      onSave(response.data); // Avisa al padre
      onClose(); // Cierra el modal
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Error al guardar la estimación.');
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>{mode === 'new' ? 'Nueva Estimación' : 'Editar Estimación'}</h3>
        
        <form onSubmit={handleSubmit} className="card-form">
          {error && <p style={{ color: 'red' }}>{error}</p>}
          
          {/* --- INICIO DE LA MODIFICACIÓN: Nuevo filtro de contratista --- */}
          <div className="form-group">
            <label>Contratista:</label>
            <select value={selectedContractorId} onChange={handleContractorChange}>
              <option value="">-- Primero seleccione un contratista --</option>
              {uniqueContractors.map(c => (
                <option key={c.id} value={c.id}>
                  {c.razon_social}
                </option>
              ))}
            </select>
          </div>
          {/* --- FIN DE LA MODIFICACIÓN --- */}

          <div className="form-group">
            <label>Contrato (Tabla 3):</label>
            <select name="contract_id" value={formData.contract_id} onChange={handleChange} disabled={!selectedContractorId}>
              <option value="">-- Seleccione un Contrato --</option>
              {availableContracts.map(c => (
                <option key={c.id} value={c.id}>
                  {c.numero_contrato} ({c.trabajos})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Número de Estimación:</label>
            <input type="text" name="numero_estimacion" value={formData.numero_estimacion} onChange={handleChange} />
          </div>

          {/* ... (Resto del formulario: Montos, etc. sin cambios) ... */}
          <CurrencyInput 
            label="Monto Estimado:"
            value={formData.estimado}
            onValueChange={(val) => handleCurrencyChange('estimado', val)}
          />
          <CurrencyInput 
            label="Deductivas:"
            value={formData.deductiva_estimacion}
            onValueChange={(val) => handleCurrencyChange('deductiva_estimacion', val)}
          />
          <CurrencyInput 
            label="Amortización de Anticipo:"
            value={formData.amortizado}
            onValueChange={(val) => handleCurrencyChange('amortizado', val)}
          />
          <CurrencyInput 
            label="Fondo de Garantía:"
            value={formData.fondo_garantia}
            onValueChange={(val) => handleCurrencyChange('fondo_garantia', val)}
          />
          <CurrencyInput 
            label="Retenciones:"
            value={formData.retenciones}
            onValueChange={(val) => handleCurrencyChange('retenciones', val)}
          />

          {/* --- INICIO CAMPOS INFORMATIVOS --- */}
          <hr style={{ gridColumn: '1 / -1', borderTop: '1px solid #eee', margin: '1rem 0' }} />
          <div className="form-group">
            <label style={{color: '#6c757d'}}>IVA :</label>
            <input type="text" value={formatCurrency(calculatedTotals.iva)} readOnly disabled />
          </div>
          <div className="form-group">
            <label style={{color: '#6c757d', fontWeight: 'bold'}}>Total con IVA :</label>
            <input 
              type="text" 
              value={formatCurrency(calculatedTotals.totalConIva)} 
              readOnly disabled style={{ fontWeight: 'bold' }}/>
          </div>
          {/* --- FIN CAMPOS INFORMATIVOS --- */}
          
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