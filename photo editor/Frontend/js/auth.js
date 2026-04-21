// [04/21/2026] handle login and registration forms

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");

    if (loginForm) {
        loginForm.addEventListener("submit", handleLogin);
    }

    if (registerForm) {
        registerForm.addEventListener("submit", handleRegister);
    }
});

async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();
    const messageEl = document.getElementById("loginMessage");

    messageEl.textContent = "";

    try {
        const response = await makeRequest("/auth/login", "POST", { email, password });

        if (response && response.token) {
            localStorage.setItem("token", response.token);
            localStorage.setItem("user", JSON.stringify(response.user));
            messageEl.textContent = "Login successful. Redirecting...";
            messageEl.className = "auth-message success";

            // Change this if your project uses a different landing page.
            window.location.href = "profile.html";
        }
    } catch (error) {
        messageEl.textContent = "Login failed. Check your email and password.";
        messageEl.className = "auth-message error";
        console.error("Login error:", error);
    }
}

async function handleRegister(event) {
    event.preventDefault();

    const username = document.getElementById("registerUsername").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value.trim();
    const messageEl = document.getElementById("registerMessage");

    messageEl.textContent = "";

    try {
        await makeRequest("/auth/register", "POST", { username, email, password });
        messageEl.textContent = "Registration successful. You can now log in.";
        messageEl.className = "auth-message success";

        setTimeout(() => {
            window.location.href = "index.html";
        }, 1500);
    } catch (error) {
        messageEl.textContent = "Registration failed. Try a different email or username.";
        messageEl.className = "auth-message error";
        console.error("Register error:", error);
    }
}
