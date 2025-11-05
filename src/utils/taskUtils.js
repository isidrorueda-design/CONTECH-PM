// src/utils/taskUtils.js

/**
 * Toma un árbol de tareas (con 'subtasks' anidadas)
 * y lo convierte en una lista plana (sin 'subtasks').
 */
export function flattenTaskTree(tasks) {
  const flatList = [];

  function traverse(taskNode) {
    // 1. Añade la tarea actual a la lista
    // (Crea una copia sin 'subtasks' para evitar bucles)
    const { subtasks, ...task } = taskNode;
    flatList.push(task);

    // 2. Si tiene hijos, recórrelos
    if (subtasks && subtasks.length > 0) {
      for (const child of subtasks) {
        traverse(child); // Llamada recursiva
      }
    }
  }

  // Inicia el recorrido por cada tarea raíz
  for (const rootTask of tasks) {
    traverse(rootTask);
  }

  return flatList;
}