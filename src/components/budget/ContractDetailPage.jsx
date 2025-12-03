import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axiosConfig';
import ContractItemRow from './ContractItemRow';
import EstimateModal from './EstimateModal';
const formatCurrency = (value) => {
  if (typeof value !== 'number') value = 0;
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
};
function ContractItemManager({ contract, onDataChange }) {
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const [importError, setImportError] = useState(null);
  const [importSuccess, setImportSuccess] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('new');  
  const [clave, setClave] = useState('');
  const [concepto, setConcepto] = useState('');
  const [unidad, setUnidad] = useState('');
  const [nivelZona, setNivelZona] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [precio, setPrecio] = useState('');
  const [aditiva, setAditiva] = useState('');
  const [deductiva, setDeductiva] = useState('');
  const [tipoConcepto, setTipoConcepto] = useState('Ordinario');
  const [isGroup, setIsGroup] = useState(false);
  const [parentId, setParentId] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [isColumnConfigOpen, setIsColumnConfigOpen] = useState(false);

  useEffect(() => {
    if (contract?.contract_items) {
      const initialCollapsedState = {};
      contract.contract_items.forEach(item => {
        if (item.is_group) initialCollapsedState[item.id] = true;
      });
      setCollapsedGroups(initialCollapsedState);
    }
  }, [contract?.contract_items]);

  const [columns, setColumns] = useState({
    clave: { label: 'Clave', visible: true },
    concepto: { label: 'Concepto', visible: true },
    unidad: { label: 'Unidad', visible: true },
    nivel_zona: { label: 'Nivel/Zona', visible: true },
    tipo_concepto: { label: 'Tipo', visible: true },
    avance_fisico: { label: 'Avance Fís.', visible: true },
    cantidad_contratada: { label: 'Cant. Cont.', visible: true },
    cantidad_aditiva: { label: 'Cant. Adi.', visible: true },
    cantidad_deductiva: { label: 'Cant. Ded.', visible: true },
    cantidad_total_vigente: { label: 'Cant. Vigente', visible: true },
    precio_unitario: { label: 'P.U.', visible: true },
    total_contratado_vigente: { label: 'Total Vigente', visible: true },
    cantidad_estimada_acumulada: { label: 'Cant. Estimada', visible: true },
    cantidad_por_estimar: { label: 'Cant. por Estimar', visible: true },
  });
  const handleColumnChange = (col) => setColumns(prev => ({ ...prev, [col]: { ...prev[col], visible: !prev[col].visible } }));
  useEffect(() => {
    if (isGroup) {
      setUnidad(''); setCantidad(''); setPrecio(''); setAditiva('');
      setDeductiva(''); setTipoConcepto('Ordinario'); setNivelZona('');
    }
  }, [isGroup]);  
  const handleSelectItem = (item) => {
    setSelectedItemId(item.id);
    setParentId(item.id);
  };
  const handleNew = () => {
    setClave(''); setConcepto(''); setUnidad(''); setNivelZona('');
    setCantidad(''); setPrecio(''); setAditiva(''); setDeductiva('');
    setTipoConcepto('Ordinario'); setIsGroup(false); setParentId(null);
    setError(null);
    setFormMode('new');
    setIsFormOpen(true);
  };
  const handleEdit = () => {
    const itemToEdit = flatItemList.find(i => i.id === selectedItemId);
    if (!itemToEdit) return;
    setClave(itemToEdit.clave || ''); setConcepto(itemToEdit.concepto || '');
    setUnidad(itemToEdit.unidad || ''); setNivelZona(itemToEdit.nivel_zona || '');
    setCantidad(itemToEdit.cantidad_contratada || ''); setPrecio(itemToEdit.precio_unitario || '');
    setAditiva(itemToEdit.cantidad_aditiva || ''); setDeductiva(itemToEdit.cantidad_deductiva || '');
    setTipoConcepto(itemToEdit.tipo_concepto || 'Ordinario'); setIsGroup(itemToEdit.is_group || false);
    setParentId(itemToEdit.parent_id || null);
    setFormMode('edit'); setIsFormOpen(true);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const cantidadNum = parseFloat(cantidad) || 0;
    const precioNum = parseFloat(precio) || 0;
    if (!concepto) {
      setError("El Concepto es obligatorio.");
      return;
    }
    if (!isGroup && cantidadNum <= 0) {
      setError("La Cantidad debe ser mayor a 0 para un concepto real.");
      return;
    }

    try {
      const newItemData = {
        clave: clave || null,
        concepto,
        unidad: isGroup ? null : (unidad || null),
        nivel_zona: nivelZona || null,
        precio_unitario: isGroup ? 0 : precioNum,
        cantidad_contratada: isGroup ? 0 : cantidadNum,
        cantidad_aditiva: isGroup ? 0 : (parseFloat(aditiva) || 0),
        cantidad_deductiva: isGroup ? 0 : (parseFloat(deductiva) || 0),
        tipo_concepto: isGroup ? 'Ordinario' : tipoConcepto,
        is_group: isGroup,
        parent_id: parentId ? parseInt(parentId, 10) : null
      };      
      
      if (formMode === 'new') {
        await api.post(`/contracts/${contract.id}/items/`, newItemData);
      } else {
        await api.put(`/contract_items/${selectedItemId}`, newItemData);
      }
      
      setTipoConcepto('Ordinario'); setIsGroup(false); setParentId(null);      
      setTipoConcepto('Ordinario'); setIsGroup(false); setParentId(null);      
      setIsFormOpen(false);
      onDataChange();
      
    } catch (err) {
      setError(err.response?.data?.detail || "Error al añadir el concepto.");
    }
  };
  
  const handleDelete = async () => {
    const itemId = selectedItemId;
    if (!window.confirm("¿Seguro que quieres borrar este concepto? (Se borrarán todos sus hijos)")) return;
    setError(null);
    try {
        await api.delete(`/contract_items/${itemId}`);
        onDataChange();
    } catch (err) {
        setError(err.response?.data?.detail || "Error al borrar.");
    }
  };
  
  const handleProgressChange = async (itemId, newProgress) => {
    try {
      await api.patch(`/contract_items/${itemId}`, { avance_fisico: newProgress });
      onDataChange();
    } catch (err) {
      console.error("Error al actualizar el avance:", err);
      alert("No se pudo actualizar el avance del concepto.");
    }
  };
  const triggerFileSelect = () => {
    const message = "El archivo Excel debe tener las siguientes columnas en la primera fila:\n\n'clave', 'concepto', 'unidad', 'cantidad', 'precio_unitario', 'es_agrupador', 'clave_padre'\n\n- 'clave' y 'concepto' son obligatorios.\n- 'es_agrupador' debe ser 'SI' o 'NO'.\n- 'clave_padre' es la clave del concepto agrupador al que pertenece este ítem.";
    
    if (window.confirm(message)) {
      fileInputRef.current.click();
    }
  };

  const handleFileImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImportError(null);
    setImportSuccess(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('contract_id', contract.id);

    try {
const response = await api.post(`/contracts/${contract.id}/import_items/`,
  formData,
  {
    headers: { 'Content-Type': 'multipart/form-data' },
  }
);
      setImportSuccess(response.data.message);
      onDataChange();

    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Error al importar el archivo.';
      setImportError(errorMsg);
    }
    e.target.value = null;
  };

  const toggleGroup = (itemId) => {
    setCollapsedGroups(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const toggleAllGroups = () => {
    const allGroupIds = flatItemList.filter(i => i.is_group).map(i => i.id);
    const allCollapsed = allGroupIds.every(id => collapsedGroups[id]);
    const newCollapsedState = {};
    allGroupIds.forEach(id => {
      newCollapsedState[id] = !allCollapsed;
    });
    setCollapsedGroups(newCollapsedState);
  };
  const flatItemList = contract.contract_items || [];  
  const contractItemTree = useMemo(() => {
    const items = contract.contract_items || [];
    const map = {};
    const roots = [];    
    items.forEach(item => {
      map[item.id] = { ...item, subitems: [] };
    });
    
    Object.values(map).forEach(item => {
      if (item.parent_id && map[item.parent_id]) {
        map[item.parent_id].subitems.push(item);
      } else if (!item.parent_id) {
        roots.push(item);
      }
    });
    return roots;
  }, [contract.contract_items]);

  return (
    <div className="dashboard-card">
      <h3>Catálogo de Conceptos (Detalle del Contrato)</h3>
      <div className="page-actions" style={{ justifyContent: 'flex-start', marginBottom: '1rem' }}>
        <button 
          className="btn-import" 
          style={{backgroundColor: '#17a2b8', color: 'white'}}
          onClick={triggerFileSelect}
        >
          Importar Conceptos
        </button>
        <button
          className="btn-secondary"
          onClick={() => setIsColumnConfigOpen(true)}
        >
          Configurar Columnas
        </button>
        <button 
          className="btn-secondary"
          onClick={toggleAllGroups}
        >
          Agrupar/Desagrupar
        </button>
        <button
          className="btn-new"
          onClick={handleNew}
        >
          Nuevo Concepto
        </button>
        {selectedItemId && (
          <>
            <button className="btn-modify" onClick={handleEdit}>
              Modificar Concepto
            </button>
            <button className="btn-delete" onClick={handleDelete}>
              Borrar Concepto
            </button>
          </>
        )}
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileImport}
        style={{ display: 'none' }} 
        accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      />
      {importError && <p style={{ color: 'red' }}>Error de Importación: {importError}</p>}
      {importSuccess && <p style={{ color: 'green' }}>{importSuccess}</p>}

      {isColumnConfigOpen && (
        <div className="modal-overlay" onClick={() => setIsColumnConfigOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Configurar Columnas Visibles</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {Object.entries(columns).map(([key, { label, visible }]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    id={`col-${key}`}
                    checked={visible}
                    onChange={() => handleColumnChange(key)}
                  />
                  <label htmlFor={`col-${key}`} style={{ marginLeft: '8px', marginBottom: 0 }}>{label}</label>
                </div>
              ))}
            </div>
            <div className="modal-actions" style={{ marginTop: '1.5rem' }}><button className="btn-primary" onClick={() => setIsColumnConfigOpen(false)}>Cerrar</button></div>
          </div>
        </div>
      )}
      {isFormOpen && (
        <div className="modal-overlay" onClick={() => setIsFormOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{formMode === 'new' ? 'Añadir Nuevo Concepto' : 'Modificar Concepto'}</h3>
            <form onSubmit={handleSubmit} className="card-form">
              {error && <p style={{ color: 'red' }}>{error}</p>}              
              {error && <p style={{ color: 'red' }}>{error}</p>}
              
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ flex: '2 1 200px' }}>
                  <label>Elemento Padre:</label>
                  <select value={parentId || ''} onChange={(e) => setParentId(e.target.value || null)}>
                    <option value="">-- Raíz del Contrato --</option>
                    {flatItemList.filter(i => i.is_group).map(item => ( // Solo permite que los Agrupadores sean padres
                      <option key={item.id} value={item.id}>{item.concepto}</option>
                    ))}
                  </select>
                  <button type="button" className="btn-cancel" style={{marginLeft: '5px'}} onClick={() => {setParentId(null); setSelectedItemId(null);}}>Limpiar</button>
                </div>
                <div className="form-group" style={{ flex: '1 1 100px', flexDirection: 'row', alignItems: 'center' }}>
                  <input type="checkbox" id="is_group" checked={isGroup} onChange={(e) => setIsGroup(e.target.checked)} />
                  <label htmlFor="is_group" style={{ marginBottom: 0, marginLeft: '8px' }}>¿Es un Agrupador?</label>
                </div>
              </div>
              <hr style={{margin: '1rem 0'}}/>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ flex: '1 1 100px' }}>
                  <label>Clave:</label>
                  <input type="text" value={clave} onChange={(e) => setClave(e.target.value)} />
                </div>
                <div className="form-group" style={{ flex: '3 1 300px' }}>
                  <label>Concepto:</label>
                  <input type="text" value={concepto} onChange={(e) => setConcepto(e.target.value)} required />
                </div>
                <div className="form-group" style={{ flex: '1 1 100px' }}>
                  <label>Nivel/Zona:</label>
                  <input type="text" value={nivelZona} onChange={(e) => setNivelZona(e.target.value)} />
                </div>
                <div className="form-group" style={{ flex: '1 1 100px' }}>
                  <label>Tipo:</label>
                  <select value={tipoConcepto} onChange={(e) => setTipoConcepto(e.target.value)} disabled={isGroup}>
                    <option value="Ordinario">Ordinario</option>
                    <option value="Extraordinario">Extraordinario</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap', opacity: isGroup ? 0.5 : 1 }}>
                <div className="form-group" style={{ flex: '1 1 50px' }}>
                  <label>Unidad:</label>
                  <input type="text" value={unidad} onChange={(e) => setUnidad(e.target.value)} placeholder="m2, pza, etc." disabled={isGroup} />
                </div>
                <div className="form-group" style={{ flex: '1 1 80px' }}>
                  <label>Cantidad:</label>
                  <input type="number" value={cantidad} onChange={(e) => setCantidad(e.target.value)} step="any" disabled={isGroup} />
                </div>
                <div className="form-group" style={{ flex: '1 1 80px' }}>
                  <label>P.U. ($):</label>
                  <input type="number" value={precio} onChange={(e) => setPrecio(e.target.value)} step="any" disabled={isGroup} />
                </div>
                <div className="form-group" style={{ flex: '1 1 80px' }}>
                  <label>Aditiva (+):</label>
                  <input type="number" value={aditiva} onChange={(e) => setAditiva(e.target.value)} step="any" disabled={isGroup} />
                </div>
                <div className="form-group" style={{ flex: '1 1 80px' }}>
                  <label>Deductiva (-):</label>
                  <input type="number" value={deductiva} onChange={(e) => setDeductiva(e.target.value)} step="any" disabled={isGroup} />
                </div>
              </div>
              <div className="modal-actions" style={{marginTop: '1rem'}}>
                <button type="button" className="btn-cancel" onClick={() => setIsFormOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-save">{formMode === 'new' ? 'Guardar Concepto' : 'Actualizar Concepto'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
        <table className="data-table" style={{minWidth: '1800px'}}>
          <thead>
            <tr>
              {Object.entries(columns).map(([key, { label, visible }]) => {                
                if (!visible) return null;
                
                const style = {};
                if (key === 'concepto') style.minWidth = '600px';
                if (key === 'concepto') style.width = '30%';
                if (['clave', 'cantidad_contratada', 'cantidad_aditiva', 'cantidad_deductiva'].includes(key)) {
                  style.minWidth = '140px';
                }

                return <th key={key} style={style}>{label}</th>;
              })}
            </tr>
          </thead>
          <tbody>
            {contractItemTree.length === 0 && (
              <tr><td colSpan={Object.values(columns).filter(c => c.visible).length}>Aún no se han añadido conceptos a este contrato.</td></tr>
            )}
            {contractItemTree.map(item => (
              <ContractItemRow 
                key={item.id} 
                item={item}
                onSelectItem={handleSelectItem}
                isSelected={item.id === selectedItemId}
                collapsedGroups={collapsedGroups}
                onToggleGroup={toggleGroup}
                visibleColumns={columns}
                onProgressChange={handleProgressChange}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function EstimateManager({ contract, onDataChange }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { projectId } = useParams();
  const handleSave = () => {
    setIsModalOpen(false);
    onDataChange();
  };
  const estimateTotals = useMemo(() => {
    if (!contract.estimates || contract.estimates.length === 0) {
      return { montoEstimado: 0, deductivas: 0, amortizado: 0, fondoGarantia: 0, retenciones: 0, totalPagar: 0 };
    }
    return contract.estimates.reduce((acc, est) => {
      const montoEstimado = est.total_estimado || 0;
      let amortizado = est.amortizacion_anticipo || 0;
      if (!amortizado && contract) {
        const totalConIva = contract.total_con_iva || (contract.total_ordinario * (contract.aplica_iva ? 1.16 : 1)) || 1;
        const anticipo = contract.anticipo || 0;
        if (totalConIva > 0 && anticipo > 0) {
          amortizado = montoEstimado * (anticipo / totalConIva);
        }
      }

      const fondoGarantia = est.fondo_garantia || 0;
      const deductivas = est.otras_deductivas || 0;
      const retenciones = est.otras_retenciones || 0;
      const subtotalNeto = montoEstimado - amortizado - fondoGarantia - deductivas - retenciones;
      const aplicaIVA = contract?.aplica_iva ?? true;
      const iva = aplicaIVA ? (subtotalNeto * 0.16) : 0;
      const totalPagar = subtotalNeto + iva;

      acc.montoEstimado += montoEstimado;
      acc.deductivas += deductivas;
      acc.amortizado += amortizado;
      acc.fondoGarantia += fondoGarantia;
      acc.retenciones += retenciones;
      acc.totalPagar += totalPagar;
      return acc;
    }, { montoEstimado: 0, deductivas: 0, amortizado: 0, fondoGarantia: 0, retenciones: 0, totalPagar: 0 });
  }, [contract]);

  return (
    <div className="dashboard-card">
      <div className="page-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Estimaciones de este Contrato</h3>
        <button className="btn-new" onClick={() => setIsModalOpen(true)}>
          Nueva Estimación
        </button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>No. Estimación</th>
            <th>Monto Estimado</th>
            <th>Deductivas</th>
            <th>Amortización</th>
            <th>Fondo Garantía</th>
            <th>Retenciones</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {(!contract.estimates || contract.estimates.length === 0) && (
            <tr><td colSpan="7">No hay estimaciones para este contrato.</td></tr>
          )}
          {contract.estimates?.map(est => {
            const montoEstimado = est.total_estimado || 0;
            let amortizado = est.amortizacion_anticipo || 0;

            if (!amortizado && contract) {
              const totalConIva = contract.total_con_iva || (contract.total_ordinario * (contract.aplica_iva ? 1.16 : 1)) || 1;
              const anticipo = contract.anticipo || 0;
              if (totalConIva > 0 && anticipo > 0) {
                amortizado = montoEstimado * (anticipo / totalConIva);
              }
            }

            const fondoGarantia = est.fondo_garantia || 0;
            const deductivas = est.otras_deductivas || 0;
            const retenciones = est.otras_retenciones || 0;
            const subtotalNeto = montoEstimado - amortizado - fondoGarantia - deductivas - retenciones;
            const aplicaIVA = contract?.aplica_iva ?? true;
            const iva = aplicaIVA ? (subtotalNeto * 0.16) : 0;
            const totalPagar = subtotalNeto + iva;

            return (
              <tr key={est.id}>
                <td>{est.numero_estimacion}</td>
                <td>{formatCurrency(montoEstimado)}</td>
                <td>{formatCurrency(deductivas)}</td>
                <td>{formatCurrency(amortizado)}</td>
                <td>{formatCurrency(fondoGarantia)}</td>
                <td>{formatCurrency(retenciones)}</td>
                <td><strong>{formatCurrency(totalPagar)}</strong></td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr style={{ backgroundColor: '#e9ecef', fontWeight: 'bold' }}>
            <td style={{ textAlign: 'right' }}>TOTALES:</td>
            <td>{formatCurrency(estimateTotals.montoEstimado)}</td>
            <td>{formatCurrency(estimateTotals.deductivas)}</td>
            <td>{formatCurrency(estimateTotals.amortizado)}</td>
            <td>{formatCurrency(estimateTotals.fondoGarantia)}</td>
            <td>{formatCurrency(estimateTotals.retenciones)}</td>
            <td><strong>{formatCurrency(estimateTotals.totalPagar)}</strong></td>
          </tr>
        </tfoot>
      </table>

      {isModalOpen && (
        <EstimateModal
          mode="new"
          projectId={projectId}
          initialData={{ contract_id: contract.id, contract: contract }}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function ContractDetailPage() {
  const { projectId, contractId } = useParams();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Centralizamos el cálculo de los totales de estimaciones aquí
  const estimateTotals = useMemo(() => {
    if (!contract?.estimates || contract.estimates.length === 0) {
      return { amortizado: 0 };
    }
    return contract.estimates.reduce((acc, est) => {
      let amortizado = est.amortizacion_anticipo || 0;
      // Si no hay amortización explícita, la calculamos
      if (!amortizado && contract) {
        const montoEstimado = est.total_estimado || 0;
        const totalConIva = contract.total_con_iva || (contract.total_ordinario * (contract.aplica_iva ? 1.16 : 1)) || 1;
        const anticipo = contract.anticipo || 0;
        if (totalConIva > 0 && anticipo > 0) {
          amortizado = montoEstimado * (anticipo / totalConIva);
        }
      }
      acc.amortizado += amortizado;
      return acc;
    }, { amortizado: 0 });
  }, [contract]);

  // Calculamos el saldo por amortizar basado en el total de amortizaciones
  const saldoPorAmortizarCalculado = (contract?.anticipo || 0) - estimateTotals.amortizado;


  const fetchData = useCallback(async () => {
    try {
      const contractRes = await api.get(`/contracts/${contractId}`);
      setContract(contractRes.data);
    } catch (err) {
      setError("Error al cargar los datos del contrato.");
      console.error(err);
    }
    setLoading(false);
  }, [contractId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <p>Cargando detalles del contrato...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!contract) return <p>Contrato no encontrado.</p>;

  return (
    <div>
      <Link to={`/projects/${projectId}/budget/contracts`}>
        &larr; Volver a la lista de Contratos
      </Link>
      
      <div style={{ padding: '1rem', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>       
           <div style={{ flex: '1 1 300px' }}>
          <p><strong>Contratista:</strong> {contract.contractor.razon_social}</p>
          <p><strong>Contrato:</strong> {contract.numero_contrato}</p>
          <p><strong>Partida (WBS):</strong> {contract.work_item?.description || 'N/A'}</p>
          <p><strong>Status:</strong> {contract.status}</p>
          <p><strong>Avance Financiero:</strong> {contract.progress}%</p>
          {contract.external_url && 
            <a href={contract.external_url} target="_blank" rel="noopener noreferrer">Ver en Drive/Externo</a>
          }
        </div>
        <div style={{ flex: '1 1 300px', borderLeft: '2px solid #eee', paddingLeft: '2rem' }}>
          <p><strong>Monto Contratado (c/IVA):</strong> {formatCurrency(contract.total_ordinario * (contract.aplica_iva ? 1.16 : 1))}</p>
          <p><strong>Total Extraordinario:</strong> {formatCurrency(contract.total_extraordinario)}</p>
          <p style={{color: 'green'}}><strong>Total Aditivas:</strong> {formatCurrency(contract.total_aditivas)}</p>
          <p style={{color: 'red'}}><strong>Total Deductivas:</strong> {formatCurrency(contract.total_deductivas)}</p>
          <hr style={{margin: '10px 0'}} />
          <p><strong>Total con IVA:</strong> {formatCurrency(contract.total_con_iva)}</p>
        </div>
        <div style={{ flex: '1 1 300px', borderLeft: '2px solid #eee', paddingLeft: '2rem' }}>
          <p><strong>Anticipo:</strong> {formatCurrency(contract.anticipo)}</p>
          <p><strong>Total Amortizado:</strong> {formatCurrency(estimateTotals.amortizado)}</p>
          <p><strong>Saldo por Amortizar:</strong> {formatCurrency(saldoPorAmortizarCalculado)}</p>
        </div>
      </div>
      <hr />
      <ContractItemManager 
        contract={contract} 
        onDataChange={fetchData}
      />
      <hr />
      <EstimateManager contract={contract} onDataChange={fetchData} />
    </div>
  );
}

export default ContractDetailPage;