import React, { useState } from 'react';
import api from '../../api/axiosConfig';
import PdfViewer from '../bim/PdfViewer'; // Importamos el visor de PDF

// Componente para el modal que contendrá el visor
const Modal = ({ children, onClose }) => (
    <div className="modal-backdrop">
        <div className="modal-content" style={{ maxWidth: '90%', width: '1200px', height: '95%' }}>
            <div className="modal-header">
                <h2>Visor de Documento</h2>
                <button onClick={onClose} className="modal-close-btn">&times;</button>
            </div>
            <div className="modal-body" style={{ height: 'calc(100% - 70px)', padding: '0' }}>
                {children}
            </div>
        </div>
    </div>
);

/**
 * Componente que muestra una lista de documentos y maneja la apertura de los mismos.
 * @param {object} props
 * @param {Array} props.documents - Lista de documentos a mostrar.
 * @param {Function} props.onIfcSelect - Función para cargar un modelo IFC.
 */
function DocumentList({ documents, onIfcSelect }) {
    const [pdfUrl, setPdfUrl] = useState(null); // Estado para guardar la URL del PDF a mostrar

    const handleFileDoubleClick = (event, document) => {
        event.stopPropagation(); // ¡Este es el cambio clave! Detiene la propagación del evento.
        event.preventDefault(); // Añadimos esto para prevenir otras acciones por defecto.

        const fileName = document.file?.split('/').pop() || '';
        const fileExtension = fileName.split('.').pop().toLowerCase();

        if (fileExtension === 'pdf') {
            // Si es un PDF, construye la URL completa y la guarda en el estado
            // para abrir el modal con el visor.
            const fullPdfUrl = `${api.defaults.baseURL}${document.file}`;
            setPdfUrl(fullPdfUrl);

        } else if (fileExtension === 'ifc') {
            // Si es un IFC, llama a la función que se le pasó como prop.
            if (onIfcSelect) {
                onIfcSelect(document.id);
            } else {
                console.warn("No se proporcionó una función para manejar archivos IFC.");
            }

        } else {
            // Si es otro tipo de archivo, muestra una alerta.
            alert(`El tipo de archivo ".${fileExtension}" no es soportado para visualización.`);
        }
    };

    const closePdfViewer = () => {
        setPdfUrl(null);
    };

    return (
        <div>
            <table className="data-table">
                <thead>
                    <tr>
                        <th>Nombre del Documento</th>
                        <th>Tipo</th>
                        <th>Fecha de Carga</th>
                    </tr>
                </thead>
                <tbody>
                    {documents.length === 0 && (
                        <tr>
                            <td colSpan="3">No hay documentos en este proyecto.</td>
                        </tr>
                    )}
                    {documents.map(doc => (
                        <tr
                            key={doc.id}
                            onDoubleClick={(e) => handleFileDoubleClick(e, doc)}
                            style={{ cursor: 'pointer' }}
                            title="Doble clic para abrir"
                        >
                            <td>{doc.name}</td>
                            <td>{doc.file?.split('.').pop().toUpperCase()}</td>
                            <td>{new Date(doc.uploaded_at).toLocaleDateString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* 
        Modal con el visor de PDF.
        Solo se muestra si 'pdfUrl' tiene un valor.
      */}
            {pdfUrl && (
                <Modal onClose={closePdfViewer}>
                    <PdfViewer fileUrl={pdfUrl} />
                </Modal>
            )}
        </div>
    );
}

export default DocumentList;