
async function loadTodos() {
  const petId = localStorage.getItem('selectedPetId');
  const petName = localStorage.getItem('selectedPetName');
  
  // Update the heading
  const heading = document.getElementById('todo-heading');
  heading.textContent = `${petName}'s To-Do List`;
  console.log(petId);
  const response = await fetch(`/api/cg/todos?petId=${petId}`);

  const data = await response.json();
  console.log("Server response:", data); 

  const container = document.getElementById('todo-list');
  container.innerHTML = '';

  if (data.success) {
    console.log("Received List")
    data.todos.forEach(todo => {
     const li = document.createElement('li');
     li.innerHTML = `
  <label>
    <input type="checkbox" ${todo.completed ? 'checked' : ''} onchange="updateTodo(${todo.task_id}, this.checked)">
    ${todo.task}
  </label>
`;
container.appendChild(li);

    });
  }
}


async function updateTodo(taskId, completed) {
  await fetch(`/api/todos/${taskId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completed })
  });
}
window.addEventListener('DOMContentLoaded', loadTodos);

