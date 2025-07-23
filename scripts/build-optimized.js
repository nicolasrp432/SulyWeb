#!/usr/bin/env node

/**
 * Script de build optimizado para producción
 * Incluye optimizaciones adicionales para SEO y rendimiento
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🚀 Iniciando build optimizado para producción...');

// 1. Limpiar directorio dist
console.log('🧹 Limpiando directorio dist...');
try {
  execSync('rm -rf dist', { cwd: rootDir, stdio: 'inherit' });
} catch (error) {
  // En Windows, usar rmdir
  try {
    execSync('rmdir /s /q dist', { cwd: rootDir, stdio: 'inherit' });
  } catch (winError) {
    console.log('📁 Directorio dist no existe o ya está limpio');
  }
}

// 2. Verificar variables de entorno
console.log('🔍 Verificando configuración...');
const envPath = path.join(rootDir, '.env');
if (!fs.existsSync(envPath)) {
  console.warn('⚠️  Archivo .env no encontrado. Usando .env.example como referencia.');
  const envExamplePath = path.join(rootDir, '.env.example');
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('📋 Archivo .env creado desde .env.example');
  }
}

// 3. Instalar dependencias si es necesario
console.log('📦 Verificando dependencias...');
try {
  execSync('npm ci --only=production', { cwd: rootDir, stdio: 'inherit' });
} catch (error) {
  console.log('📦 Instalando dependencias...');
  execSync('npm install', { cwd: rootDir, stdio: 'inherit' });
}

// 4. Ejecutar build de Vite
console.log('🏗️  Ejecutando build de Vite...');
try {
  execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });
} catch (error) {
  console.error('❌ Error durante el build:', error.message);
  process.exit(1);
}

// 5. Generar sitemap
console.log('🗺️  Generando sitemap...');
try {
  const generateSitemap = await import('../src/utils/generateSitemap.js');
  const sitemap = generateSitemap.default();
  const sitemapPath = path.join(rootDir, 'dist', 'sitemap.xml');
  fs.writeFileSync(sitemapPath, sitemap);
  console.log('✅ Sitemap generado correctamente');
} catch (error) {
  console.warn('⚠️  Error generando sitemap:', error.message);
}

// 6. Optimizar archivos estáticos
console.log('⚡ Optimizando archivos estáticos...');

// Verificar tamaños de archivos
const distPath = path.join(rootDir, 'dist');
if (fs.existsSync(distPath)) {
  const stats = getDirectorySize(distPath);
  console.log(`📊 Tamaño total del build: ${formatBytes(stats.size)}`);
  console.log(`📄 Archivos generados: ${stats.files}`);
  
  // Verificar archivos grandes
  const largeFiles = findLargeFiles(distPath, 500 * 1024); // 500KB
  if (largeFiles.length > 0) {
    console.warn('⚠️  Archivos grandes detectados:');
    largeFiles.forEach(file => {
      console.warn(`   - ${file.path}: ${formatBytes(file.size)}`);
    });
  }
}

// 7. Generar reporte de build
console.log('📋 Generando reporte de build...');
const buildReport = {
  timestamp: new Date().toISOString(),
  nodeVersion: process.version,
  buildSize: fs.existsSync(distPath) ? getDirectorySize(distPath) : null,
  environment: process.env.NODE_ENV || 'production'
};

fs.writeFileSync(
  path.join(rootDir, 'dist', 'build-report.json'),
  JSON.stringify(buildReport, null, 2)
);

console.log('✅ Build optimizado completado exitosamente!');
console.log('🌐 La aplicación está lista para desplegar en producción.');

// Funciones auxiliares
function getDirectorySize(dirPath) {
  let totalSize = 0;
  let fileCount = 0;
  
  function calculateSize(currentPath) {
    const stats = fs.statSync(currentPath);
    
    if (stats.isDirectory()) {
      const files = fs.readdirSync(currentPath);
      files.forEach(file => {
        calculateSize(path.join(currentPath, file));
      });
    } else {
      totalSize += stats.size;
      fileCount++;
    }
  }
  
  calculateSize(dirPath);
  return { size: totalSize, files: fileCount };
}

function findLargeFiles(dirPath, threshold) {
  const largeFiles = [];
  
  function checkFiles(currentPath) {
    const stats = fs.statSync(currentPath);
    
    if (stats.isDirectory()) {
      const files = fs.readdirSync(currentPath);
      files.forEach(file => {
        checkFiles(path.join(currentPath, file));
      });
    } else if (stats.size > threshold) {
      largeFiles.push({
        path: path.relative(dirPath, currentPath),
        size: stats.size
      });
    }
  }
  
  checkFiles(dirPath);
  return largeFiles;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}