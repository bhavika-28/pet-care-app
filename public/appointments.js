document.addEventListener("DOMContentLoaded", function () {
    console.log("Appointments script loaded"); // Debugging line
    
    // DOM elements
    const typeSelect = document.getElementById('appointment-type');
    const detailsInput = document.getElementById('appointment-details');
    const dateInput = document.getElementById('appointment-date');
    const addBtn = document.getElementById('add-appointment-btn');
    const appointmentsList = document.getElementById('appointments-list');
    
    // Debugging: Check if elements exist
    if (!typeSelect || !detailsInput || !dateInput || !addBtn || !appointmentsList) {
        console.error("One or more elements not found!");
        return;
    }
    
    // Store notification timers for appointments
    const appointmentTimers = new Map(); // appointmentId -> { oneHourBefore: timer, atTime: timer }
    
    // Load appointments when page loads
    loadAppointments();
    
    // Add new appointment
    addBtn.addEventListener('click', function (e) {
        e.preventDefault(); // Prevent form submission if in a form
        addAppointment();
    });
    
    // Function to add appointment
    async function addAppointment() {
        const type = typeSelect.value;
        const details = detailsInput.value.trim();
        const dateTime = dateInput.value;
    
        console.log("Adding appointment:", { type, details, dateTime }); // Debugging
    
        if (!type || !details || !dateTime) {
            alert('Please fill out all fields');
            return;
        }
    
        // Helper to get value from sessionStorage first, then localStorage
        const getValue = (key) => {
            const sessionVal = sessionStorage.getItem(key);
            return sessionVal !== null ? sessionVal : localStorage.getItem(key);
        };
        
        // 🔸 Get petId from storage
        const petId = getValue('selectedPetId');
        if (!petId) {
            alert('No pet selected. Please select a pet first.');
            return;
        }
    
        const appointment = {
            petId: parseInt(petId),
            type,
            details,
            datetime: dateTime,
        };
    
        try {
            const response = await fetch('/api/appointments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(appointment),
            });
    
            const data = await response.json();
            if (data.success) {
                // Schedule notifications for the new appointment
                if (data.appointmentId && dateTime) {
                    scheduleAppointmentNotifications(data.appointmentId, type, details, dateTime);
                }
                loadAppointments();
                clearInputs();
            } else {
                alert('Error adding appointment');
            }
        } catch (err) {
            console.error('Error adding appointment:', err);
        }
    }
    
    // Helper to get value from sessionStorage first, then localStorage
    const getValue = (key) => {
        const sessionVal = sessionStorage.getItem(key);
        return sessionVal !== null ? sessionVal : localStorage.getItem(key);
    };
    
    // Load appointments from the backend
    async function loadAppointments() {
        const petId = getValue('selectedPetId');
        if (!petId) {
            appointmentsList.innerHTML = '<li class="no-appointments">No pet selected</li>';
            return;
        }
    
        try {
            const res = await fetch(`/api/appointments/${petId}`);
            const data = await res.json();
            if (data.success) {
                renderAppointments(data.appointments);
            } else {
                appointmentsList.innerHTML = '<li class="no-appointments">Failed to load appointments</li>';
            }
        } catch (err) {
            console.error('Error loading appointments:', err);
        }
    }
    

        // Render appointments to the DOM
        function renderAppointments(appts) {
            // Store in global variable for date picker access
            appointments = appts;
            appointments.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
            
            // Clear all existing timers first to avoid duplicates
            const appointmentIds = Array.from(appointmentTimers.keys());
            appointmentIds.forEach(appointmentId => {
                clearAppointmentNotifications(appointmentId);
            });
            
            // Schedule notifications for all non-completed appointments
            appointments.forEach(appointment => {
                if (!appointment.completed && appointment.datetime) {
                    scheduleAppointmentNotifications(
                        appointment.appointment_id,
                        appointment.type,
                        appointment.details,
                        appointment.datetime
                    );
                }
            });
            
            appointmentsList.innerHTML = '';
            
            if (appointments.length === 0) {
                appointmentsList.innerHTML = '<li class="no-appointments">No upcoming appointments</li>';
                return;
            }
            
            appointments.forEach(appointment => {
                const li = document.createElement('li');
                li.dataset.id = appointment.appointment_id;
                
                // Add type-based class for styling
                const typeClass = appointment.type.toLowerCase().replace(' ', '-');
                li.classList.add(typeClass);
                
                // Add completed class if marked as done
                if (appointment.completed) {
                    li.classList.add('completed');
                }
                
                // Validate date before formatting
                let date = new Date(appointment.datetime);
                if (isNaN(date.getTime())) {
                    // If invalid date, set to today
                    date = new Date();
                }
                const formattedDate = date.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                });
                
                li.innerHTML = `
                    <div class="appointment-info">
                        <span class="appointment-type" contenteditable="false" data-id="${appointment.appointment_id}">${appointment.type}</span>
                        <span class="appointment-details" contenteditable="false" data-id="${appointment.appointment_id}">${appointment.details}</span>
                        <span class="appointment-date" contenteditable="false" data-id="${appointment.appointment_id}">${formattedDate}</span>
                    </div>
                    <div class="appointment-actions">
                        <button class="appointment-complete-btn ${appointment.completed ? 'completed' : ''}" data-id="${appointment.appointment_id}">
                            ${appointment.completed ? '✓' : '✓'}
                        </button>
                        <button class="delete-btn" data-id="${appointment.appointment_id}">×</button>
                    </div>
                `;
                
                appointmentsList.appendChild(li);
            });
            
            // Add event listeners to delete buttons
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', function () {
                    deleteAppointment(parseInt(this.dataset.id));
                });
            });
            
            // Add event listeners to complete buttons
            document.querySelectorAll('.appointment-complete-btn').forEach(btn => {
                btn.addEventListener('click', function () {
                    toggleAppointmentCompletion(parseInt(this.dataset.id));
                });
            });
            
            // Add inline editing functionality
            addInlineEditing();
        }

    // Delete appointment from the backend
    async function deleteAppointment(id) {
        try {
            // Clear notifications for this appointment
            clearAppointmentNotifications(id);
            
            const res = await fetch(`/api/appointments/${id}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (data.success) {
                loadAppointments(); // Reload appointments
            } else {
                alert('Error deleting appointment');
            }
        } catch (err) {
            console.error('Error deleting appointment:', err);
        }
    }

    // Clear the input fields
    function clearInputs() {
        typeSelect.value = '';
        detailsInput.value = '';
        dateInput.value = '';
    }
    
    // Toggle appointment completion
    async function toggleAppointmentCompletion(id) {
        try {
            const res = await fetch(`/api/appointments/${id}/toggle`, {
                method: 'PUT',
            });
            const data = await res.json();
            if (data.success) {
                // loadAppointments() will handle scheduling/clearing notifications based on completion status
                loadAppointments(); // Reload to show updated state
            } else {
                alert('Error updating appointment');
            }
        } catch (err) {
            console.error('Error toggling appointment:', err);
        }
    }
    
    // Add inline editing functionality
    function addInlineEditing() {
        // Type and details remain editable text
        const typeElements = document.querySelectorAll('.appointment-type');
        const detailsElements = document.querySelectorAll('.appointment-details');
        
        typeElements.forEach(element => {
            element.style.cursor = 'pointer';
            element.addEventListener('click', function(e) {
                e.stopPropagation();
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
            
            element.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.contentEditable = 'false';
                    updateAppointment(this.dataset.id, 'type', this.textContent.trim());
                }
            });
            
            element.addEventListener('blur', function() {
                this.contentEditable = 'false';
                updateAppointment(this.dataset.id, 'type', this.textContent.trim());
            });
        });
        
        detailsElements.forEach(element => {
            element.style.cursor = 'pointer';
            element.addEventListener('click', function(e) {
                e.stopPropagation();
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
            
            element.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.contentEditable = 'false';
                    updateAppointment(this.dataset.id, 'details', this.textContent.trim());
                }
            });
            
            element.addEventListener('blur', function() {
                this.contentEditable = 'false';
                updateAppointment(this.dataset.id, 'details', this.textContent.trim());
            });
        });
        
        // Date uses calendar picker and time uses time picker
        const dateElements = document.querySelectorAll('.appointment-date');
        dateElements.forEach(element => {
            element.style.cursor = 'pointer';
            element.addEventListener('click', function(e) {
                e.stopPropagation();
                if (e.target === this && this.textContent.trim().length > 0) {
                    // Get the current appointment datetime from the list item
                    const appointmentId = this.dataset.id;
                    const appointmentItem = appointments.find(a => a.appointment_id == appointmentId);
                    if (appointmentItem) {
                        let currentDate = new Date(appointmentItem.datetime);
                        // Check if date is valid, if not use today's date
                        if (isNaN(currentDate.getTime())) {
                            currentDate = new Date();
                        }
                        showDateTimePicker(currentDate, (selectedDateTime) => {
                            updateAppointment(appointmentId, 'datetime', selectedDateTime);
                        });
                    } else {
                        // If appointment not found, use today's date
                        showDateTimePicker(new Date(), (selectedDateTime) => {
                            updateAppointment(appointmentId, 'datetime', selectedDateTime);
                        });
                    }
                }
            });
        });
    }
    
    // Store appointments array for date picker access
    let appointments = [];
    
    // Date and time picker function
    function showDateTimePicker(currentDate, callback) {
        // Validate and default to today if invalid
        let date = currentDate;
        if (!date || isNaN(new Date(date).getTime())) {
            date = new Date();
        }
        date = new Date(date);
        if (isNaN(date.getTime())) {
            date = new Date();
        }
        
        // Ensure we're using a valid, current date (not old dates like 2001)
        const now = new Date();
        let selectedYear = date.getFullYear();
        let selectedMonth = date.getMonth();
        let selectedDay = date.getDate();
        let selectedHour = date.getHours();
        let selectedMinute = date.getMinutes();
        
        // If year is too far in past or future, use current year
        if (selectedYear < 2020 || selectedYear > 2100) {
            selectedYear = now.getFullYear();
            selectedMonth = now.getMonth();
            selectedDay = now.getDate();
        }
        
        // Parse to 12-hour format
        let displayHour = selectedHour;
        let period = 'AM';
        if (displayHour >= 12) {
            period = 'PM';
            if (displayHour > 12) displayHour -= 12;
        }
        if (displayHour === 0) displayHour = 12;
        
        // Light baby colors - very faded for professional look
        const babyPink = '#ffeef5'; // Very light pink
        const babyBlue = '#e6f3ff'; // Very light blue
        const babyGreen = '#f0f9f4'; // Very light green
        const babyYellow = '#fffbf0'; // Very light yellow
        
        // Cycle through colors for calendar days
        const dayColors = [babyPink, babyBlue, babyGreen, babyYellow];
        
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); z-index: 10000; display: flex; align-items: center; justify-content: center;';
        
        // Create picker container with gradient background
        const picker = document.createElement('div');
        picker.style.cssText = `background: linear-gradient(135deg, ${babyPink} 0%, ${babyBlue} 100%); padding: 25px; border-radius: 15px; box-shadow: 0 8px 32px rgba(0,0,0,0.15); max-width: 420px; width: 90%; border: 1px solid rgba(255,255,255,0.5);`;
        
        // Calendar section
        const calendarSection = document.createElement('div');
        calendarSection.style.cssText = 'margin-bottom: 20px;';
        
        const calendarTitle = document.createElement('div');
        calendarTitle.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;';
        
        const monthYear = document.createElement('div');
        monthYear.style.cssText = 'font-size: 20px; font-weight: 600; color: #2d3748; text-align: center;';
        monthYear.textContent = new Date(selectedYear, selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        const prevMonthBtn = document.createElement('button');
        prevMonthBtn.textContent = '←';
        prevMonthBtn.style.cssText = `padding: 8px 12px; border: 1px solid rgba(255,255,255,0.8); background: ${babyBlue}; cursor: pointer; border-radius: 8px; color: #2d3748; font-weight: bold; transition: all 0.2s;`;
        prevMonthBtn.addEventListener('mouseenter', () => {
            prevMonthBtn.style.background = babyGreen;
            prevMonthBtn.style.transform = 'scale(1.05)';
        });
        prevMonthBtn.addEventListener('mouseleave', () => {
            prevMonthBtn.style.background = babyBlue;
            prevMonthBtn.style.transform = 'scale(1)';
        });
        
        const nextMonthBtn = document.createElement('button');
        nextMonthBtn.textContent = '→';
        nextMonthBtn.style.cssText = `padding: 8px 12px; border: 1px solid rgba(255,255,255,0.8); background: ${babyBlue}; cursor: pointer; border-radius: 8px; color: #2d3748; font-weight: bold; transition: all 0.2s;`;
        nextMonthBtn.addEventListener('mouseenter', () => {
            nextMonthBtn.style.background = babyGreen;
            nextMonthBtn.style.transform = 'scale(1.05)';
        });
        nextMonthBtn.addEventListener('mouseleave', () => {
            nextMonthBtn.style.background = babyBlue;
            nextMonthBtn.style.transform = 'scale(1)';
        });
        
        calendarTitle.appendChild(prevMonthBtn);
        calendarTitle.appendChild(monthYear);
        calendarTitle.appendChild(nextMonthBtn);
        
        const calendarGrid = document.createElement('div');
        calendarGrid.style.cssText = `display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; margin-top: 10px; padding: 10px; background: ${babyBlue}; border-radius: 10px;`;
        
        // Day headers - all pink
        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayHeaders.forEach((day) => {
            const header = document.createElement('div');
            header.textContent = day;
            header.style.cssText = `text-align: center; font-weight: 600; padding: 8px 4px; color: #4a5568; font-size: 12px; background: ${babyPink}; border-radius: 6px;`;
            calendarGrid.appendChild(header);
        });
        
        function renderCalendar() {
            // Clear day cells
            const dayCells = calendarGrid.querySelectorAll('.day-cell');
            dayCells.forEach(cell => cell.remove());
            
            const firstDay = new Date(selectedYear, selectedMonth, 1).getDay();
            const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
            
            // Empty cells for days before month starts
            for (let i = 0; i < firstDay; i++) {
                const empty = document.createElement('div');
                calendarGrid.appendChild(empty);
            }
            
            // Day cells - all yellow
            for (let day = 1; day <= daysInMonth; day++) {
                const dayCell = document.createElement('div');
                dayCell.textContent = day;
                dayCell.classList.add('day-cell');
                
                const isSelected = day === selectedDay;
                
                dayCell.style.cssText = `text-align: center; padding: 10px 4px; cursor: pointer; border-radius: 8px; font-weight: 500; transition: all 0.2s; ${
                    isSelected 
                        ? `background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; box-shadow: 0 2px 8px rgba(72, 187, 120, 0.3); transform: scale(1.1);` 
                        : `background: ${babyYellow}; color: #2d3748; border: 1px solid rgba(255,255,255,0.5);`
                }`;
                
                dayCell.addEventListener('click', () => {
                    // Remove previous selection
                    calendarGrid.querySelectorAll('.day-cell').forEach((c) => {
                        const dayNum = parseInt(c.textContent);
                        if (!isNaN(dayNum)) {
                            c.style.background = babyYellow;
                            c.style.color = '#2d3748';
                            c.style.border = '1px solid rgba(255,255,255,0.5)';
                            c.style.boxShadow = 'none';
                            c.style.transform = 'scale(1)';
                        }
                    });
                    selectedDay = day;
                    dayCell.style.background = 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)';
                    dayCell.style.color = 'white';
                    dayCell.style.border = 'none';
                    dayCell.style.boxShadow = '0 2px 8px rgba(72, 187, 120, 0.3)';
                    dayCell.style.transform = 'scale(1.1)';
                });
                
                dayCell.addEventListener('mouseenter', function() {
                    if (!isSelected) {
                        this.style.transform = 'scale(1.05)';
                        this.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                    }
                });
                
                dayCell.addEventListener('mouseleave', function() {
                    if (!isSelected) {
                        this.style.transform = 'scale(1)';
                        this.style.boxShadow = 'none';
                    }
                });
                
                calendarGrid.appendChild(dayCell);
            }
            
            monthYear.textContent = new Date(selectedYear, selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        }
        
        prevMonthBtn.addEventListener('click', () => {
            selectedMonth--;
            if (selectedMonth < 0) {
                selectedMonth = 11;
                selectedYear--;
            }
            renderCalendar();
        });
        
        nextMonthBtn.addEventListener('click', () => {
            selectedMonth++;
            if (selectedMonth > 11) {
                selectedMonth = 0;
                selectedYear++;
            }
            renderCalendar();
        });
        
        renderCalendar();
        
        calendarSection.appendChild(calendarTitle);
        calendarSection.appendChild(calendarGrid);
        
        // Time picker section
        const timeSection = document.createElement('div');
        timeSection.style.cssText = `margin-top: 25px; padding: 20px; background: ${babyYellow}; border-radius: 12px; display: flex; gap: 10px; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.5);`;
        
        const hourSelect = document.createElement('select');
        hourSelect.style.cssText = `padding: 10px; font-size: 16px; border: 2px solid rgba(255,255,255,0.8); border-radius: 8px; width: 75px; text-align: center; background: white; color: #2d3748; font-weight: 500; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1);`;
        for (let i = 1; i <= 12; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i.toString().padStart(2, '0');
            if (i === displayHour) option.selected = true;
            hourSelect.appendChild(option);
        }
        
        const colon = document.createElement('span');
        colon.textContent = ':';
        colon.style.cssText = 'font-size: 20px; font-weight: bold; color: #2d3748;';
        
        const minuteSelect = document.createElement('select');
        minuteSelect.style.cssText = `padding: 10px; font-size: 16px; border: 2px solid rgba(255,255,255,0.8); border-radius: 8px; width: 75px; text-align: center; background: white; color: #2d3748; font-weight: 500; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1);`;
        for (let i = 0; i < 60; i += 5) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i.toString().padStart(2, '0');
            if (i === selectedMinute || (selectedMinute >= i && selectedMinute < i + 5)) option.selected = true;
            minuteSelect.appendChild(option);
        }
        
        const periodSelect = document.createElement('select');
        periodSelect.style.cssText = `padding: 10px; font-size: 16px; border: 2px solid rgba(255,255,255,0.8); border-radius: 8px; width: 75px; text-align: center; background: white; color: #2d3748; font-weight: 500; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1);`;
        const amOption = document.createElement('option');
        amOption.value = 'AM';
        amOption.textContent = 'AM';
        if (period === 'AM') amOption.selected = true;
        const pmOption = document.createElement('option');
        pmOption.value = 'PM';
        pmOption.textContent = 'PM';
        if (period === 'PM') pmOption.selected = true;
        periodSelect.appendChild(amOption);
        periodSelect.appendChild(pmOption);
        
        timeSection.appendChild(hourSelect);
        timeSection.appendChild(colon);
        timeSection.appendChild(minuteSelect);
        timeSection.appendChild(periodSelect);
        
        // Buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = 'display: flex; gap: 12px; justify-content: center; margin-top: 25px;';
        
        const okBtn = document.createElement('button');
        okBtn.textContent = 'OK';
        okBtn.style.cssText = `padding: 12px 30px; background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; border: none; border-radius: 10px; cursor: pointer; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(72, 187, 120, 0.3); transition: all 0.2s;`;
        okBtn.addEventListener('mouseenter', () => {
            okBtn.style.transform = 'translateY(-2px)';
            okBtn.style.boxShadow = '0 6px 16px rgba(72, 187, 120, 0.4)';
        });
        okBtn.addEventListener('mouseleave', () => {
            okBtn.style.transform = 'translateY(0)';
            okBtn.style.boxShadow = '0 4px 12px rgba(72, 187, 120, 0.3)';
        });
        
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.style.cssText = `padding: 12px 30px; background: linear-gradient(135deg, #fc8181 0%, #f56565 100%); color: white; border: none; border-radius: 10px; cursor: pointer; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(252, 129, 129, 0.3); transition: all 0.2s;`;
        cancelBtn.addEventListener('mouseenter', () => {
            cancelBtn.style.transform = 'translateY(-2px)';
            cancelBtn.style.boxShadow = '0 6px 16px rgba(252, 129, 129, 0.4)';
        });
        cancelBtn.addEventListener('mouseleave', () => {
            cancelBtn.style.transform = 'translateY(0)';
            cancelBtn.style.boxShadow = '0 4px 12px rgba(252, 129, 129, 0.3)';
        });
        
        buttonContainer.appendChild(okBtn);
        buttonContainer.appendChild(cancelBtn);
        
        picker.appendChild(calendarSection);
        picker.appendChild(timeSection);
        picker.appendChild(buttonContainer);
        
        overlay.appendChild(picker);
        document.body.appendChild(overlay);
        
        // Event handlers
        okBtn.addEventListener('click', () => {
            let hour = parseInt(hourSelect.value);
            const minute = parseInt(minuteSelect.value);
            const periodValue = periodSelect.value;
            
            // Convert to 24-hour format
            if (periodValue === 'PM' && hour !== 12) hour += 12;
            if (periodValue === 'AM' && hour === 12) hour = 0;
            
            const selectedDateTime = new Date(selectedYear, selectedMonth, selectedDay, hour, minute);
            const isoString = selectedDateTime.toISOString();
            document.body.removeChild(overlay);
            callback(isoString);
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
    
    // Update appointment in backend
    async function updateAppointment(id, field, value) {
        try {
            const res = await fetch(`/api/appointments/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [field]: value })
            });
            const data = await res.json();
            if (data.success) {
                // Show success message
                const successMsg = document.createElement('div');
                successMsg.textContent = '✓ Updated successfully';
                successMsg.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 8px 16px; border-radius: 4px; z-index: 1000;';
                document.body.appendChild(successMsg);
                setTimeout(() => successMsg.remove(), 2000);
                
                // Schedule notifications if datetime was updated
                if (field === 'datetime') {
                    // Clear old timers for this appointment
                    clearAppointmentNotifications(id);
                    
                    // Get appointment details for notification
                    const appointmentItem = appointments.find(a => a.appointment_id == id);
                    if (appointmentItem) {
                        scheduleAppointmentNotifications(id, appointmentItem.type, appointmentItem.details, value);
                    }
                }
                
                // Reload appointments to show updated date/time
                loadAppointments();
            } else {
                alert('Failed to update appointment: ' + (data.message || 'Unknown error'));
                loadAppointments(); // Reload to revert changes
            }
        } catch (error) {
            console.error('Error updating appointment:', error);
            alert('Failed to update appointment: Server error.');
            loadAppointments(); // Reload to revert changes
        }
    }
    
    // Schedule notifications for appointments (1 hour before and at appointment time)
    function scheduleAppointmentNotifications(appointmentId, type, details, datetime) {
        if (!datetime || !appointmentId) return;
        
        // Clear any existing timers for this appointment
        clearAppointmentNotifications(appointmentId);
        
        const appointmentDate = new Date(datetime);
        if (isNaN(appointmentDate.getTime())) {
            console.error(`Invalid datetime for appointment ${appointmentId}:`, datetime);
            return;
        }
        
        const now = new Date();
        const timers = {};
        
        // Schedule notification 1 hour before appointment
        const oneHourBefore = new Date(appointmentDate);
        oneHourBefore.setHours(oneHourBefore.getHours() - 1);
        
        if (oneHourBefore > now) {
            const delay1Hour = oneHourBefore.getTime() - now.getTime();
            console.log(`Scheduling 1-hour reminder for appointment ${appointmentId} at ${oneHourBefore.toLocaleString()}`);
            
            timers.oneHourBefore = setTimeout(() => {
                const formattedTime = appointmentDate.toLocaleString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                });
                showNotification(`Reminder: You have an appointment in 1 hour!\n${type}: ${details}\nTime: ${formattedTime}`);
                // Remove timer from map after it fires
                if (appointmentTimers.has(appointmentId)) {
                    const timers = appointmentTimers.get(appointmentId);
                    delete timers.oneHourBefore;
                    if (Object.keys(timers).length === 0) {
                        appointmentTimers.delete(appointmentId);
                    }
                }
            }, delay1Hour);
        }
        
        // Schedule notification at appointment time
        if (appointmentDate > now) {
            const delayAtTime = appointmentDate.getTime() - now.getTime();
            console.log(`Scheduling appointment-time reminder for appointment ${appointmentId} at ${appointmentDate.toLocaleString()}`);
            
            timers.atTime = setTimeout(() => {
                showNotification(`Appointment Time!\n${type}: ${details}\nTime to go!`);
                // Remove timer from map after it fires
                if (appointmentTimers.has(appointmentId)) {
                    const timers = appointmentTimers.get(appointmentId);
                    delete timers.atTime;
                    if (Object.keys(timers).length === 0) {
                        appointmentTimers.delete(appointmentId);
                    }
                }
            }, delayAtTime);
        }
        
        // Store timers if any were scheduled
        if (Object.keys(timers).length > 0) {
            appointmentTimers.set(appointmentId, timers);
        }
    }
    
    // Clear notifications for an appointment
    function clearAppointmentNotifications(appointmentId) {
        if (appointmentTimers.has(appointmentId)) {
            const timers = appointmentTimers.get(appointmentId);
            if (timers.oneHourBefore) {
                clearTimeout(timers.oneHourBefore);
            }
            if (timers.atTime) {
                clearTimeout(timers.atTime);
            }
            appointmentTimers.delete(appointmentId);
            console.log(`Cleared notifications for appointment ${appointmentId}`);
        }
    }
    
    // Show notification
    function showNotification(message) {
        if ('Notification' in window) {
            if (Notification.permission === 'granted') {
                new Notification('PetCare Appointment Reminder', {
                    body: message,
                    icon: 'logo.png'
                });
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        new Notification('PetCare Appointment Reminder', {
                            body: message,
                            icon: 'logo.png'
                        });
                    }
                });
            }
        }
        
        // Fallback: show browser alert
        alert(message);
    }
    
    // Request notification permission on page load
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
});
