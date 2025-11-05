import React, { useEffect, useRef } from 'react';
import Gantt from 'frappe-gantt';
import 'frappe-gantt/dist/frappe-gantt.css';

function GanttChart({ tasks }) {
  const ganttRef = useRef(null);
  const ganttInstanceRef = useRef(null); 

  useEffect(() => {
    const timerId = setTimeout(() => {      
      if (ganttRef.current && tasks.length > 0) {        
        const formattedTasks = tasks.map(task => ({
          id: String(task.id),
          name: task.name,
          start: task.start_date,
          end: task.end_date,
          progress: 0,
          dependencies: task.parent_id ? String(task.parent_id) : null
        }));

        if (ganttRef.current.innerHTML) {
          ganttRef.current.innerHTML = "";
        }

        ganttInstanceRef.current = new Gantt(ganttRef.current, formattedTasks, {
          header_height: 50,
          column_width: 30,
          step: 24,
          view_modes: ['Day', 'Week', 'Month'],
          view_mode: 'Week',
          date_format: 'YYYY-MM-DD',
          language: 'es',
          on_click: (task) => {
            console.log('Clic en tarea:', task);
          },
        });
      }
    }, 1); 

    return () => {
      clearTimeout(timerId);
      if (ganttInstanceRef.current) {
        ganttInstanceRef.current.clear();
      }
    };
  }, [tasks]);

  return <div ref={ganttRef}></div>;
}

export default GanttChart;