// src/components/budget/EstimatePage.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import EstimateModal from './EstimateModal'; 
const formatCurrency = (val) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val || 0);

function EstimatePage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [estimates, setEstimates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);
  const [filterContractor, setFilterContractor] = useState('');
  const [filterContract, setFilterContract] = useState('');
  const fetchEstimates = useCallback(async () => {
    try {
      const res = await api.get(`/projects/${projectId}/estimates/`);
      setEstimates(res.data);
    } catch (err) {
      setError('Error al cargar la lista de estimaciones.');
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    fetchEstimates();
  }, [fetchEstimates]);

  const handleSave = () => {
    fetchEstimates();
  };

  const handleRowClick = (estimateId) => {
    navigate(`/projects/${projectId}/budget/estimates/${estimateId}`);
  };

  const handleExport = async () => {
    try {
      const response = await api.get(`/projects/${projectId}/export-estimates/`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Estimaciones_Proyecto_${projectId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Error exportando:", err);
      alert("Error al exportar las estimaciones.");
    }
  };
  const handleImportClick = () => {
    fileInputRef.current.click();
  };
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setImporting(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      await api.post(`/projects/${projectId}/import-estimates/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert("Importación exitosa.");
      fetchEstimates();
    } catch (err) {
      console.error("Error importando:", err);
      alert(err.response?.data?.detail || "Error al importar el archivo.");
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  const uniqueContractors = [...new Map(estimates.map(e => [e.contract?.contractor?.id, e.contract?.contractor]).filter(pair => pair[0])).values()];
  const availableContracts = estimates
    .filter(e => !filterContractor || e.contract?.contractor?.id === parseInt(filterContractor))
    .map(e => e.contract)
    .filter((c, i, self) => c && self.findIndex(t => t.id === c.id) === i);
  const filteredEstimates = estimates.filter(e => {
    if (filterContractor && e.contract?.contractor?.id !== parseInt(filterContractor)) return false;
    if (filterContract && e.contract?.id !== parseInt(filterContract)) return false;
    return true;
  });

  const totals = filteredEstimates.reduce((acc, e) => {
    const montoEstimado = e.total_estimado || 0;
    let amortizado = e.amortizacion_anticipo || 0;
    if (!amortizado && e.contract) {
      const totalConIva = e.contract.total_con_iva ||
        (e.contract.total_ordinario * (e.contract.aplica_iva ? 1.16 : 1)) || 1;
      const anticipo = e.contract.anticipo || 0;
      if (totalConIva > 0 && anticipo > 0) {
        amortizado = montoEstimado * (anticipo / totalConIva);
      }
    }

    const fondoGarantia = e.fondo_garantia || 0;
    const deductivas = e.otras_deductivas || 0;
    const retenciones = e.otras_retenciones || 0;
    const subtotalNeto = montoEstimado - amortizado - fondoGarantia - deductivas - retenciones;
    const aplicaIVA = e.contract?.aplica_iva ?? true;
    const iva = aplicaIVA ? (subtotalNeto * 0.16) : 0;
    const totalPagar = subtotalNeto + iva;

    return {
      montoEstimado: acc.montoEstimado + montoEstimado,
      amortizado: acc.amortizado + amortizado,
      fondoGarantia: acc.fondoGarantia + fondoGarantia,
      deductivas: acc.deductivas + deductivas,
      retenciones: acc.retenciones + retenciones,
      subtotalNeto: acc.subtotalNeto + subtotalNeto,
      iva: acc.iva + iva,
      totalPagar: acc.totalPagar + totalPagar
    };
  }, {
    montoEstimado: 0, amortizado: 0, fondoGarantia: 0, deductivas: 0, retenciones: 0, subtotalNeto: 0, iva: 0, totalPagar: 0
  });

  if (loading) return <p>Cargando estimaciones...</p>;

  return (
    <div>
      <div className="page-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <h2>Estimaciones</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileChange}
              accept=".xlsx,.xls,.csv"
            />
            <button 
              onClick={handleExport} 
              title="Exportar Estimaciones"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px' }}
            >
              <img src="/icons/export.png" alt="Exportar Estimaciones" style={{ height: '34px', verticalAlign: 'middle' }} />
            </button>
            <button 
              onClick={handleImportClick} 
              title="Importar Estimaciones"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px' }}
              disabled={importing}
            >
              <img src="/icons/import.png" alt="Importar Estimaciones" style={{ height: '34px', verticalAlign: 'middle' }} />
            </button>
            <button 
              onClick={() => setShowModal(true)} 
              title="Nueva Estimación"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px' }}
            >
              <img src="/icons/new.png" alt="Nueva Estimación" style={{ height: '34px', verticalAlign: 'middle' }} />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '15px', background: '#f8f9fa', padding: '10px', borderRadius: '5px', width: '100%', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold', color: '#555' }}>Filtrar por:</span>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: '0.8rem', marginBottom: '2px' }}>Contratista</label>
            <select
              className="form-control"
              style={{ width: '200px', margin: 0 }}
              value={filterContractor}
              onChange={e => { setFilterContractor(e.target.value); setFilterContract(''); }}
            >
              <option value="">-- Todos --</option>
              {uniqueContractors.map(c => (
                <option key={c.id} value={c.id}>{c.razon_social}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: '0.8rem', marginBottom: '2px' }}>Contrato</label>
            <select
              className="form-control"
              style={{ width: '200px', margin: 0 }}
              value={filterContract}
              onChange={e => setFilterContract(e.target.value)}
            >
              <option value="">-- Todos --</option>
              {availableContracts.map(c => (
                <option key={c.id} value={c.id}>{c.numero_contrato}</option>
              ))}
            </select>
          </div>

          {(filterContractor || filterContract) && (
            <button
              className="btn-secondary"
              style={{ height: '35px', alignSelf: 'flex-end', padding: '0 10px' }}
              onClick={() => { setFilterContractor(''); setFilterContract(''); }}
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {filteredEstimates.length === 0 ? (
        <p style={{ marginTop: '20px' }}>No se encontraron estimaciones con los filtros seleccionados.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>No.</th>
              <th>Contrato</th>
              <th>Fecha</th>
              <th>Monto Est.</th>
              <th>Amort.</th>
              <th>F. Gtía</th>
              <th>Deductivas</th>
              <th>Retenciones</th>
              <th>Subtotal Neto</th>
              <th>IVA</th>
              <th>Total a Pagar</th>
            </tr>
          </thead>
          <tbody>
            {filteredEstimates.map(e => {
              const montoEstimado = e.total_estimado || 0;
              let amortizado = e.amortizacion_anticipo || 0;
              if (!amortizado && e.contract) {
                const totalConIva = e.contract.total_con_iva ||
                  (e.contract.total_ordinario * (e.contract.aplica_iva ? 1.16 : 1)) || 1;
                const anticipo = e.contract.anticipo || 0;
                if (totalConIva > 0 && anticipo > 0) {
                  amortizado = montoEstimado * (anticipo / totalConIva);
                }
              }

              const fondoGarantia = e.fondo_garantia || 0;
              const deductivas = e.otras_deductivas || 0;
              const retenciones = e.otras_retenciones || 0;
              const subtotalNeto = montoEstimado - amortizado - fondoGarantia - deductivas - retenciones;
              const aplicaIVA = e.contract?.aplica_iva ?? true;
              const iva = aplicaIVA ? (subtotalNeto * 0.16) : 0;
              const totalPagar = subtotalNeto + iva;

              return (
                <tr key={e.id} onDoubleClick={() => handleRowClick(e.id)} style={{ cursor: 'pointer' }} title="Doble clic para ver detalles">
                  <td>{e.numero_estimacion}</td>
                  <td title={e.contract?.contractor?.razon_social}>{e.contract?.numero_contrato || 'N/A'}</td>
                  <td>{e.fecha}</td>
                  <td>{formatCurrency(montoEstimado)}</td>
                  <td>{formatCurrency(amortizado)}</td>
                  <td>{formatCurrency(fondoGarantia)}</td>
                  <td>{formatCurrency(deductivas)}</td>
                  <td>{formatCurrency(retenciones)}</td>
                  <td style={{ fontWeight: 'bold' }}>{formatCurrency(subtotalNeto)}</td>
                  <td>{formatCurrency(iva)}</td>
                  <td style={{ fontWeight: 'bold', color: '#007bff' }}>{formatCurrency(totalPagar)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor: '#e9ecef', fontWeight: 'bold' }}>
              <td colSpan="3" style={{ textAlign: 'right' }}>TOTALES:</td>
              <td>{formatCurrency(totals.montoEstimado)}</td>
              <td>{formatCurrency(totals.amortizado)}</td>
              <td>{formatCurrency(totals.fondoGarantia)}</td>
              <td>{formatCurrency(totals.deductivas)}</td>
              <td>{formatCurrency(totals.retenciones)}</td>
              <td>{formatCurrency(totals.subtotalNeto)}</td>
              <td>{formatCurrency(totals.iva)}</td>
              <td style={{ color: '#007bff' }}>{formatCurrency(totals.totalPagar)}</td>
            </tr>
          </tfoot>
        </table>
      )}

      {showModal && (
        <EstimateModal
          mode="new"
          projectId={projectId}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

export default EstimatePage;