// Load and display pets in the "Other Pet Profiles" dropdown
async function loadPetSwitcher() {
    const petSwitcherContainer = document.getElementById('pet-switcher-list');
    if (!petSwitcherContainer) return;
    
    // Get userId from sessionStorage (tab-specific) first, then localStorage
    const userId = sessionStorage.getItem('userId') || localStorage.getItem('userId');
    if (!userId) {
        petSwitcherContainer.innerHTML = '<div class="pet-switcher-empty">Please log in</div>';
        return;
    }
    
    try {
        // Fetch owned pets
        const ownedRes = await fetch(`/api/pets/user?userId=${userId}`);
        const ownedData = await ownedRes.json();
        
        // Fetch caregiver pets from backend
        const caretakerRes = await fetch(`/api/pets/caretaker?userId=${userId}`);
        const caretakerData = await caretakerRes.json();
        
        // Get caregiver pets from sessionStorage (tab-specific) first, then localStorage
        const caregiverPetsStr = sessionStorage.getItem('caregiverPets') || localStorage.getItem('caregiverPets') || '[]';
        const caregiverPets = JSON.parse(caregiverPetsStr);
        const allCaretakerPets = [];
        
        // Add backend caretaker pets
        if (caretakerData.success && caretakerData.pets) {
            allCaretakerPets.push(...caretakerData.pets);
        }
        
        // Fetch and add localStorage pets
        if (caregiverPets.length > 0) {
            const localStoragePets = await Promise.all(
                caregiverPets.map(petId => 
                    fetch(`/api/pets/${petId}`)
                        .then(res => res.json())
                        .then(data => data.success ? data.pet : null)
                        .catch(() => null)
                )
            );
            
            localStoragePets.forEach(pet => {
                if (pet && !allCaretakerPets.find(p => p.id === pet.id)) {
                    allCaretakerPets.push(pet);
                }
            });
        }
        
        const ownedPets = ownedData.success && ownedData.pets ? ownedData.pets : [];
        const selectedPetIdStr = sessionStorage.getItem('selectedPetId') || localStorage.getItem('selectedPetId');
        const currentPetId = selectedPetIdStr ? parseInt(selectedPetIdStr) : null;
        
        let html = '';
        
        // Pets I Own section
        if (ownedPets.length > 0) {
            html += '<div class="pet-switcher-section">';
            html += '<div class="pet-switcher-header">👤 Pets I Own</div>';
            ownedPets.forEach(pet => {
                const isActive = pet.id === currentPetId;
                html += `
                    <div class="pet-switcher-item ${isActive ? 'active' : ''}" onclick="switchToPet(${pet.id}, 'owner')">
                        <span class="pet-switcher-emoji">${pet.emoji || '🐾'}</span>
                        <span class="pet-switcher-name">${pet.name}</span>
                        ${isActive ? '<span class="pet-switcher-badge">Current</span>' : ''}
                    </div>
                `;
            });
            html += '</div>';
        }
        
        // Pets I Care For section
        if (allCaretakerPets.length > 0) {
            html += '<div class="pet-switcher-section">';
            html += '<div class="pet-switcher-header">🤝 Pets I Care For</div>';
            allCaretakerPets.forEach(pet => {
                const isActive = pet.id === currentPetId;
                html += `
                    <div class="pet-switcher-item ${isActive ? 'active' : ''}" onclick="switchToPet(${pet.id}, 'caregiver')">
                        <span class="pet-switcher-emoji">${pet.emoji || '🐾'}</span>
                        <span class="pet-switcher-name">${pet.name}</span>
                        ${isActive ? '<span class="pet-switcher-badge">Current</span>' : ''}
                    </div>
                `;
            });
            html += '</div>';
        }
        
        if (ownedPets.length === 0 && allCaretakerPets.length === 0) {
            html = '<div class="pet-switcher-empty">No other pets found</div>';
        }
        
        petSwitcherContainer.innerHTML = html;
        
    } catch (err) {
        console.error('Error loading pet switcher:', err);
        petSwitcherContainer.innerHTML = '<div class="pet-switcher-empty">Error loading pets</div>';
    }
}

// Switch to a different pet
async function switchToPet(petId, accessMode) {
    try {
        const response = await fetch(`/api/pets/${petId}`);
        const data = await response.json();
        
        if (data.success && data.pet) {
            // Store pet information in both sessionStorage (tab-specific) and localStorage
            const petStr = JSON.stringify(data.pet);
            sessionStorage.setItem('selectedPet', petStr);
            sessionStorage.setItem('selectedPetId', data.pet.id);
            sessionStorage.setItem('accessMode', accessMode);
            localStorage.setItem('selectedPet', petStr);
            localStorage.setItem('selectedPetId', data.pet.id);
            localStorage.setItem('accessMode', accessMode);
            
            // Update caregiver pets list if needed
            if (accessMode === 'caregiver') {
                const caregiverPetsStr = sessionStorage.getItem('caregiverPets') || localStorage.getItem('caregiverPets') || '[]';
                const caregiverPets = JSON.parse(caregiverPetsStr);
                if (!caregiverPets.includes(petId)) {
                    caregiverPets.push(petId);
                    const petsStr = JSON.stringify(caregiverPets);
                    sessionStorage.setItem('caregiverPets', petsStr);
                    localStorage.setItem('caregiverPets', petsStr);
                }
            }
            
            // Reload the page to reflect the new pet
            window.location.reload();
        } else {
            alert('Error: Could not load pet information');
        }
    } catch (err) {
        console.error('Error switching pet:', err);
        alert('Error: Could not switch to this pet');
    }
}

// Make functions globally available
window.loadPetSwitcher = loadPetSwitcher;
window.switchToPet = switchToPet;

// Load when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(loadPetSwitcher, 200); // Delay to ensure dropdown HTML is loaded
    });
} else {
    setTimeout(loadPetSwitcher, 200);
}

