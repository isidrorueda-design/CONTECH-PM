// src/components/admin/SuperAdminPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosConfig'; // <-- 1. Importa 'api'
import NewCompanyForm from './NewCompanyForm';
import NewUserForm from './NewUserForm';
// import NonWorkingDays from './NonWorkingDays'; // Ya no se necesita aquí

function SuperAdminPage() {
  const { logout, user } = useAuth();
  
  // --- 2. Levantamos el estado aquí ---
  const [companies, setCompanies] = useState([]);
  const [error, setError] = useState(null);

  // --- 3. Cargamos las compañías cuando la página se monta ---
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await api.get('/companies/');
        setCompanies(response.data);
      } catch (err) {
        setError('No se pudieron cargar las compañías.');
      }
    };
    fetchCompanies();
  }, []); // El array vacío [] asegura que se ejecute solo una vez

  // --- 4. Callbacks para que los formularios hijos actualicen el estado ---
  const handleCompanyCreated = (newCompany) => {
    // Añade la nueva compañía a la lista
    setCompanies([...companies, newCompany]);
  };

  const handleUserCreated = (newUser) => {
    // Por ahora, solo lo mostramos en consola.
    console.log("Usuario creado:", newUser);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Dashboard del Super Administrador</h1>
        <button onClick={logout} style={{ padding: '8px 12px', cursor: 'pointer', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}>
          Cerrar Sesión ({user?.email})
        </button>
      </div>
      <p>Desde aquí puedes crear nuevas compañías y asignar sus usuarios administradores.</p>
      
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <hr style={{ margin: '2rem 0' }} />

      <div className="budget-dashboard-nav"> 
        {/* --- 5. Pasamos los props a los formularios hijos --- */}
        <NewCompanyForm onCompanyCreated={handleCompanyCreated} />
        <NewUserForm 
          companies={companies} 
          onUserCreated={handleUserCreated} 
        />
        {/* <div style={{ gridColumn: '1 / -1' }}>
          <NonWorkingDays />
        </div> */}
      </div>
    </div>
  );
}

export default SuperAdminPage;