import React, { useState } from 'react';
import api from '../../api/axiosConfig';

function NewCompanyForm({ onCompanyAdded }) {
    const [name, setName] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!name) {
            setError('El nombre de la compañía es obligatorio.');
            return;
        }

        try {
            const response = await api.post('/companies/', { name });
            setSuccess(`Compañía "${response.data.name}" creada con éxito.`);
            onCompanyAdded(response.data); // Notifica al componente padre para que refresque la lista
            setName(''); // Limpia el campo del formulario
        } catch (err) {
            setError(err.response?.data?.detail || err.message);
        }
    };

    return (
        <div className="dashboard-card">
            <h3>Crear Nueva Compañía</h3>
            <form onSubmit={handleSubmit} className="card-form">
                {error && <p style={{ color: 'red' }}>{error}</p>}
                {success && <p style={{ color: 'green' }}>{success}</p>}
                <div className="form-group"><label>Nombre de la Compañía:</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} required /></div>
                <div className="form-actions"><button type="submit" className="btn-save">Añadir Compañía</button></div>
            </form>
        </div>
    );
}

export default NewCompanyForm;