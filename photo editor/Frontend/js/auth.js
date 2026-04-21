// [04/01/2026] shared helpers for login and registration pages
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const currentPage = window.location.pathname.split("/").pop();

  // [04/01/2026] keep logged-in users from seeing auth pages again
  if (token && (currentPage === "index.html" || currentPage === "" || currentPage === "register.html")) {
    window.location.href = "dashboard.html";
    return;
  }

  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }

  if (registerForm) {
    registerForm.addEventListener("submit", handleRegister);
  }
});

// [04/01/2026] show auth messages in a consistent place
function setAuthMessage(message, isError = false) {
  const messageElement = document.getElementById("authMessage");
  if (!messageElement) return;

  messageElement.textContent = message;
  messageElement.classList.toggle("auth-message--error", isError);
  messageElement.classList.toggle("auth-message--success", !isError && !!message);
}

// [04/01/2026] login handler
async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  setAuthMessage("");

  try {
    const data = await makeRequest("/auth/login", "POST", { email, password });

    // [04/01/2026] save token and user summary for the dashboard
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    setAuthMessage("Login successful. Redirecting...");
    window.location.href = "dashboard.html";
  } catch (error) {
    setAuthMessage("Login failed. Please check your email and password.", true);
    console.error("Login error:", error);
  }
}

// [04/01/2026] registration handler
async function handleRegister(event) {
  event.preventDefault();

  const username = document.getElementById("registerUsername").value.trim();
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value;

  setAuthMessage("");

  try {
    await makeRequest("/auth/register", "POST", { username, email, password });
    setAuthMessage("Registration successful. You can now log in.");
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1200);
  } catch (error) {
    setAuthMessage("Registration failed. Please try different account details.", true);
    console.error("Register error:", error);
  }
}
