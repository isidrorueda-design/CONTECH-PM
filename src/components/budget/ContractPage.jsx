// src/components/budget/ContractPage.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; 
import api from '../../api/axiosConfig';
import ContractModal from './ContractModal'; // (Lo usamos para 'Nuevo')

// Helper de formato
const formatCurrency = (value) => {
  if (typeof value !== 'number') value = 0;
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(value);
};

function ContractPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();  
  const [contracts, setContracts] = useState([]);
  const [error, setError] = useState(null);
  const [workItems, setWorkItems] = useState([]); // Estado para las partidas
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [modalMode, setModalMode] = useState('new');
  const [filterContractorId, setFilterContractorId] = useState('all');
  const fileInputRef = useRef(null);
  const [importError, setImportError] = useState(null);
  const [importSuccess, setImportSuccess] = useState(null);  
  const fetchContracts = () => {
    setLoading(true);
    setError(null);
    api.get(`/projects/${projectId}/contracts/`)
      .then(res => {
        setContracts(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError("Error al cargar contratos");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchContracts();
    // Cargar también la lista de partidas para el dropdown
    api.get(`/projects/${projectId}/work_items/`)
      .then(res => setWorkItems(res.data))
      .catch(err => console.error("Error al cargar partidas", err));

  }, [projectId]);

  // --- Lógica de Filtros ---
  const uniqueContractors = useMemo(() => {
    const contractorMap = new Map();
    contracts.forEach(contract => {
      if (contract.contractor && !contractorMap.has(contract.contractor.id)) {
        contractorMap.set(contract.contractor.id, contract.contractor);
      }
    });
    return Array.from(contractorMap.values());
  }, [contracts]);

  const filteredContracts = useMemo(() => {
    if (filterContractorId === 'all') {
      return contracts;
    }
    return contracts.filter(c => c.contractor?.id == filterContractorId);
  }, [contracts, filterContractorId]);

  // --- Lógica de Totales ---
  const totals = useMemo(() => {
    return filteredContracts.reduce((acc, contract) => {
      acc.total_ordinario += contract.total_ordinario || 0;      
      acc.total_extraordinario += contract.total_extraordinario || 0;
      acc.total_contratado_vigente += contract.total_contratado_vigente || 0;
      acc.total_aditivas += contract.total_aditivas || 0;
      acc.total_deductivas += contract.total_deductivas || 0;
      acc.iva += contract.iva || 0;
      acc.total_con_iva += contract.total_con_iva || 0;
      acc.anticipo += contract.anticipo || 0;
      return acc;
    }, { 
      total_ordinario: 0,
      total_contratado_vigente: 0, 
      total_aditivas: 0,
      total_deductivas: 0,
      total_extraordinario: 0,
      iva: 0, 
      total_con_iva: 0, 
      anticipo: 0 });
  }, [filteredContracts]); 

  // --- Handlers ---
  const handleNew = () => {
    setModalMode('new');
    setSelectedId(null);
    setIsModalOpen(true);
  };
  
  const handleEdit = () => {
    if (!selectedId) {
      alert('Por favor, seleccione un contrato para editar.');
      return;
    }
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedId) {
      alert('Por favor, seleccione un contrato para eliminar.');
      return;
    }
    if (window.confirm('¿Está seguro de que quiere eliminar este contrato?')) {
      try {
        await api.delete(`/contracts/${selectedId}`);
        fetchContracts(); // Recarga la lista
        setSelectedId(null);
      } catch (err) {
        alert(err.response?.data?.detail || 'No se pudo eliminar el contrato.');
      }
    }
  };
  const handleSave = (savedContract) => {
    fetchContracts();
    setIsModalOpen(false);
  };
  const goToDetail = (contractId) => {
    navigate(`/projects/${projectId}/budget/contracts/${contractId}`);
  };  
  const handleWorkItemChange = async (contractId, newWorkItemId) => {
    try {
      await api.patch(`/contracts/${contractId}`, {
        work_item_id: newWorkItemId ? parseInt(newWorkItemId, 10) : null
      });   
      fetchContracts();
    } catch (err) {
      alert('No se pudo actualizar la partida del contrato.');
      console.error("Error al cambiar la partida:", err);
    }
  };
  const handleExport = async () => {
    try {
      const response = await api.get(`/projects/${projectId}/export-contracts/`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `proyecto_${projectId}_contratos.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      if (err.response && err.response.data instanceof Blob) {
        const errorText = await err.response.data.text();
        try {
          const errorJson = JSON.parse(errorText);
          alert(`Error al exportar: ${errorJson.detail || 'Error desconocido del servidor.'}`);
        } catch (parseError) {
          alert(`Error al exportar: ${errorText}`);
        }
      } else {
        alert(err.response?.data?.detail || "Error al exportar los contratos.");
      }
      console.error("Error exportando:", err.response || err);
    }
  };  
  const triggerFileSelect = () => {
      fileInputRef.current.click();
  };
  const handleFileImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setImportError(null); setImportSuccess(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
        const response = await api.post(`/projects/${projectId}/import-contracts/`, formData);
        setImportSuccess(response.data.message || "Importación exitosa.");
        fetchContracts();
    } catch (err) {
        setImportError(err.response?.data?.detail || "Error al importar.");
    }
    event.target.value = null;
  };
  const selectedContract = contracts.find(c => c.id === selectedId);
  return (
    <div>
      <div className="page-header">
        <h2>Contratos del Proyecto</h2>
        <div className="page-actions">
          <button className="btn-new" onClick={handleNew}>Nuevo Contrato</button>
          <button className="btn-modify" onClick={handleEdit}>Modificar</button>
          <button className="btn-delete" onClick={handleDelete}>Eliminar</button>
          <button className="btn-import" style={{backgroundColor: '#17a2b8', color: 'white'}} onClick={triggerFileSelect}>Importar</button>
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
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {importError && <p style={{ color: 'red' }}>Error de Importación: {importError}</p>}
      {importSuccess && <p style={{ color: 'green' }}>{importSuccess}</p>}
      
      {/* --- Filtro (Solo por contratista) --- */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div className="form-group" style={{ maxWidth: '400px' }}>
          <label htmlFor="contractorFilter" style={{ fontWeight: 'bold' }}>Filtrar por Contratista:</label>
          <select id="contractorFilter" value={filterContractorId} onChange={(e) => setFilterContractorId(e.target.value)}>
            <option value="all">-- Mostrar Todos --</option>
            {uniqueContractors.map(contractor => (
              <option key={contractor.id} value={contractor.id}>
                {contractor.razon_social}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="data-table" style={{ minWidth: '2200px' }}>
          <thead>
            <tr>
              <th>Contratista</th>
              <th>Contrato</th>
              <th>Partida</th>
              <th>Trabajos</th>
              <th>Status</th>
              <th>Avance</th>
              <th>Contratado</th>
              <th>Aditivas</th>
              <th>Deductivas</th>
              <th>Extraordinarios</th>
              <th>Total Contratado</th>
              <th>IVA</th>
              <th>Total c/IVA</th>
              <th>Anticipo</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan="14">Cargando...</td></tr>}
            {filteredContracts.map(contract => (
              <tr 
                key={contract.id}
                className={contract.id === selectedId ? 'selected' : ''}
                onClick={() => setSelectedId(contract.id)}
                onDoubleClick={() => goToDetail(contract.id)}
                style={{cursor: 'pointer'}}
              >
                <td>{contract.contractor?.razon_social}</td>
                <td>{contract.numero_contrato}</td>
                <td>
                  <select
                    value={contract.work_item_id || ''}
                    onChange={(e) => handleWorkItemChange(contract.id, e.target.value)}
                    onClick={(e) => e.stopPropagation()} // Evita que se seleccione la fila al hacer clic en el select
                    className="inline-edit-select"
                    style={{ width: '100%', minWidth: '150px' }}
                  >
                    <option value="">-- Sin Asignar --</option>
                    {workItems.map(wi => (
                      <option key={wi.id} value={wi.id}>{wi.description}</option>
                    ))}
                  </select>
                </td>
                <td>{contract.trabajos}</td>
                <td>{contract.status}</td>
                <td>{contract.progress}%</td>
                <td>{formatCurrency(contract.total_ordinario)}</td>
                <td style={{color: 'green'}}>{formatCurrency(contract.total_aditivas)}</td>
                <td style={{color: 'red'}}>{formatCurrency(contract.total_deductivas)}</td>
                <td>{formatCurrency(contract.total_extraordinario)}</td>
                <td>{formatCurrency(contract.total_contratado_vigente)}</td>
                <td>{formatCurrency(contract.iva)}</td>
                <td>{formatCurrency(contract.total_con_iva)}</td>
                <td>{formatCurrency(contract.anticipo)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ fontWeight: 'bold', backgroundColor: '#f8f9fa' }}>
              <td colSpan="6" style={{ textAlign: 'right' }}>TOTALES:</td>
              <td>{formatCurrency(totals.total_ordinario)}</td>
              <td>{formatCurrency(totals.total_aditivas)}</td>
              <td>{formatCurrency(totals.total_deductivas)}</td>
              <td>{formatCurrency(totals.total_extraordinario)}</td>
              <td>{formatCurrency(totals.total_contratado_vigente)}</td>            
              <td>{formatCurrency(totals.iva)}</td>
              <td>{formatCurrency(totals.total_con_iva)}</td>
              <td>{formatCurrency(totals.anticipo)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

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