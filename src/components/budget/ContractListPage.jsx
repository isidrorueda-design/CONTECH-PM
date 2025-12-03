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
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const fetchContracts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`/projects/${projectId}/contracts/`);
            setContracts(res.data);
            setError(null);
        } catch (err) {
            console.error(err);
            setError('No se pudieron cargar los contratos.');
        }
        setLoading(false);
    }, [projectId]);

    useEffect(() => {
        fetchContracts();
    }, [fetchContracts]);

    const handleExport = async () => {
        setFeedback('Generando archivo...');
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
            setFeedback('Archivo exportado con éxito.');
        } catch (err) {
            console.error('Error al exportar:', err);
            setFeedback('Error al generar el archivo de exportación.');
        }
    };

    const handleImportClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        setFeedback('Importando archivo...');
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await api.post(`/projects/${projectId}/import-contracts/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setFeedback(response.data.message || 'Importación completada con éxito.');
            fetchContracts();
        } catch (err) {
            console.error('Error al importar:', err);
            setFeedback(err.response?.data?.detail || 'Error al procesar el archivo.');
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
        }, [])
        .sort((a, b) => a.name.localeCompare(b.name));

    const filteredContracts = contracts.filter(contract => {
        const partidaMatch = !filterPartida || contract.partida_nombre === filterPartida;
        const contratistaMatch = !filterContratista || contract.contractor?.id === parseInt(filterContratista);
        return partidaMatch && contratistaMatch;
    });

    const handleResetFilters = () => {
        setFilterPartida('');
        setFilterContratista('');
        setCurrentPage(1);
    };

    const totalPages = Math.ceil(filteredContracts.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedContracts = filteredContracts.slice(startIndex, endIndex);

    const handlePageChange = (newPage) => {
        if (newPage > 0 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const handleItemsPerPageChange = (event) => {
        setItemsPerPage(Number(event.target.value));
        setCurrentPage(1);
    };

    const totalFiltrado = filteredContracts.reduce((sum, contract) => sum + (contract.total_ordinario || 0), 0);

    return (
        <div>
            <div style={{ marginBottom: '1rem' }}>
                <Link to={`/projects/${projectId}/budget`}>&larr; Volver al Presupuesto</Link>
            </div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Contratos del Proyecto</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={handleImportClick} title="Importar Contratos" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px' }}>
                        <img src="/icons/import.png" alt="Importar Contratos" style={{ height: '34px', verticalAlign: 'middle' }} />
                    </button>
                    <button onClick={handleExport} title="Exportar Contratos" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px' }}>
                        <img src="/icons/export.png" alt="Exportar Contratos" style={{ height: '34px', verticalAlign: 'middle' }} />
                    </button>
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
                    <button onClick={handleResetFilters} className="btn-secondary" style={{ height: '38px', marginBottom: '0' }}>Limpiar Filtros</button>
                </div>
            )}
            <div style={{ overflowX: 'auto', width: '100%' }}>
                <table className="data-table" style={{ minWidth: '600px' }}>
                    <thead>
                        <tr>
                            <th>Número de Contrato</th>
                            <th>Contratista</th>
                            <th>Total</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedContracts.map(contract => (
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
                    </tfoot>
                </table>
            </div>
            {/* Pagination Controls */}
            <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                <div>
                    <label htmlFor="itemsPerPage">Mostrar: </label>
                    <select id="itemsPerPage" value={itemsPerPage} onChange={handleItemsPerPageChange} style={{ marginRight: '20px' }}>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                    <span>Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong> ({filteredContracts.length} contratos)</span>
                </div>
                <div>
                    <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="btn-secondary">Anterior</button>
                    <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || totalPages === 0} className="btn-secondary" style={{ marginLeft: '10px' }}>Siguiente</button>
                </div>
            </div>
        </div>
    );
}

export default ContractListPage;