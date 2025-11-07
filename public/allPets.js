const groupCode = localStorage.getItem("groupCode"); 
const userId = localStorage.getItem("userId");
const petDisplayContainer = document.getElementById("pet-container");

if (window.location.pathname === "/allPets.html") {
    if (groupCode && userId) {
        loadPets();  // Load pets for this group
    } else {
        alert("Please log in to view pets.");
    }
}

async function loadPets() {
    petDisplayContainer.innerHTML = ""; // Clear any existing pets

    try {
        // Fetch pets associated with the caregiver's group
        const response = await fetch(`/api/pets?groupCode=${groupCode}`);
        const data = await response.json();

        if (data.success && data.pets.length > 0) {
            data.pets.forEach((pet) => {
                const petCard = document.createElement("div");
                petCard.classList.add("pet-card");
                petCard.innerHTML = `
                    <div style="font-size: 60px; padding: 30px;">${pet.emoji}</div>
                    <div>${pet.name}</div>
                    <div style="font-size: 14px; color: gray;">${pet.type}</div>
                `;

                // Click to select the pet
                petCard.addEventListener("click", () => {
                    localStorage.setItem("selectedPetId", pet.id);  // Save selected pet
                    localStorage.setItem('selectedPetName', pet.name);

                    window.location.href = "caregiver-dashboard.html";  // Redirect to dashboard
                });

                petDisplayContainer.appendChild(petCard); // Append the pet card to the container
            });
        } else {
            const noPetsMsg = document.createElement("p");
            noPetsMsg.textContent = "No pets found.";
            petDisplayContainer.appendChild(noPetsMsg);  // Show no pets message
        }
    } catch (err) {
        console.error("Error loading pets:", err);
        alert("Failed to load pets");
    }
}
