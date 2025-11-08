// src/components/admin/NonWorkingDays.jsx
import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';

function NonWorkingDays() {
  const [nonWorkingDays, setNonWorkingDays] = useState([]);
  const [newDate, setNewDate] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Carga los días no laborables existentes desde el backend
  const fetchNonWorkingDays = async () => {
    try {
      setLoading(true);
      // Nota: Este endpoint GET /settings/non-working-days/ necesita ser creado en tu backend.
      const response = await api.get('/settings/non-working-days/');
      setNonWorkingDays(response.data);
    } catch (err) {
      setError('No se pudieron cargar los días no laborables. Asegúrate de que el endpoint exista en la API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNonWorkingDays();
  }, []);

  // Maneja el envío del formulario para añadir un nuevo día
  const handleAddDay = async (e) => {
    e.preventDefault();
    if (!newDate || !newDescription) {
      setError('La fecha y la descripción son obligatorias.');
      return;
    }
    try {
      // Nota: Este endpoint POST /settings/non-working-days/ necesita ser creado en tu backend.
      const response = await api.post('/settings/non-working-days/', {
        date: newDate,
        description: newDescription,
      });
      setNonWorkingDays([...nonWorkingDays, response.data]);
      setNewDate('');
      setNewDescription('');
      setError(null);
    } catch (err) {
      setError('Error al añadir el día no laborable.');
    }
  };

  // Maneja la eliminación de un día
  const handleDeleteDay = async (dayId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este día?')) {
      try {
        // Nota: Este endpoint DELETE /settings/non-working-days/{id}/ necesita ser creado en tu backend.
        await api.delete(`/settings/non-working-days/${dayId}/`);
        setNonWorkingDays(nonWorkingDays.filter(day => day.id !== dayId));
      } catch (err) {
        setError('Error al eliminar el día.');
      }
    }
  };

  return (
    <div className="dashboard-card">
      <h3>Configurar Días No Laborables</h3>
      <form onSubmit={handleAddDay} className="card-form" style={{ gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'flex-end' }}>
        <div className="form-group">
          <label>Fecha:</label>
          <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Descripción (Ej: Año Nuevo):</label>
          <input type="text" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
        </div>
        <button type="submit" className="btn-save">Añadir</button>
      </form>

      {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}

      <h4 style={{ marginTop: '2rem' }}>Días Configurados:</h4>
      {loading ? <p>Cargando...</p> : (
        <ul className="item-list">
          {nonWorkingDays.length === 0 && <li>No hay días no laborables configurados.</li>}
          {nonWorkingDays.map(day => (
            <li key={day.id}>
              <span><strong>{day.date}</strong> - {day.description}</span>
              <button className="btn-delete" style={{padding: '4px 8px'}} onClick={() => handleDeleteDay(day.id)}>
                X
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default NonWorkingDays;