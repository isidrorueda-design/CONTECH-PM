// src/components/GanttChart.jsx
import React, { useEffect, useRef } from 'react';
import { gantt } from 'dhtmlx-gantt';
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';

function GanttChart({ tasks, links }) {
    const ganttContainer = useRef(null);

    useEffect(() => {
        // --- 1. ¡LÓGICA DE PLANTILLA ACTUALIZADA! ---
        // Esta función ahora usa el campo 'status' que le pasamos
        gantt.templates.task_class = (start, end, task) => {
            
            // Lógica basada en el 'status' de la Tarea
            if (task.status === "Retrasada") {
                return "gantt-task-delayed"; // Clase CSS para Rojo
            }
            if (task.status === "Completada") {
                return "gantt-task-completed"; // Clase CSS para Gris
            }
            
            // Para 'Pendiente' o 'En Progreso', usa el azul por defecto
            return ""; 
        };

        // --- 2. Configuración de Escala y Columnas (sin cambios) ---
        gantt.config.scale_unit = "month";
        gantt.config.date_scale = "%F, %Y";
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

        // --- 3. Configuración del Marcador de "Hoy" (sin cambios) ---
        gantt.config.show_progress = true;
        gantt.plugins({ marker: true });
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        gantt.deleteMarker("today");
        gantt.addMarker({
            start_date: today,
            css: "today",
            text: "Hoy"
        });

        gantt.config.xml_date = "%Y-%m-%d";
        gantt.init(ganttContainer.current);
        gantt.parse({ data: tasks, links: links });

        return () => {
            gantt.clearAll();
        };
    }, [tasks, links]);

    // --- 4. CSS (sin cambios, ya incluye las clases) ---
    const style = `
        /* Estilo para la barra de tarea atrasada (ROJO) */
        .gantt_task_bar.gantt-task-delayed {
            background-color: #e63946; /* Rojo */
            border-color: #c12c38;
        }
        .gantt_task_progress.gantt-task-delayed {
             background-color: #f77f89; /* Rojo más claro */
        }
        
        /* Estilo para la barra de tarea completada (GRIS) */
        .gantt_task_bar.gantt-task-completed {
            background-color: #adb5bd; /* Gris */
            border-color: #8a929a;
        }
        .gantt_task_progress.gantt-task-completed {
            background-color: #ced4da; /* Gris más claro */
        }

        /* Estilo para el marcador de "Hoy" */
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