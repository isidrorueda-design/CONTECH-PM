// src/components/GanttChart.jsx
import React, { useEffect, useRef } from 'react';
import { gantt } from 'dhtmlx-gantt'; // <-- Importa 'dhtmlx-gantt' (SIN llaves)
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css'; // Importa los estilos

function GanttChart({ tasks, links }) {
    const ganttContainer = useRef(null);

    useEffect(() => {
        // --- 1. Lógica de Plantilla (para colores) ---
        gantt.templates.task_class = (start, end, task) => {
            // 'task' es el objeto que viene de GanttTabContent
            if (task.status === "Retrasada") {
                return "gantt-task-delayed"; // Clase CSS para Rojo
            }
            if (task.status === "Completada") {
                return "gantt-task-completed"; // Clase CSS para Gris
            }
            return ""; 
        };

        // --- 2. Configuración de Escala y Columnas ---
        gantt.config.scale_unit = "month";
        gantt.config.date_scale = "%F, %Y"; // Formato: "Noviembre, 2025"
        gantt.config.subscales = [
            { unit: "week", step: 1, date: "Semana #%W" },
            { unit: "day", step: 1, date: "%d, %D" } 
        ];
        gantt.config.scale_height = 90;

        gantt.config.columns = [
            { name: "text", label: "Nombre de la Tarea", tree: true, width: 250, resize: true },
            { name: "start_date", label: "Inicio", align: "center", width: 100 },
            { name: "duration", label: "Duración", align: "center", width: 80 },
            { name: "progress", label: "% Avance", align: "center", width: 80,
              template: (task) => Math.round(task.progress * 100) + "%" 
            }
        ];

        // --- 3. Marcador de "Hoy" ---
        gantt.config.show_progress = true;
        gantt.plugins({ marker: true });
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        gantt.deleteMarker("today"); // Limpia marcadores antiguos
        gantt.addMarker({
            start_date: today,
            css: "today",
            text: "Hoy"
        });

        gantt.config.xml_date = "%Y-%m-%d"; // Lee fechas YYYY-MM-DD
        gantt.init(ganttContainer.current);
        gantt.parse({ data: tasks, links: links });

        return () => {
            gantt.clearAll();
        };
    }, [tasks, links]);

    // --- 4. CSS (para los colores) ---
    const style = `
        .gantt_task_bar.gantt-task-delayed {
            background-color: #e63946;
            border-color: #c12c38;
        }
        .gantt_task_progress.gantt-task-delayed {
             background-color: #f77f89;
        }
        .gantt_task_bar.gantt-task-completed {
            background-color: #adb5bd;
            border-color: #8a929a;
        }
        .gantt_task_progress.gantt-task-completed {
            background-color: #ced4da;
        }
        .gantt_task_line.today {
            background-color: #F0A0A0;
        }
        .gantt_task_line.today:before {
            background-color: #F0A0A0;
            opacity: 0.5;
        }
    `;

    return (
        <div>
            <style>{style}</style>
            <div 
                ref={ganttContainer} 
                style={{ width: '100%', height: '70vh' }}
            ></div>
        </div>
    );
}

export default GanttChart;