import React, { useEffect, useRef } from 'react';
import { IfcViewerAPI } from 'web-ifc-viewer';
import * as THREE from 'three'; 
import api from '../../api/axiosConfig'; // Importa la instancia de axios configurada

function IFCViewer({ versionIdToLoad }) { 
  const viewerContainerRef = useRef(null);
  const viewer = useRef(null); // Guarda la instancia del visor

  // --- useEffect de Inicialización (se ejecuta 1 vez) ---
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const container = viewerContainerRef.current;
    if (!container) return;

    if (!viewer.current) {
      const viewerApi = new IfcViewerAPI({ 
        container,
        backgroundColor: new THREE.Color(0xf0f0f0) 
      });
      viewerApi.grid.setGrid();
      viewerApi.axes.setAxes();
      
      // Apunta a los archivos .wasm en la carpeta /public
      viewerApi.IFC.setWasmPath('/'); 
      
      viewer.current = viewerApi; 
    }

    // Función de limpieza
    return () => {
      if (viewer.current) {
        viewer.current.dispose();
        viewer.current = null;
      }
    };
  }, []); // El array vacío asegura que esto se ejecute solo una vez

  // --- useEffect de Carga (se ejecuta si 'versionIdToLoad' cambia) ---
  useEffect(() => {
    if (viewer.current && versionIdToLoad) {
      
      async function loadModel() {
        const url = `${api.defaults.baseURL}/documents/file/${versionIdToLoad}`; // Usa la baseURL de la instancia 'api'
        try {
          // loadIfcUrl limpia automáticamente el modelo anterior
          const model = await viewer.current.IFC.loadIfcUrl(url);

          // --- ¡AQUÍ ESTÁ LA CORRECCIÓN! ---
          // La función 'fitToFrame' está en el sub-objeto 'context'
          if (model) {
            viewer.current.context.fitToFrame();
          }
          // --- FIN DE LA CORRECCIÓN ---

        } catch (error) {
          console.error("Error al cargar el modelo IFC:", error);
        }
      }
      loadModel();
    }
  }, [versionIdToLoad]); // Depende de 'versionIdToLoad'

  return (
    <div 
      ref={viewerContainerRef} 
      style={{ width: '100%', height: '70vh', position: 'relative' }} 
    />
  );
}

export default IFCViewer;