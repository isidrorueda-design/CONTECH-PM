// src/components/budget/ContractItemRow.jsx
import React from 'react';
const formatCurrency = (value) => {
  if (typeof value !== 'number') value = 0;
  return new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: 'MXN',
  }).format(value);
};

function ContractItemRow({ item, indent = 0, onSelectItem, isSelected, collapsedGroups, onToggleGroup, visibleColumns, onProgressChange }) {
  
  const isGroup = item.is_group;  
  let rowStyle = {};
  if (isGroup) {rowStyle = { fontWeight: 'bold', backgroundColor: '#f9f9f9' };}
  if (isSelected) {rowStyle.backgroundColor = '#e0efff';}    
  const indentStyle = { paddingLeft: `${indent * 20}px` };
  return (
    <>
      <tr style={rowStyle} onClick={() => onSelectItem(item)} className={isSelected ? 'selected' : ''}>
        {visibleColumns.clave.visible && (
          <td style={indentStyle} onClick={(e) => {
            if (isGroup) {
              e.stopPropagation();
              onToggleGroup(item.id);
            }
          }}>
            {isGroup && (
              <span style={{ marginRight: '5px', cursor: 'pointer', display: 'inline-block', width: '10px' }}>
                {collapsedGroups[item.id] ? '▶' : '▼'}
              </span>
            )}
            {item.clave}
          </td>
        )}
        {visibleColumns.concepto.visible && <td>{item.concepto}</td>}
        {visibleColumns.unidad.visible && <td>{isGroup ? '--' : item.unidad}</td>}
        {visibleColumns.nivel_zona.visible && <td>{item.nivel_zona}</td>}
        {visibleColumns.tipo_concepto.visible && <td>{item.tipo_concepto}</td>}
        {visibleColumns.avance_fisico.visible && (
          <td>
            {isGroup ? '--' : (
              <select
                value={item.avance_fisico}
                onChange={(e) => onProgressChange(item.id, parseInt(e.target.value))}
                onClick={(e) => e.stopPropagation()} 
                className="inline-edit-select"
              >
                {Array.from({ length: 21 }, (_, i) => i * 5).map(val => (
                  <option key={val} value={val}>{val}%</option>
                ))}
              </select>
            )}
          </td>
        )}
        {visibleColumns.cantidad_contratada.visible && <td>{isGroup ? '--' : item.cantidad_contratada}</td>}
        {visibleColumns.cantidad_aditiva.visible && <td>{isGroup ? '--' : item.cantidad_aditiva}</td>}
        {visibleColumns.cantidad_deductiva.visible && <td>{isGroup ? '--' : item.cantidad_deductiva}</td>}
        {visibleColumns.cantidad_total_vigente.visible && <td>{isGroup ? '--' : <b>{(item.cantidad_total_vigente || 0).toFixed(2)}</b>}</td>}
        {visibleColumns.precio_unitario.visible && <td>{isGroup ? '--' : formatCurrency(item.precio_unitario)}</td>}        
        {visibleColumns.total_contratado_vigente.visible && <td><b>{formatCurrency(item.total_contratado_vigente)}</b></td>}        
        {visibleColumns.cantidad_estimada_acumulada.visible && <td style={{color: 'blue'}}>{isGroup ? '--' : (item.cantidad_estimada_acumulada || 0).toFixed(2)}</td>}
        {visibleColumns.cantidad_por_estimar.visible && <td style={{color: 'green', fontWeight: 'bold'}}>{isGroup ? '--' : (item.cantidad_por_estimar || 0).toFixed(2)}</td>}
      </tr>
      {!collapsedGroups[item.id] && item.subitems && item.subitems.map(subItem => (
        <ContractItemRow 
          key={subItem.id} 
          item={subItem} 
          indent={indent + 1}
          onSelectItem={onSelectItem}
          isSelected={isSelected}
          collapsedGroups={collapsedGroups}
          onToggleGroup={onToggleGroup}
          visibleColumns={visibleColumns}
          onProgressChange={onProgressChange}
        />
      ))}
    </>
  );
}

export default ContractItemRow;