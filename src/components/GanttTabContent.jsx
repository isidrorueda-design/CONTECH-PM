// src/components/GanttTabContent.jsx
import React, { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import DhtmlxGantt from './DhtmlxGantt'; // Importamos el nuevo componente

function GanttTabContent() {
  // Obtenemos el proyecto completo, que tiene la estructura de árbol
  const { project } = useOutletContext();

  const ganttData = useMemo(() => {
    if (!project || !project.tasks) {
      return { tasks: [], links: [] };
    }

    const tasks = [];
    const links = [];

    // Función para calcular la duración en días laborables
    const getDuration = (start, end) => {
      if (!start || !end) return 1;
      const startDate = new Date(start);
      const endDate = new Date(end);
      let duration = 0;
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const day = currentDate.getDay();
        if (day !== 0 && day !== 6) { // Excluye Sábado (6) y Domingo (0)
          duration++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      return duration;
    };

    // Función recursiva para procesar las tareas
    const processTasks = (taskArray) => {
      taskArray.forEach(task => {
        if (task.start_date && task.end_date) {
          // Añade la tarea al array de tareas
          tasks.push({
            id: task.id,
            text: task.name,
            start_date: task.start_date,
            duration: getDuration(task.start_date, task.end_date),
            progress: (task.progress || 0) / 100, // dhtmlx usa 0-1
            parent: task.parent_id || 0,
            // Pasamos el estatus para que el componente del Gantt decida el color
            status: task.status 
          });

          // Añade las dependencias al array de enlaces
          if (task.dependencies) {
            task.dependencies.split(',').forEach(depId => {
              links.push({
                id: `${depId}-${task.id}`,
                source: depId,
                target: task.id,
                type: '0' // 0 = Finish to Start
              });
            });
          }
        }

        if (task.subtasks && task.subtasks.length > 0) {
          processTasks(task.subtasks);
        }
      });
    };

    processTasks(project.tasks);
    return { tasks, links };

  }, [project]);

  return (
    <div className="gantt-chart-panel"> 
      <h2>Diagrama de Gantt</h2>
      <DhtmlxGantt tasks={ganttData.tasks} links={ganttData.links} />
    </div>
  );
}

export default GanttTabContent;