# Gestor de Arreglos en Conferencias

Aplicación web para la gestión de arreglos en conferencias de los testigos de Jehová. Esta herramienta permite administrar salones del reino, oradores, bosquejos, asignaciones y generar informes.

## Características

- Gestión de salones del reino
- Administración de oradores
- Biblioteca de bosquejos
- Calendario de arreglos
- Asignación de oradores a eventos
- Generación de informes
- Panel de configuración personalizable

## Requisitos

- Node.js (v14 o superior)
- NPM (v6 o superior)

## Instalación

1. Clona el repositorio:
   ```bash
   git clone [URL_DEL_REPOSITORIO]
   cd gestor-arreglos-conferencias
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

4. Abre tu navegador y visita:
   ```
   http://localhost:3000
   ```

## Estructura del Proyecto

```
gestor-arreglos-conferencias/
├── assets/               # Archivos estáticos (imágenes, fuentes, etc.)
├── pages/                # Páginas HTML
│   ├── index.html        # Página de inicio/dashboard
│   ├── congregaciones.html # Gestión de congregaciones
│   ├── oradores.html     # Gestión de oradores
│   ├── bosquejos.html    # Biblioteca de bosquejos
│   ├── arreglos.html     # Calendario de arreglos
│   ├── asignaciones.html # Asignación de oradores
│   ├── informes.html     # Generación de informes
│   └── ajustes.html      # Configuración de la aplicación
├── scripts/              # Archivos JavaScript
│   ├── app.js            # Lógica principal
│   ├── sidebar.js        # Navegación lateral
│   └── page-template.js  # Plantillas de página
├── style.css            # Estilos principales
├── server.js            # Servidor Node.js
└── package.json         # Configuración del proyecto
```

## Uso

1. **Inicio**: Vista general con resumen de actividades recientes y próximos eventos.
2. **Salones**: Administra los salones del reino disponibles para las conferencias.
3. **Oradores**: Gestiona la información de los oradores y sus disponibilidades.
4. **Bosquejos**: Accede a la biblioteca de bosquejos disponibles.
5. **Arreglos**: Visualiza el calendario de arreglos programados.
6. **Asignaciones**: Asigna oradores a eventos específicos.
7. **Informes**: Genera informes de actividades y estadísticas.
8. **Ajustes**: Personaliza la aplicación según tus preferencias.

## Personalización

Puedes personalizar la apariencia de la aplicación modificando las variables CSS en `style.css`:

```css
:root {
  --color-primary: #1B3A4B;
  --color-secondary: #4FA3B7;
  --color-accent: #C97B2D;
  /* ... otras variables ... */
}
```

## Contribución

Las contribuciones son bienvenidas. Por favor, lee las pautas de contribución antes de enviar un pull request.

## Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo `LICENSE` para más información.

---

Desarrollado para la comunidad de testigos de Jehová.
