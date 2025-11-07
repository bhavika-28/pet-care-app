// public/cgHealthRecords.js
document.addEventListener('DOMContentLoaded', () => {
  const petId = localStorage.getItem('selectedPetId');
  const recordsList = document.getElementById('records-list');

  if (!petId) {
    recordsList.innerHTML = "<p>No pet selected.</p>";
    return;
  }

  fetch(`/api/cg/health-records/${petId}`)
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        if (data.records.length === 0) {
          recordsList.innerHTML = "<p>No health records available.</p>";
        } else {
          data.records.forEach(record => {
            const div = document.createElement('div');
            div.className = 'record-item';
            div.innerHTML = `
              <h3>${record.type}: ${record.name}</h3>
              <p><strong>Date:</strong> ${new Date(record.date).toLocaleDateString()}</p>
              <p><strong>Vet/Clinic:</strong> ${record.vet_clinic || 'N/A'}</p>
              <p>${record.notes || ''}</p>
            `;
            recordsList.appendChild(div);
          });
        }
      } else {
        recordsList.innerHTML = `<p>Error: ${data.message}</p>`;
      }
    })
    .catch(err => {
      console.error('Error fetching records:', err);
      recordsList.innerHTML = "<p>Failed to load records.</p>";
    });
});
