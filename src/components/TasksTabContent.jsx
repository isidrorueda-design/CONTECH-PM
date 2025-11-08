// src/components/TasksTabContent.jsx
import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../api/axiosConfig';
import NewTaskForm from './NewTaskForm';
import TaskTree from './TaskTree'; // <-- 1. Importa el nuevo componente

function TasksTabContent() {
  // 1. Obtiene los datos del Outlet, incluyendo 'user' y 'project'
  const { project, flatTasks, user, refetchProject, setProject } = useOutletContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('new');
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  
  // 2. Extrae la lista de usuarios de la compañía
  // (Asumimos que 'project' carga su 'company' y sus 'users')
  const companyUsers = project?.company?.users || []; 

  const handleOpenNewModal = () => {
    setModalMode('new');
    setSelectedTaskId(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = () => {
    if (!selectedTaskId) {
      alert('Por favor, seleccione una tarea para modificar.');
      return;
    }
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedTaskId) {
      alert('Por favor, seleccione una tarea para eliminar.');
      return;
    }
    if (window.confirm('¿Estás seguro de que quieres eliminar esta tarea y todas sus subtareas?')) {
      try {
        await api.delete(`/tasks/${selectedTaskId}`);
        refetchProject(); // Recarga todos los datos del proyecto
        setSelectedTaskId(null); // Deselecciona la tarea
      } catch (error) {
        alert('Error al eliminar la tarea.');
      }
    }
  };

  const handleSave = () => {
    refetchProject();
    setIsModalOpen(false);
  };

  const handleTaskUpdate = async (taskId, updatedFields) => {
    try {
      // --- INICIO DE LA CORRECCIÓN ---
      // 1. Encuentra la tarea completa que se está actualizando.
      const taskToUpdate = flatTasks.find(t => t.id === taskId);
      if (!taskToUpdate) return;

      // 2. Crea el payload completo combinando los datos antiguos con los nuevos.
      const fullTaskData = {
        ...taskToUpdate,
        ...updatedFields,
        // Asegúrate de que los IDs se envíen como números si es necesario
        parent_id: taskToUpdate.parent_id ? parseInt(taskToUpdate.parent_id, 10) : null,
        responsible_user_id: taskToUpdate.responsible_user_id ? parseInt(taskToUpdate.responsible_user_id, 10) : null,
      };

      // 3. Usa el método PUT, que es el que se usa para editar en el modal.
      await api.put(`/tasks/${taskId}/`, fullTaskData);
      // --- FIN DE LA CORRECCIÓN ---

      // Actualiza el estado local para reflejar el cambio instantáneamente
      // sin recargar toda la página y colapsar el árbol.
      const updateTasksRecursively = (tasks) => {
        return tasks.map(task => {
          if (task.id === taskId) {
            // Asegura que todos los campos automáticos se reflejen
            const finalUpdatedTask = { ...task, ...updatedFields };
            if (updatedFields.progress === 100) finalUpdatedTask.status = 'completed';
            if (updatedFields.actual_start_date && finalUpdatedTask.status !== 'completed') finalUpdatedTask.status = 'in_progress';
            if (updatedFields.status === 'delayed') finalUpdatedTask.status = 'delayed';

            return finalUpdatedTask;
          }
          if (task.subtasks) {
            return { ...task, subtasks: updateTasksRecursively(task.subtasks) };
          }
          return task;
        });
      };

      setProject(prevProject => ({
        ...prevProject,
        tasks: updateTasksRecursively(prevProject.tasks)
      }));
    } catch (error) {
      console.error("Error al actualizar la tarea:", error.response || error);
      alert('Error al actualizar la tarea.');
      // Opcional: podrías recargar para revertir el cambio visual
      refetchProject();
    }
  };

  const selectedTask = flatTasks.find(t => t.id === selectedTaskId);

  return (
    <div>
      <div className="page-actions" style={{ marginBottom: '1.5rem' }}>
        <button className="btn-new" onClick={handleOpenNewModal}>
          + Nueva Tarea
        </button>
        <button className="btn-modify" onClick={handleOpenEditModal}>Modificar Tarea</button>
        <button className="btn-delete" onClick={handleDelete}>Eliminar Tarea</button>
      </div>

      {isModalOpen && (
        <NewTaskForm
          mode={modalMode}
          initialData={selectedTask}
          projectId={project.id}
          flatTasks={flatTasks}
          companyUsers={companyUsers}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
        />
      )}
      <hr />
      
      <div className="task-list-panel">
        <h2>Lista de Tareas (Árbol)</h2>
        <TaskTree 
          tasks={project.tasks}
          selectedId={selectedTaskId}
          onSelectTask={setSelectedTaskId}
          onUpdateTask={handleTaskUpdate}
        />
      </div>
    </div>
  );
}
export default TasksTabContent; 