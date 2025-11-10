// src/components/BimViewerTab.jsx
import React from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import IFCViewer from './bim/IFCViewer';

function BimViewerTab() {
  // 1. Obtener 'selectedDocument' y 'project' del contexto
  const { selectedDocument, project } = useOutletContext();

  // 2. Determinar el ID de la versión a cargar
  let versionIdToLoad = null;
  let hasValidIfcFile = false;

  // Verifica si hay un documento seleccionado y si tiene versiones
  if (selectedDocument && selectedDocument.versions && selectedDocument.versions.length > 0) {
    // La última versión del array es la más reciente
    const latestVersion = selectedDocument.versions[selectedDocument.versions.length - 1];

    // Verifica si la última versión es un archivo IFC válido
    if (latestVersion && latestVersion.id && latestVersion.filename.toLowerCase().endsWith('.ifc')) {
      versionIdToLoad = latestVersion.id;
      hasValidIfcFile = true;
    }
  }

  return (
    <div>
      <div className="dms-header" style={{ alignItems: 'center', gap: '1rem' }}>
        <h3>Visor BIM</h3>
      </div>
      
      <div className="bim-viewer-container" style={{ padding: '1rem', background: '#fff' }}>
        {hasValidIfcFile ? (
          // 3. Si hay un archivo IFC válido, renderiza el visor
          <IFCViewer versionIdToLoad={versionIdToLoad} />
        ) : (
          // 4. Si no, muestra un mensaje de ayuda con un enlace a la pestaña de documentos
          <div style={{ textAlign: 'center', padding: '2rem', border: '1px dashed #ccc', borderRadius: '8px' }}>
            <h4>No se ha cargado ningún modelo IFC.</h4>
            <p>
              Por favor, vaya a la pestaña de{' '}
              <Link to={`/projects/${project.id}/documents`}>Documentos</Link>
              {' '} para seleccionar un archivo con formato .ifc.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default BimViewerTab;
