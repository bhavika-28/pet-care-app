async function loadAppointments() {
  const petId = localStorage.getItem('selectedPetId');
  const caregiverId = localStorage.getItem('userId'); // Assuming caregiver is logged in
  const heading = document.getElementById('heading');
  heading.textContent = `${localStorage.getItem('selectedPetName')}'s Appointments`;

  const response = await fetch(`/api/cg/appointments?petId=${petId}`);
  const data = await response.json();

  const container = document.getElementById('appointments-container');
  container.innerHTML = '';

  if (data.success && data.appointments.length > 0) {
    data.appointments.forEach(app => {
      const div = document.createElement('div');
      div.classList.add('appointment');
      div.innerHTML = `
        <p><strong>Date:</strong> ${app.datetime}</p>
        <p><strong>Type:</strong> ${app.type}</p>
        <p><strong>Details:</strong> ${app.details}</p>
        <p><strong>Taken By:</strong> ${app.caregiverId ? 'Caregiver Assigned' : 'Not marked yet'}</p>
        ${!app.caregiverId ? `<button onclick="markAsTaken(${app.appointment_id})">Mark as Taken</button>` : ''}
        <hr />
      `;
      container.appendChild(div);
    });
  } else {
    container.textContent = 'No upcoming appointments.';
    container.style.fontSize = "25px";
  }
}

async function markAsTaken(appointmentId) {
  const caregiverId = localStorage.getItem('userId');
  const response = await fetch(`/api/cg/appointments/${appointmentId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ caregiverId }),
  });

  const data = await response.json();
  if (data.success) {
    alert('Marked as taken!');
    loadAppointments(); // refresh
  } else {
    alert('Error: ' + data.message);
  }
}

window.addEventListener('DOMContentLoaded', loadAppointments);
