// src/components/admin/NewUserForm.jsx
import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';

function NewUserForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [role, setRole] = useState('admin'); // Por defecto, creamos 'admin' de compañía
  
  const [companies, setCompanies] = useState([]); // Para el dropdown
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Carga las compañías para el <select>
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        // (Nota: Necesitamos un endpoint 'GET /companies/' para el Super Admin)
        // (Por ahora, asumimos que existe o que lo crearemos)
        const response = await api.get('/companies/'); // <-- Necesitaremos crear este endpoint
        setCompanies(response.data);
      } catch (err) {
        setError('No se pudieron cargar las compañías. ¿Inició sesión como Super Admin?');
      }
    };
    fetchCompanies();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email || !password || !companyId || !role) {
      setError('Todos los campos son obligatorios.');
      return;
    }

    try {
      const userData = {
        email,
        password,
        company_id: parseInt(companyId, 10),
        role
      };
      
      const response = await api.post('/users/', userData);
      
      setSuccess(`Usuario "${response.data.email}" creado.`);
      // Limpia el formulario
      setEmail('');
      setPassword('');
      setCompanyId('');
      setRole('admin');

    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Error al crear el usuario.');
      }
    }
  };

  return (
    <div className="dashboard-card">
      <h3>Crear Nuevo Usuario</h3>
      <form onSubmit={handleSubmit} className="card-form">
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {success && <p style={{ color: 'green' }}>{success}</p>}
        
        <div className="form-group">
          <label htmlFor="userEmail">Email:</label>
          <input type="email" id="userEmail" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        
        <div className="form-group">
          <label htmlFor="userPassword">Contraseña:</label>
          <input type="password" id="userPassword" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        <div className="form-group">
          <label htmlFor="userCompany">Compañía:</label>
          <select id="userCompany" value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
            <option value="">-- Seleccione una compañía --</option>
            {companies.map(company => (
              <option key={company.id} value={company.id}>{company.name}</option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="userRole">Rol:</label>
          <select id="userRole" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="admin">Admin (Administrador de Compañía)</option>
            <option value="user">User (Usuario Normal)</option>
            {/* (Solo un Super Admin puede crear otro Super Admin, 
                 lo cual es raro pero podríamos añadirlo si 'user.role' es 'super_admin') */}
          </select>
        </div>
        
        <div className="form-actions">
          <button type="submit" className="btn-save">Crear Usuario</button>
        </div>
      </form>
    </div>
  );
}

export default NewUserForm;