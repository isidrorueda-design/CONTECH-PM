import React, { useState, useEffect } from 'react';
import { useParams, Link, Outlet, useLocation } from 'react-router-dom';
import { flattenTaskTree } from '../utils/taskUtils';
import api from '../api/axiosConfig'; // Importa la instancia de axios configurada
 

function ProjectDetail() {
  const { projectId } = useParams();
  const location = useLocation();   
  const [project, setProject] = useState(null);
  const [flatTasks, setFlatTasks] = useState([]);
  const [error, setError] = useState(null);
  const [selectedDocumentVersionId, setSelectedDocumentVersionId] = useState(null);
  const fetchProjectData = async () => { // Usa la instancia 'api'
    try {
      const response = await api.get(`/projects/${projectId}`);
      setProject(response.data);
      const flattened = flattenTaskTree(response.data.tasks);
      setFlatTasks(flattened);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    }
  };
  useEffect(() => { fetchProjectData(); }, [projectId]);
  const handleTaskCreated = () => { fetchProjectData(); };
  const handleDocumentSelect = (document) => {
    if (document && document.versions && document.versions.length > 0) {      
      const latestVersion = document.versions[document.versions.length - 1];
      setSelectedDocumentVersionId(latestVersion.id);
      console.log("Documento seleccionado, ID de versión:", latestVersion.id);
    } else {
      setSelectedDocumentVersionId(null);
    }
  };  
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/bim')) return 'bim';
    if (path.includes('/documents')) return 'documents';
    if (path.includes('/budget')) return 'budget';
    if (path.includes('/gantt')) return 'gantt';
    return 'tasks';
  };
  const activeTab = getActiveTab();
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
  if (!project) return <p>Cargando detalle del proyecto...</p>;

  return (
    <div>
      <Link to="/">&larr; Volver a Proyectos</Link>      
      <h1>{project.name}</h1>
      <p>{project.description}</p>      
      <div className="tab-navigation">
        <Link to={`/projects/${projectId}/tasks`}
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
        <Link to={`/projects/${projectId}/budget`}
          className={`tab-button ${activeTab === 'budget' ? 'active' : ''}`}
        >
          Control Presupuestal
        </Link>

        <Link to={`/projects/${projectId}/documents`}
          className={`tab-button ${activeTab === 'documents' ? 'active' : ''}`}
        >
          Documentos
        </Link>
        <Link to={`/projects/${projectId}/bim`}
          className={`tab-button ${activeTab === 'bim' ? 'active' : ''}`}
        >
          Visor BIM
        </Link>   
      </div>

      <div className="tab-content">
        <Outlet context={{ 
          project, 
          flatTasks, 
          onTaskCreated: handleTaskCreated,
          refetchProject: fetchProjectData,
          selectedDocumentVersionId: selectedDocumentVersionId,
          onDocumentSelect: handleDocumentSelect
        }} />
      </div>
    </div>
  );
}

export default ProjectDetail;