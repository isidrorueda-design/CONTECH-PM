// src/components/DhtmlxGantt.jsx
import React, { useEffect, useRef } from 'react';
import { gantt } from 'dhtmlx-gantt';
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';

function DhtmlxGantt({ tasks, links }) {
  const ganttContainer = useRef(null);

  useEffect(() => {
    // --- Configuración del Gantt ---
    gantt.config.date_format = "%Y-%m-%d";
    gantt.config.work_time = true;

    // --- INICIO DE LA MODIFICACIÓN: Reducir altura de las barras ---
    gantt.config.row_height = 30; // El valor por defecto es 40

    // --- INICIO DE LA MODIFICACIÓN: Progreso ponderado para tareas padre ---
    // Habilita el cálculo automático de progreso para las tareas "proyecto" (padre).
    // El progreso se calculará como un promedio ponderado por la duración de las subtareas.
    gantt.config.auto_scheduling = true;

    gantt.config.skip_off_time = true;

    // --- INICIO DE LA MODIFICACIÓN: Ajustar altura y estilo de la cabecera ---
    // La altura total de la cabecera será la suma de las alturas de cada fila.
    gantt.config.scales = [
      { unit: "month", step: 1, format: "%F, %Y", height: 35, css: () => "gantt-month-header" },
      { unit: "week", step: 1, format: "Semana #%W" }, // Usará la altura restante
      { unit: "day", step: 1, format: "%d, %D" }
    ];
    gantt.config.scale_height = 75; // Aumentamos la altura total de la cabecera
    // --- FIN DE LA MODIFICACIÓN ---

    // --- Configuración de Columnas (similar a MS Project) ---
    gantt.config.columns = [
      { name: "text", label: "Nombre de Tarea", tree: true, width: '*' },
      { name: "start_date", label: "Inicio", align: "center", width: 90 },
      { name: "duration", label: "Duración", align: "center", width: 70 },
      { name: "add", width: 44 }
    ];

    // --- Plantilla para colorear las barras ---
    gantt.templates.task_class = (start, end, task) => {
      // Si es una tarea padre (tipo 'project'), su estatus se deriva de su progreso.
      if (task.type === gantt.config.types.project) {
        if (task.progress === 1) return 'gantt-completed'; // Verde si está al 100%
        // La lógica de 'retrasada' para padres puede ser compleja. Por ahora, se mantiene azul.
        // Podríamos añadir una lógica más avanzada si es necesario.
        return ''; // Azul por defecto
      }

      // Lógica de color para tareas normales (hijas)
      switch (task.status) {
        case 'delayed': return 'gantt-delayed';
        case 'completed': return 'gantt-completed';
        case 'pending': return 'gantt-pending';
        default: return ''; // 'in_progress' o por defecto usará el color azul
      }
    };

    // --- INICIO DE LA MODIFICACIÓN: Mostrar porcentaje de avance ---
    gantt.templates.task_text = (start, end, task) => {
      // task.progress es un valor de 0 a 1, lo convertimos a porcentaje
      if (task.progress > 0) return Math.round(task.progress * 100) + '%';
      return '';
    };
    // --- FIN DE LA MODIFICACIÓN ---
    // --- Inicialización ---
    gantt.init(ganttContainer.current);
    gantt.clearAll();
    gantt.parse({ data: tasks, links: links });

    // --- Cleanup ---
    return () => {
      if (ganttContainer.current) {
        gantt.clearAll();
      }
    };
  }, [tasks, links]); // Se re-renderiza si las tareas o los enlaces cambian

  return (
    <div
      ref={ganttContainer}
      style={{ width: '100%', height: 'calc(100vh - 300px)' }}
    ></div>
  );
}

export default DhtmlxGantt;
