// src/components/budget/EstimateDetailPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axiosConfig';
import EstimateModal from './EstimateModal';

const formatCurrency = (val) => 
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val || 0);

function EstimateDetailPage() {
  const { projectId, estimateId } = useParams();
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [contractItemId, setContractItemId] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [filterParentId, setFilterParentId] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const fetchEstimate = useCallback(async () => {
    try {
      const res = await api.get(`/estimates/${estimateId}`);
      setEstimate(res.data);
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar el detalle de la estimación.");
    }
    setLoading(false);
  }, [estimateId]);

  useEffect(() => { fetchEstimate(); }, [fetchEstimate]);

  const handleAddItem = async (e) => {
    e.preventDefault();
    setError(null);
    if (!contractItemId || !cantidad) {
      setError('Seleccione un concepto y una cantidad.');
      return;
    }

    try {
      await api.post(`/estimates/${estimateId}/items/`, {
        contract_item_id: parseInt(contractItemId),
        cantidad_estimada: parseFloat(cantidad)
      });
      setCantidad('');
      setContractItemId('');
      fetchEstimate();
    } catch (err) {setError(err.response?.data?.detail || "Error al agregar concepto");}
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm("¿Borrar este avance?")) return;
    try {
      await api.delete(`/estimate_items/${itemId}`);
      fetchEstimate();
    } catch (err) { setError("Error al borrar"); }
  };

  const handleEditSave = () => {
    setShowEditModal(false);
    fetchEstimate();
  }

  if (loading) return <p>Cargando detalle...</p>;
  if (error && !estimate) return <p style={{ color: 'red' }}>{error}</p>;
  if (!estimate) return <p>No encontrada.</p>;

  const allConcepts = estimate.contract?.contract_items || [];
  const requiresConceptEntry = allConcepts.length > 0;
  const parentGroups = allConcepts.filter(item => item.is_group);
  const uniqueLevels = [...new Set(allConcepts.map(item => item.nivel_zona).filter(Boolean))].sort();
  const filteredConcepts = allConcepts.filter(item => {
    if (item.is_group) return false;
    if (filterParentId) {
      if (item.parent_id !== parseInt(filterParentId)) return false;
    }

    if (filterLevel) {
      if (item.nivel_zona !== filterLevel) return false;
    }

    return true;
  });

  const montoEstimadoBase = estimate.total_estimado || 0;
  const totalItems = estimate.estimate_items?.reduce((acc, item) => acc + (item.total_estimado || 0), 0) || 0;
  let amortizadoDisplay = estimate.amortizacion_anticipo || 0;
  let amortizacionCalculada = 0;

  if (estimate.contract) {
    const totalConIva = estimate.contract.total_con_iva ||
      (estimate.contract.total_ordinario * (estimate.contract.aplica_iva ? 1.16 : 1)) ||
      1;
    const anticipo = estimate.contract.anticipo || 0;

    if (totalConIva > 0 && anticipo > 0) {
      amortizacionCalculada = montoEstimadoBase * (anticipo / totalConIva);
    }
  }

  if (!amortizadoDisplay && amortizacionCalculada > 0) {
    amortizadoDisplay = amortizacionCalculada;
  }

  const fondoGarantia = estimate.fondo_garantia || 0;
  const deductivas = estimate.otras_deductivas || 0;
  const retenciones = estimate.otras_retenciones || 0;
  const subtotalNeto = montoEstimadoBase - amortizadoDisplay - fondoGarantia - deductivas - retenciones;
  const aplicaIVA = estimate.contract?.aplica_iva ?? true;
  const iva = aplicaIVA ? (subtotalNeto * 0.16) : 0;
  const totalPagar = subtotalNeto + iva;

  return (
    <div>
      <Link to={`/projects/${projectId}/budget/estimates`}>&larr; Volver a Estimaciones</Link>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Estimación {estimate.numero_estimacion} (Contrato: {estimate.contract?.numero_contrato})</h2>
        <button className="btn-secondary" onClick={() => setShowEditModal(true)}>
          Editar Encabezado Completo
        </button>
      </div>

      <div className="dashboard-card" style={{ borderLeft: '5px solid #007bff' }}>
        <h4>Resumen Financiero</h4>
        <p>Monto Estimado (BASE): <strong>{formatCurrency(montoEstimadoBase)}</strong></p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <p style={{ margin: 0 }}>(-) Amortización: <strong>{formatCurrency(amortizadoDisplay)}</strong></p>
          <button
            className="btn-icon"
            onClick={() => setShowEditModal(true)}
            style={{ padding: '2px 8px', fontSize: '0.8rem', background: '#eee', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}
            title="Editar Amortización"
          >            ✏️
          </button>
        </div>

        <p>(-) Fondo Garantía: <strong>{formatCurrency(fondoGarantia)}</strong></p>
        <p>(-) Deductivas: <strong>{formatCurrency(deductivas)}</strong></p>
        <p>(-) Otras Retenciones: <strong>{formatCurrency(retenciones)}</strong></p>
        <hr style={{ margin: '5px 0' }} />
        <p>Subtotal Neto: <strong>{formatCurrency(subtotalNeto)}</strong></p>
        <p>IVA: <strong>{formatCurrency(iva)}</strong></p>
        <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Total a Pagar: <strong>{formatCurrency(totalPagar)}</strong></p>
      </div>

      {requiresConceptEntry ? (
        <>
          <hr />
          <h3>Captura de Avance por Concepto</h3>

          {error && <p style={{ color: 'red' }}>{error}</p>}

          <form onSubmit={handleAddItem} style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-end',
            marginBottom: '40px',
            width: '100%',
            flexWrap: 'wrap'
          }}>

            {/* FILTRO: Agrupador */}
            <div style={{ flex: '1 1 200px' }} className="form-group">
              <label>Filtrar por Agrupador:</label>
              <select
                className="form-control"
                value={filterParentId}
                onChange={e => { setFilterParentId(e.target.value); setContractItemId(''); }}
              >
                <option value="">-- Todos los Grupos --</option>
                {parentGroups.map(group => (
                  <option key={group.id} value={group.id}>{group.concepto}</option>
                ))}
              </select>
            </div>

            {/* FILTRO: Nivel/Zona */}
            <div style={{ flex: '1 1 150px' }} className="form-group">
              <label>Filtrar por Nivel/Zona:</label>
              <select
                className="form-control"
                value={filterLevel}
                onChange={e => { setFilterLevel(e.target.value); setContractItemId(''); }}
              >
                <option value="">-- Todos --</option>
                {uniqueLevels.map(lvl => (
                  <option key={lvl} value={lvl}>{lvl}</option>
                ))}
              </select>
            </div>

            {/* SELECCIÓN: Concepto */}
            <div style={{ flex: '2 1 300px', minWidth: 0 }} className="form-group">
              <label>Concepto a Estimar:</label>
              <select
                className="form-control"
                value={contractItemId}
                onChange={e => setContractItemId(e.target.value)}
                style={{
                  width: '100%',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden'
                }}
              >
                <option value="">-- Seleccionar Concepto ({filteredConcepts.length}) --</option>
                {filteredConcepts.map(item => (
                  <option key={item.id} value={item.id} title={`${item.clave} - ${item.concepto}`}>
                    {item.clave} - {item.concepto} (Disp: {item.cantidad_por_estimar})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ flex: '0 1 150px' }} className="form-group">
              <label>Cantidad:</label>
              <input type="number" className="form-control" value={cantidad} onChange={e => setCantidad(e.target.value)} step="any" />
            </div>
            <button type="submit" className="btn-save" style={{ height: '38px', marginBottom: '0' }}>Agregar</button>
          </form>

          <table className="data-table">
            <thead>
              <tr>
                <th>Clave</th>
                <th>Concepto</th>
                <th>Unidad</th>
                <th>P.U.</th>
                <th>Cantidad Actual</th>
                <th>Importe Actual</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {estimate.estimate_items.map(item => (
                <tr key={item.id}>
                  <td>{item.contract_item.clave}</td>
                  <td>{item.contract_item.concepto}</td>
                  <td>{item.contract_item.unidad}</td>
                  <td>{formatCurrency(item.contract_item.precio_unitario)}</td>
                  <td>{item.cantidad_estimada}</td>
                  <td>{formatCurrency(item.total_estimado)}</td>
                  <td><button className="btn-delete" onClick={() => handleDeleteItem(item.id)}>Eliminar</button></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <td colSpan="5" style={{ textAlign: 'right', fontWeight: 'bold' }}>Total Estimación:</td>
                <td style={{ fontWeight: 'bold' }}>{formatCurrency(totalItems)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </>
      ) : (
        <p style={{ marginTop: '2rem', fontStyle: 'italic' }}>
          Este contrato no tiene un catálogo de conceptos cargado. La estimación se basa en el **Monto Estimado (BASE)** del encabezado.
        </p>
      )}

      {/* MODAL DE EDICIÓN DEL ENCABEZADO */}
      {showEditModal && (
        <EstimateModal
          mode="edit"
          projectId={projectId}
          initialData={estimate}
          onClose={() => setShowEditModal(false)}
          onSave={handleEditSave}
        />
      )}
    </div>
  );
}
export default EstimateDetailPage;