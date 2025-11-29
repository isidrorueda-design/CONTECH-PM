import React, { useState } from 'react';

function IssueForm({ projectId, initialData, onSubmit, onCancel }) {
    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        description: initialData?.description || '',
        topic_status: initialData?.topic_status || 'Open',
        topic_type: initialData?.topic_type || 'Issue',
        priority: initialData?.priority || 'Normal',
        assigned_to: initialData?.assigned_to || '',
        // Los datos de la cámara (viewpoint) se manejan al enviar si es una nueva incidencia
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="issue-form" style={{ padding: '15px', height: '100%', overflowY: 'auto' }}>
            <h3>{initialData ? 'Editar Incidencia' : 'Nueva Incidencia'}</h3>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Título</label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                </div>

                <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Descripción</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="4"
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Estado</label>
                        <select
                            name="topic_status"
                            value={formData.topic_status}
                            onChange={handleChange}
                            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                        >
                            <option value="Open">Abierto</option>
                            <option value="In Progress">En Progreso</option>
                            <option value="Resolved">Resuelto</option>
                            <option value="Closed">Cerrado</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Tipo</label>
                        <select
                            name="topic_type"
                            value={formData.topic_type}
                            onChange={handleChange}
                            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                        >
                            <option value="Issue">Problema</option>
                            <option value="Clash">Colisión</option>
                            <option value="Request">Solicitud</option>
                            <option value="Remark">Nota</option>
                        </select>
                    </div>
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Asignado a (Email)</label>
                    <input
                        type="text"
                        name="assigned_to"
                        value={formData.assigned_to}
                        onChange={handleChange}
                        placeholder="email@ejemplo.com"
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button
                        type="button"
                        onClick={onCancel}
                        style={{ padding: '8px 16px', background: '#f5f5f5', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        style={{ padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        {initialData ? 'Guardar Cambios' : 'Crear Incidencia'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default IssueForm;
