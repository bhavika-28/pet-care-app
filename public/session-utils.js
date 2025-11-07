// Session utility - provides tab-specific storage
// sessionStorage is tab-specific, so each tab can have a different user logged in

// Get value from sessionStorage first, fallback to localStorage
function getSessionValue(key) {
    // Try sessionStorage first (tab-specific)
    const sessionValue = sessionStorage.getItem(key);
    if (sessionValue !== null) {
        return sessionValue;
    }
    // Fallback to localStorage (for backward compatibility)
    return localStorage.getItem(key);
}

// Set value in both sessionStorage and localStorage
function setSessionValue(key, value) {
    sessionStorage.setItem(key, value);
    localStorage.setItem(key, value); // Keep for backward compatibility
}

// Remove value from both storages
function removeSessionValue(key) {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
}

// Clear all session data for current tab
function clearSession() {
    sessionStorage.clear();
    // Don't clear localStorage as it might have other users' data
}

// Get userId from session (tab-specific)
function getCurrentUserId() {
    return getSessionValue('userId');
}

// Make functions globally available
window.getSessionValue = getSessionValue;
window.setSessionValue = setSessionValue;
window.removeSessionValue = removeSessionValue;
window.clearSession = clearSession;
window.getCurrentUserId = getCurrentUserId;

