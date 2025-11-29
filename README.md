# CONTECH-PM

CONTECH-PM es una aplicación web para la gestión y control de proyectos de construcción, diseñada para centralizar la información y facilitar el seguimiento del progreso, presupuesto y documentación.

## Características Principales

*   **Gestión de Proyectos**: Creación y administración de múltiples proyectos.
*   **Planificación de Tareas**: Estructura de tareas jerárquica (árbol de tareas) con seguimiento de avance, estatus y fechas.
*   **Diagrama de Gantt Interactivo**: Visualización del cronograma del proyecto con dependencias y progreso de tareas.
*   **Control Presupuestal**: Gestión de contratos y estimaciones.
*   **Gestor Documental (DMS)**: Organización de documentos en carpetas por proyecto.
*   **Visor BIM**: Carga y visualización de modelos IFC.
*   **Roles de Usuario**: Diferentes niveles de acceso (Super Administrador, Administrador de Compañía, Usuario).

## Instalación (Frontend)

Sigue estos pasos para configurar y ejecutar el entorno de desarrollo del frontend.

### Prerrequisitos

*   [Node.js](https://nodejs.org/) (se recomienda v18.x o superior)
*   [npm](https://www.npmjs.com/) (generalmente se instala con Node.js)

### Pasos

1.  **Clona el repositorio:**
    ```bash
    git clone https://github.com/isidrorueda-design/CONTECH-PM.git
    ```

2.  **Navega al directorio del proyecto:**
    ```bash
    cd CONTECH-PM
    ```

3.  **Instala las dependencias:**
    ```bash
    npm install
    ```

4.  **Ejecuta el servidor de desarrollo:**
    ```bash
    npm run dev
    ```

    La aplicación estará disponible en `http://localhost:5173`.

## Dependencias Clave

*   **React**: Biblioteca principal para la construcción de la interfaz de usuario.
*   **Vite**: Herramienta de construcción y servidor de desarrollo rápido.
*   **React Router**: Para la navegación y el enrutamiento dentro de la aplicación.
*   **Axios**: Cliente HTTP para realizar peticiones a la API del backend.
*   **dhtmlx-gantt**: Librería para la creación del Diagrama de Gantt interactivo.
*   **web-ifc-viewer**: Componente para la visualización de modelos BIM (formato IFC).
*   **three.js**: Dependencia fundamental para el renderizado 3D del visor BIM.

---
*Nota: Esta aplicación requiere un backend funcional (construido con FastAPI) que se ejecute en `http://127.0.0.1:8000` para operar correctamente.*
