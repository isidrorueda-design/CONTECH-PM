// src/components/bim/IFCViewer.jsx
import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Color } from 'three';
import { IfcViewerAPI } from 'web-ifc-viewer';

const IFCViewer = forwardRef(({ modelUrl }, ref) => {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);

  useImperativeHandle(ref, () => ({
    takeSnapshot: async () => {
      if (viewerRef.current) {
        return await viewerRef.current.takeScreenshot(); }
      return null;
    },
    getCameraState: () => {
      if (viewerRef.current) {
        const manager = viewerRef.current.IFC.context.ifcCamera;
        return {
          position: manager.cameraControls.getPosition(),
          target: manager.cameraControls.getTarget(),
        };
      }
      return null;
    },
    setCameraState: (state) => {
      if (viewerRef.current && state) {
        const manager = viewerRef.current.IFC.context.ifcCamera;
        manager.cameraControls.setPosition(state.position[0], state.position[1], state.position[2], false);
        manager.cameraControls.setTarget(state.target[0], state.target[1], state.target[2], false);
      }
    }
  }));

  useEffect(() => {
    if (containerRef.current && !viewerRef.current) {
      const container = containerRef.current;
      const viewer = new IfcViewerAPI({ container, backgroundColor: new Color(0xffffff) });
      viewer.axes.setAxes();
      viewer.grid.setGrid();
      viewer.IFC.setWasmPath('/');
      viewerRef.current = viewer;
    }
    return () => {
      if (viewerRef.current) {
        viewerRef.current.dispose();
        viewerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const loadIfc = async () => {
      if (viewerRef.current && modelUrl) {
        try {
          await viewerRef.current.IFC.loadIfcUrl(modelUrl);
        } catch (error) {
          console.error("Error loading IFC model:", error);
        }
      }
    };
    loadIfc();
  }, [modelUrl]);
  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }} />
  );
});
export default IFCViewer;