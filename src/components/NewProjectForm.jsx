// src/components/NewProjectForm.jsx
import React, { useState } from 'react';
import api from '../api/axiosConfig'; // Usa la instancia de api
import { useAuth } from '../context/AuthContext'; // Importa useAuth

function NewProjectForm({ onProjectCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState(null);
  
  const { user } = useAuth(); // Obtiene el usuario (que tiene el company_id 'cid')

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Verificación: user.cid (company_id) debe existir
    if (!name || !user?.cid) {
      setError('El nombre es obligatorio y debe ser un usuario de compañía.');
      return;
    }

    try {
      // Añade el company_id del usuario al request
      const newProjectData = { 
        name, 
        description, 
        company_id: user.cid 
      };

      // Usa la instancia 'api' (ya tiene la URL base y el token)
      const response = await api.post('/projects/', newProjectData);

      setName('');
      setDescription('');
      onProjectCreated(response.data); // Axios pone la respuesta en .data

    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError(err.message);
      }
    }
  };

  // Estilos (sin cambios)
  const formStyle = { padding: '1rem', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#fff', marginBottom: '2rem' };
  const inputStyle = { width: 'calc(100% - 10px)', padding: '8px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ddd' };
  const buttonStyle = { padding: '10px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' };

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <h3>Crear Nuevo Proyecto</h3>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <div>
        <label htmlFor="projectName">Nombre del Proyecto:</label>
        <input type="text" id="projectName" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
      </div>
      
      <div>
        <label htmlFor="projectDesc">Descripción:</label>
        <textarea id="projectDesc" value={description} onChange={(e) => setDescription(e.target.value)} style={inputStyle} />
      </div>
      
      <button type="submit" style={buttonStyle}>Crear Proyecto</button>
    </form>
  );
}

export default NewProjectForm;