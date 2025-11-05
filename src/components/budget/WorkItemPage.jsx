import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import WorkItemModal from './WorkItemModal';

import api from '../../api/axiosConfig'; // 1. Importar axios
const formatCurrency = (value) => { // (Esta función está bien)
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(value);
};

function WorkItemPage() {
  const { projectId } = useParams();
  
  const [workItems, setWorkItems] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedId, setSelectedId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('new');
  
  // --- 1. NUEVO ESTADO PARA EL TOTAL ---
  const [totalPresupuestoBase, setTotalPresupuestoBase] = useState(0);

  const fetchWorkItems = () => {
    setLoading(true);
    api.get(`/projects/${projectId}/work_items/`) // 2. Usar api.get
      .then(response => {
        const data = response.data;
        setWorkItems(data);
        
        // --- 2. CALCULAR EL TOTAL ---
        // Sumamos el presupuesto base de todas las partidas
        const total = data.reduce((acc, item) => acc + item.presupuesto_base, 0);
        setTotalPresupuestoBase(total);
      })
      .catch(err => {
        setError(err.message);
      }).finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchWorkItems();
  }, [projectId]);

  const handleNew = () => { setModalMode('new'); setSelectedId(null); setIsModalOpen(true); };
  const handleEdit = () => { if (!selectedId) { alert('Seleccione partida'); return; } setModalMode('edit'); setIsModalOpen(true); };
  const handleDelete = async () => {
    if (!selectedId) { alert('Seleccione partida'); return; }
    if (window.confirm('¿Borrar partida?')) {
      try { // 3. Usar api.delete
        await api.delete(`/work_items/${selectedId}`);
        fetchWorkItems(); // Recargamos la lista
        setSelectedId(null);
      } catch (err) { setError(err.message); }
    }
  };

  const handleSave = (savedItem) => {
    fetchWorkItems(); 
    setSelectedId(savedItem.id);
  };

  const selectedWorkItem = workItems.find(w => w.id === selectedId);

  return (
    <div>
      <div className="page-header">
        {/* --- 3. RENOMBRAMOS EL TÍTULO --- */}
        <h2>Presupuesto Base (Partidas)</h2>
        <div className="page-actions">
          <button className="btn-new" onClick={handleNew}>Nueva Partida</button>
          <button className="btn-modify" onClick={handleEdit}>Editar Partida</button>
          <button className="btn-delete" onClick={handleDelete}>Borrar Partida</button>
        </div>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      {/* --- 4. ACTUALIZAMOS LA TABLA --- */}
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table" style={{ minWidth: '1000px' }}>
          <thead>
            <tr>
              <th>Código</th>
              <th>Descripción</th>
              <th>Presupuesto Base (PV)</th>
              <th>Peso %</th>
              <th>Costo Real (AC)</th>
              <th>Diferencia (CV)</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan="6">Cargando...</td></tr>}
            
            {workItems.map(item => {
              // --- 5. CÁLCULO DEL PESO % ---
              const pesoPorcentaje = (totalPresupuestoBase > 0)
                ? (item.presupuesto_base / totalPresupuestoBase) * 100
                : 0;
              
              const diffStyle = item.diferencia_costo < 0 ? { color: 'red', fontWeight: 'bold' } : {};

              return (
                <tr 
                  key={item.id}
                  className={item.id === selectedId ? 'selected' : ''}
                  onClick={() => setSelectedId(item.id)}
                >
                  <td>{item.item_code}</td>
                  <td>{item.description}</td>
                  <td>{formatCurrency(item.presupuesto_base)}</td>
                  <td>{pesoPorcentaje.toFixed(2)}%</td>
                  {/* Campos calculados desde la API */}
                  <td>{formatCurrency(item.costo_real)}</td>
                  <td style={diffStyle}>{formatCurrency(item.diferencia_costo)}</td>
                </tr>
              );
            })}
          </tbody>
          {/* --- 6. AÑADIMOS UNA FILA DE TOTALES --- */}
          <tfoot>
            <tr style={{ fontWeight: 'bold', backgroundColor: '#f8f9fa' }}>
              <td colSpan="2" style={{ textAlign: 'right' }}>TOTALES:</td>
              <td>{formatCurrency(totalPresupuestoBase)}</td>
              <td>100.00%</td>
              <td>{formatCurrency(workItems.reduce((acc, item) => acc + item.costo_real, 0))}</td>
              <td>{formatCurrency(workItems.reduce((acc, item) => acc + item.diferencia_costo, 0))}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {isModalOpen && (
        <WorkItemModal
          mode={modalMode}
          projectId={projectId}
          initialData={selectedWorkItem}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

export default WorkItemPage;