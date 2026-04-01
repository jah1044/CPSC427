const BASE_URL = "http://localhost:5000";

async function makeRequest(endpoint, method = 'GET', body = null, isFormData = false) {
    const token = localStorage.getItem('token');

    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }

    const options = { method, headers };

    if (body) {
        options.body = isFormData ? body : JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);

    if (response.status === 401) {
        window.location.href = 'index.html';
        throw new Error("Unauthorized");
    }

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Error ${response.status}: ${text}`);
    }

    try {
        return await response.json();
    } catch {
        return null;
    }
}
