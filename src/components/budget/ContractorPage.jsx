import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom'; // Importa useParams
import ContractorModal from './ContractorModal';

import api from '../../api/axiosConfig'; // Importa la instancia de axios configurada
 
function ContractorPage() {
  // Estados de la página
  const [contractors, setContractors] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // (useParams no se usa aquí, pero se usará en las otras páginas)
  // const { projectId } = useParams(); 
  
  // Estados de la UI (modal y selección)
  const [selectedId, setSelectedId] = useState(null); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('new'); 
  
  // Estados para la importación de Excel
  const [importError, setImportError] = useState(null);
  const [importSuccess, setImportSuccess] = useState(null);
  const fileInputRef = useRef(null); // Referencia para el input de archivo

  // Función para cargar los datos de la tabla
  const fetchContractors = async () => {
    setLoading(true);
    setError(null); // Limpia errores antiguos
    try { // Usa la instancia 'api'
      const response = await api.get('/contractors/');
      setContractors(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Carga inicial al montar el componente
  useEffect(() => {
    fetchContractors();
  }, []);

  // --- Handlers de Botones de la Barra Superior ---

  const handleNew = () => {
    setModalMode('new');
    setSelectedId(null); 
    setIsModalOpen(true);
  };

  const handleEdit = () => {
    if (!selectedId) {
      alert('Por favor, seleccione un contratista de la tabla para editar.');
      return;
    }
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedId) {
      alert('Por favor, seleccione un contratista de la tabla para borrar.');
      return;
    }
    
    if (window.confirm('¿Está seguro de que quiere borrar este contratista?')) {
      try {
        await api.delete(`/contractors/${selectedId}`); // Usa la instancia 'api'
        // Actualiza la lista en el frontend
        setContractors(contractors.filter(c => c.id !== selectedId));
        setSelectedId(null); // Limpia selección
      } catch (err) {
        const errorMsg = err.response?.data?.detail || 'No se pudo borrar. Es posible que esté en uso en un contrato.';
        setError(errorMsg);
      }
    }
  };

  // --- Handler del Modal (cuando se guarda) ---

  const handleSave = (savedContractor) => {
    if (modalMode === 'new') {
      // Añade el nuevo a la lista
      setContractors([...contractors, savedContractor]);
    } else {
      // Reemplaza el editado en la lista
      setContractors(contractors.map(c => 
        c.id === savedContractor.id ? savedContractor : c
      ));
    }
    setSelectedId(savedContractor.id); // Selecciona el ítem guardado
  };

  // --- Handlers de Importación de Excel ---

  // 1. Esta función es llamada por el botón "Importar"
  const triggerFileSelect = () => {
    // Da clic programáticamente al input oculto
    fileInputRef.current.click();
  };

  // 2. Esta función se dispara cuando el usuario selecciona un archivo
  const handleFileImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImportError(null);
    setImportSuccess(null);

    // Usamos FormData para enviar archivos
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/contractors/import-excel/', formData, { // Usa la instancia 'api'
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setImportSuccess(response.data.message); // Muestra el mensaje de éxito
      fetchContractors(); // ¡Refresca la tabla!

    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Error al importar el archivo.';
      setImportError(errorMsg);
    }
    
    // Limpia el input para que se pueda subir el mismo archivo otra vez
    e.target.value = null;
  };

  // Busca el contratista seleccionado para pasarlo al modal
  const selectedContractor = contractors.find(c => c.id === selectedId);

  // --- Renderizado del Componente ---
  return (
    <div>
      <div className="page-header">
        <h2>Directorio de Contratistas</h2>
        <div className="page-actions">
          <button className="btn-new" onClick={handleNew}>Nuevo</button>
          <button className="btn-modify" onClick={handleEdit}>Editar</button>
          <button className="btn-delete" onClick={handleDelete}>Borrar</button>
          
          {/* Botón de Importar que llama al input oculto */}
          <button 
            className="btn-import" 
            style={{backgroundColor: '#17a2b8', color: 'white'}}
            onClick={triggerFileSelect}
          >
            Importar
          </button>
        </div>
      </div>

      {/* Input de archivo real, oculto */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileImport}
        style={{ display: 'none' }} 
        accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      />

      {/* Mensajes de feedback */}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {importError && <p style={{ color: 'red' }}>Error de Importación: {importError}</p>}
      {importSuccess && <p style={{ color: 'green' }}>{importSuccess}</p>}
          
      <table className="data-table">
        <thead>
          <tr>
            <th>Razón Social</th>
            <th>Responsable</th>
            <th>Teléfono</th>
            <th>Correo Electrónico</th>
          </tr>
        </thead>
        <tbody>
          {loading && <tr><td colSpan="4">Cargando...</td></tr>}
          
          {contractors.map(contractor => (
            <tr 
              key={contractor.id}
              className={contractor.id === selectedId ? 'selected' : ''}
              onClick={() => setSelectedId(contractor.id)}
            >
              <td>{contractor.razon_social}</td>
              <td>{contractor.responsable}</td>
              <td>{contractor.telefono}</td>
              <td>{contractor.correo_electronico}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* --- El Modal --- */}
      {isModalOpen && (
        <ContractorModal
          mode={modalMode}
          initialData={selectedContractor}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

export default ContractorPage;