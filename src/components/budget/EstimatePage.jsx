// src/components/budget/EstimatePage.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import EstimateModal from './EstimateModal';
import api from '../../api/axiosConfig'; // Importa la instancia de axios configurada
 

// Helper para formatear moneda
const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(value);
};

function EstimatePage() {
  const { projectId } = useParams();
  
  // Estados de datos
  const [estimates, setEstimates] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Estados de UI
  const [selectedId, setSelectedId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('new');
  
  // Estados de Importación/Exportación
  const [importError, setImportError] = useState(null);
  const [importSuccess, setImportSuccess] = useState(null);
  const fileInputRef = useRef(null);
  
  // Estados de Filtros
  const [filterContractorId, setFilterContractorId] = useState('all');
  const [filterContractId, setFilterContractId] = useState('all');

  // Carga inicial de datos
  const fetchEstimates = async () => {
    setLoading(true);
    setError(null);
    try { // Usa la instancia 'api'
      const response = await api.get(`/projects/${projectId}/estimates/`);
      setEstimates(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEstimates();
  }, [projectId]);

  // --- Lógica de Filtros (NUEVO) ---
  
  const uniqueContractors = useMemo(() => {
    const contractorMap = new Map();
    estimates.forEach(est => {
      // Verificación de seguridad
      if (est.contract && est.contract.contractor && !contractorMap.has(est.contract.contractor.id)) {
        contractorMap.set(est.contract.contractor.id, est.contract.contractor);
      }
    });
    return Array.from(contractorMap.values());
  }, [estimates]);

  const availableContracts = useMemo(() => {
    if (filterContractorId === 'all') return [];
    const contractMap = new Map();
    estimates.forEach(est => {
      // Verificación de seguridad
      if (est.contract && est.contract.contractor && est.contract.contractor.id == filterContractorId) {
        if (!contractMap.has(est.contract.id)) {
          contractMap.set(est.contract.id, est.contract);
        }
      }
    });
    return Array.from(contractMap.values());
  }, [estimates, filterContractorId]);

  const filteredEstimates = useMemo(() => {
    let items = estimates;
    if (filterContractId !== 'all') {
      // Verificación de seguridad
      return items.filter(e => e.contract && e.contract.id == filterContractId);
    }
    if (filterContractorId !== 'all') {
      // Verificación de seguridad
      return items.filter(e => e.contract && e.contract.contractor && e.contract.contractor.id == filterContractorId);
    }
    return items;
  }, [estimates, filterContractorId, filterContractId]);

  // --- Lógica de Totales (NUEVO) ---
  
  const totals = useMemo(() => {
    return filteredEstimates.reduce((acc, est) => {
      acc.estimado += est.estimado;
      acc.deductiva_estimacion += est.deductiva_estimacion;
      acc.amortizado += est.amortizado;
      acc.fondo_garantia += est.fondo_garantia;
      acc.retenciones += est.retenciones;
      acc.total += est.total;
      acc.iva += est.iva;
      acc.total_con_iva += est.total_con_iva;
      return acc;
    }, {
      estimado: 0, deductiva_estimacion: 0, amortizado: 0, fondo_garantia: 0,
      retenciones: 0, total: 0, iva: 0, total_con_iva: 0,
    });
  }, [filteredEstimates]);

  // --- Handlers ---
  
  const handleContractorFilterChange = (e) => {
    setFilterContractorId(e.target.value);
    setFilterContractId('all'); // Resetea subfiltro
  };
  
  const handleNew = () => { setModalMode('new'); setSelectedId(null); setIsModalOpen(true); };
  const handleEdit = () => { if (!selectedId) { alert('Seleccione estimación'); return; } setModalMode('edit'); setIsModalOpen(true); };
  const handleSave = (savedEstimate) => { fetchEstimates(); setSelectedId(savedEstimate.id); };

  const handleDelete = async () => {
    if (!selectedId) { alert('Seleccione estimación'); return; }
    if (window.confirm('¿Borrar esta estimación?')) {
      try {
        await api.delete(`/estimates/${selectedId}`); // Usa la instancia 'api'
        setEstimates(estimates.filter(e => e.id !== selectedId));
        setSelectedId(null);
      } catch (err) { 
        setError(err.response?.data?.detail || err.message); 
      }
    }
  };

  const handleExport = () => { // Prepend api.defaults.baseURL for direct navigation
    const url = `/projects/${projectId}/estimates/export-excel/`;
    window.location.href = api.defaults.baseURL + url;
  };

  const triggerFileSelect = () => {
    fileInputRef.current.click();
  };

  const handleFileImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportError(null); setImportSuccess(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post(`/projects/${projectId}/estimates/import-excel/`, formData, { // Usa la instancia 'api'
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setImportSuccess(response.data.message);
      fetchEstimates(); // Recarga la tabla
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Error al importar.';
      setImportError(errorMsg);
    }
    e.target.value = null;
  };

  const selectedEstimate = estimates.find(e => e.id === selectedId);

  return (
    <div>
      <div className="page-header">
        <h2>Estimaciones del Proyecto</h2>
        {/* --- Botones Importar/Exportar añadidos --- */}
        <div className="page-actions">
          <button className="btn-new" onClick={handleNew}>Nueva Estimación</button>
          <button className="btn-modify" onClick={handleEdit}>Editar Estimación</button>
          <button className="btn-delete" onClick={handleDelete}>Borrar Estimación</button>
          <button 
            className="btn-import" 
            style={{backgroundColor: '#17a2b8', color: 'white'}}
            onClick={triggerFileSelect}
          >
            Importar
          </button>
          <button 
            className="btn-export" 
            style={{backgroundColor: '#28a745', color: 'white'}} 
            onClick={handleExport}
          >
            Exportar
          </button>
        </div>
      </div>

      {/* --- Input oculto y mensajes de feedback --- */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileImport}
        style={{ display: 'none' }}
        accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      />
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {importError && <p style={{ color: 'red' }}>Error de Importación: {importError}</p>}
      {importSuccess && <p style={{ color: 'green' }}>{importSuccess}</p>}

      {/* --- Filtros Añadidos --- */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label htmlFor="contractorFilter" style={{ fontWeight: 'bold' }}>Filtrar por Contratista:</label>
          <select
            id="contractorFilter"
            value={filterContractorId}
            onChange={handleContractorFilterChange}
          >
            <option value="all">-- Mostrar Todos --</option>
            {uniqueContractors.map(contractor => (
              <option key={contractor.id} value={contractor.id}>
                {contractor.razon_social}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label htmlFor="contractFilter" style={{ fontWeight: 'bold' }}>Filtrar por Contrato:</label>
          <select
            id="contractFilter"
            value={filterContractId}
            onChange={(e) => setFilterContractId(e.target.value)}
            disabled={filterContractorId === 'all'}
          >
            <option value="all">-- Mostrar Todos los de este Contratista --</option>
            {availableContracts.map(contract => (
              <option key={contract.id} value={contract.id}>
                {contract.numero_contrato}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="data-table" style={{ minWidth: '1200px' }}>
          <thead>
            <tr>
              <th>Contrato</th>
              <th>Contratista</th> {/* <-- COLUMNA NUEVA --- */}
              <th>Estimado</th>
              <th>Deductivas (-)</th>
              <th>Amortizado</th>
              <th>Fondo Garantía (-)</th>
              <th>Retenciones (-)</th>
              <th>Total</th>
              <th>IVA</th>
              <th>Total c/IVA</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan="10">Cargando...</td></tr>}
            
            {/* Usamos filteredEstimates para renderizar */}
            {filteredEstimates.map(estimate => (
              <tr 
                key={estimate.id}
                className={estimate.id === selectedId ? 'selected' : ''}
                onClick={() => setSelectedId(estimate.id)}
              >
                {/* Usamos 'optional chaining' (?) por seguridad */}
                <td>{estimate.contract?.numero_contrato}</td>
                <td>{estimate.contract?.contractor?.razon_social}</td> {/* <-- CELDA NUEVA --- */}
                <td>{formatCurrency(estimate.estimado)}</td>
                <td>{formatCurrency(estimate.deductiva_estimacion)}</td>
                <td>{formatCurrency(estimate.amortizado)}</td>
                <td>{formatCurrency(estimate.fondo_garantia)}</td>
                <td>{formatCurrency(estimate.retenciones)}</td>
                <td><strong>{formatCurrency(estimate.total)}</strong></td>
                <td>{formatCurrency(estimate.iva)}</td>
                <td><strong>{formatCurrency(estimate.total_con_iva)}</strong></td>
              </tr>
            ))}
          </tbody>
          {/* --- Fila de Totales Añadida --- */}
          <tfoot>
            <tr style={{ fontWeight: 'bold', backgroundColor: '#f8f9fa', borderTop: '2px solid #ddd' }}>
              <td colSpan="2" style={{ textAlign: 'right' }}>TOTALES:</td>
              <td>{formatCurrency(totals.estimado)}</td>
              <td>{formatCurrency(totals.deductiva_estimacion)}</td>
              <td>{formatCurrency(totals.amortizado)}</td>
              <td>{formatCurrency(totals.fondo_garantia)}</td>
              <td>{formatCurrency(totals.retenciones)}</td>
              <td><strong>{formatCurrency(totals.total)}</strong></td>
              <td>{formatCurrency(totals.iva)}</td>
              <td><strong>{formatCurrency(totals.total_con_iva)}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {isModalOpen && (
        <EstimateModal
          mode={modalMode}
          projectId={projectId}
          initialData={selectedEstimate}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

export default EstimatePage;