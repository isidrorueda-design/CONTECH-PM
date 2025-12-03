import React from 'react';

// Importa los componentes principales del visor
import { Viewer, Worker } from '@react-pdf-viewer/core';

// Importa los plugins para la interfaz de usuario
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';

// Importa los estilos
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

/**
 * Componente para mostrar un archivo PDF desde una URL.
 * @param {object} props
 * @param {string} props.fileUrl La URL del archivo PDF a mostrar.
 */
function PdfViewer({ fileUrl }) {
    // Crea una instancia del plugin de la interfaz
    const defaultLayoutPluginInstance = defaultLayoutPlugin();

    return (
        <div
            style={{
                height: '750px', // Altura del contenedor del visor
                width: '100%',   // Ancho del contenedor
                border: '1px solid rgba(0, 0, 0, 0.3)',
            }}
        >
            {/* El Worker es necesario para que la librería procese el PDF en segundo plano */}
            <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
                {fileUrl ? (
                    <Viewer
                        fileUrl={fileUrl}
                        plugins={[
                            // Registra el plugin de la interfaz
                            defaultLayoutPluginInstance,
                        ]}
                    />
                ) : (
                    <div style={{ padding: '2rem' }}>No se ha proporcionado un archivo PDF.</div>
                )}
            </Worker>
        </div>
    );
}

export default PdfViewer;