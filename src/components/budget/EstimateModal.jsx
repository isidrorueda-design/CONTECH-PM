// src/components/budget/EstimateModal.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';

const formatCurrency = (value) => {
  if (typeof value !== 'number') return '$0.00';
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
};

function EstimateModal({ mode, projectId, initialData, onClose, onSave }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    contract_id: '',
    numero_estimacion: '',
    fecha: new Date().toISOString().split('T')[0],
    monto_estimado_manual: '',
    otras_deductivas: '',
    amortizacion_anticipo: '',
    fondo_garantia: '',
    otras_retenciones: '',
    amortizacion_manual: false,
    fondo_manual: false,
    fondo_garantia_porcentaje: '7.5',
  });

  const [contracts, setContracts] = useState([]);
  const [error, setError] = useState(null);
  const [filterContractor, setFilterContractor] = useState('');

  useEffect(() => {
    api.get(`/projects/${projectId}/contracts/`)
      .then(res => setContracts(res.data))
      .catch(err => setError('Error al cargar contratos'));
  }, [projectId]);

  useEffect(() => {
    if (mode === 'edit' && initialData) {

      const baseValue = initialData.total_items_calculado > 0
        ? initialData.total_items_calculado
        : (initialData.monto_estimado_manual || 0);

      setFormData({
        contract_id: initialData.contract_id || '',
        numero_estimacion: initialData.numero_estimacion || '',
        fecha: initialData.fecha || new Date().toISOString().split('T')[0],
        monto_estimado_manual: baseValue.toString(),
        otras_deductivas: (initialData.otras_deductivas || 0).toString(),
        amortizacion_anticipo: (initialData.amortizacion_anticipo || 0).toString(),
        fondo_garantia: (initialData.fondo_garantia || 0).toString(),
        otras_retenciones: (initialData.otras_retenciones || 0).toString(),
        amortizacion_manual: initialData.amortizacion_manual || false,
        fondo_manual: initialData.fondo_manual || false,
        fondo_garantia_porcentaje: initialData.fondo_garantia_porcentaje || '7.5',
      });
    }
  }, [mode, initialData]);

  const calculations = useMemo(() => {
    const estimadoManual = parseFloat(formData.monto_estimado_manual) || 0;
    const deductiva = parseFloat(formData.otras_deductivas) || 0;
    const retenciones = parseFloat(formData.otras_retenciones) || 0;
    const selectedContract = contracts.find(c => c.id == formData.contract_id);
    const aplicaIVA = selectedContract ? selectedContract.aplica_iva : true;
    let amortizacionCalculada = 0;
    if (selectedContract) {
      const totalConIva = selectedContract.total_con_iva ||
        (selectedContract.total_ordinario * (selectedContract.aplica_iva ? 1.16 : 1)) ||
        1;

      const anticipo = selectedContract.anticipo || 0;

      if (totalConIva > 0) {
        const factorAmortizacion = anticipo / totalConIva;
        amortizacionCalculada = estimadoManual * factorAmortizacion;
      }
    }

    const amortizadoFinal = formData.amortizacion_manual
      ? (parseFloat(formData.amortizacion_anticipo) || 0)
      : amortizacionCalculada;

    const fondoGarantiaCalculado = estimadoManual * (parseFloat(formData.fondo_garantia_porcentaje) / 100);
    const fondoGarantiaFinal = formData.fondo_manual
      ? (parseFloat(formData.fondo_garantia) || 0)
      : fondoGarantiaCalculado;

    const subtotalNeto = estimadoManual - amortizadoFinal - fondoGarantiaFinal - deductiva - retenciones;
    const iva = aplicaIVA ? (subtotalNeto * 0.16) : 0;
    const total = subtotalNeto + iva;

    return {
      amortizado: amortizadoFinal,
      fondoGarantia: fondoGarantiaFinal,
      subtotalNeto, iva, total
    };
  }, [formData, contracts]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'amortizacion_manual' || name === 'fondo_manual') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.contract_id || !formData.numero_estimacion) {
      setError('Contrato y Número de Estimación son obligatorios.');
      return;
    }

    const payload = {
      ...formData,
      contract_id: parseInt(formData.contract_id),
      amortizacion_anticipo: calculations.amortizado,
      fondo_garantia: calculations.fondoGarantia,
      monto_estimado_manual: parseFloat(formData.monto_estimado_manual) || 0,
      otras_deductivas: parseFloat(formData.otras_deductivas) || 0,
      otras_retenciones: parseFloat(formData.otras_retenciones) || 0,
    };

    delete payload.amortizacion_manual;
    delete payload.fondo_manual;
    delete payload.fondo_garantia_porcentaje;
    const isNew = mode === 'new';
    const url = isNew ? `/projects/${projectId}/estimates/` : `/estimates/${initialData.id}`;
    const method = isNew ? 'post' : 'put';

    try {
      const response = await api[method](url, payload);
      navigate(`/projects/${projectId}/budget/estimates/${response.data.id}`);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al guardar.');
    }
  };

  const uniqueContractors = useMemo(() => {
    if (!contracts.length) return [];
    const contractorMap = new Map();
    contracts.forEach(c => {
      if (c.contractor && !contractorMap.has(c.contractor.id)) {
        contractorMap.set(c.contractor.id, c.contractor);
      }
    });
    return Array.from(contractorMap.values()).sort((a, b) => a.razon_social.localeCompare(b.razon_social));
  }, [contracts]);

  const availableContracts = useMemo(() => {
    if (!filterContractor) {
      return [];
    }
    return contracts.filter(c => c.contractor?.id === parseInt(filterContractor));
  }, [contracts, filterContractor]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>{mode === 'new' ? 'Nueva Estimación' : 'Editar Encabezado'}</h3>

        <form onSubmit={handleSubmit} className="card-form">
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: '1 1 200px' }}>
              <label>Contratista:</label>
              <select
                value={filterContractor}
                onChange={e => {
                  setFilterContractor(e.target.value);
                  handleChange({ target: { name: 'contract_id', value: '' } });
                }}
                disabled={mode === 'edit'}
              >
                <option value="">-- Seleccione Contratista --</option>
                {uniqueContractors.map(c => <option key={c.id} value={c.id}>{c.razon_social}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ flex: '1 1 200px' }}>
              <label>Contrato:</label>
              <select name="contract_id" value={formData.contract_id} onChange={handleChange} disabled={mode === 'edit' || !filterContractor} required>
                <option value="">-- Seleccione --</option>
                {availableContracts.map(c => <option key={c.id} value={c.id}>{c.numero_contrato}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ width: '150px' }}>
              <label>No. Estimación:</label>
              <input type="text" name="numero_estimacion" value={formData.numero_estimacion} onChange={handleChange} required />
            </div>
            <div className="form-group" style={{ width: '150px' }}>
              <label>Fecha:</label>
              <input type="date" name="fecha" value={formData.fecha} onChange={handleChange} />
            </div>
          </div>

          <hr style={{ margin: '10px 0' }} />
          <div className="form-group full-width">
            <label>Monto Estimado:</label>
            <input type="number" name="monto_estimado_manual" value={formData.monto_estimado_manual} onChange={handleChange} step="any" placeholder="0.00" required />
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', border: '1px solid #ddd', padding: '10px', borderRadius: '4px', marginBottom: '10px' }}>

            <div className="form-group" style={{ flex: 1, borderBottom: 'none' }}>
              <label>Amortización (Anticipo):</label>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="number"
                  name="amortizacion_anticipo"
                  value={formData.amortizacion_manual ? formData.amortizacion_anticipo : calculations.amortizado.toFixed(2)}
                  onChange={handleChange}
                  step="any"
                  disabled={!formData.amortizacion_manual}
                />
                <button type="button" onClick={() => setFormData(p => ({ ...p, amortizacion_manual: !p.amortizacion_manual }))} style={{ marginLeft: '10px', padding: '5px 10px', fontSize: '0.8rem' }}>
                  {formData.amortizacion_manual ? 'Automático' : 'Manual'}
                </button>
              </div>
              <small style={{ color: '#888' }}>Cálculo: {calculations.amortizado.toFixed(2)}</small>
            </div>

            <div className="form-group" style={{ flex: 1, borderBottom: 'none' }}>
              <label>Fondo Garantía:</label>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <select name="fondo_garantia_porcentaje" value={formData.fondo_garantia_porcentaje} onChange={handleChange} disabled={formData.fondo_manual} style={{ width: '60px', marginRight: '5px' }}>
                  <option value="7.5">7.5%</option>
                  <option value="5">5%</option>
                  <option value="0">0%</option>
                </select>
                <input
                  type="number"
                  name="fondo_garantia"
                  value={formData.fondo_manual ? formData.fondo_garantia : calculations.fondoGarantia.toFixed(2)}
                  onChange={handleChange}
                  step="any"
                  disabled={!formData.fondo_manual}
                />
                <button type="button" onClick={() => setFormData(p => ({ ...p, fondo_manual: !p.fondo_manual }))} style={{ marginLeft: '10px', padding: '5px 10px', fontSize: '0.8rem' }}>
                  {formData.fondo_manual ? 'Automático' : 'Manual'}
                </button>
              </div>
              <small style={{ color: '#888' }}>Cálculo: {calculations.fondoGarantia.toFixed(2)}</small>
            </div>

          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Otras Deductivas (-):</label>
              <input type="number" name="otras_deductivas" value={formData.otras_deductivas} onChange={handleChange} step="any" />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Otras Retenciones (-):</label>
              <input type="number" name="otras_retenciones" value={formData.otras_retenciones} onChange={handleChange} step="any" />
            </div>
          </div>

          <div style={{ background: '#e9f7f0', padding: '10px', borderRadius: '4px', marginTop: '10px' }}>
            <p style={{ margin: '5px 0' }}>Subtotal Neto: <strong>{formatCurrency(calculations.subtotalNeto)}</strong></p>
            <p style={{ margin: '5px 0' }}>IVA: <strong>{formatCurrency(calculations.iva)}</strong></p>
            <p style={{ margin: '5px 0', fontSize: '1.1rem' }}>Total a Pagar: <strong>{formatCurrency(calculations.total)}</strong></p>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-save">Guardar y Continuar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EstimateModal;