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
    document.getElementById("deleteAccountButton")?.addEventListener("click", deleteAccount);
  }
  
  // [04/21/2026] load current user info into the form and header
  async function loadAccountProfile() {
    try {
      const user = await makeRequest("/auth/me");
  
      document.getElementById("accountUsername").value = user.username || "";
      document.getElementById("accountEmail").value = user.email || "";
  
      const headerName = document.getElementById("accountHeaderName");
      if (headerName) {
        headerName.textContent = user.username || "Account";
      }
  
      const avatar = document.getElementById("accountAvatar");
      if (avatar && user.username) {
        avatar.textContent = user.username.charAt(0).toUpperCase();
      }
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
  
      const headerName = document.getElementById("accountHeaderName");
      if (headerName) {
        headerName.textContent = username;
      }
  
      const avatar = document.getElementById("accountAvatar");
      if (avatar && username) {
        avatar.textContent = username.charAt(0).toUpperCase();
      }
  
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
  
  // [04/21/2026] permanently delete the current account
  async function deleteAccount() {
    const confirmText = document.getElementById("deleteConfirmText")?.value.trim();
  
    if (confirmText !== "DELETE") {
      alert('Type DELETE exactly to confirm account deletion.');
      return;
    }
  
    const confirmed = confirm("Are you sure you want to permanently delete your account?");
    if (!confirmed) return;
  
    try {
      const result = await makeRequest("/auth/delete-account", "DELETE");
  
      localStorage.removeItem("token");
      localStorage.removeItem("user");
  
      alert(result.message || "Account deleted.");
      window.location.href = "index.html";
    } catch (error) {
      console.error("Delete account error:", error);
      alert(error.message || "Could not delete account.");
    }
  }
  
  // [04/21/2026] log out and return to login page
  function logoutUser() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "index.html";
  }