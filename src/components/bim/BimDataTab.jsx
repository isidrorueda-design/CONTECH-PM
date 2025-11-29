// src/components/bim/BimDataTab.jsx
import React, { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';

// (El componente Visor BIM no se usa en esta pestaña,
// así que no necesitamos importarlo en absoluto).

function BimDataTab() {
  const { project } = useOutletContext();
  
  // Estado para ver las propiedades de un elemento
  const [selectedElementProps, setSelectedElementProps] = useState(null);

  // 1. Extraemos TODOS los elementos de TODAS las versiones de TODOS los documentos
  const allBimElements = useMemo(() => {
    let elements = [];
    // Verificación de seguridad
    if (!project || !project.folders) return elements;

    project.folders.forEach(folder => {
      if (folder.documents) {
        folder.documents.forEach(doc => {
          if (doc.versions) {
            doc.versions.forEach(version => {
              if (version.bim_elements) {
                // Añadimos una referencia a la versión y al documento
                const elementsWithContext = version.bim_elements.map(el => ({
                  ...el,
                  docName: doc.name,
                  versionNum: version.version_number
                }));
                elements = elements.concat(elementsWithContext);
              }
            });
          }
        });
      }
    });
    return elements;
  }, [project]);

  return (
    <div className="dms-layout"> {/* Reutilizamos el layout de DMS */}
      
      {/* --- Panel Izquierdo: Lista de Elementos --- */}
      <aside className="dms-sidebar" style={{ maxWidth: '60%' }}>
        <div className="dms-header">
          <h3>Elementos BIM Extraídos del Proyecto</h3>
        </div>
        <div style={{ overflowY: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre (Documento)</th>
                <th>Versión</th>
                <th>Tipo IFC</th>
                <th>Nombre (Elemento)</th>
                <th>GUID</th>
              </tr>
            </thead>
            <tbody>
              {allBimElements.length === 0 && (
                <tr><td colSpan="5">No se han extraído elementos BIM. Sube un archivo .ifc.</td></tr>
              )}
              {allBimElements.map(el => (
                <tr 
                  key={el.id} 
                  onClick={() => setSelectedElementProps(el.properties)}
                  style={{cursor: 'pointer'}}
                  className={selectedElementProps === el.properties ? 'selected' : ''}
                >
                  <td>{el.docName}</td>
                  <td>v{el.versionNum}</td>
                  <td>{el.ifc_type}</td>
                  <td>{el.name || '--'}</td>
                  <td style={{fontSize: '0.8rem', color: '#555'}}>{el.guid}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </aside>

      {/* --- Panel Derecho: Propiedades --- */}
      <main className="dms-main" style={{ flex: 2 }}>
        <div className="dms-header">
          <h3>Propiedades y Cantidades</h3>
        </div>
        <div>
          {selectedElementProps ? (
             <pre style={{ backgroundColor: '#f4f4f4', padding: '1rem', borderRadius: '4px', maxHeight: '70vh', overflowY: 'auto' }}>
              {/* 'JSON.stringify' es una forma rápida de "imprimir" un objeto */}
              {JSON.stringify(selectedElementProps, null, 2)}
             </pre>
          ) : (
            <p>Seleccione un elemento de la lista para ver sus propiedades.</p>
          )}
        </div>
      </main>

      {/* (Quitamos el modal duplicado, la vista en el panel es suficiente) */}
    </div>
  );
}

export default BimDataTab;