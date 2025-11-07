// Add a fade-in class when the page loads
document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('fade-in');
});

// Function to navigate with a fade-out transition
function navigateTo(page) {
    // Add fade-out class
    document.body.classList.remove('fade-in');
    document.body.classList.add('fade-out');

    // Wait for the animation to finish before navigating
    setTimeout(() => {
        window.location.href = page;
    }, 300); // Match this with the CSS transition duration
}
