// [04/21/2026] protect account page when user is not logged in
document.addEventListener("DOMContentLoaded", () => {
    if (!localStorage.getItem("token")) {
      window.location.href = "index.html";
      return;
    }
  
    bindAccountEvents();
    loadAccountProfile();
  });
  
  // [04/21/2026] bind account page actions
  function bindAccountEvents() {
    document.getElementById("saveProfileButton")?.addEventListener("click", updateProfile);
    document.getElementById("changePasswordButton")?.addEventListener("click", changePassword);
    document.getElementById("logoutButton")?.addEventListener("click", logoutUser);
  }
  
  // [04/21/2026] load current user info into the form
  async function loadAccountProfile() {
    try {
      const user = await makeRequest("/auth/me");
      document.getElementById("accountUsername").value = user.username || "";
      document.getElementById("accountEmail").value = user.email || "";
    } catch (error) {
      console.error("Load profile error:", error);
      alert("Could not load profile.");
    }
  }
  
  // [04/21/2026] save username and email changes
  async function updateProfile() {
    const username = document.getElementById("accountUsername").value.trim();
    const email = document.getElementById("accountEmail").value.trim();
  
    if (!username || !email) {
      alert("Username and email are required.");
      return;
    }
  
    try {
      const result = await makeRequest("/auth/update-profile", "PUT", {
        username,
        email
      });
  
      alert(result.message || "Profile updated.");
    } catch (error) {
      console.error("Update profile error:", error);
      alert(error.message || "Could not update profile.");
    }
  }
  
  // [04/21/2026] change the current user's password
  async function changePassword() {
    const currentPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;
  
    if (!currentPassword || !newPassword) {
      alert("Both password fields are required.");
      return;
    }
  
    try {
      const result = await makeRequest("/auth/change-password", "PUT", {
        currentPassword,
        newPassword
      });
  
      alert(result.message || "Password updated.");
      document.getElementById("currentPassword").value = "";
      document.getElementById("newPassword").value = "";
    } catch (error) {
      console.error("Change password error:", error);
      alert(error.message || "Could not change password.");
    }
  }
  
  // [04/21/2026] log out and return to login page
  function logoutUser() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "index.html";
  }