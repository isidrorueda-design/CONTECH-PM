import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axiosConfig';

const formatCurrency = (val) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val || 0);

function ContractListPage() {
    const { projectId } = useParams();
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [feedback, setFeedback] = useState(null);
    const [filterPartida, setFilterPartida] = useState('');
    const [filterContratista, setFilterContratista] = useState('');
    const fileInputRef = useRef(null);
    const fetchContracts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`/projects/${projectId}/contracts/`);
            setContracts(res.data);
            setError(null);
        } catch (err) {
            console.error(err);
            setError("No se pudieron cargar los contratos.");
        }
        setLoading(false);
    }, [projectId]);

    useEffect(() => {
        fetchContracts();
    }, [fetchContracts]);

    const handleExport = async () => {
        setFeedback("Generando archivo...");
        try {
            const response = await api.get(`/projects/${projectId}/export-contracts/`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const filename = `proyecto_${projectId}_contratos.xlsx`;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);

            setFeedback("Archivo exportado con éxito.");
        } catch (err) {
            console.error("Error al exportar:", err);
            setFeedback("Error al generar el archivo de exportación.");
        }
    };

    const handleImportClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setFeedback("Importando archivo...");
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post(`/projects/${projectId}/import-contracts/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setFeedback(response.data.message || "Importación completada con éxito.");
            fetchContracts();
        } catch (err) {
            console.error("Error al importar:", err);
            setFeedback(err.response?.data?.detail || "Error al procesar el archivo.");
        } finally {
            event.target.value = null;
        }
    };

    if (loading) return <p>Cargando contratos...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    const uniquePartidas = contracts
        .map(c => c.partida_nombre)
        .filter(Boolean)
        .reduce((acc, partida) => acc.includes(partida) ? acc : [...acc, partida], [])
        .sort();

    const uniqueContractors = contracts
        .filter(c => c.contractor && c.contractor.id && c.contractor.name)
        .reduce((acc, c) => {
            if (!acc.some(contractor => contractor.id === c.contractor.id)) {
                acc.push(c.contractor);
            }
            return acc;
        }, []).sort((a, b) => a.name.localeCompare(b.name));

    const filteredContracts = contracts.filter(contract => {
        const partidaMatch = !filterPartida || contract.partida_nombre === filterPartida;
        const contratistaMatch = !filterContratista || contract.contractor?.id === parseInt(filterContratista);
        return partidaMatch && contratistaMatch;
    });

    const handleResetFilters = () => {
        setFilterPartida('');
        setFilterContratista('');
    };
    const totalFiltrado = filteredContracts.reduce((sum, contract) => sum + (contract.total_ordinario || 0), 0);
    return (
        <div>
            <Link to={`/projects/${projectId}/budget`}>&larr; Volver al Presupuesto</Link>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Contratos del Proyecto</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-secondary" onClick={handleImportClick}>Importar desde Excel</button>
                    <button className="btn-save" onClick={handleExport}>Exportar a Excel</button>
                </div>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
                accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            />

            {feedback && <p style={{ fontStyle: 'italic', color: '#007bff' }}>{feedback}</p>}
            {(uniquePartidas.length > 0 || uniqueContractors.length > 0) && (
                <div className="filters-container" style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', marginBottom: '20px', flexWrap: 'wrap' }}>
                    <div className="form-group" style={{ flex: '1 1 200px' }}>
                        <label>Filtrar por Partida:</label>
                        <select className="form-control" value={filterPartida} onChange={e => setFilterPartida(e.target.value)}>
                            <option value="">-- Todas las Partidas --</option>
                            {uniquePartidas.map(partida => (
                                <option key={partida} value={partida}>{partida}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group" style={{ flex: '1 1 200px' }}>
                        <label>Filtrar por Contratista:</label>
                        <select className="form-control" value={filterContratista} onChange={e => setFilterContratista(e.target.value)}>
                            <option value="">-- Todos los Contratistas --</option>
                            {uniqueContractors.map(contractor => (
                                <option key={contractor.id} value={contractor.id}>{contractor.name}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={handleResetFilters}
                        className="btn-secondary"
                        style={{ height: '38px', marginBottom: '0' }}
                    >Limpiar Filtros</button>
                </div>
            )}

            {/* Contenedor para permitir el desplazamiento horizontal de la tabla */}
            <div style={{ overflowX: 'auto', width: '100%' }}>
                <table className="data-table" style={{ minWidth: '600px' }}> {/* minWidth opcional para forzar scroll en pantallas pequeñas */}
                    <thead>
                        <tr>
                            <th>Número de Contrato</th>
                            <th>Contratista</th>
                            <th>Total</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredContracts.map(contract => (
                            <tr key={contract.id}>
                                <td><Link to={`/projects/${projectId}/contracts/${contract.id}`}>{contract.numero_contrato}</Link></td>
                                <td>{contract.contractor?.name || 'N/A'}</td>
                                <td>{formatCurrency(contract.total_ordinario)}</td>
                                <td>{contract.status}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr style={{ backgroundColor: '#f8f9fa', fontWeight: 'bold' }}>
                            <td colSpan="2" style={{ textAlign: 'right' }}>Total Filtrado:</td>
                            <td>{formatCurrency(totalFiltrado)}</td>
                            <td></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default ContractListPage;