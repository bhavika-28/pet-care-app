document.addEventListener('DOMContentLoaded', async function () {
    const taskInput = document.getElementById('task-input');
    const taskDescription = document.getElementById('task-description');
    const assignedTo = document.getElementById('assigned-to');
    const reminderTime = document.getElementById('reminder-time');
    const repeatType = document.getElementById('repeat-type');
    const customRepeatDiv = document.getElementById('custom-repeat');
    const taskList = document.getElementById('task-list');
    const notificationModal = document.getElementById('notification-modal');
    const notificationText = document.getElementById('notification-text');
    const notificationOk = document.getElementById('notification-ok');
    
    // New elements for the add task box
    const addTaskBox = document.getElementById('add-task-box');
    const addTaskInput = document.getElementById('add-task-input');
    const expandedForm = document.getElementById('expanded-form');
    const saveTaskBtn = document.getElementById('save-task-btn');
    const cancelTaskBtn = document.getElementById('cancel-task-btn');

    // Helper to get value from sessionStorage first, then localStorage
    const getValue = (key) => {
        const sessionVal = sessionStorage.getItem(key);
        return sessionVal !== null ? sessionVal : localStorage.getItem(key);
    };
    
    // Get selected pet
    const selectedPetStr = getValue("selectedPet");
    let selectedPet = selectedPetStr ? JSON.parse(selectedPetStr) : null;
if (!selectedPet || !selectedPet.id) {
        const fallbackPetId = getValue("selectedPetId");
    if (fallbackPetId) {
            selectedPet = { id: parseInt(fallbackPetId), name: "Your Pet" };
        } else {
        alert("No pet selected.");
        return;
    }
}

const petId = selectedPet.id;

    // In-memory timers for local notifications
    const reminderTimers = new Map();

    // Load existing tasks
    await loadTasks();

    // Check for reminders every 10 seconds (for testing)
    console.log('Setting up reminder checking...');
    setInterval(() => {
        console.log('Reminder check triggered at:', new Date().toLocaleTimeString());
        checkReminders();
    }, 10000);
    
    // Manual test for reminders (remove this in production)
    window.testReminders = checkReminders;
    
    // Test reminder check immediately
    console.log('Testing reminder check immediately...');
    checkReminders();

    // Handle repetition type change
    repeatType.addEventListener('change', function() {
        if (this.value === 'custom') {
            customRepeatDiv.style.display = 'flex';
        } else {
            customRepeatDiv.style.display = 'none';
        }
    });

    // Add task box click to expand form
    addTaskInput.addEventListener('click', function() {
        expandedForm.style.display = 'block';
        taskInput.focus();
    });

    // Save task button
    saveTaskBtn.addEventListener('click', async function() {
        const taskValue = taskInput.value.trim();
        const descriptionValue = taskDescription.value.trim();
        const assignedToValue = assignedTo.value.trim();
        const reminderTimeValue = reminderTime.value;
        const repeatTypeValue = repeatType.value;
        const repeatInterval = document.getElementById('repeat-interval').value;
        const repeatPeriod = document.getElementById('repeat-period').value;

        if (taskValue === '') {
            alert('Please enter a task!');
            return;
        }

        try {
            const response = await fetch('/api/todos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    petId,
                    task: taskValue,
                    description: descriptionValue,
                    assigned_to: assignedToValue,
                    reminder_time: reminderTimeValue,
                    repeat_type: repeatTypeValue,
                    repeat_interval: repeatInterval,
                    repeat_days: repeatPeriod
                })
            });

            const data = await response.json();
            if (data.success) {
                // Clear inputs and collapse form
                taskInput.value = '';
                taskDescription.value = '';
                assignedTo.value = '';
                reminderTime.value = '';
                repeatType.value = 'none';
                customRepeatDiv.style.display = 'none';
                document.getElementById('repeat-interval').value = '1';
                document.getElementById('repeat-period').value = 'days';
                expandedForm.style.display = 'none';
                
                // Reload tasks
                await loadTasks();
            } else {
                alert('Failed to add task.');
            }
        } catch (error) {
            console.error('Error adding task:', error);
            alert('Failed to add task: Server error.');
        }
    });

    // Cancel task button
    cancelTaskBtn.addEventListener('click', function() {
        // Clear inputs and collapse form
        taskInput.value = '';
        taskDescription.value = '';
        assignedTo.value = '';
        reminderTime.value = '';
        repeatType.value = 'none';
        customRepeatDiv.style.display = 'none';
        document.getElementById('repeat-interval').value = '1';
        document.getElementById('repeat-period').value = 'days';
        expandedForm.style.display = 'none';
    });

    // Time picker function
    function showTimePicker(currentTime, callback) {
        // Parse current time if provided
        let currentHour = 12;
        let currentMinute = 0;
        let currentPeriod = 'AM';
        
        if (currentTime && currentTime.includes(':')) {
            const timeMatch = currentTime.match(/(\d{1,2}):(\d{2})/);
            if (timeMatch) {
                let hour = parseInt(timeMatch[1]);
                currentMinute = parseInt(timeMatch[2]);
                
                // Check if 24-hour format or 12-hour format
                if (hour >= 12) {
                    currentPeriod = 'PM';
                    if (hour > 12) hour -= 12;
                } else {
                    currentPeriod = 'AM';
                }
                if (hour === 0) hour = 12;
                currentHour = hour;
            }
        }
        
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center;';
        
        // Create time picker container
        const picker = document.createElement('div');
        picker.style.cssText = 'background: white; padding: 20px; border-radius: 10px; display: flex; gap: 15px; align-items: center; box-shadow: 0 4px 20px rgba(0,0,0,0.3);';
        
        // Hour selector
        const hourSelect = document.createElement('select');
        hourSelect.style.cssText = 'padding: 10px; font-size: 18px; border: 2px solid #ddd; border-radius: 5px; width: 80px; text-align: center;';
        for (let i = 1; i <= 12; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i.toString().padStart(2, '0');
            if (i === currentHour) option.selected = true;
            hourSelect.appendChild(option);
        }
        
        // Minute selector
        const minuteSelect = document.createElement('select');
        minuteSelect.style.cssText = 'padding: 10px; font-size: 18px; border: 2px solid #ddd; border-radius: 5px; width: 80px; text-align: center;';
        for (let i = 0; i < 60; i += 5) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i.toString().padStart(2, '0');
            if (i === currentMinute || (currentMinute >= i && currentMinute < i + 5)) option.selected = true;
            minuteSelect.appendChild(option);
        }
        
        // AM/PM selector
        const periodSelect = document.createElement('select');
        periodSelect.style.cssText = 'padding: 10px; font-size: 18px; border: 2px solid #ddd; border-radius: 5px; width: 80px; text-align: center;';
        const amOption = document.createElement('option');
        amOption.value = 'AM';
        amOption.textContent = 'AM';
        if (currentPeriod === 'AM') amOption.selected = true;
        const pmOption = document.createElement('option');
        pmOption.value = 'PM';
        pmOption.textContent = 'PM';
        if (currentPeriod === 'PM') pmOption.selected = true;
        periodSelect.appendChild(amOption);
        periodSelect.appendChild(pmOption);
        
        // Buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = 'display: flex; gap: 10px; flex-direction: column;';
        
        const okBtn = document.createElement('button');
        okBtn.textContent = 'OK';
        okBtn.style.cssText = 'padding: 10px 20px; background: #10b981; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;';
        
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.style.cssText = 'padding: 10px 20px; background: #ef4444; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;';
        
        buttonContainer.appendChild(okBtn);
        buttonContainer.appendChild(cancelBtn);
        
        picker.appendChild(hourSelect);
        picker.appendChild(document.createTextNode(':'));
        picker.appendChild(minuteSelect);
        picker.appendChild(periodSelect);
        picker.appendChild(buttonContainer);
        
        overlay.appendChild(picker);
        document.body.appendChild(overlay);
        
        // Event handlers
        okBtn.addEventListener('click', () => {
            let hour = parseInt(hourSelect.value);
            const minute = parseInt(minuteSelect.value);
            const period = periodSelect.value;
            
            // Convert to 24-hour format
            if (period === 'PM' && hour !== 12) hour += 12;
            if (period === 'AM' && hour === 12) hour = 0;
            
            const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            document.body.removeChild(overlay);
            callback(timeString);
        });
        
        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(overlay);
        });
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
            }
        });
    }

    function scheduleReminder(todo) {
        try {
            // Clear existing timer
            if (reminderTimers.has(todo.id)) {
                clearTimeout(reminderTimers.get(todo.id));
                reminderTimers.delete(todo.id);
            }
            if (!todo.reminder_time || todo.completed) return;
            // Parse HH:MM (or take first 5 chars)
            const timeStr = (todo.reminder_time.includes(':') ? todo.reminder_time.slice(0,5) : '').trim();
            if (!/^\d{2}:\d{2}$/.test(timeStr)) return;
            const [hh, mm] = timeStr.split(':').map(Number);
            const now = new Date();
            const target = new Date();
            target.setHours(hh, mm, 0, 0);
            let delay = target.getTime() - now.getTime();
            if (delay < 0) return; // past times handled by polling/overdue UI
            const t = setTimeout(() => {
                showNotification(`It's time for "${todo.task}"! Assigned to: ${todo.assigned_to || 'N/A'}.`);
                reminderTimers.delete(todo.id);
            }, delay);
            reminderTimers.set(todo.id, t);
        } catch (_) {}
    }

    async function loadTasks() {
        try {
            // Try new endpoint first; fallback if needed
            let res = await fetch(`/api/todos/list/${petId}`);
            if (!res.ok) {
                res = await fetch(`/api/todos/${petId}`);
            }
            const data = await res.json();
            if (data.success) {
                taskList.innerHTML = '';
                
                // Sort tasks by reminder time (earliest first)
                const sortedTodos = data.todos.sort((a, b) => {
                    // Handle tasks without reminder times (put them at the end)
                    if (!a.reminder_time && !b.reminder_time) return 0;
                    if (!a.reminder_time) return 1;
                    if (!b.reminder_time) return -1;
                    
                    // Compare reminder times
                    const timeA = new Date(`2000-01-01T${a.reminder_time}`);
                    const timeB = new Date(`2000-01-01T${b.reminder_time}`);
                    return timeA - timeB;
                });
                
                sortedTodos.forEach(todo => {
                    addTaskToDOM(todo);
                    scheduleReminder(todo);
                });
            } else {
                taskList.innerHTML = '<li>Failed to load tasks</li>';
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
            taskList.innerHTML = '<li>Failed to load tasks</li>';
        }
    }

    function addTaskToDOM(todo) {
        const newTask = document.createElement('li');
        newTask.classList.add('task-item');
        if (todo.completed) {
            newTask.classList.add('completed');
        }
        
        // Check if task is overdue (past reminder time but not completed)
        let isOverdue = false;
        if (todo.reminder_time && !todo.completed) {
            const now = new Date();
            const currentTime = now.getHours() * 60 + now.getMinutes();
            const [hours, minutes] = todo.reminder_time.split(':').map(Number);
            const reminderTime = hours * 60 + minutes;
            
            if (currentTime > reminderTime) {
                isOverdue = true;
                newTask.classList.add('overdue');
            }
        }


        // Format reminder time
        let reminderText = '';
        if (todo.reminder_time) {
            // Handle both time strings (HH:MM) and full datetime strings
            if (todo.reminder_time.includes('T') || todo.reminder_time.includes(' ')) {
                // Full datetime string
                const reminderDate = new Date(todo.reminder_time);
                if (!isNaN(reminderDate.getTime())) {
                    reminderText = `⏰ ${reminderDate.toLocaleString()}`;
                }
            } else {
                // Time string (HH:MM format)
                reminderText = `⏰ ${todo.reminder_time}`;
            }
        }

        // Format repetition info
        let repetitionText = '';
        if (todo.repeat_type && todo.repeat_type !== 'none') {
            if (todo.repeat_type === 'daily') {
                repetitionText = ' (Repeats Daily)';
            } else if (todo.repeat_type === 'weekly') {
                repetitionText = ' (Repeats Weekly)';
            } else if (todo.repeat_type === 'custom') {
                repetitionText = ` (Repeats Every ${todo.repeat_interval} ${todo.repeat_days})`;
            }
        }

        newTask.innerHTML = `
            <div class="task-content">
                <div class="task-header">
                    <div class="task-title" data-id="${todo.id}" contenteditable="false">${todo.task}${repetitionText}</div>
                    ${reminderText ? `<div class="task-reminder" data-id="${todo.id}" contenteditable="false">${reminderText}</div>` : ''}
                    ${isOverdue ? '<div class="pending-indicator">PENDING</div>' : ''}
                </div>
                ${todo.description ? `<div class="task-description" data-id="${todo.id}" contenteditable="false">${todo.description}</div>` : ''}
                ${todo.assigned_to ? `<div class="task-assigned" data-id="${todo.id}" contenteditable="false">Assigned to: ${todo.assigned_to}</div>` : ''}
            </div>
            <div class="task-buttons">
                <button class="complete-btn" data-id="${todo.id}" ${todo.completed ? 'style="display:none;"' : ''}>✓</button>
                <button class="undo-btn" data-id="${todo.id}" ${!todo.completed ? 'style="display:none;"' : ''}>↶</button>
                <button class="delete-btn" data-id="${todo.id}">🗑️</button>
            </div>
        `;

        taskList.appendChild(newTask);

        // Add event listeners
        newTask.querySelector('.complete-btn').addEventListener('click', () => toggleTaskCompletion(todo.id, true));
        newTask.querySelector('.undo-btn').addEventListener('click', () => toggleTaskCompletion(todo.id, false));
        newTask.querySelector('.delete-btn').addEventListener('click', () => deleteTask(todo.id));
        
        // Add inline editing functionality
        const taskTitle = newTask.querySelector('.task-title');
        const taskDescription = newTask.querySelector('.task-description');
        const taskAssigned = newTask.querySelector('.task-assigned');
        const taskReminder = newTask.querySelector('.task-reminder');
        
        // Make task title editable on click
        if (taskTitle) {
            taskTitle.style.cursor = 'pointer';
            taskTitle.addEventListener('click', function(e) {
                e.stopPropagation();
                // Only allow editing if click is directly on text content
                if (e.target === this && this.textContent.trim().length > 0) {
                    if (this.contentEditable !== 'true') {
                        this.contentEditable = 'true';
                        this.focus();
                        // Select all text for easy editing
                        const range = document.createRange();
                        range.selectNodeContents(this);
                        const selection = window.getSelection();
                        selection.removeAllRanges();
                        selection.addRange(range);
                    }
                }
            });
            
            // Save changes when user presses Enter or clicks away
            taskTitle.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.contentEditable = 'false';
                    updateTask(todo.id, this.textContent.trim(), null);
                }
            });
            
            taskTitle.addEventListener('blur', function() {
                this.contentEditable = 'false';
                updateTask(todo.id, this.textContent.trim(), null);
            });
        }
        
        // Make description editable if it exists
        if (taskDescription) {
            taskDescription.style.cursor = 'pointer';
            taskDescription.addEventListener('click', function(e) {
                e.stopPropagation();
                // Only allow editing if click is directly on text content
                if (e.target === this && this.textContent.trim().length > 0) {
                    if (this.contentEditable !== 'true') {
                        this.contentEditable = 'true';
                        this.focus();
                        const range = document.createRange();
                        range.selectNodeContents(this);
                        const selection = window.getSelection();
                        selection.removeAllRanges();
                        selection.addRange(range);
                    }
                }
            });
            
            taskDescription.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.contentEditable = 'false';
                    updateTask(todo.id, null, this.textContent.trim());
                }
            });
            
            taskDescription.addEventListener('blur', function() {
                this.contentEditable = 'false';
                updateTask(todo.id, null, this.textContent.trim());
            });
        }
        
        // Make assigned field editable if it exists
        if (taskAssigned) {
            taskAssigned.style.cursor = 'pointer';
            taskAssigned.addEventListener('click', function(e) {
                e.stopPropagation();
                // Only allow editing if click is directly on text content
                if (e.target === this && this.textContent.trim().length > 0) {
                    if (this.contentEditable !== 'true') {
                        this.contentEditable = 'true';
                        this.focus();
                        const range = document.createRange();
                        range.selectNodeContents(this);
                        const selection = window.getSelection();
                        selection.removeAllRanges();
                        selection.addRange(range);
                    }
                }
            });
            
            taskAssigned.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.contentEditable = 'false';
                    const assignedText = this.textContent.replace('Assigned to: ', '').trim();
                    updateTask(todo.id, null, null, assignedText);
                }
            });
            
            taskAssigned.addEventListener('blur', function() {
                this.contentEditable = 'false';
                const assignedText = this.textContent.replace('Assigned to: ', '').trim();
                updateTask(todo.id, null, null, assignedText);
            });
        }
        
        // Make reminder field editable with time picker if it exists
        if (taskReminder) {
            taskReminder.style.cursor = 'pointer';
            taskReminder.addEventListener('click', function(e) {
                e.stopPropagation();
                if (e.target === this && this.textContent.trim().length > 0) {
                    // Extract current time from text
                    const currentTime = this.textContent.replace('⏰ ', '').trim();
                    showTimePicker(currentTime, (selectedTime) => {
                        const reminderText = selectedTime;
                        console.log('Updating reminder time to:', reminderText);
                        updateTask(todo.id, null, null, null, reminderText);
                        // Reschedule local notification
                        scheduleReminder({ ...todo, reminder_time: reminderText, completed: false });
                        // Immediately remove pending state if new time is in the future
                        const now = new Date();
                        const nowMins = now.getHours() * 60 + now.getMinutes();
                        const [hh, mm] = reminderText.split(':').map(Number);
                        const newMins = (hh || 0) * 60 + (mm || 0);
                        if (newMins > nowMins) {
                            newTask.classList.remove('overdue');
                            const pending = newTask.querySelector('.pending-indicator');
                            if (pending) pending.remove();
                        }
                        // Reload tasks to update display
                        loadTasks();
                    });
                }
            });
        }
    }

    async function updateTask(todoId, task, description, assigned_to, reminder_time) {
        try {
            const updateData = {};
            if (task !== null && task !== undefined) updateData.task = task;
            if (description !== null && description !== undefined) updateData.description = description;
            if (assigned_to !== null && assigned_to !== undefined) updateData.assigned_to = assigned_to;
            if (reminder_time !== null && reminder_time !== undefined) updateData.reminder_time = reminder_time;
            
            console.log('Updating task:', todoId, updateData); // Debug log
            
            const response = await fetch(`/api/todos/${todoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });
            const data = await response.json();
            console.log('Update response:', data); // Debug log
            
            if (!data.success) {
                alert('Failed to update task: ' + (data.message || 'Unknown error'));
                // Reload to revert changes
                await loadTasks();
            } else {
                console.log('Update successful!');
                // Show a brief success indicator
                const successMsg = document.createElement('div');
                successMsg.textContent = '✓ Updated successfully';
                successMsg.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 8px 16px; border-radius: 4px; z-index: 1000;';
                document.body.appendChild(successMsg);
                setTimeout(() => successMsg.remove(), 2000);
            }
        } catch (error) {
            console.error('Error updating task:', error);
            alert('Failed to update task: Server error.');
            // Reload to revert changes
            await loadTasks();
        }
    }

    async function toggleTaskCompletion(todoId, completed) {
        try {
            const response = await fetch(`/api/todos/${todoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completed })
            });
            const data = await response.json();
            if (data.success) {
                await loadTasks();
            } else {
                alert('Failed to update task status.');
            }
        } catch (error) {
            console.error('Error updating task status:', error);
        }
    }

    async function deleteTask(todoId) {
        if (!confirm('Are you sure you want to delete this task?')) {
            return;
        }
    try {
        const res = await fetch(`/api/todos/${todoId}`, { method: 'DELETE' });
        const result = await res.json();
        if (result.success) {
                await loadTasks();
        } else {
            alert('Failed to delete task');
        }
    } catch (err) {
        console.error('Error deleting task:', err);
    }
    }

    async function checkReminders() {
        try {
            console.log('Checking reminders for petId:', petId);
            const res = await fetch(`/api/todos/reminders/${petId}`);
            const data = await res.json();
            console.log('Reminder check response:', data);
            if (data.success && data.todos.length > 0) {
                console.log('Found overdue tasks:', data.todos);
                data.todos.forEach(todo => {
                    showNotification(`It's time for "${todo.task}"! Assigned to: ${todo.assigned_to || 'N/A'}.`);
                });
            } else {
                console.log('No overdue tasks found');
            }
        } catch (error) {
            console.error('Error checking reminders:', error);
        }
    }

    function showNotification(message) {
        notificationText.textContent = message;
        notificationModal.style.display = 'flex';
    }

    notificationOk.addEventListener('click', () => {
        notificationModal.style.display = 'none';
    });
});