import React, { useState } from 'react';
import api from '../../api/axiosConfig';

function NewUserForm({ companies, onUserAdded }) {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [companyId, setCompanyId] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!username || !password || !companyId) {
            setError('Username, contraseña y compañía son obligatorios.');
            return;
        }

        const userData = {
            username,
            email,
            password,
            company_id: parseInt(companyId),
        };

        try {
            const response = await api.post('/users/', userData);
            setSuccess(`Usuario "${response.data.username}" creado con éxito.`);
            onUserAdded(response.data); // Notifica al padre para refrescar
            // Limpiar formulario
            setUsername('');
            setEmail('');
            setPassword('');
            setCompanyId('');
        } catch (err) {
            setError(err.response?.data?.detail || err.message);
        }
    };

    return (
        <div className="dashboard-card">
            <h3>Crear Nuevo Usuario</h3>
            <form onSubmit={handleSubmit} className="card-form">
                {error && <p style={{ color: 'red' }}>{error}</p>}
                {success && <p style={{ color: 'green' }}>{success}</p>}
                <div className="form-group"><label>Username:</label><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required /></div>
                <div className="form-group"><label>Email:</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <div className="form-group"><label>Contraseña:</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
                <div className="form-group"><label>Compañía:</label><select value={companyId} onChange={(e) => setCompanyId(e.target.value)} required>
                    <option value="">-- Seleccione una Compañía --</option>
                    {companies.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                </select></div>
                <div className="form-actions"><button type="submit" className="btn-save">Añadir Usuario</button></div>
            </form>
        </div>
    );
}

export default NewUserForm;