// src/components/TasksTabContent.jsx
import React from 'react';
import { useOutletContext } from 'react-router-dom';
import NewTaskForm from './NewTaskForm';
import TaskList from './TaskList'; // <-- El árbol con columnas
// import GanttChart from './GanttChart'; // <-- Ya no se usa aquí

function TasksTabContent() {
  // Obtenemos todos los datos que necesitamos del Outlet
  const { project, flatTasks, onTaskCreated } = useOutletContext();
  
  return (
    <div>
      <NewTaskForm
        projectId={project.id}
        flatTasks={flatTasks}
        onTaskCreated={onTaskCreated}
      />
      <hr />
      
      {/* Ya no hay 2 columnas, solo mostramos el Árbol de Tareas */}
      <div className="task-list-panel">
        <h2>Lista de Tareas (Árbol)</h2>
        <TaskList tasks={project.tasks} />
      </div>

    </div>
  );
}

export default TasksTabContent;