// src/components/budget/EstimatePage.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/axiosConfig'; // <-- 1. Importa 'api'
import EstimateModal from './EstimateModal';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(value);
};

function EstimatePage() {
  const { projectId } = useParams();
  
  const [estimates, setEstimates] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedId, setSelectedId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('new');
  
  const [importError, setImportError] = useState(null);
  const [importSuccess, setImportSuccess] = useState(null);
  const fileInputRef = useRef(null);
  
  const [filterContractorId, setFilterContractorId] = useState('all');
  const [filterContractId, setFilterContractId] = useState('all');

  // Carga inicial de datos
  const fetchEstimates = () => {
    setLoading(true);
    setError(null);  
    // Ahora usamos el endpoint correcto y eficiente que creamos en el backend
    api.get(`/projects/${projectId}/estimates/`)
      .then(res => {
        setEstimates(res.data); // Ya no necesitamos filtrar aquí
        setLoading(false);
      })
      .catch(err => {
        setError(err.response?.data?.detail || err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchEstimates();
  }, [projectId]);

  // --- Lógica de Filtros (Copiada de ContractPage, pero usa 'estimates') ---
  
  const uniqueContractors = useMemo(() => {
    const contractorMap = new Map();
    estimates.forEach(est => {
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
      if (est.contract && est.contract.contractor && est.contract.contractor.id == filterContractorId) {
        if (!contractMap.has(est.contract.id)) {
          contractMap.set(est.contract.id, est.contract);
        }
      }
    });
    return Array.from(contractMap.values());
  }, [estimates, filterContractorId]);

  const filteredEstimates = useMemo(() => {
    // --- INICIO DE LA MODIFICACIÓN: Lógica de filtrado y ordenamiento ---
    let items = [...estimates]; // Copiamos para no mutar el estado original

    // 1. Aplicar filtros
    if (filterContractId !== 'all') {
      items = items.filter(e => e.contract?.id == filterContractId);
    } else if (filterContractorId !== 'all') {
      items = items.filter(e => e.contract?.contractor?.id == filterContractorId);
    }

    // 2. Aplicar ordenamiento
    items.sort((a, b) => {
      const contractorA = a.contract?.contractor?.razon_social || '';
      const contractorB = b.contract?.contractor?.razon_social || '';
      const contractNumA = a.contract?.numero_contrato || '';
      const contractNumB = b.contract?.numero_contrato || '';
      const estNumA = a.numero_estimacion || '';
      const estNumB = b.numero_estimacion || '';

      // Primero, por nombre de contratista
      if (contractorA.localeCompare(contractorB) !== 0) {
        return contractorA.localeCompare(contractorB);
      }

      // Segundo, por número de contrato (alfabético)
      if (contractNumA.localeCompare(contractNumB) !== 0) {
        return contractNumA.localeCompare(contractNumB);
      }

      // Tercero, por número de estimación (alfanumérico)
      return estNumA.localeCompare(estNumB, undefined, { numeric: true, sensitivity: 'base' });
    });

    return items;
    // --- FIN DE LA MODIFICACIÓN ---
  }, [estimates, filterContractorId, filterContractId]);

  // --- Lógica de Totales (Basada en filteredEstimates) ---
  
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
    setFilterContractId('all');
  };
  
  const handleNew = () => { setModalMode('new'); setSelectedId(null); setIsModalOpen(true); };
  const handleEdit = () => { if (!selectedId) { alert('Seleccione una estimación para editar.'); return; } setModalMode('edit'); setIsModalOpen(true); };
  
  const handleSave = (savedEstimate) => {
    // --- INICIO DE LA CORRECCIÓN: Actualización Híbrida ---
    if (modalMode === 'new') {
      // Para una nueva estimación, es mejor recargar todo para obtener los datos anidados.
      fetchEstimates();
    } else {
      // Para una edición, actualizamos el estado localmente para ver los cambios al instante.
      setEstimates(prevEstimates =>
        prevEstimates.map(est => {
          if (est.id === savedEstimate.id) {
            // Combina los datos antiguos (con 'contract' y 'contractor') con los nuevos.
            return { ...est, ...savedEstimate };
          }
          return est;
        })
      );
    }
    setSelectedId(savedEstimate.id);
  };

  const handleDelete = async () => {
    if (!selectedId) { alert('Seleccione estimación'); return; }
    if (window.confirm('¿Borrar esta estimación?')) {
      try {
        await api.delete(`/estimates/${selectedId}`); // <-- 3. Usa 'api'
        setEstimates(estimates.filter(e => e.id !== selectedId));
        setSelectedId(null);
      } catch (err) { setError(err.message); }
    }
  };

  const handleExport = () => {
    const url = `${API_URL}/projects/${projectId}/estimates/export-excel/`;
    // (Asegúrate de que 'api.defaults.baseURL' no esté duplicado si usas 'api' aquí)
    // window.location.href es más simple para descargas
    window.location.href = url;
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
      // 4. Usa 'api.post' (ya está autenticado)
      const response = await api.post(`/projects/${projectId}/estimates/import-excel/`, formData);
      setImportSuccess(response.data.message);
      fetchEstimates(); // Recarga la tabla
    } catch (err) {
      setImportError(err.response?.data?.detail || "Error al importar.");
    }
    e.target.value = null;
  };

  const selectedEstimate = estimates.find(e => e.id === selectedId);

  return (
    <div>
      <div className="page-header">
        <h2>Estimaciones del Proyecto</h2>
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

      {/* --- Filtros --- */}
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
              {/* --- INICIO DE LA MODIFICACIÓN: Columnas reordenadas --- */}
              <th>Contratista</th>
              <th>Contrato</th>
              <th>No. Estimación</th>
              <th>Estimado</th>
              <th>Deductivas (-)</th>
              <th>Amortizado</th>
              <th>Fondo Garantía (-)</th>
              <th>Retenciones (-)</th>
              <th>Total</th>
              <th>IVA</th>
              <th>Total c/IVA</th>
              {/* --- FIN DE LA MODIFICACIÓN --- */}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan="11">Cargando...</td></tr>}
            
            {filteredEstimates.map(estimate => (
              <tr 
                key={estimate.id}
                className={estimate.id === selectedId ? 'selected' : ''}
                onClick={() => setSelectedId(estimate.id)}
              >
                {/* --- INICIO DE LA MODIFICACIÓN: Celdas reordenadas --- */}
                <td>{estimate.contract?.contractor?.razon_social}</td>
                <td>{estimate.contract?.numero_contrato}</td>
                <td>{estimate.numero_estimacion}</td>
                <td>{formatCurrency(estimate.estimado)}</td>
                <td>{formatCurrency(estimate.deductiva_estimacion)}</td>
                <td>{formatCurrency(estimate.amortizado)}</td>
                <td>{formatCurrency(estimate.fondo_garantia)}</td>
                <td>{formatCurrency(estimate.retenciones)}</td>
                <td><strong>{formatCurrency(estimate.total)}</strong></td>
                <td>{formatCurrency(estimate.iva)}</td>
                <td><strong>{formatCurrency(estimate.total_con_iva)}</strong></td>
                {/* --- FIN DE LA MODIFICACIÓN --- */}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ fontWeight: 'bold', backgroundColor: '#f8f9fa', borderTop: '2px solid #ddd' }}>
              <td colSpan="3" style={{ textAlign: 'right' }}>TOTALES:</td>
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