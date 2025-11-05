import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import ContractModal from './ContractModal';
import api from '../../api/axiosConfig'; // Importa la instancia de axios configurada
 

// Helper para formatear moneda
const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(value);
};

function ContractPage() {
  const { projectId } = useParams(); 
  
  const [contracts, setContracts] = useState([]);
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
  
  const fetchContracts = async () => {
    setLoading(true);
    setError(null);
    try { // Usa la instancia 'api'
      const response = await api.get(`/projects/${projectId}/contracts/`);
      setContracts(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [projectId]);

  // --- Lógica de Filtros (Corregida con Verificaciones) ---

  const uniqueContractors = useMemo(() => {
    const contractorMap = new Map();
    contracts.forEach(contract => {
      // 1. CORRECCIÓN: Verifica que 'contract.contractor' exista
      if (contract.contractor && !contractorMap.has(contract.contractor.id)) {
        contractorMap.set(contract.contractor.id, contract.contractor);
      }
    });
    return Array.from(contractorMap.values());
  }, [contracts]);

  const availableContracts = useMemo(() => {
    if (filterContractorId === 'all') {
      return []; 
    }
    // 2. CORRECCIÓN: Verifica que 'contract.contractor' exista
    return contracts.filter(
      contract => contract.contractor && contract.contractor.id == filterContractorId
    );
  }, [contracts, filterContractorId]);

  const filteredContracts = useMemo(() => {
    if (filterContractId !== 'all') {
      return contracts.filter(c => c.id == filterContractId);
    }
    if (filterContractorId !== 'all') {
      // 3. CORRECCIÓN: Verifica que 'c.contractor' exista
      return contracts.filter(c => c.contractor && c.contractor.id == filterContractorId);
    }
    return contracts;
  }, [contracts, filterContractorId, filterContractId]);

  // Cálculo de totales (sin cambios)
  const totals = useMemo(() => {
    return filteredContracts.reduce((acc, contract) => {
      acc.contratado += contract.contratado;
      acc.aditiva += contract.aditiva;
      acc.deductiva += contract.deductiva;
      acc.total += contract.total;
      acc.iva += contract.iva;
      acc.total_con_iva += contract.total_con_iva;
      acc.anticipo += contract.anticipo;
      return acc;
    }, {
      contratado: 0, aditiva: 0, deductiva: 0, total: 0,
      iva: 0, total_con_iva: 0, anticipo: 0,
    });
  }, [filteredContracts]); 

  // Handlers (sin cambios)
  const handleContractorFilterChange = (e) => {
    setFilterContractorId(e.target.value);
    setFilterContractId('all');
  };
  const handleNew = () => { setModalMode('new'); setSelectedId(null); setIsModalOpen(true); };
  const handleEdit = () => { if (!selectedId) { alert('Seleccione contrato'); return; } setModalMode('edit'); setIsModalOpen(true); };
  const handleDelete = async () => { 
    if (!selectedId) {
      alert('Por favor, seleccione un contrato para borrar.');
      return;
    }
    if (window.confirm('¿Está seguro de que quiere borrar este contrato? (No se podrá borrar si tiene estimaciones asociadas)')) {
      try { // Usa la instancia 'api'
        await api.delete(`/contracts/${selectedId}`);
        setContracts(contracts.filter(c => c.id !== selectedId));
        setSelectedId(null);
      } catch (err) {
        const errorMsg = err.response?.data?.detail || 'No se pudo borrar. Es posible que esté en uso en una estimación.';
        setError(errorMsg);
      }
    }
  };
  const handleSave = (savedContract) => { fetchContracts(); setSelectedId(savedContract.id); };
  const handleExport = () => { // Prepend api.defaults.baseURL for direct navigation
    const url = `/projects/${projectId}/contracts/export-excel/`;
    window.location.href = api.defaults.baseURL + url;
  };
  const triggerFileSelect = () => { fileInputRef.current.click(); };

  // --- Función de Importación (Corregida) ---
  const handleFileImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImportError(null);
    setImportSuccess(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Usa la instancia 'api' con ruta relativa
      const response = await api.post(`/projects/${projectId}/contracts/import-excel/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setImportSuccess(response.data.message);
      fetchContracts(); // Refresca la tabla

    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Error al importar el archivo.';
      setImportError(errorMsg);
    }
    
    e.target.value = null;
  };

  const selectedContract = contracts.find(c => c.id === selectedId);

  return (
    <div>
      <div className="page-header">
        <h2>Contratos del Proyecto</h2>
        <div className="page-actions">
          <button className="btn-new" onClick={handleNew}>Nuevo Contrato</button>
          <button className="btn-modify" onClick={handleEdit}>Editar Contrato</button>
          <button className="btn-delete" onClick={handleDelete}>Borrar Contrato</button>
          <button 
            className="btn-import" 
            style={{backgroundColor: '#17a2b8', color: 'white'}}
            onClick={triggerFileSelect}
          >
            Importar
          </button>
          <button className="btn-export" style={{backgroundColor: '#28a745', color: 'white'}} onClick={handleExport}>Exportar</button>
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
      
      {/* Filtros */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label htmlFor="contractorFilter" style={{ fontWeight: 'bold' }}>Filtrar por Contratista:</label>
          <select id="contractorFilter" value={filterContractorId} onChange={handleContractorFilterChange}>
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
          <select id="contractFilter" value={filterContractId} onChange={(e) => setFilterContractId(e.target.value)} disabled={filterContractorId === 'all'}>
            <option value="all">-- Mostrar Todos los de este Contratista --</option>
            {availableContracts.map(contract => (
              <option key={contract.id} value={contract.id}>
                {contract.numero_contrato} ({contract.trabajos})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla de Datos */}
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table" style={{ minWidth: '1200px' }}>
          <thead>
            <tr>
              <th>No. Contrato</th>
              <th>Contratista</th>
              <th>Partida</th>
              <th>Trabajos</th>
              <th>Contratado</th>
              <th>Aditiva (+)</th>
              <th>Deductiva (-)</th>
              <th>Total</th>
              <th>IVA</th>
              <th>Total c/IVA</th>
              <th>Anticipo</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan="11">Cargando...</td></tr>}
            
            {filteredContracts.map(contract => (
              <tr 
                key={contract.id}
                className={contract.id === selectedId ? 'selected' : ''}
                onClick={() => setSelectedId(contract.id)}
              >
                <td>{contract.numero_contrato}</td>
                {/* 5. CORRECCIÓN: "Optional Chaining" para evitar crasheos */}
                <td>{contract.contractor?.razon_social}</td>
                <td>{contract.work_item?.item_code}</td>
                <td>{contract.trabajos}</td>
                <td>{formatCurrency(contract.contratado)}</td>
                <td>{formatCurrency(contract.aditiva)}</td>
                <td>{formatCurrency(contract.deductiva)}</td>
                <td><strong>{formatCurrency(contract.total)}</strong></td>
                <td>{formatCurrency(contract.iva)}</td>
                <td><strong>{formatCurrency(contract.total_con_iva)}</strong></td>
                <td>{formatCurrency(contract.anticipo)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ fontWeight: 'bold', backgroundColor: '#f8f9fa', borderTop: '2px solid #ddd' }}>
              <td colSpan="4" style={{ textAlign: 'right' }}>TOTALES:</td>
              <td>{formatCurrency(totals.contratado)}</td>
              <td>{formatCurrency(totals.aditiva)}</td>
              <td>{formatCurrency(totals.deductiva)}</td>
              <td><strong>{formatCurrency(totals.total)}</strong></td>
              <td>{formatCurrency(totals.iva)}</td>
              <td><strong>{formatCurrency(totals.total_con_iva)}</strong></td>
              <td>{formatCurrency(totals.anticipo)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <ContractModal
          mode={modalMode}
          projectId={projectId}
          initialData={selectedContract}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

export default ContractPage;