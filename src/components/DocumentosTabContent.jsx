import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext, useParams, useNavigate } from 'react-router-dom';
import FolderTree from './dms/FolderTree';
import FolderModal from './dms/FolderModal';
import NewDocumentModal from './dms/NewDocumentModal';
import api from '../api/axiosConfig';

function buildFolderTree(folders) {
  const map = {};
  const roots = [];
  if (!folders) return roots;
  if (folders.length === 0) {
    return [];
  }
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
  const { project, refetchProject, onDocumentSelect, selectedFolderId, onFolderSelect, folderContents, isLoadingFolder } = useOutletContext();
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [folderModalMode, setFolderModalMode] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState(null);

  const folderTree = useMemo(() => {
    return buildFolderTree(project?.folders);
  }, [project?.folders]);

  useEffect(() => {
    setSelectedDocId(null);
  }, [selectedFolderId]);

  const handleRefreshAll = async () => {
    refetchProject();
  };

  const handleFolderSave = (savedFolder) => {
    handleRefreshAll();
    setFolderModalMode(null);
  };

  const handleDelete = async () => {
    // 1. Prioriza borrar el documento si hay uno seleccionado
    if (selectedDocId) {
      const docToDelete = folderContents?.documents.find(d => d.id === selectedDocId);
      if (docToDelete && window.confirm(`¿Seguro que quieres eliminar el documento "${docToDelete.name}"?`)) {
        try {
          await api.delete(`/documents/${selectedDocId}`);
          handleRefreshAll(); // Recarga el contenido de la carpeta
          setSelectedDocId(null); // Deselecciona el documento
        } catch (err) {
          alert(err.response?.data?.detail || 'Error al eliminar el documento.');
        }
      }
      return;
    }

    // 2. Si no hay documento seleccionado, procede a borrar la carpeta
    if (selectedFolderId) {
      if (window.confirm(`¿Seguro que quieres eliminar la carpeta "${folderContents.name}" y todo su contenido?`)) {
        try {
          await api.delete(`/folders/${selectedFolderId}`);
          refetchProject(); // Refresca todo el árbol de carpetas
          onFolderSelect(null); // Notifica al padre que no hay carpeta seleccionada
        } catch (err) {
          alert(err.response?.data?.detail || 'Error al eliminar la carpeta. Asegúrate de que esté vacía.');
        }
      }
      return;
    }
  };

  const handleUploadSuccess = () => {
    // Notifica al padre que recargue el contenido de la carpeta actual
    onFolderSelect(selectedFolderId);
    setIsUploadModalOpen(false);
  };

  const handleDocSelect = (doc) => {
    setSelectedDocId(doc.id);
    onDocumentSelect(doc);
  };

  const handleDocOpen = (doc) => {
    const fullDoc = folderContents?.documents.find(d => d.id === selectedDocId);

    if (!fullDoc || !fullDoc.versions) return;

    const latestVersion = fullDoc.versions?.at(-1);

    if (!latestVersion) {
      alert("Este documento no tiene una versión de archivo cargada.");
      return;
    }

    if (latestVersion.filename.toLowerCase().endsWith('.ifc')) {
      navigate(`/projects/${projectId}/bim`);
    } else {
      alert("Este tipo de archivo no se puede abrir en el visor BIM. Solo se admiten archivos .ifc.");
    }
  };

  // --- Renderizado ---
  return (
    <div className="dms-layout">

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
          onFolderSelect={(id) => onFolderSelect(id)}
        />
      </aside>

      {/* --- Panel Derecho: Contenido de la Carpeta --- */}
      <main className="dms-main">
        <div className="dms-header">
          <h3>
            {folderContents ? folderContents.name : "Seleccione una carpeta"}
          </h3>
          {selectedFolderId && (
            <div className="page-actions" style={{ gap: '0.5rem' }}>
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

        {isLoadingFolder && <p>Cargando...</p>}

        {folderContents && (
          <ul className="folder-content-list">
            {folderContents.subfolders?.map(subfolder => (
              <li key={subfolder.id} onClick={() => onFolderSelect(subfolder.id)}>
                <span className="icon">📁</span> {subfolder.name}
              </li>
            ))}
            {folderContents.documents?.map(doc => (
              <li
                key={doc.id}
                className={doc.id === selectedDocId ? 'selected' : ''}
                onClick={() => handleDocSelect(doc)}
                onDoubleClick={() => handleDocOpen(doc)}
              >
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
      </main>

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

    </div>
  );
}

export default DocumentosTabContent;