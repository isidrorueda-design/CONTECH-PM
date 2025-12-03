import React, { useState, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import IFCViewer from './bim/IFCViewer';
import IssuesTab from './bim/IssuesTab';
import IssueForm from './bim/IssueForm';
import BcfService from '../api/BcfService';
import api from '../api/axiosConfig';

function BimViewerTab() {
  const { project, selectedDocument } = useOutletContext();

  const viewerRef = useRef(null);

  const [newIssueSnapshot, setNewIssueSnapshot] = useState(null);
  const [newIssueCamera, setNewIssueCamera] = useState(null);
  const [localFileUrl, setLocalFileUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null); // Store the actual IFC File object
  const [objUrl, setObjUrl] = useState(null); // URL for the generated OBJ file
  const [showIssues, setShowIssues] = useState(false);
  const [currentView, setCurrentView] = useState('list'); // 'list' or 'create'
  const [selectedTopic, setSelectedTopic] = useState(null); // To store the selected topic for viewing

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setLocalFileUrl(url);
      setSelectedFile(file);
    }
  };

  // Convert IFC to OBJ using backend endpoint
  const handleConvertToObj = async () => {
    if (!selectedFile) {
      alert('Primero seleccione un archivo IFC.');
      return;
    }
    const formData = new FormData();
    formData.append('file', selectedFile);
    try {
      const response = await api.post('/ifc/convert', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'blob', // Expect binary OBJ file
      });
      const blob = new Blob([response.data], { type: 'application/octet-stream' });
      const downloadUrl = URL.createObjectURL(blob);
      setObjUrl(downloadUrl);
    } catch (err) {
      console.error('Error converting IFC to OBJ:', err);
      alert('Error al convertir el archivo. Consulte la consola para más detalles.');
    }
  };

  const latestVersionId = selectedDocument?.versions?.at(-1)?.id;

  const handleCreateTopicClick = async () => {
    if (viewerRef.current) {
      const snapshot = await viewerRef.current.takeSnapshot();
      setNewIssueSnapshot(snapshot);
      const cameraState = viewerRef.current.getCameraState();
      setNewIssueCamera(cameraState);
    }
    setCurrentView('create');
  };

  const handleSaveTopic = async (formData) => {
    try {
      const topicData = { ...formData };
      if (newIssueCamera) {
        const viewpointData = {
          snapshot: newIssueSnapshot,
          camera_position: newIssueCamera.position,
          camera_target: newIssueCamera.target,
        };
        // Placeholder for future backend integration
      }
      console.log('Guardando Topic:', topicData);
      console.log('Guardando Viewpoint:', newIssueCamera);
      alert('Incidencia creada (Simulación). Backend pendiente.');
      setCurrentView('list');
      setNewIssueSnapshot(null);
      setNewIssueCamera(null);
    } catch (error) {
      console.error('Error al crear incidencia:', error);
      alert('Error al crear la incidencia.');
    }
  };

  const handleSelectTopic = (topic) => {
    setSelectedTopic(topic);
    if (topic.viewpoint && viewerRef.current) {
      viewerRef.current.setCameraState(topic.viewpoint);
    }
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 150px)', overflow: 'hidden' }}>
      <div style={{ flex: 1, position: 'relative', borderRight: '1px solid #ccc', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '10px', borderBottom: '1px solid #eee', background: '#f0f0f0' }}>
          <span style={{ marginRight: '10px', fontWeight: 'bold' }}>Cargar Modelo Local:</span>
          <input type="file" accept=".ifc" onChange={handleFileChange} />
          {localFileUrl && (
            <button onClick={handleConvertToObj} style={{ marginLeft: '10px', padding: '5px 10px' }}>
              Convertir a OBJ
            </button>
          )}
          {objUrl && (
            <a href={objUrl} download="model.obj" style={{ marginLeft: '10px', padding: '5px 10px', background: '#28a745', color: 'white', borderRadius: '4px' }}>
              Descargar OBJ
            </a>
          )}
        </div>
        <div style={{ flex: 1, position: 'relative' }}>
          {localFileUrl ? (
            <IFCViewer ref={viewerRef} modelUrl={localFileUrl} />
          ) : (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <p>Seleccione un archivo IFC local para visualizar.</p>
            </div>
          )}
        </div>
        <button onClick={() => setShowIssues(!showIssues)}
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
          }}>
          {showIssues ? 'Ocultar Incidencias' : 'Ver Incidencias'}
        </button>
      </div>
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
