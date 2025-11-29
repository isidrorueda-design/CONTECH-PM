// src/components/BimViewerTab.jsx
import React, { useState, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import IFCViewer from './bim/IFCViewer';
import IssuesTab from './bim/IssuesTab';
import IssueForm from './bim/IssueForm';
import BcfService from '../api/BcfService';

function BimViewerTab() {
  const { selectedDocument, project } = useOutletContext();
  const viewerRef = useRef(null);

  // Estado para el panel lateral (Issues)
  const [showIssues, setShowIssues] = useState(true);
  const [currentView, setCurrentView] = useState('list'); // 'list', 'create', 'detail'
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [newIssueSnapshot, setNewIssueSnapshot] = useState(null);
  const [newIssueCamera, setNewIssueCamera] = useState(null);

  // Obtener la última versión del documento para cargar
  const latestVersionId = selectedDocument?.versions?.at(-1)?.id;

  // --- Manejadores de Eventos ---

  const handleCreateTopicClick = async () => {
    if (viewerRef.current) {
      // 1. Capturar Snapshot
      const snapshot = await viewerRef.current.takeSnapshot();
      setNewIssueSnapshot(snapshot);

      // 2. Capturar Cámara
      const cameraState = viewerRef.current.getCameraState();
      setNewIssueCamera(cameraState);
    }
    setCurrentView('create');
  };

  const handleSaveTopic = async (formData) => {
    try {
      // 1. Crear el Topic
      const topicData = {
        ...formData,
        // Aquí podrías añadir más metadatos iniciales
      };

      // Llamada al servicio (ajusta según tu backend real)
      // const newTopic = await BcfService.createTopic(project.id, topicData);

      // 2. Crear el Viewpoint (si tenemos datos de cámara)
      if (newIssueCamera) {
        const viewpointData = {
          snapshot: newIssueSnapshot, // Base64
          camera_position: newIssueCamera.position,
          camera_target: newIssueCamera.target,
          // perspective_camera: true
        };
        // await BcfService.addViewpoint(newTopic.guid, viewpointData);
      }

      // Mock para frontend sin backend listo:
      console.log("Guardando Topic:", topicData);
      console.log("Guardando Viewpoint:", newIssueCamera);
      alert("Incidencia creada (Simulación). Backend pendiente.");

      setCurrentView('list');
      setNewIssueSnapshot(null);
      setNewIssueCamera(null);
    } catch (error) {
      console.error("Error al crear incidencia:", error);
      alert("Error al crear la incidencia.");
    }
  };

  const handleSelectTopic = (topic) => {
    setSelectedTopic(topic);
    // Aquí deberíamos cargar el viewpoint por defecto del topic
    // const viewpoint = await BcfService.getViewpoint(topic.default_viewpoint_id);

    // Mock de restauración de vista
    if (topic.viewpoint) {
      if (viewerRef.current) {
        viewerRef.current.setCameraState(topic.viewpoint);
      }
    }

    // setCurrentView('detail'); // Opcional, o mantener en lista y resaltar
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 150px)', overflow: 'hidden' }}>

      {/* --- Área del Visor (Izquierda) --- */}
      <div style={{ flex: 1, position: 'relative', borderRight: '1px solid #ccc' }}>
        {latestVersionId ? (
          <IFCViewer
            ref={viewerRef}
            versionIdToLoad={latestVersionId}
          />
        ) : (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <p>Seleccione un documento con versiones para visualizar.</p>
          </div>
        )}

        {/* Botón flotante para ocultar/mostrar panel */}
        <button
          onClick={() => setShowIssues(!showIssues)}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 10,
            padding: '5px 10px',
            background: 'white',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {showIssues ? 'Ocultar Incidencias' : 'Ver Incidencias'}
        </button>
      </div>

      {/* --- Panel Lateral (Derecha) --- */}
      {showIssues && (
        <div style={{ width: '350px', display: 'flex', flexDirection: 'column', backgroundColor: '#f9f9f9' }}>

          {currentView === 'list' && (
            <IssuesTab
              projectId={project?.id}
              onSelectTopic={handleSelectTopic}
              onCreateTopic={handleCreateTopicClick}
            />
          )}

          {currentView === 'create' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {newIssueSnapshot && (
                <div style={{ padding: '10px', borderBottom: '1px solid #eee', textAlign: 'center' }}>
                  <img src={newIssueSnapshot} alt="Snapshot" style={{ maxWidth: '100%', maxHeight: '150px', border: '1px solid #ddd' }} />
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>Captura de vista incluida</div>
                </div>
              )}
              <IssueForm
                projectId={project?.id}
                onSubmit={handleSaveTopic}
                onCancel={() => setCurrentView('list')}
              />
            </div>
          )}

        </div>
      )}

    </div>
  );
}

export default BimViewerTab;
