const Document = require('../models/Document');

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

    // Aquí se debería guardar el archivo en un almacenamiento persistente (S3, GCS, etc.)
    // Por ahora, simularemos que se guarda y generamos una URL.
    const fileUrl = `/uploads/${req.file.originalname}`; // Placeholder URL

    const newDocument = new Document({
      title: req.body.title || req.file.originalname, // Get title from body or use filename
      type: req.body.type || 'other', // Get type from body or use 'other'
      fileName: req.file.originalname,
      fileUrl: fileUrl, // URL donde se almacenará el archivo
      fileSize: req.file.size, // Add fileSize
      mimetype: req.file.mimetype, // Add mimetype
      uploadedBy: req.user ? req.user.id : null, // Asumiendo que req.user está disponible
      projectId: req.body.projectId || null, // Si se envía un projectId en el body
    });

    await newDocument.save();

    res.status(201).json({
      success: true,
      message: 'Documento subido y registrado exitosamente',
      data: newDocument
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
