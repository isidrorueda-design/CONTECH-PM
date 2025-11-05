import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext, useParams, useNavigate } from 'react-router-dom';
import FolderTree from './dms/FolderTree';
import FolderModal from './dms/FolderModal';
import NewDocumentModal from './dms/NewDocumentModal';
import api from '../api/axiosConfig'; // Importa la instancia de axios configurada
 

function buildFolderTree(folders) {
  const map = {};
  const roots = [];

  if (!folders) return roots; 
  folders.forEach(folder => {
    map[folder.id] = { ...folder, subfolders: [] };
  });

  Object.values(map).forEach(folder => {
    if (folder.parent_id && map[folder.parent_id]) {
      map[folder.parent_id].subfolders.push(folder);
    } else if (!folder.parent_id) {
      roots.push(folder);
    }
  });
  
  return roots;
}

function DocumentosTabContent() {
  const { project, refetchProject, onDocumentSelect } = useOutletContext();
  const { projectId } = useParams();
  const navigate = useNavigate();
  
  // Estados de Modales
  const [folderModalMode, setFolderModalMode] = useState(null); // 'new' o 'rename'
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false); 

  // Estados de Navegación
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [folderContents, setFolderContents] = useState(null);
  const [loadingContents, setLoadingContents] = useState(false);
  const [error, setError] = useState(null);

  // Construye el árbol
  const folderTree = useMemo(() => {
    return buildFolderTree(project?.folders);
  }, [project?.folders]);

  // Carga el contenido de la carpeta seleccionada
  useEffect(() => {
    const fetchFolderContents = async () => {
      setLoadingContents(true);
      setError(null);
      try { // Usa la instancia 'api'
        const response = await api.get(`/folders/${selectedFolderId}`);
        setFolderContents(response.data);
      } catch (err) {
        console.error("Error cargando contenido de carpeta:", err);
        setError("No se pudo cargar el contenido de la carpeta.");
      } finally {
        setLoadingContents(false);
      }
    };

    if (selectedFolderId) {
      fetchFolderContents();
    } else {
      setFolderContents(null);
    }
  }, [selectedFolderId]);

  // --- Handlers (Funciones de botones) ---
  
  const handleRefreshAll = async () => {
    if (refetchProject) {
      refetchProject();
    }
    if (selectedFolderId) {
      // Recarga el contenido de la carpeta actual
      try {
        const response = await api.get(`/folders/${selectedFolderId}`); // Usa la instancia 'api'
        setFolderContents(response.data);
      } catch (err) {
        console.error("Error refrescando contenido de carpeta:", err);
      }
    }
  };

  const handleFolderSave = (savedFolder) => {
    handleRefreshAll();
    setFolderModalMode(null);
  };

  const handleDelete = async () => {
    if (!selectedFolderId || !folderContents) {
      alert("Por favor, seleccione una carpeta.");
      return;
    }

    if (window.confirm(`¿Seguro que quieres eliminar la carpeta "${folderContents.name}"? Esta acción no se puede deshacer.`)) {
      setError(null);
      try {
        await api.delete(`/folders/${selectedFolderId}`); // Usa la instancia 'api'
        
        refetchProject(); // Refresca el árbol
        setSelectedFolderId(null);
        setFolderContents(null);

      } catch (err) {
        const errorMessage = err.response?.data?.detail || err.message || 'Error del servidor al eliminar la carpeta.';
        setError(errorMessage);
      }
    }
  };
  
  const handleUploadSuccess = () => {
    handleRefreshAll();
    setIsUploadModalOpen(false);
  };

  const handleDocClick = (doc) => {
    onDocumentSelect(doc);
    if (doc.versions && doc.versions.length > 0) {
      navigate(`/projects/${projectId}/bim`);
    } else {
      alert("Este documento no tiene versiones cargadas.");
    }
  };

  // --- Renderizado ---
  return (
    <div className="dms-layout"> {/* <--- DIV (A) OPENS */}
    
      {/* --- Panel Izquierdo: Árbol de Carpetas --- */}
      <aside className="dms-sidebar">
        <div className="dms-header">
          <h3>Carpetas del Proyecto</h3>
          <button 
            className="btn-new" 
            style={{ padding: '5px 10px' }}
            onClick={() => setFolderModalMode('new')}
            title="Crear carpeta raíz"
          >
            +
          </button>
        </div>
        <FolderTree
          folders={folderTree} 
          selectedFolderId={selectedFolderId}
          onFolderSelect={(id) => setSelectedFolderId(id)}
        />
      </aside>
      
      {/* --- Panel Derecho: Contenido de la Carpeta --- */}
      <main className="dms-main"> {/* <--- MAIN (B) OPENS */}
        <div className="dms-header">
          <h3>
            {folderContents ? folderContents.name : "Seleccione una carpeta"}
          </h3>
          {selectedFolderId && (
            <div className="page-actions" style={{gap: '0.5rem'}}>
              <button 
                className="btn-new"
                onClick={() => setFolderModalMode('new')}
              >
                + Subcarpeta
              </button>
              <button 
                className="btn-modify"
                onClick={() => setFolderModalMode('rename')}
              >
                Renombrar
              </button>
              <button 
                className="btn-delete"
                onClick={handleDelete}
              >
                Eliminar
              </button>
              <button 
                className="btn-save"
                onClick={() => setIsUploadModalOpen(true)}
              >
                Subir Documento
              </button>
            </div>
          )}
        </div>
        
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {loadingContents && <p>Cargando...</p>}
        
        {folderContents && (
          <ul className="folder-content-list">
            {folderContents.subfolders.map(subfolder => (
              <li key={subfolder.id} onClick={() => setSelectedFolderId(subfolder.id)}>
                <span className="icon">📁</span> {subfolder.name}
              </li>
            ))}
            {folderContents.documents.map(doc => (
              <li key={doc.id} onClick={() => handleDocClick(doc)}>
                <span className="icon">
                  {doc.versions.length > 0 && doc.versions[doc.versions.length - 1].filename.toLowerCase().endsWith('.ifc') ? '🏗️' : '📄'}
                </span> 
                {doc.name}
                <span style={{ marginLeft: 'auto', color: '#888' }}>
                  (v{doc.versions.length > 0 ? doc.versions[doc.versions.length - 1].version_number : 0})
                </span>
              </li>
            ))}
          </ul>
        )}
      </main> {/* <--- MAIN (B) CLOSES */}
      
      {/* --- Modales --- */}
      {folderModalMode && (
        <FolderModal
          mode={folderModalMode}
          projectId={projectId}
          parentId={folderModalMode === 'new' ? selectedFolderId : null} 
          folderToEdit={folderModalMode === 'rename' ? folderContents : null} 
          onClose={() => setFolderModalMode(null)}
          onSave={handleFolderSave}
        />
      )}
      
      {isUploadModalOpen && (
        <NewDocumentModal
          projectId={projectId}
          folderId={selectedFolderId}
          onClose={() => setIsUploadModalOpen(false)}
          onUploadSuccess={handleUploadSuccess}
        />
      )}
      
    </div> /* <--- DIV (A) CLOSES */
  );
}

export default DocumentosTabContent;