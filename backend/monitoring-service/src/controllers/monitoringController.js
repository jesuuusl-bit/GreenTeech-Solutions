const ProductionData = require('../models/ProductionData');
const Alert = require('../models/Alert');



exports.getCurrentProduction = async (req, res) => {
  try {
    const { plantId } = req.query;
    
    const filter = plantId ? { plantId } : {};
    
    const latestData = await ProductionData.aggregate([
      { $match: filter },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: '$plantId',
          latestRecord: { $first: '$$ROOT' }
        }
      },
      { $replaceRoot: { newRoot: '$latestRecord' } }
    ]);

    const totalProduction = latestData.reduce((sum, plant) => sum + plant.production.current, 0);
    const totalCapacity = latestData.reduce((sum, plant) => sum + plant.production.capacity, 0);
    const avgEfficiency = latestData.length > 0
      ? latestData.reduce((sum, plant) => sum + plant.efficiency, 0) / latestData.length
      : 0;

    res.status(200).json({
      success: true,
      data: {
        plants: latestData,
        summary: {
          totalProduction: totalProduction.toFixed(2),
          totalCapacity: totalCapacity.toFixed(2),
          averageEfficiency: avgEfficiency.toFixed(2),
          plantCount: latestData.length,
          unit: 'MW'
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener datos de producción',
      error: error.message
    });
  }
};

exports.getHistoricalData = async (req, res) => {
  try {
    const { plantId, startDate, endDate, interval = 'hour' } = req.query;
    
    const filter = { plantId };
    
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    const data = await ProductionData.find(filter)
      .sort({ timestamp: 1 })
      .limit(1000);

    res.status(200).json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener datos históricos',
      error: error.message
    });
  }
};

exports.createProductionData = async (req, res) => {
  try {
    const data = await ProductionData.create(req.body);
    
    // Verificar si necesita generar alerta
    if (data.efficiency < 70) {
      await Alert.create({
        plantId: data.plantId,
        plantName: data.plantName,
        type: 'low-production',
        severity: data.efficiency < 50 ? 'high' : 'medium',
        title: 'Eficiencia baja detectada',
        description: `La planta ${data.plantName} está operando al ${data.efficiency}% de eficiencia`
      });
    }

    res.status(201).json({
      success: true,
      message: 'Datos registrados',
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al registrar datos',
      error: error.message
    });
  }
};

exports.updateProductionData = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    const data = await ProductionData.findByIdAndUpdate(id, updatedData, {
      new: true, // Return the updated document
      runValidators: true // Run schema validators on update
    });

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Datos de producción no encontrados'
      });
    }

    // Consider re-checking for alerts if efficiency is updated
    // For now, we'll just update the data.
    // If (data.efficiency < 70) { ... create alert ... }

    res.status(200).json({
      success: true,
      message: 'Datos de producción actualizados',
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar datos de producción',
      error: error.message
    });
  }
};

exports.getAlerts = async (req, res) => {
  try {
    const { status, severity, plantId } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (severity) filter.severity = severity;
    if (plantId) filter.plantId = plantId;

    const alerts = await Alert.find(filter)
      .sort('-createdAt')
      .limit(100);

    res.status(200).json({
      success: true,
      count: alerts.length,
      data: alerts
    });
  } catch (error) {
    console.error('Error in getAlerts:', error); // Add console.error
    res.status(500).json({
      success: false,
      message: 'Error al obtener alertas',
      error: error.message
    });
  }
};

exports.acknowledgeAlert = async (req, res) => {
  try {
    const { userId, userName } = req.body;
    
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      {
        status: 'acknowledged',
        'acknowledgedBy.userId': userId,
        'acknowledgedBy.userName': userName,
        'acknowledgedBy.acknowledgedAt': Date.now()
      },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alerta no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Alerta reconocida',
      data: alert
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al reconocer alerta',
      error: error.message
    });
  }
};

exports.resolveAlert = async (req, res) => {
  try {
    const { userId, userName, resolution } = req.body;
    
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      {
        status: 'resolved',
        'resolvedBy.userId': userId,
        'resolvedBy.userName': userName,
        'resolvedBy.resolvedAt': Date.now(),
        'resolvedBy.resolution': resolution
      },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alerta no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Alerta resuelta',
      data: alert
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al resolver alerta',
      error: error.message
    });
  }
};
