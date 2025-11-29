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
  // --- INICIO DE LA CORRECCIÓN: Centralizar el estado del contenido de la carpeta ---
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [folderContents, setFolderContents] = useState(null);
  const [isLoadingFolder, setIsLoadingFolder] = useState(false);
  // --- FIN DE LA CORRECCIÓN ---

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
  
  const handleDocumentSelect = (doc) => {
    setSelectedDocument(doc);
  };

  // --- INICIO DE LA CORRECCIÓN: Cargar contenido de la carpeta en el padre ---
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
        // Al cambiar de carpeta, deseleccionamos cualquier documento
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
  // --- FIN DE LA CORRECCIÓN ---
  
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/bim-data')) return 'bim-data';
    if (path.includes('/bim')) return 'bim';
    if (path.includes('/documents')) return 'documents';
    // --- INICIO DE LA CORRECCIÓN ---
    // Ahora, cualquier sub-ruta de /budget activará la pestaña de presupuesto.
    if (path.startsWith(`/projects/${projectId}/budget`)) return 'budget';
    // --- FIN DE LA CORRECCIÓN ---
    if (path.includes('/gantt')) return 'gantt';
    return 'tasks';
  };
  const activeTab = getActiveTab();

  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!project) return <p>Cargando...</p>; 

  return (
    <div>
      {/* Botón para volver a la lista de proyectos */}
      <Link 
        to={user?.role === 'super_admin' ? '/admin' : '/projects'}
        style={{ textDecoration: 'none', color: '#007bff', fontWeight: 'bold' }}
      >
        &larr; Volver
      </Link> 
      
      <h1>{project.name}</h1>
      <p>{project.description}</p>
      
      {/* --- 5. EL MENÚ DE PESTAÑAS --- */}
      <div className="tab-navigation">
        <Link 
          to={`/projects/${projectId}/tasks`}
          className={`tab-button ${activeTab === 'tasks' ? 'active' : ''}`}
        >
          Tareas
        </Link>
        <Link 
          to={`/projects/${projectId}/gantt`}
          className={`tab-button ${activeTab === 'gantt' ? 'active' : ''}`}
        >
          Diagrama de Gantt
        </Link>
        <Link 
          to={`/projects/${projectId}/budget`}
          className={`tab-button ${activeTab === 'budget' ? 'active' : ''}`}
        >
          Control Presupuestal
        </Link>
        <Link 
          to={`/projects/${projectId}/documents`}
          className={`tab-button ${activeTab === 'documents' ? 'active' : ''}`}
        >
          Documentos
        </Link>
        <Link 
          to={`/projects/${projectId}/bim`}
          className={`tab-button ${activeTab === 'bim' ? 'active' : ''}`}
        >
          Visor BIM
        </Link>
        <Link 
          to={`/projects/${projectId}/bim-data`}
          className={`tab-button ${activeTab === 'bim-data' ? 'active' : ''}`}
        >
          Datos BIM
        </Link>
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
          // --- INICIO DE LA CORRECCIÓN: Pasar el estado y los setters al hijo ---
          selectedDocument: selectedDocument,
          onDocumentSelect: handleDocumentSelect,
          selectedFolderId: selectedFolderId,
          onFolderSelect: setSelectedFolderId,
          folderContents: folderContents,
          isLoadingFolder: isLoadingFolder
          // --- FIN DE LA CORRECCIÓN ---
        }} />
      </div>
    </div>
  );
}

export default ProjectDetail;