const API_URL = "http://localhost:8000/api";

export async function getUserById(id) {
    const response = await fetch(
        `http://localhost:8000/api/user/${id}`
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error);
    }

    return data;
}

export async function register(username, display_name, password) {
    const response = await fetch("http://localhost:8000/api/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username,
            display_name,
            password
        })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error);
    }

    return data;
}