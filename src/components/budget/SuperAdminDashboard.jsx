import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import './WorkItemPage.css'; // Reutilizando estilos existentes con una ruta más simple
import NewCompanyForm from './NewCompanyForm';
import NewUserForm from './NewUserForm';

function SuperAdminDashboard() {
    const [companies, setCompanies] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Hacemos las dos peticiones a la API en paralelo para mayor eficiencia
            const [companiesResponse, usersResponse] = await Promise.all([
                api.get('/companies/'),
                api.get('/users/')
            ]);

            // Ordenamos los datos alfabéticamente
            const sortedCompanies = companiesResponse.data.sort((a, b) => a.name.localeCompare(b.name));
            const sortedUsers = usersResponse.data.sort((a, b) => a.username.localeCompare(b.username));

            setCompanies(sortedCompanies);
            setUsers(sortedUsers);

        } catch (err) {
            setError('Error al cargar los datos. ' + (err.response?.data?.detail || err.message));
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // useEffect se ejecuta cuando el componente se monta por primera vez
    useEffect(() => {
        fetchData();
    }, []); // El array vacío asegura que se ejecute solo una vez

    // 3. Funciones para refrescar las listas cuando se añade un nuevo elemento
    const handleCompanyAdded = () => {
        fetchData(); // Vuelve a cargar todos los datos
    };

    const handleUserAdded = () => {
        fetchData(); // Vuelve a cargar todos los datos
    };

    if (loading && companies.length === 0) { // Muestra cargando solo la primera vez
        return <div>Cargando datos del dashboard...</div>;
    }

    return (
        <div>
            <div className="page-header">
                <h2>Dashboard de Superadministrador</h2>
            </div>

            {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

            {/* 4. Sección de Formularios */}
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
                <div style={{ flex: 1, minWidth: '400px' }}>
                    <NewCompanyForm onCompanyAdded={handleCompanyAdded} />
                </div>
                <div style={{ flex: 1, minWidth: '400px' }}>
                    <NewUserForm companies={companies} onUserAdded={handleUserAdded} />
                </div>
            </div>

            <hr />

            {/* 5. Sección de Listas */}
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginTop: '2rem' }}>
                {/* Tabla de Compañías */}
                <div style={{ flex: 1, minWidth: '400px' }}>
                    <h3>Compañías Registradas ({companies.length})</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Nombre de la Compañía</th>
                                </tr>
                            </thead>
                            <tbody>
                                {companies.map(company => (
                                    <tr key={company.id}>
                                        <td>{company.id}</td>
                                        <td>{company.name}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Tabla de Usuarios */}
                <div style={{ flex: 1, minWidth: '400px' }}>
                    <h3>Usuarios Registrados ({users.length})</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Username</th>
                                    <th>Email</th>
                                    <th>Compañía</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id}>
                                        <td>{user.id}</td>
                                        <td>{user.username}</td>
                                        <td>{user.email}</td>
                                        <td>{user.company_name || 'N/A'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SuperAdminDashboard;