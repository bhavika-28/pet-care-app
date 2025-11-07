// Load and display pet icon in navigation
function loadPetIcon() {
    // Use sessionStorage first, fallback to localStorage
    const getValue = (key) => {
        const sessionVal = sessionStorage.getItem(key);
        return sessionVal !== null ? sessionVal : localStorage.getItem(key);
    };
    
    const petId = getValue('selectedPetId');
    const petIconNav = document.getElementById('pet-emoji-icon');
    const petCodeDisplay = document.getElementById('dropdown-pet-code');
    
    if (!petIconNav) {
        return;
    }
    
    // Try to get from selectedPet object first (faster)
    const selectedPetStr = getValue('selectedPet');
    const selectedPet = selectedPetStr ? JSON.parse(selectedPetStr) : null;
    if (selectedPet && selectedPet.emoji) {
        petIconNav.textContent = selectedPet.emoji || '🐾';
        if (petCodeDisplay && selectedPet.pet_code) {
            petCodeDisplay.textContent = selectedPet.pet_code;
        }
    }
    
    // Always fetch from API to ensure we have the latest pet_code
    if (petId) {
        console.log('Loading pet icon for petId:', petId);
        fetch(`/api/pets/${petId}`)
            .then(res => {
                console.log('Response status:', res.status, res.statusText);
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                }
                return res.json();
            })
            .then(data => {
                console.log('Pet data received:', JSON.stringify(data, null, 2));
                if (data.success && data.pet) {
                    if (data.pet.emoji) {
                        petIconNav.textContent = data.pet.emoji || '🐾';
                    }
                    if (petCodeDisplay) {
                        if (data.pet.pet_code) {
                            console.log('Pet code found:', data.pet.pet_code);
                            petCodeDisplay.textContent = data.pet.pet_code;
                            // Update storage with pet_code if it exists
                            if (selectedPet) {
                                selectedPet.pet_code = data.pet.pet_code;
                                const petStr = JSON.stringify(selectedPet);
                                sessionStorage.setItem('selectedPet', petStr);
                                localStorage.setItem('selectedPet', petStr);
                            }
                        } else {
                            console.warn('Pet code is null/undefined. Pet data:', data.pet);
                            console.log('Attempting to generate pet code...');
                            petCodeDisplay.textContent = 'Generating...';
                            // Try to trigger code generation
                            generatePetCodeForPet(petId, petCodeDisplay);
                        }
                    }
                } else {
                    console.error('API response indicates failure:', data);
                    if (petCodeDisplay) {
                        petCodeDisplay.textContent = 'Error loading';
                    }
                }
            })
            .catch(err => {
                console.error('Error loading pet icon:', err);
                console.error('Error details:', err.message, err.stack);
                if (petCodeDisplay) {
                    petCodeDisplay.textContent = 'Error loading';
                }
            });
    } else {
        console.warn('No petId found in localStorage');
        if (petCodeDisplay) {
            petCodeDisplay.textContent = 'No pet selected';
        }
    }
}

// Function to generate pet code for a pet that doesn't have one
async function generatePetCodeForPet(petId, petCodeDisplay) {
    if (!petId || !petCodeDisplay) {
        console.error('generatePetCodeForPet: Missing petId or petCodeDisplay');
        return;
    }
    
    console.log('Attempting to generate pet code for pet:', petId);
    
    try {
        // First try the generate-code endpoint
        const res = await fetch(`/api/pets/${petId}/generate-code`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Generate-code endpoint response status:', res.status);
        
        if (!res.ok) {
            const errorText = await res.text();
            console.error('Generate-code endpoint failed:', res.status, errorText);
            // Fallback: fetch pet again (backend should auto-generate)
            console.log('Falling back to getPetById (should auto-generate)...');
            return fetchPetAgain(petId, petCodeDisplay);
        }
        
        const data = await res.json();
        console.log('Generate code response:', JSON.stringify(data, null, 2));
        
        if (data.success && data.pet_code) {
            console.log('Successfully generated pet code:', data.pet_code);
            petCodeDisplay.textContent = data.pet_code;
            // Update localStorage
            const selectedPet = JSON.parse(localStorage.getItem('selectedPet') || 'null');
            if (selectedPet) {
                selectedPet.pet_code = data.pet_code;
                localStorage.setItem('selectedPet', JSON.stringify(selectedPet));
            }
        } else {
            console.error('Generate-code endpoint returned failure:', data);
            // Fallback: fetch pet again
            fetchPetAgain(petId, petCodeDisplay);
        }
    } catch (err) {
        console.error('Error calling generate-code endpoint:', err);
        // Fallback: fetch pet again
        fetchPetAgain(petId, petCodeDisplay);
    }
}

// Fallback function to fetch pet again (backend should auto-generate code)
async function fetchPetAgain(petId, petCodeDisplay) {
    try {
        console.log('Fetching pet again (should auto-generate code)...');
        const res = await fetch(`/api/pets/${petId}`);
        
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        const data = await res.json();
        console.log('Second fetch response:', JSON.stringify(data, null, 2));
        
        if (data.success && data.pet && data.pet.pet_code) {
                        console.log('Pet code found after second fetch:', data.pet.pet_code);
                        petCodeDisplay.textContent = data.pet.pet_code;
                        const selectedPetStr = sessionStorage.getItem('selectedPet') || localStorage.getItem('selectedPet') || 'null';
                        const selectedPet = JSON.parse(selectedPetStr);
                        if (selectedPet) {
                            selectedPet.pet_code = data.pet.pet_code;
                            const petStr = JSON.stringify(selectedPet);
                            sessionStorage.setItem('selectedPet', petStr);
                            localStorage.setItem('selectedPet', petStr);
                        }
        } else if (data.success && data.pet) {
            // Pet exists but no code - try one more time with delay
            console.warn('Pet exists but still no pet_code. Pet data:', data.pet);
            setTimeout(async () => {
                try {
                    console.log('Retrying fetch after delay...');
                    const retryRes = await fetch(`/api/pets/${petId}`);
                    const retryData = await retryRes.json();
                    if (retryData.success && retryData.pet && retryData.pet.pet_code) {
                        console.log('Pet code found on retry:', retryData.pet.pet_code);
                        petCodeDisplay.textContent = retryData.pet.pet_code;
                        const selectedPetStr = sessionStorage.getItem('selectedPet') || localStorage.getItem('selectedPet') || 'null';
                        const selectedPet = JSON.parse(selectedPetStr);
                        if (selectedPet) {
                            selectedPet.pet_code = retryData.pet.pet_code;
                            const petStr = JSON.stringify(selectedPet);
                            sessionStorage.setItem('selectedPet', petStr);
                            localStorage.setItem('selectedPet', petStr);
                        }
                    } else {
                        console.error('Still no pet code after retry:', retryData);
                        petCodeDisplay.textContent = 'Not available';
                    }
                } catch (retryErr) {
                    console.error('Retry fetch failed:', retryErr);
                    petCodeDisplay.textContent = 'Not available';
                }
            }, 1000);
        } else {
            console.error('Second fetch returned failure:', data);
            petCodeDisplay.textContent = 'Not available';
        }
    } catch (err) {
        console.error('Error in fetchPetAgain:', err);
        petCodeDisplay.textContent = 'Error loading';
    }
}

// Copy pet code to clipboard
function copyPetCode() {
    const petCodeDisplay = document.getElementById('dropdown-pet-code');
    const petCode = petCodeDisplay ? petCodeDisplay.textContent.trim() : '';
    
    // Don't copy if it's a status message
    if (!petCode || 
        petCode === 'Loading...' || 
        petCode === 'No pet selected' || 
        petCode === 'Error loading' ||
        petCode === 'Not available') {
        alert('Pet code is not available. Please try refreshing the page.');
        return;
    }
    
    navigator.clipboard.writeText(petCode).then(() => {
        // Show temporary feedback
        const originalText = petCodeDisplay.textContent;
        petCodeDisplay.textContent = 'Copied!';
        setTimeout(() => {
            petCodeDisplay.textContent = originalText;
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
        alert('Failed to copy pet code. Code: ' + petCode);
    });
}

// Logout function - only clears data for current tab
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        // ONLY clear sessionStorage (tab-specific) - DO NOT touch localStorage
        // This ensures other tabs remain logged in
        sessionStorage.clear();
        
        // Redirect to login page
        window.location.href = 'index.html';
    }
}

// Run when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadPetIcon);
} else {
    // DOM is already loaded
    loadPetIcon();
}

// Also try after a short delay in case elements are added dynamically
setTimeout(loadPetIcon, 100);

// Make functions available globally
window.copyPetCode = copyPetCode;
window.logout = logout;

