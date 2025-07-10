document.addEventListener('DOMContentLoaded', function() {
            // DOM Elements
            const taskForm = document.getElementById('task-form');
            const taskInput = document.getElementById('task-input');
            const addButton = document.getElementById('add-button');
            const taskList = document.getElementById('task-list');
            const emptyState = document.getElementById('empty-state');
            const taskCount = document.getElementById('task-count');
            const taskText = document.getElementById('task-text');
            const filterButtons = document.querySelectorAll('.filter-btn');
            const editModal = document.getElementById('edit-modal');
            const editInput = document.getElementById('edit-input');
            const closeModal = document.getElementById('close-modal');
            const cancelEdit = document.getElementById('cancel-edit');
            const saveEdit = document.getElementById('save-edit');

            // State
            let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
            let currentFilter = 'all';
            let currentEditId = null;

            // Initialize
            renderTasks();
            updateTaskCount();

            // Event Listeners
            taskForm.addEventListener('submit', handleAddTask);
            taskInput.addEventListener('keyup', handleKeyPress);
            filterButtons.forEach(btn => btn.addEventListener('click', filterTasks));
            closeModal.addEventListener('click', closeEditModal);
            cancelEdit.addEventListener('click', closeEditModal);
            saveEdit.addEventListener('click', saveEditedTask);

            // Functions
            function handleAddTask(e) {
                e.preventDefault();
                addTask();
            }

            function handleKeyPress(e) {
                if (e.key === 'Enter') {
                    addTask();
                }
            }

            function addTask() {
                const taskText = taskInput.value.trim();
                if (!taskText) {
                    shakeInput();
                    return;
                }

                const newTask = {
                    id: Date.now(),
                    text: taskText,
                    completed: false,
                    createdAt: new Date().toISOString()
                };

                tasks.unshift(newTask);
                saveTasks();
                renderTasks();
                taskInput.value = '';
                taskInput.focus();
            }

            function shakeInput() {
                taskInput.classList.add('animate-shake');
                setTimeout(() => {
                    taskInput.classList.remove('animate-shake');
                }, 500);
            }

            function renderTasks() {
                // Clear task list
                taskList.innerHTML = '';

                // Filter tasks
                let filteredTasks = tasks;
                if (currentFilter === 'completed') {
                    filteredTasks = tasks.filter(task => task.completed);
                } else if (currentFilter === 'pending') {
                    filteredTasks = tasks.filter(task => !task.completed);
                }

                // Update active filter style
                filterButtons.forEach(btn => {
                    if (btn.dataset.filter === currentFilter) {
                        btn.classList.add('bg-purple-600', 'text-white');
                        btn.classList.remove('bg-white', 'border');
                    } else {
                        btn.classList.remove('bg-purple-600', 'text-white');
                        btn.classList.add('bg-white', 'border');
                    }
                });

                // Show empty state if no tasks
                if (filteredTasks.length === 0) {
                    emptyState.classList.remove('hidden');
                    taskList.appendChild(emptyState);
                    return;
                }

                emptyState.classList.add('hidden');

                // Create task items
                filteredTasks.forEach(task => {
                    const taskItem = document.createElement('div');
                    taskItem.className = `task-item p-4 ${task.completed ? 'completed' : 'pending'} fade-in`;
                    taskItem.dataset.id = task.id;
                    
                    taskItem.innerHTML = `
                        <div class="flex items-center gap-3">
                            <label class="relative flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    class="checkbox-custom appearance-none rounded checked:bg-purple-600 mr-2"
                                    ${task.completed ? 'checked' : ''}
                                    data-action="toggle"
                                >
                                <span class="checkmark"></span>
                            </label>
                            <div class="flex-1 min-w-0">
                                <p class="${task.completed ? 'line-through text-purple-400' : 'text-purple-800'} truncate">${task.text}</p>
                                <p class="text-xs text-purple-400 mt-1">
                                    <i class="far fa-clock mr-1"></i>
                                    ${formatDate(task.createdAt)}
                                </p>
                            </div>
                            <div class="flex gap-2">
                                <button 
                                    class="p-2 text-purple-500 hover:text-purple-700"
                                    data-action="edit"
                                    aria-label="Edit task"
                                >
                                    <i class="fas fa-pencil-alt"></i>
                                </button>
                                <button 
                                    class="p-2 text-purple-500 hover:text-purple-700"
                                    data-action="delete"
                                    aria-label="Delete task"
                                >
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                            </div>
                        </div>
                    `;
                    
                    taskList.appendChild(taskItem);
                });

                // Add event listeners to task controls
                document.querySelectorAll('[data-action="toggle"]').forEach(el => {
                    el.addEventListener('change', toggleTask);
                });
                
                document.querySelectorAll('[data-action="edit"]').forEach(el => {
                    el.addEventListener('click', openEditModal);
                });
                
                document.querySelectorAll('[data-action="delete"]').forEach(el => {
                    el.addEventListener('click', deleteTask);
                });
            }

            function toggleTask(e) {
                const taskId = parseInt(e.target.closest('.task-item').dataset.id);
                const task = tasks.find(task => task.id === taskId);
                
                if (task) {
                    task.completed = e.target.checked;
                    saveTasks();
                    renderTasks();
                }
            }

            function deleteTask(e) {
                const taskId = parseInt(e.target.closest('.task-item').dataset.id);
                tasks = tasks.filter(task => task.id !== taskId);
                saveTasks();
                
                // Animation for deletion
                const taskItem = e.target.closest('.task-item');
                taskItem.style.transform = 'translateX(100%)';
                taskItem.style.opacity = '0';
                
                setTimeout(() => {
                    renderTasks();
                }, 200);
            }

            function openEditModal(e) {
                const taskId = parseInt(e.target.closest('.task-item').dataset.id);
                const task = tasks.find(task => task.id === taskId);
                
                if (task) {
                    currentEditId = taskId;
                    editInput.value = task.text;
                    editModal.classList.remove('hidden');
                    editInput.focus();
                }
            }

            function closeEditModal() {
                editModal.classList.add('hidden');
                currentEditId = null;
                editInput.value = '';
            }

            function saveEditedTask() {
                const newText = editInput.value.trim();
                
                if (newText && currentEditId) {
                    const task = tasks.find(task => task.id === currentEditId);
                    
                    if (task) {
                        task.text = newText;
                        saveTasks();
                        renderTasks();
                        closeEditModal();
                    }
                }
            }

            function filterTasks(e) {
                currentFilter = e.currentTarget.dataset.filter;
                renderTasks();
            }

            function saveTasks() {
                localStorage.setItem('tasks', JSON.stringify(tasks));
                updateTaskCount();
            }

            function updateTaskCount() {
                const total = tasks.length;
                const completed = tasks.filter(task => task.completed).length;
                
                taskCount.textContent = `${completed} / ${total}`;
                
                // Singular/plural text
                taskText.textContent = total === 1 ? 'task' : 'tasks';
            }

            function formatDate(isoString) {
                const date = new Date(isoString);
                return date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }
        });
