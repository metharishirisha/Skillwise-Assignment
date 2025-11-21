import React, { useRef } from 'react';
import './ImportExport.css';

const ImportExport = ({ onImport, onExport, isImporting, isExporting }) => {
  const fileInputRef = useRef(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        onImport(file);
      } else {
        alert('Please select a CSV file.');
      }
    }
    // Reset input so the same file can be selected again
    e.target.value = '';
  };

  return (
    <div className="import-export-container">
      <input
        type="file"
        ref={fileInputRef}
        accept=".csv"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <button
        onClick={handleImportClick}
        className="btn btn-import"
        disabled={isImporting}
      >
        {isImporting ? 'Importing...' : '📥 Import CSV'}
      </button>
      <button
        onClick={onExport}
        className="btn btn-export"
        disabled={isExporting}
      >
        {isExporting ? 'Exporting...' : '📤 Export CSV'}
      </button>
    </div>
  );
};

export default ImportExport;

