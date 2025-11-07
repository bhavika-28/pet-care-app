document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById('health-record-form');
    const recordsList = document.getElementById('records-list');
    const filterType = document.getElementById('filter-type');
    const searchInput = document.getElementById('search-records');
    const vaccineTableContainer = document.getElementById('vaccine-table-container');
    const pdfPreviewBtn = document.getElementById('pdf-preview-btn');
    const pdfDownloadBtn = document.getElementById('pdf-download-btn');
    const pdfPreviewModal = document.getElementById('pdf-preview-modal');
    const pdfCloseBtn = document.querySelector('.pdf-close-btn');

    // Helper to get value from sessionStorage first, then localStorage
    const getValue = (key) => {
        const sessionVal = sessionStorage.getItem(key);
        return sessionVal !== null ? sessionVal : localStorage.getItem(key);
    };
    
    const petId = getValue('selectedPetId');

    if (!petId) {
        alert('Pet not selected. Please go back and select a pet.');
        return;
    }

    // Load pet info for PDF
    let petInfo = null;
    loadPetInfo();
    loadRecords();
    loadVaccineSchedule();
    
    // PDF functionality
    if (pdfPreviewBtn) {
        pdfPreviewBtn.addEventListener('click', () => {
            showPDFPreview();
        });
    }
    
    if (pdfDownloadBtn) {
        pdfDownloadBtn.addEventListener('click', () => {
            downloadPDF();
        });
    }
    
    if (pdfCloseBtn) {
        pdfCloseBtn.addEventListener('click', () => {
            pdfPreviewModal.style.display = 'none';
        });
    }
    
    // Close inline PDF preview
    const pdfCloseInlineBtn = document.getElementById('pdf-close-inline-btn');
    if (pdfCloseInlineBtn) {
        pdfCloseInlineBtn.addEventListener('click', () => {
            const pdfPreviewSection = document.getElementById('pdf-preview-section');
            if (pdfPreviewSection) {
                pdfPreviewSection.style.display = 'none';
            }
        });
    }
    
    async function loadPetInfo() {
        try {
            const res = await fetch(`/api/pets/${petId}`);
            const data = await res.json();
            if (data.success && data.pet) {
                petInfo = data.pet;
                console.log('Pet info loaded:', petInfo); // Debug
            } else {
                console.error('Failed to load pet info:', data);
            }
        } catch (err) {
            console.error('Error loading pet info:', err);
        }
    }

    // File upload handling
    const fileInput = document.getElementById('record-file');
    const fileNameDisplay = document.getElementById('file-name-display');
    const fileUploadLabel = document.querySelector('.file-upload-label');

    fileUploadLabel.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            fileNameDisplay.textContent = `Selected: ${file.name}`;
            fileNameDisplay.style.display = 'block';
            
            // Check file size (10MB limit)
            if (file.size > 10 * 1024 * 1024) {
                alert('File size must be less than 10MB');
                fileInput.value = '';
                fileNameDisplay.style.display = 'none';
                return;
            }
        } else {
            fileNameDisplay.style.display = 'none';
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const recordType = document.getElementById('record-type').value;
        const recordName = document.getElementById('record-name').value.trim();
        const recordDate = document.getElementById('record-date').value;

        if (!recordType || !recordName || !recordDate) {
            alert('Please fill in required fields (Type, Name, and Date).');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('petId', petId);
            formData.append('type', recordType);
            formData.append('name', recordName);
            formData.append('notes', document.getElementById('record-notes').value.trim());
            formData.append('date', recordDate);
            formData.append('vet_clinic', document.getElementById('record-vet').value.trim());
            
            if (fileInput.files[0]) {
                formData.append('file', fileInput.files[0]);
            }

            const res = await fetch('/api/health-records', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();
            if (data.success) {
                form.reset();
                fileNameDisplay.style.display = 'none';
                
                // Reset filters to show the new record
                filterType.value = 'all';
                searchInput.value = '';
                
                // Show success message
                const successMsg = document.createElement('div');
                successMsg.textContent = '✓ Health record added successfully!';
                successMsg.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 12px 20px; border-radius: 8px; z-index: 1000; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);';
                document.body.appendChild(successMsg);
                setTimeout(() => successMsg.remove(), 3000);
                
                // Reload records after a short delay to ensure database is updated
                setTimeout(() => {
                    loadRecords();
                }, 500);
            } else {
                alert('Failed to add health record: ' + (data.message || 'Unknown error'));
            }
        } catch (err) {
            console.error('Error adding record:', err);
            alert('Failed to add health record: ' + err.message);
        }
    });

    async function loadRecords() {
        try {
            const res = await fetch(`/api/health-records/${petId}`);
            const data = await res.json();

            console.log('Health records response:', data); // Debug log

            if (data.success) {
                if (data.records && data.records.length > 0) {
                    renderRecords(data.records);
                } else {
                    recordsList.innerHTML = '<p class="no-records">No health records yet. Add your first record above!</p>';
                }
            } else {
                recordsList.innerHTML = '<p class="no-records">Failed to load records: ' + (data.message || 'Unknown error') + '</p>';
            }
        } catch (err) {
            console.error('Error loading records:', err);
            recordsList.innerHTML = '<p class="no-records">Error loading records. Please try refreshing the page.</p>';
        }
    }

    function renderRecords(records) {
        const filter = filterType.value;
        const query = searchInput.value.toLowerCase();

        const filtered = records.filter(record =>
            (filter === 'all' || record.type === filter) &&
            (record.name?.toLowerCase().includes(query) || record.notes?.toLowerCase().includes(query))
        );

        recordsList.innerHTML = '';

        if (filtered.length === 0) {
            recordsList.innerHTML = '<p class="no-records">No matching records found. Try adjusting your filters.</p>';
            return;
        }

        filtered.forEach(record => {
            const recordDiv = document.createElement('div');
            recordDiv.className = 'record-card';
            recordDiv.setAttribute('data-type', record.type);

            const formattedDate = new Date(record.date).toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });

            recordDiv.innerHTML = `
                <h3>${record.name}</h3>
                <p><strong>Type:</strong> ${record.type}</p>
                <p><strong>Date:</strong> ${formattedDate}</p>
                ${record.vet_clinic ? `<p><strong>Vet/Clinic:</strong> ${record.vet_clinic}</p>` : ''}
                ${record.notes ? `<p><strong>Notes:</strong> ${record.notes}</p>` : ''}
                ${record.file_path ? `<p><strong>Document:</strong> <a href="${record.file_path}" target="_blank" class="file-link">📎 ${record.file_name || 'View Document'}</a></p>` : ''}
                <button class="delete-btn" data-id="${record.record_id}" data-file="${record.file_path || ''}">🗑️ Delete</button>
            `;

            recordsList.appendChild(recordDiv);
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const filePath = btn.dataset.file;
                if (confirm('Are you sure you want to delete this record?')) {
                    deleteRecord(id, filePath);
                }
            });
        });
    }

    async function deleteRecord(id, filePath) {
        try {
            const res = await fetch(`/api/health-records/${id}`, {
                method: 'DELETE'
            });
            const data = await res.json();

            if (data.success) {
                loadRecords();
            } else {
                alert('Failed to delete record.');
            }
        } catch (err) {
            console.error('Error deleting record:', err);
        }
    }

    filterType.addEventListener('change', loadRecords);
    searchInput.addEventListener('input', loadRecords);
    
    // Add Enter key support for search
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            loadRecords();
        }
    });
    
    // Load vaccine schedule
    async function loadVaccineSchedule() {
        try {
            console.log('Loading vaccine schedule for petId:', petId);
            const res = await fetch(`/api/vaccines/${petId}`);
            const data = await res.json();
            console.log('Vaccine schedule response:', data);
            
            if (data.success && data.vaccines && data.vaccines.length > 0) {
                console.log('Rendering vaccine table with', data.vaccines.length, 'vaccines');
                renderVaccineTable(data.vaccines);
            } else {
                console.log('No vaccines found or error:', data);
                vaccineTableContainer.innerHTML = '<p class="no-vaccines">No vaccine schedule found. Please ensure your pet profile includes breed information.</p>';
            }
        } catch (err) {
            console.error('Error loading vaccine schedule:', err);
            vaccineTableContainer.innerHTML = '<p class="no-vaccines">Error loading vaccine schedule.</p>';
        }
    }
    
    function renderVaccineTable(vaccines) {
        // Group vaccines by age
        const vaccinesByAge = {};
        vaccines.forEach(vaccine => {
            if (!vaccinesByAge[vaccine.age_years]) {
                vaccinesByAge[vaccine.age_years] = [];
            }
            vaccinesByAge[vaccine.age_years].push(vaccine);
        });
        
        const ages = Object.keys(vaccinesByAge).sort((a, b) => parseInt(a) - parseInt(b));
        const maxColumns = 3; // Maximum vaccines per age
        
        let html = '<table class="vaccine-table">';
        html += '<thead><tr><th>Age (Years)</th>';
        for (let i = 1; i <= maxColumns; i++) {
            html += `<th>Vaccine ${i}</th>`;
        }
        html += '</tr></thead><tbody>';
        
        ages.forEach(age => {
            html += `<tr><td class="age-cell">${age} ${age === '1' ? 'year' : 'years'}</td>`;
            const ageVaccines = vaccinesByAge[age];
            
            for (let i = 0; i < maxColumns; i++) {
                if (i < ageVaccines.length) {
                    const vaccine = ageVaccines[i];
                    const isCompleted = vaccine.completed === 1 || vaccine.completed === true;
                    html += `<td class="vaccine-cell">
                        <label class="vaccine-checkbox-label">
                            <input type="checkbox" class="vaccine-checkbox" 
                                data-id="${vaccine.id}" 
                                ${isCompleted ? 'checked' : ''}>
                            <span>${vaccine.vaccine_name}</span>
                        </label>
                    </td>`;
                } else {
                    html += '<td class="vaccine-cell"></td>';
                }
            }
            html += '</tr>';
        });
        
        html += '</tbody></table>';
        vaccineTableContainer.innerHTML = html;
        
        // Add event listeners to checkboxes
        document.querySelectorAll('.vaccine-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', async function() {
                const vaccineId = this.dataset.id;
                const completed = this.checked;
                const completedDate = completed ? new Date().toISOString() : null;
                
                try {
                    const res = await fetch(`/api/vaccines/${vaccineId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ completed: completed ? 1 : 0, completed_date: completedDate })
                    });
                    
                    const data = await res.json();
                    if (!data.success) {
                        alert('Failed to update vaccine status');
                        this.checked = !completed; // Revert checkbox
                    }
                } catch (err) {
                    console.error('Error updating vaccine:', err);
                    alert('Error updating vaccine status');
                    this.checked = !completed; // Revert checkbox
                }
            });
        });
    }
    
    async function showPDFPreview() {
        // Ensure pet info is loaded before generating PDF
        if (!petInfo) {
            await loadPetInfo();
        }
        const html = await generatePDFContent();
        document.getElementById('pdf-content').innerHTML = html;
        
        // Show inline preview instead of modal
        const pdfPreviewSection = document.getElementById('pdf-preview-section');
        if (pdfPreviewSection) {
            pdfPreviewSection.style.display = 'block';
            // Scroll to preview section
            pdfPreviewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
    
    async function downloadPDF() {
        // Ensure pet info is loaded before generating PDF
        if (!petInfo) {
            await loadPetInfo();
        }
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        
        // Generate PDF content
        const html = await generatePDFContent();
        
        // Create temporary div for PDF generation
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.width = '210mm';
        tempDiv.innerHTML = html;
        document.body.appendChild(tempDiv);
        
        try {
            const canvas = await html2canvas(tempDiv, {
                scale: 2,
                useCORS: true,
                logging: false
            });
            
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = 210;
            const pageHeight = 297;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;
            
            doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
            
            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                doc.addPage();
                doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }
            
            const petName = petInfo ? petInfo.name : 'Pet';
            doc.save(`Pet_Health_Record_${petName}_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (err) {
            console.error('Error generating PDF:', err);
            alert('Error generating PDF. Please try again.');
        } finally {
            document.body.removeChild(tempDiv);
        }
    }
    
    async function generatePDFContent() {
        // Load all data
        const [recordsRes, vaccinesRes] = await Promise.all([
            fetch(`/api/health-records/${petId}`),
            fetch(`/api/vaccines/${petId}`)
        ]);
        
        const recordsData = await recordsRes.json();
        const vaccinesData = await vaccinesRes.json();
        
        const records = recordsData.success ? recordsData.records : [];
        const vaccines = vaccinesData.success ? vaccinesData.vaccines : [];
        
        // Group vaccines by age
        const vaccinesByAge = {};
        vaccines.forEach(vaccine => {
            if (!vaccinesByAge[vaccine.age_years]) {
                vaccinesByAge[vaccine.age_years] = [];
            }
            vaccinesByAge[vaccine.age_years].push(vaccine);
        });
        
        // Calculate birth date from age if available
        const calculateBirthDate = (age) => {
            if (!age) return 'N/A';
            const today = new Date();
            const birthYear = today.getFullYear() - age;
            const birthMonth = today.getMonth() + 1;
            const birthDay = today.getDate();
            return `${birthMonth}/${birthDay}/${birthYear}`;
        };
        
        const petName = petInfo ? petInfo.name : 'Unknown';
        const petType = petInfo ? petInfo.type : 'Unknown';
        const petBreed = petInfo ? petInfo.breed : 'Unknown';
        const petAge = petInfo ? petInfo.age : null;
        const petGender = petInfo ? petInfo.gender : null;
        const petWeight = petInfo ? petInfo.weight : null;
        const petColor = petInfo ? petInfo.color : null;
        
        // Use birth_date from database if available, otherwise calculate from age
        let birthDate = petInfo && petInfo.birth_date ? petInfo.birth_date : (petAge ? calculateBirthDate(petAge) : 'N/A');
        if (birthDate && birthDate !== 'N/A' && !birthDate.includes('/')) {
            // Format date if it's in YYYY-MM-DD format
            const date = new Date(birthDate);
            if (!isNaN(date.getTime())) {
                birthDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
            }
        }
        
        let html = `
            <div class="pdf-document">
                <div class="pdf-header">
                    <h1 class="pdf-title">Pet Health Record</h1>
                    <div class="pdf-contact">PetCare Application</div>
                </div>
                
                <div class="pdf-section">
                    <div class="pdf-section-header">Pet Information</div>
                    <div class="pdf-info-grid">
                        <div class="pdf-info-item"><strong>Pet Name:</strong> ${petName}</div>
                        <div class="pdf-info-item"><strong>Pet Age:</strong> ${petAge ? petAge + ' years' : 'N/A'}</div>
                        <div class="pdf-info-item"><strong>Birth Date:</strong> ${birthDate}</div>
                        <div class="pdf-info-item"><strong>Breed:</strong> ${petBreed}</div>
                        <div class="pdf-info-item"><strong>Type:</strong> ${petType}</div>
                        <div class="pdf-info-item"><strong>Gender:</strong> ${petGender || 'N/A'}</div>
                        <div class="pdf-info-item"><strong>Weight:</strong> ${petWeight || 'N/A'}</div>
                        <div class="pdf-info-item"><strong>Color:</strong> ${petColor || 'N/A'}</div>
                    </div>
                </div>
                
                <div class="pdf-section">
                    <div class="pdf-section-header">Immunization History</div>`;
        
        if (vaccines.length > 0) {
            html += `
                    <table class="pdf-vaccine-table">
                        <thead>
                            <tr>
                                <th>Age (Years)</th>
                                <th>Vaccine 1</th>
                                <th>Vaccine 2</th>
                                <th>Vaccine 3</th>
                            </tr>
                        </thead>
                        <tbody>`;
            
            const ages = Object.keys(vaccinesByAge).sort((a, b) => parseInt(a) - parseInt(b));
            ages.forEach(age => {
                const ageVaccines = vaccinesByAge[age];
                html += `<tr><td>${age} ${age === '1' ? 'year' : 'years'}</td>`;
                for (let i = 0; i < 3; i++) {
                    if (i < ageVaccines.length) {
                        const vaccine = ageVaccines[i];
                        const checkmark = vaccine.completed ? ' ✓' : '';
                        html += `<td>${vaccine.vaccine_name}${checkmark}</td>`;
                    } else {
                        html += '<td></td>';
                    }
                }
                html += '</tr>';
            });
            
            html += `
                        </tbody>
                    </table>`;
        } else {
            html += '<p>No vaccine schedule found. Please ensure your pet profile includes breed information.</p>';
        }
        
        html += `
                </div>
                
                <div class="pdf-section">
                    <div class="pdf-section-header">Medical History</div>
                    <table class="pdf-medical-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Description</th>
                                <th>Veterinarian</th>
                                <th>Notes</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        records.forEach(record => {
            const date = record.date ? new Date(record.date).toLocaleDateString() : 'N/A';
            html += `
                <tr>
                    <td>${date}</td>
                    <td>${record.type || 'N/A'}</td>
                    <td>${record.name || 'N/A'}</td>
                    <td>${record.vet_clinic || 'N/A'}</td>
                    <td>${record.notes || 'N/A'}</td>
                </tr>
            `;
        });
        
        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        return html;
    }
});
