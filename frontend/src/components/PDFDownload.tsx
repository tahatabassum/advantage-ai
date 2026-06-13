import React, { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { FullAnalysisResponse } from '../types/advantage';
import { exportPdf } from '../services/api';

interface PDFDownloadProps {
  analysis: FullAnalysisResponse;
}

const PDFDownload: React.FC<PDFDownloadProps> = ({ analysis }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      const blob = await exportPdf(analysis);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'AdVantage_AI_Audit.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to generate PDF. Check console for details.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-blue-600 rounded-3xl p-8 text-white shadow-xl shadow-blue-200 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
        <FileDown className="w-32 h-32" />
      </div>
      
      <div className="relative z-10 space-y-6">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Export Audit Report</h2>
          <p className="text-blue-100 font-medium mt-1">Generate a professional PDF audit for clients or team review.</p>
        </div>

        <button 
          onClick={handleDownload}
          disabled={isExporting}
          className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 hover:bg-blue-50 active:scale-[0.98] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
          {isExporting ? 'Generating PDF...' : 'Download PDF Audit'}
        </button>
      </div>
    </div>
  );
};

export default PDFDownload;
