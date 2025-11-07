async function loadGroupMembers() {
  // Get selectedPetId from sessionStorage (tab-specific) first, then localStorage
  const selectedPetId = sessionStorage.getItem('selectedPetId') || localStorage.getItem('selectedPetId');
  const list = document.getElementById("groupMembersList");

  if (!selectedPetId) {
    list.innerHTML = "<li>No pet selected. Please select a pet first.</li>";
    return;
  }

  try {
    // First, migrate any caregivers from localStorage to database
    const userId = sessionStorage.getItem('userId') || localStorage.getItem('userId');
    const caregiverPets = JSON.parse(sessionStorage.getItem('caregiverPets') || localStorage.getItem('caregiverPets') || '[]');
    
    if (caregiverPets.length > 0 && userId) {
      try {
        const migrateRes = await fetch('/api/caregiver/migrate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, petIds: caregiverPets })
        });
        const migrateData = await migrateRes.json();
        if (migrateData.success && migrateData.migrated.length > 0) {
          console.log(`✅ Migrated ${migrateData.migrated.length} caregivers to database`);
        }
      } catch (migrateErr) {
        console.error('Error migrating caregivers:', migrateErr);
        // Continue anyway
      }
    }

    console.log("🔍 Fetching group members for pet:", selectedPetId);
    const response = await fetch(`/api/pet/${selectedPetId}/members`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log("📦 Pet group members:", data);

    if (!data.success || !Array.isArray(data.members) || data.members.length === 0) {
      list.innerHTML = "<li>No members found for this pet.</li>";
      return;
    }

    // Display pet name in header if available
    if (data.pet && data.pet.name) {
      const h1 = document.querySelector('h1');
      if (h1) {
        h1.textContent = `Group Members - ${data.pet.name}`;
      }
    }

    // Get current user ID to check if they're the owner
    const currentUserId = parseInt(sessionStorage.getItem('userId') || localStorage.getItem('userId') || '0', 10);
    const owner = data.members.find(m => m.role === 'owner');
    const isOwner = owner && owner.id === currentUserId;
    
    list.innerHTML = data.members.map(member => {
      const roleBadge = member.role === 'owner' 
        ? '<span style="color: #5baec5; font-weight: 600;"> (Owner)</span>' 
        : '<span style="color: #666; font-size: 0.9em;"> (Caregiver)</span>';
      
      // Only show remove button if current user is owner and member is not owner
      const removeButton = (isOwner && member.role !== 'owner') 
        ? `<button onclick="removeMember(${member.id}, ${data.pet.id})" style="margin-left: auto; padding: 0.25rem 0.5rem; background: #f56565; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">Remove</button>`
        : '';
      
      return `<li style="display: flex; align-items: center; gap: 0.5rem;"><strong>${member.username || member.email}</strong>${roleBadge}${removeButton}</li>`;
    }).join("");

  } catch (err) {
    console.error("❌ Error loading group members:", err);
    list.innerHTML = `<li>Error loading members: ${err.message}</li>`;
  }
}

async function removeMember(memberId, petId) {
  if (!confirm('Are you sure you want to remove this member from the pet profile? This will revoke their access.')) {
    return;
  }
  
  try {
    const currentUserId = sessionStorage.getItem('userId') || localStorage.getItem('userId');
    
    const response = await fetch('/api/caregiver/remove', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: memberId, petId, removedByUserId: currentUserId })
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('Member removed successfully.');
      // Reload the list
      await loadGroupMembers();
    } else {
      alert(data.message || 'Failed to remove member.');
    }
  } catch (err) {
    console.error('Error removing member:', err);
    alert('An error occurred while removing member.');
  }
}

// Make removeMember globally available
window.removeMember = removeMember;

document.addEventListener("DOMContentLoaded", function () {
  loadGroupMembers();
});
