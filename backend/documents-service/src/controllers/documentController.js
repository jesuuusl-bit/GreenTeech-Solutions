const Document = require('../models/Document');
const mongoose = require('mongoose');
const { gfs } = require('../server'); // Import gfs from server.js

// Obtener todos los documentos
exports.getAllDocuments = async (req, res) => {
  try {
    const documents = await Document.find()
      .populate('uploadedBy', 'name email')
      .populate('projectId', 'name')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: documents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener documentos',
      error: error.message
    });
  }
};

// Obtener documentos por ID de proyecto
exports.getDocumentsByProjectId = async (req, res) => {
  try {
    const { projectId } = req.params;
    const documents = await Document.find({ projectId })
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: documents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener documentos por proyecto',
      error: error.message
    });
  }
};

// Crear nuevo documento (placeholder, la subida real se hará con Multer)
exports.createDocument = async (req, res) => {
  try {
    const document = new Document(req.body);
    await document.save();
    
    res.status(201).json({
      success: true,
      data: document,
      message: 'Documento creado exitosamente'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error al crear documento',
      error: error.message
    });
  }
};

// Endpoint de prueba para activar MongoDB
exports.testMongoDB = async (req, res) => {
  console.log('--- Entering testMongoDB controller ---'); // Added log
  try {
    const documentsCount = await Document.countDocuments();
    console.log('Documents count:', documentsCount); // Added log
    res.status(200).json({ success: true, documentsCount });
  } catch (error) {
    console.error('Error testing MongoDB connection:', error);
    res.status(500).json({ success: false, message: 'Error testing MongoDB connection', error: error.message });
  }
};

// Subir un documento (con Multer)
exports.uploadDocument = async (req, res) => {
  try {
    console.log('[DocumentController] uploadDocument called.');
    console.log('[DocumentController] req.file:', req.file);
    console.log('[DocumentController] req.body:', req.body);

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No se ha proporcionado ningún archivo.' });
    }

    // Upload file to GridFS
    const uploadStream = gfs.openUploadStream(req.file.originalname, {
      contentType: req.file.mimetype,
      metadata: {
        uploadedBy: req.user ? req.user.id : null,
        projectId: req.body.projectId || null,
        title: req.body.title || req.file.originalname,
        type: req.body.type || 'other',
      }
    });

    uploadStream.end(req.file.buffer);

    uploadStream.on('error', (error) => {
      console.error('Error uploading to GridFS:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al subir el archivo a GridFS',
        error: error.message
      });
    });

    uploadStream.on('finish', async (file) => {
      const newDocument = new Document({
        title: req.body.title || req.file.originalname,
        type: req.body.type || 'other',
        fileName: req.file.originalname,
        gridfsId: file._id, // Store GridFS file ID
        uploadedBy: req.user ? req.user.id : null,
        projectId: req.body.projectId || null,
      });

      await newDocument.save();

      res.status(201).json({
        success: true,
        message: 'Documento subido y registrado exitosamente',
        data: newDocument
      });
    });

  } catch (error) {
    console.error('Error al subir documento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al subir documento',
      error: error.message
    });
  }
};

// Descargar un documento de GridFS
exports.downloadDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ success: false, message: 'Documento no encontrado.' });
    }

    if (!gfs) {
      return res.status(500).json({ success: false, message: 'GridFS no inicializado.' });
    }

    const downloadStream = gfs.openDownloadStream(document.gridfsId);

    downloadStream.on('error', (error) => {
      console.error('Error downloading from GridFS:', error);
      return res.status(500).json({ success: false, message: 'Error al descargar el archivo de GridFS', error: error.message });
    });

    // Fetch file metadata from GridFS to get content type and filename
    const file = await gfs.find({ _id: document.gridfsId }).toArray();
    if (!file || file.length === 0) {
      return res.status(404).json({ success: false, message: 'Archivo no encontrado en GridFS.' });
    }
    const fileMetadata = file[0];

    res.set('Content-Type', fileMetadata.contentType || 'application/octet-stream');
    res.set('Content-Disposition', `attachment; filename="${fileMetadata.filename}"`);

    downloadStream.pipe(res);

  } catch (error) {
    console.error('Error al descargar documento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al descargar documento',
      error: error.message
    });
  }
};