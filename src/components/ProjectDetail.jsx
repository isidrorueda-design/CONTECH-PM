import React, { useState, useEffect } from 'react';
import { useParams, Link, Outlet, useLocation } from 'react-router-dom';
import { flattenTaskTree } from '../utils/taskUtils';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';

function ProjectDetail() {
  const { projectId } = useParams();
  const location = useLocation(); 
  const { user } = useAuth();   
  const [project, setProject] = useState(null);
  const [flatTasks, setFlatTasks] = useState([]);
  const [error, setError] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [folderContents, setFolderContents] = useState(null);
  const [isLoadingFolder, setIsLoadingFolder] = useState(false);
  const fetchProjectData = () => {
    setError(null);
    api.get(`/projects/${projectId}`) 
      .then(response => {
        setProject(response.data); 
        const tasks = response.data.tasks || [];
        const flattened = flattenTaskTree(tasks);
        setFlatTasks(flattened);
      })
      .catch(err => {
        console.error("Error cargando proyecto:", err);
        setError("Error al cargar datos del proyecto.");
      });
  };
  
  useEffect(() => {
    fetchProjectData();
  }, [projectId]); 
  const handleTaskCreated = () => { fetchProjectData(); };  
  const handleDocumentSelect = (doc) => {setSelectedDocument(doc); };
  useEffect(() => {
    const fetchFolderContents = async () => {
      if (!selectedFolderId) {
        setFolderContents(null);
        return;
      }
      setIsLoadingFolder(true);
      try {
        const response = await api.get(`/folders/${selectedFolderId}`);
        setFolderContents(response.data);
        setSelectedDocument(null);
      } catch (err) {
        console.error("Error cargando contenido de carpeta en ProjectDetail:", err);
        setError("No se pudo cargar el contenido de la carpeta.");
      } finally {
        setIsLoadingFolder(false);
      }
    };

    fetchFolderContents();
  }, [selectedFolderId]);  
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/bim-data')) return 'bim-data';
    if (path.includes('/bim')) return 'bim';
    if (path.includes('/documents')) return 'documents';
    if (path.startsWith(`/projects/${projectId}/budget`)) return 'budget';
    if (path.includes('/gantt')) return 'gantt';
    return 'tasks';
  };
  const activeTab = getActiveTab();
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!project) return <p>Cargando...</p>; 

  return (
    <div style={{ paddingTop: '160px' }}> {/* Ajustamos padding para un header más compacto */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, backgroundColor: '#001e3eff', color: 'white', padding: '0.5rem 1rem', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>  
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <img src="/logo.png" alt="Logo" style={{ height: '90px', width: 'auto' }} />
          </div>
          <div style={{ flex: 2, textAlign: 'center' }}>
            <h1 style={{ margin: 0, color: 'white' }}>{project.name}</h1>
          </div>
          <div style={{ flex: 1 }}></div>
        </div>
        
        <p style={{ textAlign: 'center', margin: '0.5rem 0', fontSize: '0.9rem', opacity: 0.9 }}>{project.description}</p>        
        <div className="tab-navigation">
          <Link 
            to={user?.role === 'super_admin' ? '/admin' : '/projects'}
            className="tab-button" 
            style={{ color: 'white', fontWeight: 'bold' }}
          >
            Inicio
          </Link>
          <Link 
            to={`/projects/${projectId}/tasks`}
            className={`tab-button ${activeTab === 'tasks' ? 'active' : ''}`}
            style={{ color: 'white' }}
          >
            Tareas
          </Link>
          <Link 
            to={`/projects/${projectId}/gantt`}
            className={`tab-button ${activeTab === 'gantt' ? 'active' : ''}`}
            style={{ color: 'white' }}
          >
            Diagrama de Gantt
          </Link>
          <Link 
            to={`/projects/${projectId}/budget`}
            className={`tab-button ${activeTab === 'budget' ? 'active' : ''}`}
            style={{ color: 'white' }}
          >
            Control Presupuestal
          </Link>
          <Link 
            to={`/projects/${projectId}/documents`}
            className={`tab-button ${activeTab === 'documents' ? 'active' : ''}`}
            style={{ color: 'white' }}
          >
            Documentos
          </Link>
          <Link 
            to={`/projects/${projectId}/bim`}
            className={`tab-button ${activeTab === 'bim' ? 'active' : ''}`}
            style={{ color: 'white' }}
          >
            Visor BIM
          </Link>
          <Link 
            to={`/projects/${projectId}/bim-data`}
            className={`tab-button ${activeTab === 'bim-data' ? 'active' : ''}`}
            style={{ color: 'white' }}
          >
            Datos BIM
          </Link>
        </div>
      </div>

      <div className="tab-content">
        {/* 6. Pasa el 'user' al contexto del Outlet */}
        <Outlet context={{ 
          project, 
          flatTasks, 
          user, 
          onTaskCreated: handleTaskCreated,
          refetchProject: fetchProjectData,
          setProject: setProject,   
          selectedDocument: selectedDocument,
          onDocumentSelect: handleDocumentSelect,
          selectedFolderId: selectedFolderId,
          onFolderSelect: setSelectedFolderId,
          folderContents: folderContents,
          isLoadingFolder: isLoadingFolder

        }} />
      </div>
    </div>
  );
}

export default ProjectDetail;