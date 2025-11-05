import React, { useState } from 'react';
function FolderNode({ folder, selectedFolderId, onFolderSelect }) {
  const [isOpen, setIsOpen] = useState(false); 
  const hasSubfolders = folder.subfolders && folder.subfolders.length > 0;

  const handleSelect = (e) => {
    e.stopPropagation(); 
    onFolderSelect(folder.id);
  };

  const handleToggle = (e) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <li>
      <div 
        className={`folder-node ${folder.id === selectedFolderId ? 'selected' : ''}`}
        onClick={handleSelect} 
      >
        {hasSubfolders ? (
          <span className="toggle" onClick={handleToggle}>
            {isOpen ? '−' : '+'}
          </span>
        ) : (
          <span className="toggle">&nbsp;</span> 
        )}
        📁 {folder.name}
      </div>
      
      {/* Si está abierto y tiene hijos, renderiza el árbol de hijos */}
      {isOpen && hasSubfolders && (
        <FolderTree 
          folders={folder.subfolders} 
          selectedFolderId={selectedFolderId}
          onFolderSelect={onFolderSelect}
        />
      )}
    </li>
  );
}

function FolderTree({ folders, selectedFolderId, onFolderSelect }) {
  return (
    <ul className="folder-tree">
      {folders.map(folder => (
        <FolderNode 
          key={folder.id} 
          folder={folder}
          selectedFolderId={selectedFolderId}
          onFolderSelect={onFolderSelect}
        />
      ))}
    </ul>
  );
}

export default FolderTree;