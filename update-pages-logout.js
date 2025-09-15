const fs = require('fs');
const path = require('path');

// Ruta a la carpeta de páginas
const pagesDir = path.join(__dirname, 'pages');

// Obtener todos los archivos HTML en la carpeta pages
fs.readdir(pagesDir, (err, files) => {
    if (err) {
        console.error('Error al leer la carpeta pages:', err);
        return;
    }

    // Filtrar solo archivos HTML
    const htmlFiles = files.filter(file => file.endsWith('.html'));
    
    // Actualizar cada archivo HTML
    htmlFiles.forEach(file => {
        const filePath = path.join(pagesDir, file);
        
        // Leer el contenido del archivo
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                console.error(`Error al leer el archivo ${file}:`, err);
                return;
            }
            
            // Verificar si ya tiene el script de logout-handler
            if (data.includes('logout-handler.js')) {
                console.log(`${file} ya tiene el botón de cierre de sesión`);
                return;
            }
            
            // Insertar el script antes del cierre del body
            const updatedContent = data.replace(
                /<\/body>/, 
                '    <script type="module" src="../scripts/auth/logout-handler.js"></script>\n</body>'
            );
            
            // Escribir el archivo actualizado
            fs.writeFile(filePath, updatedContent, 'utf8', (err) => {
                if (err) {
                    console.error(`Error al actualizar el archivo ${file}:`, err);
                    return;
                }
                console.log(`✅ ${file} actualizado con el botón de cierre de sesión`);
            });
        });
    });
});
