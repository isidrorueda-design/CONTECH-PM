// src/components/bim/IFCViewer.jsx
import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { IfcViewerAPI } from 'web-ifc-viewer';
import * as THREE from 'three';
import api from '../../api/axiosConfig';

const API_URL = 'http://127.0.0.1:8000';

const IFCViewer = forwardRef(({ versionIdToLoad }, ref) => {
  const viewerContainerRef = useRef(null);
  const viewer = useRef(null); 

  useImperativeHandle(ref, () => ({
    getCameraState: () => {
      if (!viewer.current) return null;
      const camera = viewer.current.context.getCamera();
      const controls = viewer.current.context.ifcCamera.cameraControls;
      const position = {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z
      };
      let target = { x: 0, y: 0, z: 0 };
      if (controls) {
        const t = new THREE.Vector3();
        controls.getTarget(t);
        target = { x: t.x, y: t.y, z: t.z };
      }

      return { position, target };
    },

    // Restaurar estado de la cámara
    setCameraState: (viewpoint) => {
      if (!viewer.current || !viewpoint) return;
      const { position, target } = viewpoint;

      const controls = viewer.current.context.ifcCamera.cameraControls;
      if (controls) {
        controls.setLookAt(
          position.x, position.y, position.z,
          target.x, target.y, target.z,
          true // enableTransition
        );
      }
    },

    // Tomar snapshot (captura de pantalla)
    takeSnapshot: async () => {
      if (!viewer.current) return null;
      // Forzar render para asegurar que esté actualizado
      // viewer.current.context.renderer.render(viewer.current.context.scene, viewer.current.context.camera);

      // Obtener canvas
      const canvas = viewer.current.context.renderer.domElement;
      return canvas.toDataURL('image/png');
    },

    // Obtener elementos seleccionados (GUIDs)
    getSelectedGuids: async () => {
      // Esta implementación depende de cómo manejes la selección en tu app.
      // Por defecto web-ifc-viewer tiene su propio sistema de selección.
      // Aquí un ejemplo simple si usas el selection manager por defecto:
      if (!viewer.current) return [];

      // Nota: Obtener la selección actual de web-ifc-viewer puede requerir 
      // acceder a viewer.current.context.items.pickable... 
      // O si has implementado un evento de click, guardar el estado.
      // Por ahora retornamos vacío o implementamos si tienes lógica de selección.
      return [];
    }
  }));

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
        try {
          // Usamos la instancia 'api' para incluir el token de autenticación
          const response = await api.get(`/documents/file/${versionIdToLoad}`, { responseType: 'blob' });

          if (response.status === 200) {
            const file = new File([response.data], "model.ifc");
            const model = await viewer.current.IFC.loadIfc(file);

            if (model) {
              viewer.current.context.fitToFrame();
            }
          }
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
      style={{ width: '100%', height: '100%', position: 'relative' }}
    />
  );
});

export default IFCViewer;