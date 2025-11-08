// src/components/admin/NewUserForm.jsx
import React, { useState } from 'react'; // <-- 1. Quita 'useEffect'
import api from '../../api/axiosConfig';

// 2. Recibe 'companies' y 'onUserCreated' como props
function NewUserForm({ companies, onUserCreated }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [role, setRole] = useState('admin');
  
  // const [companies, setCompanies] = useState([]); // <-- 3. BORRA ESTE ESTADO
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // 4. BORRA TODO EL 'useEffect' que cargaba las compañías

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
      
      // 5. Llama al 'callback' del padre
      onUserCreated(response.data);

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
          {/* 6. El 'select' ahora usa la lista 'companies' de los props */}
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