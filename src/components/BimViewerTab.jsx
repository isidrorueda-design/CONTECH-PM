// src/components/BimViewerTab.jsx
import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import IFCViewer from './bim/IFCViewer';
import SelectIFCModal from './dms/SelectIFCModal'; // <-- 1. Importa el nuevo modal

function BimViewerTab() {
  // 2. Obtén la lista completa de carpetas del proyecto
  const { project } = useOutletContext();
  
  // 3. Estado para el modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 4. Estado para el ID que se pasará al visor
  const [versionIdToLoad, setVersionIdToLoad] = useState(null);

  // 5. Esta función se le pasa al modal
  const handleFileSelect = (selectedVersionId) => {
    setVersionIdToLoad(selectedVersionId); // Pasa el ID al visor
  };

  return (
    <div>
      <div className="dms-header" style={{ alignItems: 'center', gap: '1rem' }}>
        <h3>Visor BIM</h3>
        
        {/* --- 6. El Botón ahora abre el modal --- */}
        <button 
          className="btn-save"
          onClick={() => setIsModalOpen(true)} // <-- Abre el modal
        >
          Cargar Modelo IFC...
        </button>
      </div>
      
      <div className="bim-viewer-container" style={{ padding: '1rem', background: '#fff' }}>
        {/* 7. El visor carga lo que 'versionIdToLoad' le diga */}
        <IFCViewer versionIdToLoad={versionIdToLoad} />
      </div>

      {/* --- 8. Renderizado del Modal --- */}
      {isModalOpen && (
        <SelectIFCModal
          allFolders={project?.folders || []} // Pasa todas las carpetas
          onClose={() => setIsModalOpen(false)}
          onFileSelect={handleFileSelect}
        />
      )}
    </div>
  );
}

export default BimViewerTab;