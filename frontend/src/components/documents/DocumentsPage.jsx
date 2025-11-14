import React, { useState, useEffect } from 'react';
import documentService from '../../services/documentService';
import { toast } from 'react-hot-toast';
import { FileText, UploadCloud, Trash2, Download, Home, ChevronRight, AlertCircle } from 'lucide-react'; // Iconos
import { useNavigate } from 'react-router-dom';

export default function DocumentsPage() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentTitle, setDocumentTitle] = useState(''); // New state for document title
  const [documentType, setDocumentType] = useState('');   // New state for document type
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true); // Set to true initially for loading state
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await documentService.getAllDocuments();
      console.log('API Response for documents:', response); // Add this log
      setDocuments(response.data);
    } catch (err) {
      setError('Error al cargar los documentos.');
      toast.error('Error al cargar los documentos.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Por favor, selecciona un archivo para subir.');
      return;
    }
    if (!documentTitle) {
      toast.error('Por favor, ingresa un título para el documento.');
      return;
    }
    if (!documentType) {
      toast.error('Por favor, selecciona un tipo de documento.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('document', selectedFile);
      formData.append('title', documentTitle);
      formData.append('type', documentType);

      await documentService.uploadDocument(formData);
      toast.success('Documento subido exitosamente!');
      setSelectedFile(null);
      setDocumentTitle(''); // Reset title
      setDocumentType('');   // Reset type
      fetchDocuments(); // Refrescar la lista de documentos
    } catch (err) {
      setError('Error al subir el documento.');
      toast.error('Error al subir el documento.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este documento?')) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await documentService.deleteDocument(id);
      toast.success('Documento eliminado exitosamente!');
      fetchDocuments(); // Refrescar la lista de documentos
    } catch (err) {
      setError('Error al eliminar el documento.');
      toast.error('Error al eliminar el documento.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (id, fileName) => {
    try {
      await documentService.downloadDocument(id, fileName);
      toast.success('Documento descargado exitosamente!');
    } catch (err) {
      toast.error('Error al descargar el documento.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center hover:text-emerald-600 transition-colors"
          >
            <Home className="w-4 h-4 mr-1" />
            Dashboard
          </button>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">Documentos</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Documentos</h1>
            <p className="text-gray-600 mt-2">Administra todos los documentos relacionados con tus proyectos</p>
          </div>
        </div>

        {/* Sección de Subida de Documentos */}
        <div className="card mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900">Subir Nuevo Documento</h2>
          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
            <input
              type="file"
              onChange={handleFileChange}
              className="input-field block w-full" // Usar input-field y ajustar para file
            />
            <input
              type="text"
              placeholder="Título del documento"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              className="input-field block w-full"
            />
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="input-field block w-full"
            >
              <option value="">Selecciona tipo</option>
              <option value="report">Reporte</option>
              <option value="manual">Manual</option>
              <option value="policy">Política</option>
              <option value="certificate">Certificado</option>
              <option value="image">Imagen</option>
              <option value="other">Otro</option>
            </select>
            <button
              onClick={handleUpload}
              disabled={loading || !selectedFile || !documentTitle || !documentType}
              className="btn-primary"
            >
              <UploadCloud className="mr-2 h-5 w-5" />
              {loading ? 'Subiendo...' : 'Subir Documento'}
            </button>
          </div>
          {error && <p className="text-red-500 mt-4">{error}</p>}
        </div>

        {/* Lista de Documentos */}
        <div className="card">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900">Documentos Existentes</h2>
          {loading && <p className="text-center text-gray-600">Cargando documentos...</p>}
          {!loading && documents.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">No hay documentos subidos aún.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {documents.map((doc) => (
                <li
                  key={doc._id}
                  className="card flex flex-col md:flex-row items-start md:items-center justify-between p-4 hover:shadow-lg transition-shadow duration-200"
                >
                  <div className="flex items-center mb-2 md:mb-0">
                    <FileText className="h-6 w-6 text-emerald-600 mr-3" />
                    <div>
                      <p className="text-lg font-medium text-gray-900">{doc.fileName}</p>
                      <p className="text-sm text-gray-600">
                        Subido el: {new Date(doc.createdAt).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-3 mt-3 md:mt-0">
                      <button
                        onClick={() => handleDownload(doc._id, doc.fileName)}
                        className="btn-secondary flex items-center"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Descargar
                      </button>
                    <button
                      onClick={() => handleDelete(doc._id)}
                      className="btn-danger flex items-center"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
