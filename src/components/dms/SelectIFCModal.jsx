import React, { useState, useEffect, useMemo } from 'react';
import FolderTree from './FolderTree';
import api from '../../api/axiosConfig'; // Importa la instancia de axios configurada
 
function buildFolderTree(folders) {
  const map = {}; const roots = [];
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

function SelectIFCModal({ allFolders, onClose, onFileSelect }) {
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [folderContents, setFolderContents] = useState(null);
  const [loading, setLoading] = useState(false);  
  const [selectedDocVersionId, setSelectedDocVersionId] = useState(null);
  const [selectedDocName, setSelectedDocName] = useState('');
  const folderTree = useMemo(() => {
    return buildFolderTree(allFolders);
  }, [allFolders]);

  useEffect(() => {
    const fetchFolderContents = async () => {
      setLoading(true);
      try { // Usa la instancia 'api'
        const response = await api.get(`/folders/${selectedFolderId}`);
        setFolderContents(response.data);
      } catch (err) {
        console.error("Error cargando contenido:", err);
      } finally {
        setLoading(false);
      }
    };
    if (selectedFolderId) {
      fetchFolderContents();
    } else {
      setFolderContents(null);
    }
  }, [selectedFolderId]);

  const handleDocumentClick = (doc) => {
    if (!doc.versions || doc.versions.length === 0) {
      alert("Este documento no tiene versiones.");
      return;
    }

    const latestVersion = doc.versions[doc.versions.length - 1];
    if (!latestVersion.filename.toLowerCase().endsWith('.ifc')) {
      alert("Por favor, seleccione un archivo .ifc");
      return;
    }

    setSelectedDocVersionId(latestVersion.id);
    setSelectedDocName(doc.name);
  };

  const handleConfirmLoad = () => {
    if (selectedDocVersionId) {
      onFileSelect(selectedDocVersionId);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      {/* Hacemos el modal más grande */}
      <div 
        className="modal-content" 
        style={{ maxWidth: '800px', height: '70vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3>Seleccionar Modelo IFC</h3>
        
        {/* Usamos el layout del DMS dentro del modal */}
        <div className="dms-layout" style={{ height: 'calc(100% - 120px)' }}>
          {/* Panel Izquierdo (Árbol) */}
          <aside className="dms-sidebar">
            <FolderTree
              folders={folderTree}
              selectedFolderId={selectedFolderId}
              onFolderSelect={(id) => setSelectedFolderId(id)}
            />
          </aside>
          
          {/* Panel Derecho (Contenido) */}
          <main className="dms-main">
            {loading && <p>Cargando...</p>}
            {folderContents && (
              <ul className="folder-content-list">
                {folderContents.subfolders.map(subfolder => (
                  <li key={subfolder.id} onClick={() => setSelectedFolderId(subfolder.id)}>
                    <span className="icon">📁</span> {subfolder.name}
                  </li>
                ))}
                {folderContents.documents.map(doc => {
                  const latestVersion = doc.versions.length > 0 ? doc.versions[doc.versions.length - 1] : null;
                  const isIFC = latestVersion && latestVersion.filename.toLowerCase().endsWith('.ifc');
                  const isSelected = latestVersion && latestVersion.id === selectedDocVersionId;
                  
                  return (
                    <li 
                      key={doc.id}
                      onClick={() => handleDocumentClick(doc)}
                      style={{ 
                        cursor: isIFC ? 'pointer' : 'not-allowed',
                        color: isIFC ? 'inherit' : '#999',
                        backgroundColor: isSelected ? '#e0eaff' : 'transparent'
                      }}
                    >
                      <span className="icon">{isIFC ? '🏗️' : '📄'}</span>
                      {doc.name}
                    </li>
                  );
                })}
              </ul>
            )}
          </main>
        </div>

        {/* Acciones del Modal */}
        <div className="modal-actions" style={{ paddingTop: '1rem', borderTop: '1px solid #eee' }}>
          <span style={{ marginRight: 'auto', color: '#555', fontStyle: 'italic' }}>
            Seleccionado: {selectedDocName || "Ninguno"}
          </span>
          <button type="button" className="btn-cancel" onClick={onClose}>
            Cancelar
          </button>
          <button 
            type="button" 
            className="btn-save" 
            onClick={handleConfirmLoad}
            disabled={!selectedDocVersionId} // Deshabilitado si no hay IFC
          >
            Cargar
          </button>
        </div>
      </div>
    </div>
  );
}

export default SelectIFCModal;