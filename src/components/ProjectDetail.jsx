// src/components/ProjectDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, Outlet, useLocation } from 'react-router-dom';
import { flattenTaskTree } from '../utils/taskUtils';
import api from '../api/axiosConfig'; // <-- 1. Importa 'api'
import { useAuth } from '../context/AuthContext'; // <-- 2. Importa 'useAuth'

function ProjectDetail() {
  const { projectId } = useParams();
  const location = useLocation(); 
  const { user } = useAuth(); // <-- 3. Obtiene el usuario logueado
  
  const [project, setProject] = useState(null);
  const [flatTasks, setFlatTasks] = useState([]);
  const [error, setError] = useState(null);
  // --- INICIO DE LA CORRECCIÓN ---
  // 1. Estado para guardar el documento que se usará en el visor BIM
  const [selectedDocument, setSelectedDocument] = useState(null);
  // --- FIN DE LA CORRECCIÓN ---
  
  // 4. Función de recarga (ahora usa 'api')
  const fetchProjectData = () => {
    setError(null);
    api.get(`/projects/${projectId}`) // <-- Usa 'api'
      .then(response => {
        setProject(response.data); 
        // Verifica que 'tasks' exista antes de aplanar
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

  // --- INICIO DE LA CORRECCIÓN ---
  // 2. Función que se pasará a DocumentosTabContent para actualizar el estado
  const handleDocumentSelect = (doc) => {
    setSelectedDocument(doc);
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

  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!project) return <p>Cargando...</p>; // Muestra cargando mientras 'project' es null

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
      </div>

      <div className="tab-content">
        {/* 6. Pasa el 'user' al contexto del Outlet */}
        <Outlet context={{ 
          project, 
          flatTasks, 
          user, // Pasa el objeto 'user'
          onTaskCreated: handleTaskCreated,
          refetchProject: fetchProjectData,
          setProject: setProject,
          // 3. Pasamos el estado y la función al contexto
          selectedDocument: selectedDocument,
          onDocumentSelect: handleDocumentSelect
        }} />
      </div>
    </div>
  );
}

export default ProjectDetail;