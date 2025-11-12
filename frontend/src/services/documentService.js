import api from './api';

const documentService = {
  // Subir un nuevo documento
  uploadDocument: async (file, projectId) => {
    try {
      console.log('⬆️ Uploading document...');
      const formData = new FormData();
      formData.append('document', file);
      if (projectId) {
        formData.append('projectId', projectId);
      }
      const response = await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('✅ Document uploaded successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error uploading document:', error);
      throw error;
    }
  },

  // Obtener todos los documentos
  getAllDocuments: async () => {
    try {
      console.log('🔍 Fetching all documents...');
      const response = await api.get('/documents');
      console.log('✅ Documents fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching documents:', error);
      throw error;
    }
  },

  // Obtener documentos por ID de proyecto
  getDocumentsByProjectId: async (projectId) => {
    try {
      console.log(`🔍 Fetching documents for project ID: ${projectId}...`);
      const response = await api.get(`/documents/project/${projectId}`);
      console.log('✅ Documents fetched successfully for project:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching documents for project ${projectId}:`, error);
      throw error;
    }
  },

  // Obtener un documento por su ID
  getDocumentById: async (id) => {
    try {
      console.log(`🔍 Fetching document with ID: ${id}...`);
      const response = await api.get(`/documents/${id}`);
      console.log('✅ Document fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching document ${id}:`, error);
      throw error;
    }
  },

  // Eliminar un documento por su ID
  deleteDocument: async (id) => {
    try {
      console.log(`🗑️ Deleting document with ID: ${id}...`);
      const response = await api.delete(`/documents/${id}`);
      console.log('✅ Document deleted successfully');
      return response.data;
    } catch (error) {
      console.error(`❌ Error deleting document ${id}:`, error);
      throw error;
    }
  },
};

export default documentService;
