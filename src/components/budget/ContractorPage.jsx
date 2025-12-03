// src/components/budget/ContractorPage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/axiosConfig';
import ContractorModal from './ContractorModal';
import NewContractorForm from './NewContractorForm';

const formatCurrency = (val) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val || 0);
function ContractorPage() {
  const { projectId } = useParams();
  const [contractors, setContractors] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingContractor, setEditingContractor] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [importError, setImportError] = useState(null);
  const [importSuccess, setImportSuccess] = useState(null);
  const [selectedContractorId, setSelectedContractorId] = useState(null);
  const fileInputRef = useRef(null);
  const fetchContractors = useCallback(() => {
    setLoading(true);
    setError(null);
    api.get(`/projects/${projectId}/contractors/`)
      .then(response => {
        setContractors(response.data);
      })
      .catch(err => {
        setError(err.response?.data?.detail || "Error al cargar contratistas.");
        setContractors([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [projectId]);

  useEffect(() => {
    fetchContractors();
  }, [fetchContractors]);

  const handleCreated = () => fetchContractors();
  const handleUpdated = () => {
    fetchContractors();
    setEditingContractor(null);
    setSelectedContractorId(null);
  };

  const handleDelete = async () => {
    if (!selectedContractorId) return;
    if (window.confirm('¿Eliminar Contratista seleccionado?')) {
      try {
        await api.delete(`/contractors/${selectedContractorId}`);
        fetchContractors();
        setSelectedContractorId(null);
      } catch (err) {
        setError(err.response?.data?.detail || "Error al eliminar.");
      }
    }
  };

  const handleEditClick = () => {
    const contractorToEdit = contractors.find(c => c.id === selectedContractorId);
    if (contractorToEdit) {
      setEditingContractor(contractorToEdit);
    }
  };

  const triggerFileSelect = () => {
    const message = "El archivo Excel debe tener una fila de encabezado con las siguientes columnas:\n\n'razon_social', 'responsable', 'telefono', 'correo_electronico'\n\n- Solo 'razon_social' es obligatoria.";
    if (window.confirm(message)) {
      fileInputRef.current.click();
    }
  };

  const handleFileImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportError(null);
    setImportSuccess(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post(`/projects/${projectId}/contractors/import-excel/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setImportSuccess(response.data.message);
      fetchContractors();
    } catch (err) {
      setImportError(err.response?.data?.detail || 'Error al importar el archivo.');
    }
    e.target.value = null;
  };

  const handleRowClick = (id) => {
    if (selectedContractorId === id) {
      setSelectedContractorId(null);
    } else {
      setSelectedContractorId(id);
    }
  };

  const selectedContractor = editingContractor;

  return (
    <div>
      <div className="page-header">
        <h2>Directorio de Contratistas</h2>
        <div className="page-actions">
          <button
            onClick={() => setIsModalOpen(true)}
            title="Nuevo Contratista"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px' }}
          >
            <img src="/icons/new.png" alt="Nuevo Contratista" style={{ height: '34px', verticalAlign: 'middle' }} />
          </button>
          <button
            onClick={handleEditClick}
            title="Modificar Contratista"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px', opacity: !selectedContractorId ? 0.5 : 1 }}
            disabled={!selectedContractorId}
          >
            <img src="/icons/editar.png" alt="Modificar Contratista" style={{ height: '34px', verticalAlign: 'middle' }} />
          </button>
          <button
            onClick={handleDelete}
            title="Borrar Contratista"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px', opacity: !selectedContractorId ? 0.5 : 1 }}
            disabled={!selectedContractorId}
          >
            <img src="/icons/delete.png" alt="Borrar Contratista" style={{ height: '34px', verticalAlign: 'middle' }} />
          </button>
          <button
            onClick={triggerFileSelect}
            title="Importar Contratistas"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px' }}
          >
            <img src="/icons/import.png" alt="Importar Contratistas" style={{ height: '34px', verticalAlign: 'middle' }} />
          </button>
        </div>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* 3. Renderizado Condicional */}
      {loading ? (
        <p>Cargando lista...</p>
      ) : (
        <>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileImport}
            style={{ display: 'none' }}
            accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          />
          {importError && <p style={{ color: 'red' }}>Error de Importación: {importError}</p>}
          {importSuccess && <p style={{ color: 'green' }}>{importSuccess}</p>}
          <table className="data-table">
            <thead>
              <tr>
                <th>Razón Social</th>
                <th>Responsable</th>
                <th>Teléfono</th>
                <th>Correo</th>
              </tr>
            </thead>
            <tbody>
              {contractors.length === 0 && <tr><td colSpan="4">No hay contratistas registrados.</td></tr>}
              {contractors.map(c => (
                <tr
                  key={c.id}
                  onClick={() => handleRowClick(c.id)}
                  style={{
                    cursor: 'pointer',
                    backgroundColor: selectedContractorId === c.id ? '#e2e6ea' : 'transparent'
                  }}
                >
                  <td>{c.razon_social}</td>
                  <td>{c.responsable}</td>
                  <td>{c.telefono}</td>
                  <td>{c.correo_electronico}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Modal de Creación/Edición */}
      {isModalOpen && (
        <ContractorModal
          mode="new"
          onClose={() => setIsModalOpen(false)}
          projectId={projectId}
          onSave={handleCreated}
        />
      )}
      {selectedContractor && (
        <ContractorModal
          mode="edit"
          initialData={selectedContractor}
          projectId={projectId}
          onClose={() => setEditingContractor(null)}
          onSave={handleUpdated}
        />
      )}
    </div>
  );
}

export default ContractorPage;