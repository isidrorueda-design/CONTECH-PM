import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axiosConfig';
import FinancialSummaryModal from './FinancialSummaryModal';
import './EstimateDetailPage.css';

const formatCurrency = (val) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val || 0);
function EstimateDetailPage() {
  const { projectId, estimateId } = useParams();
  const [estimate, setEstimate] = useState(null);
  const [estimateDetails, setEstimateDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFinancialModal, setShowFinancialModal] = useState(false);
  const [contractItemId, setContractItemId] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [filterParentId, setFilterParentId] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [contractConcepts, setContractConcepts] = useState([]);
  const fetchEstimate = useCallback(async () => {
    try {
      const res = await api.get(`/estimates/${estimateId}/`);
      const estimateData = res.data;
      let concepts = [];

      if (estimateData.contract) {
        if (estimateData.contract.contract_items && estimateData.contract.contract_items.length > 0) {
          concepts = estimateData.contract.contract_items;
        } else {
          const contractRes = await api.get(`/contracts/${estimateData.contract.id}/`);
          estimateData.contract = { ...estimateData.contract, ...contractRes.data };
          concepts = contractRes.data.contract_items || [];
        }
      }
      setContractConcepts(concepts);
      setEstimate(estimateData);
      const items = estimateData.estimate_items || [];
      const detailsWithEditState = items.map(item => {
        const conceptId = item.contract_item?.id;
        let foundConcept = null;
        if (conceptId) {
          foundConcept = concepts.find(c => c.id == conceptId);
        }

        return {
          ...item,
          contract_concept: foundConcept || {},
          isEditing: false,
          // Aseguramos que currentQuantity siempre tenga un valor definido para evitar el warning de "uncontrolled input".
          currentQuantity: item.cantidad_estimada ?? ''
        };
      });

      setEstimateDetails(detailsWithEditState);

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

    const contractItemIdInt = parseInt(contractItemId, 10);
    const cantidadFloat = parseFloat(cantidad);

    if (isNaN(contractItemIdInt) || contractItemIdInt <= 0) {
      setError('Por favor, seleccione un concepto válido.');
      return;
    }
    if (isNaN(cantidadFloat) || cantidadFloat <= 0) {
      setError('Por favor, ingrese una cantidad válida y mayor a cero.');
      return;
    }

    try {
      await api.post(`/estimates/${estimateId}/items/`, {
        contract_item_id: contractItemIdInt,
        cantidad_estimada: cantidadFloat
      });
      setCantidad('');
      setContractItemId('');
      fetchEstimate();
    } catch (err) { setError(err.response?.data?.detail || "Error al agregar concepto"); }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm("¿Borrar este avance?")) return;
    try {
      await api.delete(`/estimates/${estimateId}/items/${itemId}/`);
      fetchEstimate();
    } catch (err) { setError("Error al borrar"); }
  };

  const handleQuantityChange = (detailId, value) => {
    setEstimateDetails(prevDetails =>
      prevDetails.map(d =>
        d.id === detailId ? { ...d, currentQuantity: value } : d
      )
    );
  };

  const handleSaveQuantity = async (detailId) => {
    const detail = estimateDetails.find(d => d.id === detailId);
    if (!detail) return;

    if (parseFloat(detail.currentQuantity) === parseFloat(detail.quantity)) {
      return;
    }

    try {
      const payload = {
        // El backend solo necesita la cantidad para la actualización.
        cantidad_estimada: parseFloat(detail.currentQuantity) || 0
      };
      // Corregimos la URL para que apunte al endpoint correcto de la API.
      await api.put(`/estimate_items/${detail.id}/`, payload);

      setEstimateDetails(prevDetails =>
        prevDetails.map(d =>
          d.id === detailId ? { ...d, cantidad_estimada: detail.currentQuantity } : d
        )
      );
    } catch (err) {
      console.error("Error al guardar la cantidad:", err);
      alert("No se pudo guardar la cantidad.");
      setEstimateDetails(prevDetails =>
        prevDetails.map(d =>
          d.id === detailId ? { ...d, currentQuantity: d.cantidad_estimada } : d
        )
      );
    }
  };

  const totalEstimadoActual = estimateDetails.reduce((sum, d) => {
    const quantity = parseFloat(d.currentQuantity) || 0;
    const price = parseFloat(d.contract_concept?.precio_unitario) || 0;
    return sum + (quantity * price);
  }, 0);

  if (loading) return <p>Cargando detalle...</p>;
  if (error && !estimate) return <p style={{ color: 'red' }}>{error}</p>;
  if (!estimate) return <p>No encontrada.</p>;

  const allConcepts = contractConcepts.length > 0 ? contractConcepts : (estimate.contract?.contract_items || []);
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

  // Lógica de visualización de amortización
  let amortizacionCalculada = 0;
  if (estimate.contract) {
    let totalConIva = parseFloat(estimate.contract.total_con_iva);
    if (isNaN(totalConIva) || totalConIva === 0) {
      totalConIva = (parseFloat(estimate.contract.total_ordinario) || 0) * (estimate.contract.aplica_iva ? 1.16 : 1);
    }
    const anticipo = estimate.contract.anticipo || 0;

    if (totalConIva > 0 && anticipo > 0) {
      amortizacionCalculada = montoEstimadoBase * (anticipo / totalConIva);
    }
  }
  // Si estimate.amortizacion_anticipo tiene valor (incluso 0 si fue manual), lo usamos.
  // Si es null, usamos la calculada.
  const amortizadoDisplay = estimate.amortizacion_anticipo ?? amortizacionCalculada;

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
      </div>
      <div className="dashboard-card" style={{ borderLeft: '5px solid #007bff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4>Resumen Financiero</h4>
          <button
            className="btn-secondary"
            onClick={() => setShowFinancialModal(true)}
            style={{ fontSize: '0.8rem', padding: '5px 10px' }}
          >
            Editar Detalles Financieros
          </button>
        </div>

        <p>Monto Estimado (BASE): <strong>{formatCurrency(montoEstimadoBase)}</strong></p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <p style={{ margin: 0 }}>(-) Amortización: <strong>{formatCurrency(amortizadoDisplay)}</strong></p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <p style={{ margin: 0 }}>(-) Fondo Garantía ({((estimate.porcentaje_fondo_garantia || 0) * 100).toFixed(2)}%): <strong>{formatCurrency(fondoGarantia)}</strong></p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <p style={{ margin: 0 }}>(-) Deductivas: <strong>{formatCurrency(deductivas)}</strong></p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <p style={{ margin: 0 }}>(-) Otras Retenciones: <strong>{formatCurrency(retenciones)}</strong></p>
        </div>

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

          <div className="table-responsive">
            <table className="data-table estimate-detail-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Concepto</th>
                  <th>Unidad</th>
                  <th>P.U.</th>
                  <th>Cant. Contratada</th>
                  <th>Cant. Acumulada</th>
                  <th>Cant. por Estimar</th>
                  <th>Cantidad</th>
                  <th>Importe</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {estimateDetails.map(d => {
                  const concept = d.contract_concept || {};
                  const cantidadPorEstimar = concept.cantidad_por_estimar || 0;
                  const importe = (parseFloat(d.currentQuantity) || 0) * (concept.precio_unitario || 0);
                  return (
                    <tr key={d.id}>
                      <td>{concept.clave || '-'}</td>
                      <td>{concept.concepto || 'Concepto no encontrado'}</td>
                      <td>{concept.unidad || '-'}</td>
                      <td>{formatCurrency(concept.precio_unitario)}</td>
                      <td>{(concept.cantidad_contratada || 0).toFixed(2)}</td>
                      <td>{(concept.cantidad_acumulada || 0).toFixed(2)}</td>
                      <td style={{ color: cantidadPorEstimar < 0 ? 'red' : 'inherit' }}>{cantidadPorEstimar.toFixed(2)}</td>
                      <td>
                        <input
                          type="number"
                          className="inline-edit-input"
                          value={d.currentQuantity}
                          onChange={(e) => handleQuantityChange(d.id, e.target.value)}
                          onBlur={() => handleSaveQuantity(d.id)}
                          step="0.01"
                        />
                      </td>
                      <td>{formatCurrency(importe)}</td>
                      <td><button className="btn-delete" onClick={() => handleDeleteItem(d.id)}>Eliminar</button></td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="8" style={{ textAlign: 'right', fontWeight: 'bold' }}>Total de esta Estimación:</td>
                  <td style={{ fontWeight: 'bold' }}>{formatCurrency(totalEstimadoActual)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      ) : (
        <p style={{ marginTop: '2rem', fontStyle: 'italic' }}>
          Este contrato no tiene un catálogo de conceptos cargado. La estimación se basa en el **Monto Estimado (BASE)** del encabezado.
        </p>
      )}

      {/* MODAL DE EDICIÓN FINANCIERA */}
      {showFinancialModal && (
        <FinancialSummaryModal
          estimate={estimate}
          onClose={() => setShowFinancialModal(false)}
          onSave={(updatedEstimate) => {
            setShowFinancialModal(false);
            // Actualizamos el estado directamente con la respuesta de la API, sin hacer otra petición.
            setEstimate(updatedEstimate);
          }}
        />
      )}
    </div>
  );
}

export default EstimateDetailPage;