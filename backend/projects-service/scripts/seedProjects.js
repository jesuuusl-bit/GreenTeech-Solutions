const mongoose = require('mongoose');
const Project = require('../src/models/Project');
require('dotenv').config();

const sampleProjects = [
  {
    name: 'Parque Solar Valle del Sol',
    description: 'Instalación de parque solar de 50MW en región central',
    type: 'solar',
    status: 'in-progress',
    priority: 'high',
    location: {
      country: 'Colombia',
      region: 'Córdoba',
      coordinates: { lat: 8.7479, lng: -75.8814 }
    },
    capacity: { value: 50, unit: 'MW' },
    budget: {
      allocated: 45000000,
      spent: 18000000,
      currency: 'USD'
    },
    dates: {
      start: new Date('2024-01-15'),
      estimatedEnd: new Date('2025-06-30')
    },
    progress: 40,
    milestones: [
      {
        name: 'Fase 1: Preparación del terreno',
        description: 'Limpieza y nivelación',
        dueDate: new Date('2024-03-31'),
        completed: true,
        completedDate: new Date('2024-03-28')
      },
      {
        name: 'Fase 2: Instalación de paneles',
        description: 'Montaje de estructuras y paneles solares',
        dueDate: new Date('2024-12-31'),
        completed: false
      }
    ]
  },
  {
    name: 'Granja Eólica Costa Verde',
    description: 'Proyecto de energía eólica marina de 100MW',
    type: 'wind',
    status: 'planning',
    priority: 'critical',
    location: {
      country: 'Colombia',
      region: 'Atlántico',
      coordinates: { lat: 10.9685, lng: -74.7813 }
    },
    capacity: { value: 100, unit: 'MW' },
    budget: {
      allocated: 95000000,
      spent: 5000000,
      currency: 'USD'
    },
    dates: {
      start: new Date('2025-01-01'),
      estimatedEnd: new Date('2026-12-31')
    },
    progress: 15,
    milestones: [
      {
        name: 'Estudios de viabilidad',
        description: 'Análisis de viento y condiciones marinas',
        dueDate: new Date('2024-12-31'),
        completed: false
      }
    ]
  },
  {
    name: 'Planta Híbrida Montañas Verdes',
    description: 'Combinación de solar y eólica en zona montañosa',
    type: 'hybrid',
    status: 'completed',
    priority: 'medium',
    location: {
      country: 'Colombia',
      region: 'Antioquia',
      coordinates: { lat: 6.2442, lng: -75.5812 }
    },
    capacity: { value: 75, unit: 'MW' },
    budget: {
      allocated: 60000000,
      spent: 58500000,
      currency: 'USD'
    },
    dates: {
      start: new Date('2022-06-01'),
      estimatedEnd: new Date('2024-05-31'),
      actualEnd: new Date('2024-05-20')
    },
    progress: 100,
    milestones: [
      {
        name: 'Construcción completa',
        description: 'Todas las instalaciones finalizadas',
        dueDate: new Date('2024-05-31'),
        completed: true,
        completedDate: new Date('2024-05-20')
      }
    ]
  }
];

const seedProjects = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    // Limpiar proyectos existentes
    await Project.deleteMany({});
    
    // Crear proyectos de prueba
    const createdProjects = await Project.create(sampleProjects);
    
    console.log(`✅ ${createdProjects.length} proyectos de prueba creados:\n`);
    createdProjects.forEach(project => {
      console.log(`  🏗️  ${project.name}`);
      console.log(`     📍 ${project.location.region}, ${project.location.country}`);
      console.log(`     ⚡ ${project.capacity.value}${project.capacity.unit}`);
      console.log(`     📊 Estado: ${project.status} (${project.progress}%)\n`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

seedProjects();