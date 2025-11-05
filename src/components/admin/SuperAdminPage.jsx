// src/components/admin/SuperAdminPage.jsx
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import NewCompanyForm from './NewCompanyForm';
import NewUserForm from './NewUserForm';

function SuperAdminPage() {
  const { logout, user } = useAuth();

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Dashboard del Super Administrador</h1>
        <button onClick={logout} style={{ padding: '8px 12px', cursor: 'pointer', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}>
          Cerrar Sesión ({user?.email})
        </button>
      </div>
      <p>Desde aquí puedes crear nuevas compañías y asignar sus usuarios administradores.</p>

      <hr style={{ margin: '2rem 0' }} />

      {/* Usamos el CSS de dashboard que ya teníamos */}
      <div className="budget-dashboard-nav"> 
        <NewCompanyForm />
        <NewUserForm />
      </div>
    </div>
  );
}

export default SuperAdminPage;