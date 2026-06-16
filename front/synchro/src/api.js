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

export async function register(
    username,
    display_name,
    password,
    avatarFile
) {
    const formData = new FormData();

    formData.append("username", username);
    formData.append("display_name", display_name);
    formData.append("password", password);

    if (avatarFile) {
        formData.append("avatar", avatarFile);
    }

    const response = await fetch(
        "http://localhost:8000/api/register",
        {
            method: "POST",
            body: formData
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error);
    }

    return data;
}

export async function login(username, password) {
    const response = await fetch(
        "http://localhost:8000/api/login",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username,
                password,
            }),
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error);
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify({ id: data.id, role_id: data.role_id }));


    return data;
}
export async function createPost(title, content, genre, imageFile) {
    const token = localStorage.getItem("token");

    const formData = new FormData();
    console.log("TOKEN:", token);
    formData.append("title", title);
    formData.append("content", content);
    formData.append("genre", genre);

    if (imageFile) {
        formData.append("image", imageFile);
    }

    const response = await fetch(
        "http://localhost:8000/api/posts",
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: formData
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error);
    }

    return data;
}
export async function getPostById(id) {
    const response = await fetch(
        `http://localhost:8000/api/posts/${id}`
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error);
    }

    return data;
}
export async function getUserPosts(id) {
    const response = await fetch(
        `http://localhost:8000/api/user/${id}/posts`
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error);
    }

    return data;
}
export async function getPosts(
    genre = null,
    search = null,
    artist = null,
    release = null
) {
    let url = "http://localhost:8000/api/posts";

    const params = new URLSearchParams();

    if (genre) params.append("genre", genre);
    if (search) params.append("search", search);
    if (artist) params.append("artist", artist);
    if (release) params.append("release", release);

    if (params.toString()) {
        url += `?${params.toString()}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error);
    }

    return data;
}

export async function toggleLike(postId) {
    const token = localStorage.getItem("token");

    const response = await fetch(
        `http://localhost:8000/api/posts/${postId}/like`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error("Ошибка лайка");
    }

    return response.json();
}
export async function getComments(postId) {
    const response = await fetch(
        `http://localhost:8000/api/posts/${postId}/comments`
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error);
    }

    return data;
}

export async function createComment(postId, content) {
    const token = localStorage.getItem("token");

    const response = await fetch(
        `http://localhost:8000/api/posts/${postId}/comments`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ content }),
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error);
    }

    return data;
}

export async function deleteComment(commentId) {
    const token = localStorage.getItem("token");

    const response = await fetch(
        `http://localhost:8000/api/comments/${commentId}`,
        {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error);
    }

    return data;
}
export async function updateUser(formData) {
    const token = localStorage.getItem("token");

    const response = await fetch(
        "http://localhost:8000/api/user/edit",
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error);
    }

    return data;
}
export async function deletePost(postId) {
    const token = localStorage.getItem("token");

    const response = await fetch(
        `http://localhost:8000/api/posts/${postId}`,
        {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error);
    }

    return data;
}
export async function getAllUsers() {
    const token = localStorage.getItem("token");

    const res = await fetch("http://localhost:8000/api/admin/users", {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error);

    return data;
}
export async function banUser(userId) {
    const token = localStorage.getItem("token");

    const res = await fetch(
        `http://localhost:8000/api/admin/users/${userId}/ban`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    const data = await res.json();

    if (!res.ok) throw new Error(data.error);

    return data;
}
export async function unbanUser(userId) {
    const token = localStorage.getItem("token");
    const res = await fetch(`http://localhost:8000/api/admin/users/${userId}/unban`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
}

// Получить все релизы
export async function getReleases() {
    const res = await fetch('http://localhost:8000/api/releases');
    if (!res.ok) throw new Error('Ошибка загрузки релизов');
    return res.json();
}

// Добавить релиз (через FormData, так как есть картинка)
export async function addRelease(formData) {
    const token = localStorage.getItem('token'); // или откуда ты берешь токен
    const res = await fetch('http://localhost:8000/api/admin/releases', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData,
    });
    if (!res.ok) throw new Error('Ошибка добавления релиза');
    return res.json();
}

// Удалить релиз
export async function deleteRelease(id) {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:8000/api/admin/releases/${id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (!res.ok) throw new Error('Ошибка удаления релиза');
    return res.json();
}