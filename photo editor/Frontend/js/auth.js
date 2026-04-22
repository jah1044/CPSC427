// [04/01/2026] wait until page loads

document.addEventListener("DOMContentLoaded", () => {

  bindAuthForms();

});



// [04/01/2026] attach form events safely

function bindAuthForms() {

  const loginForm = document.getElementById("loginForm");

  const registerForm = document.getElementById("registerForm");



  if (loginForm) {

    loginForm.addEventListener("submit", handleLogin);

  }



  if (registerForm) {

    registerForm.addEventListener("submit", handleRegister);

  }

}



// [04/01/2026] handle login form submit

async function handleLogin(event) {

  event.preventDefault();



  const email = document.getElementById("loginEmail")?.value.trim();

  const password = document.getElementById("loginPassword")?.value;

  const messageEl = document.getElementById("authMessage");



  if (!email || !password) {

    showAuthMessage("Email and password are required.", true);

    return;

  }



  try {

    const data = await makeRequest("/auth/login", "POST", {

      email,

      password

    });



    localStorage.setItem("token", data.token);



    if (data.user) {

      localStorage.setItem("user", JSON.stringify(data.user));

    }



    showAuthMessage("Login successful.", false);



    setTimeout(() => {

      window.location.href = "dashboard.html";

    }, 500);

  } catch (error) {

    console.error("Login error:", error);

    showAuthMessage(error.message || "Login failed.", true);

  }

}



// [04/01/2026] handle register form submit

async function handleRegister(event) {

  event.preventDefault();



  const username = document.getElementById("registerUsername")?.value.trim();

  const email = document.getElementById("registerEmail")?.value.trim();

  const password = document.getElementById("registerPassword")?.value;



  if (!username || !email || !password) {

    showAuthMessage("All fields are required.", true);

    return;

  }



  try {

    await makeRequest("/auth/register", "POST", {

      username,

      email,

      password

    });



    showAuthMessage("Registration successful. Redirecting to login...", false);



    setTimeout(() => {

      window.location.href = "login.html";

    }, 1000);

  } catch (error) {

    console.error("Register error:", error);

    showAuthMessage(error.message || "Registration failed.", true);

  }

}



// [04/01/2026] show auth messages on login/register pages

function showAuthMessage(message, isError = false) {

  const messageEl = document.getElementById("authMessage");

  if (!messageEl) return;



  messageEl.textContent = message;

  messageEl.className = isError ? "auth-message auth-message--error" : "auth-message";

}
