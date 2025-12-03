import React, { useState } from 'react';
import api from '../../api/axiosConfig';
import './EstimateDetailPage.css';
const formatCurrency = (val) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val || 0);
function FinancialSummaryModal({ estimate, onClose, onSave }) {
    // Se elimina useMemo para asegurar que el cálculo se haga en cada render con los datos más frescos.
    const getCalculatedAmortization = () => {
        if (!estimate.contract) return 0;
        const montoEstimadoBase = estimate.total_estimado || 0;
        let totalConIva = parseFloat(estimate.contract.total_con_iva);
        if (isNaN(totalConIva) || totalConIva === 0) {
            totalConIva = (parseFloat(estimate.contract.total_ordinario) || 0) * (estimate.contract.aplica_iva ? 1.16 : 1);
        }
        const anticipo = parseFloat(estimate.contract.anticipo) || 0;
        if (totalConIva > 0 && anticipo > 0) {
            return montoEstimadoBase * (anticipo / totalConIva);
        }
        return 0;
    };
    const calculatedAmortization = getCalculatedAmortization();

    const [amortizationMode, setAmortizationMode] = useState(
        estimate.amortizacion_anticipo === null ? 'auto' : 'manual');
    const [manualAmortization, setManualAmortization] = useState(
        estimate.amortizacion_anticipo ?? '');
    const [porcentajeFondoGarantia, setPorcentajeFondoGarantia] = useState(
        estimate.porcentaje_fondo_garantia || 0);
    const [otrasDeductivas, setOtrasDeductivas] = useState(estimate.otras_deductivas || '');
    const [otrasRetenciones, setOtrasRetenciones] = useState(estimate.otras_retenciones || '');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setError('');
        const finalAmortization = amortizationMode === 'auto'
            ? calculatedAmortization // Si es automático, usamos el valor calculado.
            : parseFloat(manualAmortization) || 0; // Si es manual, usamos el del input.

        // 2. Se calcula el monto del fondo de garantía de forma precisa.
        const montoEstimadoBase = estimate.total_estimado || 0;
        const fondoGarantiaAmount = montoEstimadoBase * parseFloat(porcentajeFondoGarantia);

        try {
            const response = await api.put(`/estimates/${estimate.id}/`, {
                numero_estimacion: estimate.numero_estimacion,
                fecha: estimate.fecha,
                contract_id: estimate.contract.id,
                amortizacion_anticipo: finalAmortization,
                // Se envía solo el monto calculado. Se omite el porcentaje para
                // evitar que el backend lo recalcule incorrectamente.
                fondo_garantia: fondoGarantiaAmount,
                otras_deductivas: parseFloat(otrasDeductivas) || 0,
                otras_retenciones: parseFloat(otrasRetenciones) || 0,
            });
            onSave(response.data);
        } catch (err) {
            setError(err.response?.data?.detail || "Error al guardar los detalles financieros.");
        } finally { setIsSaving(false); }
    };
    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '600px' }}>
                <form onSubmit={handleSubmit}>
                    <h2>Editar Resumen Financiero</h2>

                    <fieldset className="form-group">
                        <legend>Amortización de Anticipo</legend>
                        <div className="radio-group">
                            <label>
                                <input type="radio" value="auto" checked={amortizationMode === 'auto'} onChange={() => setAmortizationMode('auto')} />
                                Automática ({formatCurrency(calculatedAmortization)})
                            </label>
                            <label>
                                <input type="radio" value="manual" checked={amortizationMode === 'manual'} onChange={() => setAmortizationMode('manual')} />
                                Manual
                            </label>
                        </div>
                        {amortizationMode === 'manual' && (
                            <input
                                type="number"
                                className="form-control"
                                value={manualAmortization}
                                onChange={(e) => setManualAmortization(e.target.value)}
                                placeholder={calculatedAmortization.toFixed(2)}
                                step="any"
                            />
                        )}
                    </fieldset>

                    {/* Fondo de Garantía */}
                    <div className="form-group">
                        <label htmlFor="fondoGarantia">Fondo de Garantía</label>
                        <select id="fondoGarantia" className="form-control" value={porcentajeFondoGarantia} onChange={(e) => setPorcentajeFondoGarantia(e.target.value)}>
                            <option value="0">0.00%</option>
                            <option value="0.05">5.00%</option>
                            <option value="0.075">7.50%</option>
                        </select>
                    </div>

                    {/* Otras Deductivas y Retenciones */}
                    <div className="form-group">
                        <label htmlFor="otrasDeductivas">Otras Deductivas</label>
                        <input type="number" id="otrasDeductivas" className="form-control" value={otrasDeductivas} onChange={(e) => setOtrasDeductivas(e.target.value)} step="any" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="otrasRetenciones">Otras Retenciones</label>
                        <input type="number" id="otrasRetenciones" className="form-control" value={otrasRetenciones} onChange={(e) => setOtrasRetenciones(e.target.value)} step="any" />
                    </div>

                    {error && <p className="error-message">{error}</p>}
                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onClose} disabled={isSaving}>Cancelar</button>
                        <button type="submit" className="btn-save" disabled={isSaving}>
                            {isSaving ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default FinancialSummaryModal;