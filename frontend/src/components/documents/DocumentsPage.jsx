import React, { useState, useEffect } from 'react';
import documentService from '../../services/documentService';
import { toast } from 'react-hot-toast';
import { FileText, UploadCloud, Trash2, Download } from 'lucide-react'; // Iconos

export default function DocumentsPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await documentService.getAllDocuments();
      setDocuments(data);
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

    setLoading(true);
    setError(null);
    try {
      await documentService.uploadDocument(selectedFile);
      toast.success('Documento subido exitosamente!');
      setSelectedFile(null);
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

  const handleDownload = (url, filename) => {
    // Asumiendo que la URL del documento es directamente descargable
    // O que el backend proporciona una ruta de descarga
    window.open(url, '_blank');
  };

  return (
    <div className="container mx-auto p-6 bg-gray-900 text-white min-h-screen">
      <h1 className="text-4xl font-bold mb-8 text-green-400">Gestión de Documentos</h1>

      {/* Sección de Subida de Documentos */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-green-300">Subir Nuevo Documento</h2>
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
          <input
            type="file"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-400
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-full file:border-0
                       file:text-sm file:font-semibold
                       file:bg-green-500 file:text-white
                       hover:file:bg-green-600"
          />
          <button
            onClick={handleUpload}
            disabled={loading || !selectedFile}
            className="flex items-center justify-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UploadCloud className="mr-2 h-5 w-5" />
            {loading ? 'Subiendo...' : 'Subir Documento'}
          </button>
        </div>
        {error && <p className="text-red-500 mt-4">{error}</p>}
      </div>

      {/* Lista de Documentos */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-4 text-green-300">Documentos Existentes</h2>
        {loading && <p className="text-center text-gray-400">Cargando documentos...</p>}
        {!loading && documents.length === 0 && (
          <p className="text-center text-gray-400">No hay documentos subidos aún.</p>
        )}
        {!loading && documents.length > 0 && (
          <ul className="space-y-4">
            {documents.map((doc) => (
              <li
                key={doc._id}
                className="flex flex-col md:flex-row items-start md:items-center justify-between bg-gray-700 p-4 rounded-md shadow-sm hover:bg-gray-600 transition-colors duration-200"
              >
                <div className="flex items-center mb-2 md:mb-0">
                  <FileText className="h-6 w-6 text-green-400 mr-3" />
                  <div>
                    <p className="text-lg font-medium text-white">{doc.filename}</p>
                    <p className="text-sm text-gray-400">
                      Subido el: {new Date(doc.uploadDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-3">
                  {doc.url && ( // Asegúrate de que la URL exista antes de mostrar el botón de descarga
                    <button
                      onClick={() => handleDownload(doc.url, doc.filename)}
                      className="flex items-center px-4 py-2 text-sm font-medium rounded-md text-blue-300 hover:text-blue-100 bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Descargar
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(doc._id)}
                    className="flex items-center px-4 py-2 text-sm font-medium rounded-md text-red-300 hover:text-red-100 bg-red-700 hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
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
  );
}
