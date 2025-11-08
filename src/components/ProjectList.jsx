// src/components/ProjectList.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext'; // 1. Importa useAuth
import NewProjectForm from './NewProjectForm';
import EditProjectModal from './EditProjectModal';

// --- 2. Componente: Vista para el Super Admin ---
function AdminDashboard() {
  const { logout, user } = useAuth();
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Bienvenido, Super Administrador</h1>
      <p>Tu rol es gestionar compañías y crear a los administradores de esas compañías.</p>
      <p>Actualmente, estas acciones se realizan desde la documentación de la API del backend.</p>
      <a 
        href="http://127.0.0.1:8000/docs" 
        target="_blank" 
        rel="noopener noreferrer"
        style={{marginRight: '1rem', color: '#007bff', fontWeight: 'bold'}}
      >
        Ir a la API (para crear Compañías y Usuarios)
      </a>
      <button onClick={logout} style={{padding: '8px 12px', cursor: 'pointer', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}>
        Cerrar Sesión ({user?.email})
      </button>
    </div>
  );
}

// --- Componente de Proyectos (para usuarios normales) ---
function CompanyProjectDashboard() {
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const { logout, user } = useAuth(); // Obtenemos el usuario para mostrar el email

  const fetchProjects = () => {
    api.get('/projects/')
      .then(response => {
        setProjects(response.data);
      })
      .catch(err => {
        if (err.response && err.response.status === 401) {
          setError("Sesión expirada. Por favor, inicie sesión de nuevo.");
        } else {
          // Captura el error 403
          setError(err.message || "Error al cargar proyectos.");
        }
      });
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleProjectCreated = (newProject) => {
    setProjects(currentProjects => [newProject, ...currentProjects]);
  };

  const handleDelete = async (projectId) => {
    if (!window.confirm('¿Seguro que quieres borrar este proyecto?')) return;
    try {
      await api.delete(`/projects/${projectId}`);
      setProjects(currentProjects =>
        currentProjects.filter(p => p.id !== projectId)
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const handleProjectUpdated = (updatedProject) => {
    setProjects(currentProjects => 
      currentProjects.map(p => 
        p.id === updatedProject.id ? updatedProject : p
      )
    );
    setEditingProject(null);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' }}>
        <h2>Bienvenido, {user?.email}</h2>
        <button onClick={logout} style={{ padding: '8px 12px', cursor: 'pointer' }}>
          Cerrar Sesión
        </button>
      </div>

      <NewProjectForm onProjectCreated={handleProjectCreated} />

      <h1>Mis Proyectos</h1>
      {error && <p style={{ color: 'red' }}>Request failed with status code 403</p>} {/* Muestra el error 403 */}
      <ul className="project-list">
        {projects.map(project => (
          <li key={project.id} className="project-item">
            <div className="project-info">
              <Link to={`/projects/${project.id}`}>
                <strong>{project.name}</strong>
              </Link>
              <p>{project.description}</p>
            </div>
            <div className="project-actions">
              <button className="btn-modify" onClick={() => setEditingProject(project)}>
                Modificar
              </button>
              <button className="btn-delete" onClick={() => handleDelete(project.id)}>
                Borrar
              </button>
            </div>
          </li>
        ))}
        {projects.length === 0 && !error && <p>Cargando proyectos...</p>}
      </ul>
      {editingProject && (
        <EditProjectModal
          project={editingProject}
          onClose={() => setEditingProject(null)}
          onProjectUpdated={handleProjectUpdated}
        />
      )}
    </div>
  );
}

// --- 3. Componente Principal (Decide qué mostrar) ---
function ProjectList() {
  const { user } = useAuth(); // Obtiene el rol del usuario

  // Muestra "Cargando..." mientras el 'user' se decodifica
  if (!user) {
    return <p>Cargando...</p>; 
  }
  
  // Si es Super Admin, muestra el Dashboard de Admin
  if (user.role === 'super_admin') {
    return <AdminDashboard />;
  }
  
  // Si es usuario normal, muestra sus proyectos
  return <CompanyProjectDashboard />;
}

export default ProjectList; 