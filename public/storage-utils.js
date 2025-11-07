// Storage utility for user-specific localStorage
// This allows multiple users to be logged in simultaneously in different tabs

// Get userId from sessionStorage (tab-specific) first, then localStorage
function getCurrentUserId() {
    return sessionStorage.getItem('userId') || localStorage.getItem('userId');
}

// Get user-specific key
function getUserKey(key) {
    const userId = getCurrentUserId();
    if (!userId) {
        // If no userId, use the key as-is (for backward compatibility)
        return key;
    }
    return `user_${userId}_${key}`;
}

// Set item with user-specific key
function setUserItem(key, value) {
    const userKey = getUserKey(key);
    localStorage.setItem(userKey, value);
    return userKey;
}

// Get item with user-specific key
function getUserItem(key) {
    const userKey = getUserKey(key);
    return localStorage.getItem(userKey);
}

// Remove item with user-specific key
function removeUserItem(key) {
    const userKey = getUserKey(key);
    localStorage.removeItem(userKey);
}

// Clear all data for a specific user
function clearUserData(userId) {
    if (!userId) return;
    
    const prefix = `user_${userId}_`;
    const keysToRemove = [];
    
    // Find all keys that belong to this user
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
            keysToRemove.push(key);
        }
    }
    
    // Remove all user-specific keys
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Also remove shared keys that are user-specific (only if they match this user)
    const sharedKeys = ['token', 'userId', 'userRole', 'username', 'email', 'currentUser', 'selectedPet', 'selectedPetId', 'accessMode', 'caregiverPets'];
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId === userId.toString()) {
        sharedKeys.forEach(key => localStorage.removeItem(key));
    }
}

// Get all user IDs that have data stored
function getActiveUserIds() {
    const userIds = new Set();
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('user_')) {
            const match = key.match(/^user_(\d+)_/);
            if (match) {
                userIds.add(match[1]);
            }
        }
    }
    
    // Also check for shared keys with userId (from both storages)
    const sessionUserId = sessionStorage.getItem('userId');
    const storedUserId = localStorage.getItem('userId');
    if (sessionUserId) userIds.add(sessionUserId);
    if (storedUserId) userIds.add(storedUserId);
    
    return Array.from(userIds);
}

// Make functions globally available
window.getUserKey = getUserKey;
window.setUserItem = setUserItem;
window.getUserItem = getUserItem;
window.removeUserItem = removeUserItem;
window.clearUserData = clearUserData;
window.getActiveUserIds = getActiveUserIds;
window.getCurrentUserId = getCurrentUserId;

