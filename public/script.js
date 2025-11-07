
// ================== LOGIN/SIGNUP/FORGOT PASSWORD ==================

function showLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('signupForm').style.display = 'none';
    document.getElementById('forgotPasswordSection').style.display = 'none';
    document.getElementById('loginBtn').classList.add('active');
    document.getElementById('signupBtn').classList.remove('active');
}

function showSignup() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'block';
    document.getElementById('forgotPasswordSection').style.display = 'none';
    document.getElementById('signupBtn').classList.add('active');
    document.getElementById('loginBtn').classList.remove('active');
}



async function login(event) {
    event.preventDefault();
    console.log("Login triggered");

    const email = document.querySelector('#email')?.value.trim();
    const password = document.querySelector('#password')?.value.trim();

    if (!email || !password) {
        alert('Please fill in both email and password.');
        return;
    }

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok && data.token && data.user) {
            // Use sessionStorage for session data (tab-specific, not shared across tabs)
            const userId = data.user.id.toString();
            
            // Store session data in sessionStorage (tab-specific)
            sessionStorage.setItem('userId', userId);
            sessionStorage.setItem('token', data.token);
            sessionStorage.setItem('userRole', data.user.role);
            sessionStorage.setItem('username', data.user.username);
            sessionStorage.setItem('email', data.user.email);
            sessionStorage.setItem('currentUser', JSON.stringify({
                id: data.user.id,
                username: data.user.username,
                email: data.user.email,
                role: data.user.role
            }));
            
            // Also store in localStorage for backward compatibility (but prioritize sessionStorage)
            localStorage.setItem('userId', userId);
            localStorage.setItem('token', data.token);
            localStorage.setItem('userRole', data.user.role);
            localStorage.setItem('username', data.user.username);
            localStorage.setItem('email', data.user.email);
            localStorage.setItem('currentUser', JSON.stringify({
                id: data.user.id,
                username: data.user.username,
                email: data.user.email,
                role: data.user.role
            }));
            
            window.location.href = '/role.html'; 
        } else {
            alert(data.message || 'Login failed.');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('An error occurred during login.');
    }
}

async function signup(event) {
    event.preventDefault();

    const firstName = document.getElementById('signupFirstName')?.value.trim();
    const lastName = document.getElementById('signupLastName')?.value.trim();
    const email = document.getElementById('signupEmail')?.value.trim();
    const password = document.getElementById('signupPassword')?.value.trim();

    if (!firstName || !lastName || !email || !password) {
        alert("Please fill in all fields.");
        return;
    }

    // Combine first name and last name into username
    const username = `${firstName} ${lastName}`.trim();

    try {
        const response = await fetch('/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, role: 'user' })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Signup successful! You can now log in.');
            // Clear the form
            document.getElementById('signupForm').reset();
            // Switch to login form
            showLogin();
        } else {
            alert(data.message || 'Signup failed.');
        }
    } catch (error) {
        console.error('Signup error:', error);
        alert('An error occurred during signup.');
    }
}

// ================== EVENT LISTENERS ==================

document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');

    if (loginForm) loginForm.addEventListener("submit", login);
    if (signupForm) signupForm.addEventListener("submit", signup);

    // if (localStorage.getItem('token')) {
    //     window.location.href = '/role.html'; // Already logged in, redirect to role page
    //     return; // Stop running rest of this script
    // }

    if (loginBtn && signupBtn) {
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showLogin();
        });
        signupBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showSignup();
        });
    }

    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    const backToLogin = document.getElementById('backToLogin');
    const sendResetLinkBtn = document.getElementById('sendResetLinkBtn');

    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('loginForm').style.display = "none";
            document.getElementById('forgotPasswordSection').style.display = "block";
        });
    }

    if (backToLogin) {
        backToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('forgotPasswordSection').style.display = "none";
            document.getElementById('loginForm').style.display = "block";
        });
    }

    if (sendResetLinkBtn) {
        sendResetLinkBtn.addEventListener('click', () => {
            const email = document.getElementById('resetEmail').value.trim();
            if (email) {
                alert("Password reset link sent to: " + email);
                document.getElementById('forgotPasswordSection').style.display = "none";
                document.getElementById('loginForm').style.display = "block";
            } else {
                alert("Please enter your email.");
            }
        });
    }

    // ================== ROLE SELECTION ==================

    const ownerBtn = document.getElementById('ownerBtn');
    const caregiverBtn = document.getElementById('caregiverBtn');

   
    if (ownerBtn) {
        ownerBtn.addEventListener('click', async function () {
            const userId = sessionStorage.getItem('userId') || localStorage.getItem('userId');
            console.log(`${userId} clicked pet owner`);
    
            if (!userId) {
                alert('User not logged in.');
                return;
            }
    
            // Pet owners go directly to pet profile page
            // Group will be created automatically when they create their first pet
            window.location.href = 'pet-profile.html';
        });
    }
    
    if (caregiverBtn) {
        caregiverBtn.addEventListener('click', async function () {
            const userId = sessionStorage.getItem('userId') || localStorage.getItem('userId');
            
            if (!userId) {
                alert('User not logged in.');
                return;
            }
            
            // Check if caregiver already has pets (from sessionStorage first, then localStorage)
            const caregiverPetsStr = sessionStorage.getItem('caregiverPets') || localStorage.getItem('caregiverPets') || '[]';
            const caregiverPets = JSON.parse(caregiverPetsStr);
            
            // Also check backend for pets they care for
            try {
                const backendRes = await fetch(`/api/pets/caretaker?userId=${userId}`);
                const backendData = await backendRes.json();
                
                if (backendData.success && backendData.pets && backendData.pets.length > 0) {
                    // Has pets from backend, go directly to caregiver pets page
                    window.location.href = 'caregiver-pets.html';
                    return;
                }
            } catch (err) {
                console.error('Error checking backend pets:', err);
            }
            
            if (caregiverPets.length > 0) {
                // Already has pets in storage, go to caregiver pets page
                window.location.href = 'caregiver-pets.html';
            } else {
                // No pets yet, ask for pet code
                const enteredPetCode = prompt("Please enter the pet code to access the pet's profile:");
                
                if (!enteredPetCode || !enteredPetCode.trim()) {
                    return;
                }
                
                try {
                    // Fetch pet by pet code
                    const response = await fetch(`/api/pets/code/${enteredPetCode.trim().toUpperCase()}`);
                    const data = await response.json();
                    
                    if (data.success && data.pet) {
                        // Add caregiver to database
                        const addResponse = await fetch('/api/caregiver/add', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId, petId: data.pet.id })
                        });
                        
                        const addData = await addResponse.json();
                        
                        if (!addData.success) {
                            alert(addData.message || 'Failed to add caregiver access.');
                            return;
                        }
                        
                        // Store the pet in caregiver pets list (in both storages)
                        const pets = [data.pet.id];
                        const petsStr = JSON.stringify(pets);
                        sessionStorage.setItem('caregiverPets', petsStr);
                        localStorage.setItem('caregiverPets', petsStr);
                        
                        // Store the pet information (in both storages)
                        const petStr = JSON.stringify(data.pet);
                        sessionStorage.setItem('selectedPet', petStr);
                        sessionStorage.setItem('selectedPetId', data.pet.id);
                        sessionStorage.setItem('accessMode', 'caregiver');
                        localStorage.setItem('selectedPet', petStr);
                        localStorage.setItem('selectedPetId', data.pet.id);
                        localStorage.setItem('accessMode', 'caregiver');
                        
                        alert(`Access granted! You can now view ${data.pet.name}'s profile.`);
                        // Redirect to caregiver pets page
                        window.location.href = 'caregiver-pets.html';
                    } else {
                        alert(data.message || 'Invalid pet code. Please check and try again.');
                    }
                } catch (err) {
                    console.error("Fetch error:", err);
                    alert('Error: Could not verify pet code. Please try again.');
                }
            }
        });
    }

    // ================== PET PROFILE MANAGEMENT ==================


// Helper to get userId from sessionStorage (tab-specific) first, then localStorage
const getUserId = () => sessionStorage.getItem('userId') || localStorage.getItem('userId');
const userId = getUserId();
const petDisplayContainer = document.getElementById("petProfiles"); // not petProfilesList

if (window.location.pathname === "/pet-profile.html" || window.location.pathname.includes("pet-profile.html")) {
    if (userId) {
        loadPets();
    } else {
        alert("Please log in to view pets.");
        window.location.href = '/';
    }
}

const addPetCard = document.getElementById("addPetCard");
const addPetModal = document.getElementById("addPetModal");
const managePetModal = document.getElementById("managePetModal");
const closeBtns = document.querySelectorAll(".closeBtn");
const savePetBtn = document.getElementById("savePetBtn");
const manageProfilesBtn = document.getElementById("manageProfilesBtn");
const petProfilesList = document.getElementById("petProfilesList");

// Open modal to add pet
addPetCard?.addEventListener("click", () => {
    addPetModal.style.display = "flex";
});

// Close modals
closeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        addPetModal.style.display = "none";
        managePetModal.style.display = "none";
    });
});

// Save new pet
savePetBtn?.addEventListener("click", () => {
    const petNameInput = document.getElementById("petNameInput").value.trim();
    const select = document.getElementById("petTypeSelect");
    const petType = select.value;
    const petEmoji = select.options[select.selectedIndex]?.textContent.trim().split(" ")[0];
    const breedInput = document.getElementById("petBreedInput");
    const breed = breedInput ? breedInput.value.trim() : "";

    if (!petNameInput || !petType || !breed) {
        alert("Please enter all fields: Name, Type, and Breed.");
        return;
    }

    savePet(petNameInput, petEmoji, petType);
    addPetModal.style.display = "none";
    document.getElementById("petNameInput").value = "";
    document.getElementById("petTypeSelect").value = "";
    if (breedInput) breedInput.value = "";
});


manageProfilesBtn?.addEventListener("click", async () => {
    petProfilesList.innerHTML = "";  // Clear the petProfilesList container before adding new content

    if (!userId) return alert("User not found");

    try {
        const currentUserId = sessionStorage.getItem('userId') || localStorage.getItem('userId');
        // Fetch pets associated with the user
        const response = await fetch(`/api/pets/user?userId=${currentUserId}`);
        const data = await response.json();

        if (data.success && data.pets.length > 0) {
            // Render pet profiles in the UI
            data.pets.forEach((pet) => {
                const petItem = document.createElement("div");
                petItem.classList.add("manage-pet-item");
                petItem.setAttribute("data-id", pet.id); // Ensure each pet has a unique data-id
                petItem.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="font-size: 30px;">${pet.emoji}</div>
                        <div>${pet.name} (${pet.type})</div>
                    </div>
                    <button class="delete-btn" data-id="${pet.id}">Delete</button>
                `;
                petProfilesList.appendChild(petItem);
            });

            managePetModal.style.display = "flex"; // Show the modal

            // Attach the delete button event listeners
            document.querySelectorAll(".delete-btn").forEach(btn => {
                btn.addEventListener("click", async function () {
                    const petId = this.getAttribute("data-id");
                    await deletePetFromBackend(petId); // Delete the pet
                    petItem.remove(); // Immediately remove the deleted pet from the DOM
                });
            });
        } else {
            petProfilesList.innerHTML = "<p>No pets found.</p>";
        }
    } catch (err) {
        console.error("Error loading pets:", err);
        alert("Error loading pets");
    }
});


window.addEventListener("click", (e) => {
    if (e.target === addPetModal) addPetModal.style.display = "none";
    if (e.target === managePetModal) managePetModal.style.display = "none";
});

// Load pets for the group
// async function loadPets() {
//     if (!groupCode || !userId) return;

//     try {
//         const response = await fetch(`/api/pets?groupCode=${groupCode}`);
//         const data = await response.json();

//         if (data.success) {
//             localStorage.setItem("pets", JSON.stringify(data.pets));
//             renderPets(data.pets);
//         } else {
//             alert("Failed to load pet profiles");
//         }
//     } catch (err) {
//         console.error("Error loading pets:", err);
//         alert("An error occurred while loading pets");
//     }
// }


async function loadPets() {
    const addPetCard = document.getElementById("addPetCard"); // Store BEFORE clearing
    petDisplayContainer.innerHTML = ""; // Now safe to clear

    // Re-append the Add Pet card first
    petDisplayContainer.appendChild(addPetCard);

    try {
        const currentUserId = sessionStorage.getItem('userId') || localStorage.getItem('userId');
        const response = await fetch(`/api/pets/user?userId=${currentUserId}`);
        const data = await response.json();

        if (data.success && data.pets.length > 0) {
            data.pets.forEach((pet) => {
                const petCard = document.createElement("div");
                petCard.classList.add("pet-card");
                petCard.innerHTML = `
                    <div style="font-size: 40px;">${pet.emoji}</div>
                    <div>${pet.name}</div>
                    <div style="font-size: 14px; color: gray;">${pet.type}</div>
                `;

                // Click to go to dashboard
                petCard.addEventListener("click", () => {
                    const petStr = JSON.stringify(pet);
                    // Store in both sessionStorage (tab-specific) and localStorage
                    sessionStorage.setItem("selectedPet", petStr);
                    sessionStorage.setItem("selectedPetId", pet.id);
                    localStorage.setItem("selectedPet", petStr);
                    localStorage.setItem("selectedPetId", pet.id);
                    window.location.href = "dashboard.html";
                });

                // Insert each pet *before* the add card so + stays at the end
                petDisplayContainer.insertBefore(petCard, addPetCard);
            });
        } else {
            const noPetsMsg = document.createElement("p");
            noPetsMsg.textContent = "No pets found.";
            petDisplayContainer.insertBefore(noPetsMsg, addPetCard);
        }
    } catch (err) {
        console.error("Error loading pets:", err);
        alert("Failed to load pets");
    }
}


// Save pet to backend
async function savePet(name, emoji, type) {
    const currentUserId = sessionStorage.getItem('userId') || localStorage.getItem('userId');
    if (!currentUserId) return alert("User not found");
    
    const breedInput = document.getElementById("petBreedInput");
    const breed = breedInput ? breedInput.value.trim() : "";

    if (!name || !type || !breed) {
        alert("Please fill in all fields: Name, Type, and Breed.");
        return;
    }

    try {
        const response = await fetch("/api/pets/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, emoji, userId: currentUserId, type, breed }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: `HTTP ${response.status}: ${response.statusText}` }));
            throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        if (data.success) {
            // Store pet ID for pet details page
            if (data.petId) {
                localStorage.setItem('newPetId', data.petId);
                // Redirect to pet details page
                window.location.href = 'pet-details.html';
            } else {
                loadPets(); // refresh pets
            }
            if (breedInput) breedInput.value = "";
        } else {
            alert("Failed to save pet: " + (data.message || "Unknown error"));
        }
    } catch (err) {
        console.error("Error saving pet:", err);
        alert("Failed to save pet: " + (err.message || "Server error. Please check the console for details."));
    }
}

// Delete pet from backend
// async function deletePetFromBackend(petId) {
//     try {
//         const response = await fetch(`/api/pets/${petId}`, { method: "DELETE" });
//         const data = await response.json();

//         if (data.success) {
//             alert("Pet deleted successfully");
            
//             manageProfilesBtn.click(); // reload pets
//         } else {
//             alert("Failed to delete pet");
//         }
//     } catch (err) {
//         console.error("Error deleting pet:", err);
//         alert("Error deleting pet");
//     }
// }

// Delete pet from backend (synchronous function)
async function deletePetFromBackend(petId) {
    try {
        const response = await fetch(`/api/pets/${petId}`, { method: "DELETE" });
        const data = await response.json();

        if (data.success) {
            alert("Pet deleted successfully");

            // Reload pets after deletion
            manageProfilesBtn.click(); // reload pets by calling manageProfilesBtn click
        } else {
            alert("Failed to delete pet");
        }
    } catch (err) {
        console.error("Error deleting pet:", err);
        alert("Error deleting pet");
    }
}


// Render pet cards
function renderPets(pets) {
    // Remove all existing pets except the Add Pet card
    const addPetCard = document.getElementById("addPetCard");
    petDisplayContainer.innerHTML = ""; // Clear all
    petDisplayContainer.appendChild(addPetCard); // Add back the "Add Pet" card

    if (!pets || pets.length === 0) {
        const noPetsMsg = document.createElement("p");
        noPetsMsg.textContent = "No pets found.";
        petDisplayContainer.insertBefore(noPetsMsg, addPetCard);
        return;
    }

    pets.forEach((pet) => {
        const petItem = document.createElement("div");
        petItem.classList.add("pet-item");
        petItem.innerHTML = `
            <div class="pet-info">
                <div class="pet-emoji" style="font-size: 30px;">${pet.emoji}</div>
                <div class="pet-name">${pet.name}</div>
                <div class="pet-type">${pet.type}</div>
            </div>
        `;
        petDisplayContainer.insertBefore(petItem, addPetCard);
    });
}


// Copy group code
window.copyCode = function () {
    const codeText = document.getElementById("groupCode").textContent;
    navigator.clipboard.writeText(codeText)
        .then(() => {
            alert("Code copied to clipboard!");
            window.location.href = "pet-profile.html";
        })
        .catch(err => alert("Failed to copy code: " + err));
};
});