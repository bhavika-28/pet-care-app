// dashboard.js - Updated with Health Records
document.addEventListener("DOMContentLoaded", function() {
    // Helper to get value from sessionStorage first, then localStorage
    const getValue = (key) => {
        const sessionVal = sessionStorage.getItem(key);
        return sessionVal !== null ? sessionVal : localStorage.getItem(key);
    };
    
    // Load selected pet
    const selectedPetStr = getValue("selectedPet");
    const selectedPet = selectedPetStr ? JSON.parse(selectedPetStr) : null;
    const dashboardTitle = document.getElementById("dashboard-title");
    
    if (selectedPet && selectedPet.name) {
        dashboardTitle.textContent = `${selectedPet.name}'s Dashboard`;
    } else {
        dashboardTitle.textContent = "Dashboard";
    }
    
    // Load all dashboard components
    loadUpcomingTasks();
    loadRecentAppointments();
    loadHealthRecordsSummary();
    loadPetProfileSummary();
    loadGroupMembers();
    
});

function loadUpcomingTasks() {
    const tasks = JSON.parse(localStorage.getItem("petcare-tasks")) || [];
    const upcomingTasksList = document.getElementById("upcoming-tasks");
    
    upcomingTasksList.innerHTML = tasks.slice(0, 3).map(task => 
        `<li>${task.text}</li>`
    ).join("") || "<li>No upcoming tasks</li>";
}

function loadRecentAppointments() {
    const appointments = JSON.parse(localStorage.getItem("petcare-appointments")) || [];
    const recentAppointmentsList = document.getElementById("recent-appointments");
    
    // Sort by date (newest first)
    appointments.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
    
    recentAppointmentsList.innerHTML = appointments.slice(0, 3).map(appointment => {
        const date = new Date(appointment.dateTime);
        const formattedDate = date.toLocaleDateString();
        return `<li>${appointment.type} - ${formattedDate}</li>`;
    }).join("") || "<li>No recent appointments</li>";
}

function loadHealthRecordsSummary() {
    const records = JSON.parse(localStorage.getItem("petcare-health-records")) || [];
    const healthSummary = document.getElementById("health-records-summary");
    
    // Sort by date (newest first)
    records.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Get last vaccination
    const lastVaccination = records.find(r => r.type === "Vaccination");
    // Get last medication
    const lastMedication = records.find(r => r.type === "Medication");
    // Get last vet visit
    const lastVetVisit = records.find(r => r.type === "Vet Visit");
    
    healthSummary.innerHTML = `
        ${lastVaccination ? `<p><strong>Last Vaccination:</strong> ${lastVaccination.name} (${new Date(lastVaccination.date).toLocaleDateString()})</p>` : ''}
        ${lastMedication ? `<p><strong>Current Medication:</strong> ${lastMedication.name}` : ''}
        ${lastVetVisit ? `<p><strong>Last Vet Visit:</strong> ${new Date(lastVetVisit.date).toLocaleDateString()}` : ''}
        ${records.length === 0 ? '<p>No health records yet</p>' : ''}
    `;
}

function loadPetProfileSummary() {
    const selectedPet = JSON.parse(localStorage.getItem("selectedPet")) || {};
    const petSummary = document.getElementById("pet-profile-summary");
    
    petSummary.innerHTML = `
        ${selectedPet.name ? `<p><strong>Name:</strong> ${selectedPet.name}</p>` : ''}
        ${selectedPet.type ? `<p><strong>Type:</strong> ${selectedPet.type}</p>` : ''}
        ${selectedPet.age ? `<p><strong>Age:</strong> ${selectedPet.age}</p>` : ''}
        ${!selectedPet.name ? `<p>No pet selected</p>` : ''}
    `;
}


 
// Function to navigate to different sections
function navigateTo(page) {
    window.location.href = page;
}



