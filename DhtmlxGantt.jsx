// src/components/DhtmlxGantt.jsx
import React, { useEffect, useRef } from 'react';
import { gantt } from 'dhtmlx-gantt';
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';

function DhtmlxGantt({ tasks, links }) {
  const ganttContainer = useRef(null);

  useEffect(() => {
    // --- Configuración del Gantt ---
    gantt.config.date_format = "%Y-%m-%d";
    gantt.config.work_time = true; // Habilita el cálculo de tiempo de trabajo
    gantt.config.skip_off_time = true; // Oculta fines de semana del gráfico
    gantt.config.scales = [
      { unit: "month", step: 1, format: "%F, %Y" },
      { unit: "week", step: 1, format: "Semana #%W" },
      { unit: "day", step: 1, format: "%d, %D" }
    ];

    // --- Configuración de Columnas (similar a MS Project) ---
    gantt.config.columns = [
      { name: "text", label: "Nombre de Tarea", tree: true, width: '*' },
      { name: "start_date", label: "Inicio", align: "center", width: 90 },
      { name: "duration", label: "Duración", align: "center", width: 70 },
      { name: "add", width: 44 }
    ];

    // --- Plantilla para colorear las barras ---
    gantt.templates.task_class = (start, end, task) => {
      if (task.progress === 1) return "gantt-completed";
      if (task.custom_class === 'bar-delayed') return "gantt-delayed";
      return "";
    };

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