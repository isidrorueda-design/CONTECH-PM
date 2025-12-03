// src/components/budget/ContractPage.jsx
import React, { useState, useEffect, useRef, useMemo, Link } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; 
import api from '../../api/axiosConfig';
import ContractModal from './ContractModal';
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
  const [workItems, setWorkItems] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [modalMode, setModalMode] = useState('new');
  const [filterWorkItemId, setFilterWorkItemId] = useState('all');
  const [filterContractorId, setFilterContractorId] = useState('all');
  const fileInputRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
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
    // Ordenar alfabéticamente por razón social
    return Array.from(contractorMap.values()).sort((a, b) => 
      a.razon_social.localeCompare(b.razon_social)
    );
  }, [contracts]);

  const filteredContracts = useMemo(() => {
    return contracts.filter(c => {
      const contractorMatch = filterContractorId === 'all' || c.contractor?.id == filterContractorId;
      // Si se selecciona "Sin Asignar", buscamos contratos con work_item_id nulo o indefinido.
      const workItemMatch = filterWorkItemId === 'all' || 
                            (filterWorkItemId === 'none' ? !c.work_item_id : c.work_item_id == filterWorkItemId);
      return contractorMatch && workItemMatch;
    });
  }, [contracts, filterContractorId, filterWorkItemId]);

  // --- Lógica de Paginación ---
  const totalPages = Math.ceil(filteredContracts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedContracts = filteredContracts.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleItemsPerPageChange = (event) => {
    setItemsPerPage(Number(event.target.value));
    setCurrentPage(1);
  };
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
    // 1. Encontrar el contrato completo que se va a actualizar.
    const contractToUpdate = contracts.find(c => c.id === contractId);
    if (!contractToUpdate) {
      alert('Error: No se pudo encontrar el contrato para actualizar.');
      return;
    }

    // 2. Preparar el payload completo para la petición PUT.
    const updatedData = {
      ...contractToUpdate, // Copia todos los datos existentes del contrato
      work_item_id: newWorkItemId ? parseInt(newWorkItemId, 10) : null // Actualiza solo la partida
    };

    try {
      // 3. Usar el método PUT en la URL correcta con el payload completo.
      await api.put(`/contracts/${contractId}/`, updatedData);
      fetchContracts(); // Recargar los datos para ver el cambio.
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
          <button 
            onClick={handleNew} 
            title="Nuevo Contrato"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px' }}
          >
            <img src="/icons/new.png" alt="Nuevo Contrato" style={{ height: '34px', verticalAlign: 'middle' }} />
          </button>
          <button 
            onClick={handleEdit} 
            title="Editar Contrato"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px' }}
          >
            <img src="/icons/editar.png" alt="Editar Contrato" style={{ height: '34px', verticalAlign: 'middle' }} />
          </button>
          <button 
            onClick={handleDelete} 
            title="Eliminar Contrato"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px' }}
          >
            <img src="/icons/delete.png" alt="Eliminar Contrato" style={{ height: '34px', verticalAlign: 'middle' }} />
          </button>
          <button 
            onClick={triggerFileSelect} 
            title="Importar Contratos"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px' }}
          >
            <img src="/icons/import.png" alt="Importar Contratos" style={{ height: '34px', verticalAlign: 'middle' }} />
          </button>
          <button 
            onClick={handleExport} 
            title="Exportar Contratos"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px' }}
          >
            <img src="/icons/export.png" alt="Exportar Contratos" style={{ height: '34px', verticalAlign: 'middle' }} />
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
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {importError && <p style={{ color: 'red' }}>Error de Importación: {importError}</p>}
      {importSuccess && <p style={{ color: 'green' }}>{importSuccess}</p>}
      
      {/* --- Filtro (Solo por contratista) --- */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div className="form-group" style={{ flex: '1 1 300px', minWidth: '300px' }}>
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
        <div className="form-group" style={{ flex: '1 1 300px', minWidth: '300px' }}>
          <label htmlFor="workItemFilter" style={{ fontWeight: 'bold' }}>Filtrar por Partida:</label>
          <select id="workItemFilter" value={filterWorkItemId} onChange={(e) => setFilterWorkItemId(e.target.value)}>
            <option value="all">-- Todas las Partidas --</option>
            <option value="none">-- Sin Asignar --</option>
            {workItems
              .sort((a, b) => a.description.localeCompare(b.description))
              .map(wi => (
                <option key={wi.id} value={wi.id}>
                  {wi.description}
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
            {paginatedContracts.map(contract => (
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

      {/* --- Controles de Paginación --- */}
      <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
          <div>
              <label htmlFor="itemsPerPage">Mostrar: </label>
              <select id="itemsPerPage" value={itemsPerPage} onChange={handleItemsPerPageChange} style={{ marginRight: '20px' }}>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
              </select>
              <span>
                  Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong> ({filteredContracts.length} contratos)
              </span>
          </div>
          <div>
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="btn-secondary">
                  Anterior
              </button>
              <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || totalPages === 0} className="btn-secondary" style={{ marginLeft: '10px' }}>
                  Siguiente
              </button>
          </div>
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