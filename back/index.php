<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// 1. Инициализация БД
$dbFile = __DIR__ . '/database.sqlite';
$schemaFile = __DIR__ . '/schema.sql';
$isNewDb = !file_exists($dbFile);

try {
    $pdo = new PDO("sqlite:" . $dbFile);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec("PRAGMA foreign_keys = ON;");
    
    if ($isNewDb && file_exists($schemaFile)) {
        $schema = file_get_contents($schemaFile);
        $pdo->exec($schema);
    }
} catch (PDOException $e) {
    response(["error" => "Ошибка БД: " . $e->getMessage()], 500);
}

// 2. Вспомогательные функции
function response($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function getAuthUser($pdo) {
    $headers = getallheaders();
    $auth = $headers['Authorization'] ?? '';
    if (preg_match('/Bearer\s(\S+)/', $auth, $matches)) {
        $stmt = $pdo->prepare("SELECT * FROM users WHERE api_token = ? LIMIT 1");
        $stmt->execute([$matches[1]]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    return null;
}

function requireAuth($pdo) {
    $user = getAuthUser($pdo);
    if (!$user) response(["error" => "Необходима авторизация"], 401);
    return $user;
}

// 3. Роутинг
$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$input = json_decode(file_get_contents('php://input'), true) ?? [];

// Убираем возможный базовый путь, если проект в подпапке
$basePath = '/api'; 
if (strpos($uri, $basePath) === 0) {
    $uri = substr($uri, strlen($basePath));
}

// === AUTH & USER ENDPOINTS ===

// Регистрация
if ($method === 'POST' && $uri === '/register') {
    if (empty($input['username']) || empty($input['password']) || empty($input['display_name'])) {
        response(["error" => "Заполните все поля"], 400);
    }
    $hash = password_hash($input['password'], PASSWORD_DEFAULT);
    try {
        $stmt = $pdo->prepare("INSERT INTO users (username, display_name, password_hash) VALUES (?, ?, ?)");
        $stmt->execute([$input['username'], $input['display_name'], $hash]);
        response(["message" => "Пользователь зарегистрирован"], 201);
    } catch (PDOException $e) {
        response(["error" => "Пользователь уже существует"], 409);
    }
}

// Авторизация
if ($method === 'POST' && $uri === '/login') {
    $stmt = $pdo->prepare("SELECT id, password_hash FROM users WHERE username = ?");
    $stmt->execute([$input['username'] ?? '']);
    $user = $stmt->fetch();

    if ($user && password_verify($input['password'] ?? '', $user['password_hash'])) {
        $token = bin2hex(random_bytes(32));
        $pdo->prepare("UPDATE users SET api_token = ?, last_login_at = CURRENT_TIMESTAMP WHERE id = ?")->execute([$token, $user['id']]);
        response(["token" => $token]);
    }
    response(["error" => "Неверный логин или пароль"], 401);
}

// Получить профиль текущего юзера (getUser)
if ($method === 'GET' && $uri === '/user') {
    $user = requireAuth($pdo);
    response([
        "id" => (int)$user['id'],
        "username" => $user['username'],
        "display_name" => $user['display_name'],
        "avatar_url" => $user['avatar_url']
    ]);
}

// Редактировать профиль текущего юзера (editUser)
if ($method === 'POST' && $uri === '/user/edit') {
    $user = requireAuth($pdo);
    
    // Данные могут прийти как через FormData (multipart/form-data), так и через обычный JSON
    $username = $_POST['username'] ?? $input['username'] ?? $user['username'];
    $displayName = $_POST['display_name'] ?? $input['display_name'] ?? $user['display_name'];
    $avatarUrl = $user['avatar_url'];
    
    // Обработка загрузки аватарки
    if (isset($_FILES['avatar']) && $_FILES['avatar']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = __DIR__ . '/view/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        
        $fileTmp = $_FILES['avatar']['tmp_name'];
        $fileName = $_FILES['avatar']['name'];
        $fileExt = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        $allowedExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        
        if (in_array($fileExt, $allowedExts)) {
            $newFileName = uniqid('avatar_') . '.' . $fileExt;
            $destPath = $uploadDir . $newFileName;
            
            if (move_uploaded_file($fileTmp, $destPath)) {
                $avatarUrl = '/view/' . $newFileName;
            } else {
                response(["error" => "Ошибка при сохранении файла аватара"], 500);
            }
        } else {
            response(["error" => "Недопустимый формат изображения. Доступны: jpg, jpeg, png, gif, webp"], 400);
        }
    }

    try {
        $stmt = $pdo->prepare("UPDATE users SET username = ?, display_name = ?, avatar_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
        $stmt->execute([$username, $displayName, $avatarUrl, $user['id']]);
        
        response([
            "message" => "Профиль успешно обновлен",
            "user" => [
                "id" => (int)$user['id'],
                "username" => $username,
                "display_name" => $displayName,
                "avatar_url" => $avatarUrl
            ]
        ]);
    } catch (PDOException $e) {
        response(["error" => "Этот никнейм уже занят"], 409);
    }
}

// === POSTS ENDPOINTS ===

// Получить посты (Фильтры по жанру, по автору, пагинация и флаг is_liked)
if ($method === 'GET' && $uri === '/posts') {
    $genre = $_GET['genre'] ?? null;
    $authorId = $_GET['author_id'] ?? null; // Фильтр по ID юзера
    
    $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
    $limit = isset($_GET['limit']) ? max(1, min(100, (int)$_GET['limit'])) : 10;
    $offset = ($page - 1) * $limit;
    
    $user = getAuthUser($pdo);
    $userId = $user ? (int)$user['id'] : 0;
    
    $sql = "
        SELECT p.id, p.title, p.content, p.genre, p.image_path, p.likes_count, p.comments_count, p.created_at, u.username as author,
               CASE WHEN ? > 0 AND EXISTS(SELECT 1 FROM likes WHERE user_id = ? AND post_id = p.id) THEN 1 ELSE 0 END as is_liked
        FROM posts p 
        JOIN users u ON p.author_id = u.id 
        WHERE p.status_id = 2 
    ";
    
    $params = [$userId, $userId];
    
    if ($genre) {
        $sql .= " AND p.genre = ? ";
        $params[] = $genre;
    }
    
    if ($authorId) {
        $sql .= " AND p.author_id = ? ";
        $params[] = (int)$authorId;
    }
    
    $sql .= " ORDER BY p.created_at DESC LIMIT " . $limit . " OFFSET " . $offset;

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($posts as &$post) {
        $post['is_liked'] = (bool)$post['is_liked'];
    }
    
    response($posts);
}

// Создать пост
if ($method === 'POST' && $uri === '/posts') {
    $user = requireAuth($pdo);
    
    $title = $_POST['title'] ?? $input['title'] ?? null;
    $content = $_POST['content'] ?? $input['content'] ?? null;
    $genre = $_POST['genre'] ?? $input['genre'] ?? null;
    
    if (empty($title) || empty($content)) {
        response(["error" => "Заполните заголовок и контент"], 400);
    }
    
    $imagePath = null;
    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = __DIR__ . '/view/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        
        $fileTmp = $_FILES['image']['tmp_name'];
        $fileName = $_FILES['image']['name'];
        $fileExt = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        $allowedExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        
        if (in_array($fileExt, $allowedExts)) {
            $newFileName = uniqid('post_') . '.' . $fileExt;
            $destPath = $uploadDir . $newFileName;
            
            if (move_uploaded_file($fileTmp, $destPath)) {
                $imagePath = '/view/' . $newFileName;
            } else {
                response(["error" => "Ошибка при сохранении файла"], 500);
            }
        } else {
            response(["error" => "Недопустимый формат файла. Доступны: jpg, jpeg, png, gif, webp"], 400);
        }
    }

    $stmt = $pdo->prepare("INSERT INTO posts (author_id, title, content, genre, image_path, status_id) VALUES (?, ?, ?, ?, ?, 2)");
    $stmt->execute([$user['id'], $title, $content, $genre, $imagePath]);
    
    response([
        "message" => "Пост создан", 
        "id" => $pdo->lastInsertId(),
        "genre" => $genre,
        "image_path" => $imagePath
    ], 201);
}

// Получить один пост
if ($method === 'GET' && preg_match('#^/posts/(\d+)$#', $uri, $matches)) {
    $user = getAuthUser($pdo);
    $userId = $user ? (int)$user['id'] : 0;
    $postId = $matches[1];

    $stmt = $pdo->prepare("
        SELECT p.id, p.title, p.content, p.genre, p.image_path, p.likes_count, p.comments_count, p.created_at, u.username as author,
               CASE WHEN ? > 0 AND EXISTS(SELECT 1 FROM likes WHERE user_id = ? AND post_id = p.id) THEN 1 ELSE 0 END as is_liked
        FROM posts p 
        JOIN users u ON p.author_id = u.id 
        WHERE p.id = ? AND p.status_id = 2
    ");
    $stmt->execute([$userId, $userId, $postId]);
    $post = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$post) response(["error" => "Пост не найден"], 404);
    
    $post['is_liked'] = (bool)$post['is_liked'];
    response($post);
}

// === COMMENTS ENDPOINTS ===

// Получить комментарии поста
if ($method === 'GET' && preg_match('#^/posts/(\d+)/comments$#', $uri, $matches)) {
    $stmt = $pdo->prepare("
        SELECT c.id, c.content, c.created_at, u.username as author 
        FROM comments c 
        JOIN users u ON c.author_id = u.id 
        WHERE c.post_id = ? 
        ORDER BY c.created_at ASC
    ");
    $stmt->execute([$matches[1]]);
    response($stmt->fetchAll(PDO::FETCH_ASSOC));
}

// Написать комментарий
if ($method === 'POST' && preg_match('#^/posts/(\d+)/comments$#', $uri, $matches)) {
    $user = requireAuth($pdo);
    $postId = $matches[1];
    
    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare("INSERT INTO comments (post_id, author_id, content) VALUES (?, ?, ?)");
        $stmt->execute([$postId, $user['id'], $input['content']]);
        
        $pdo->prepare("UPDATE posts SET comments_count = comments_count + 1 WHERE id = ?")->execute([$postId]);
        $pdo->commit();
        response(["message" => "Комментарий добавлен"], 201);
    } catch (Exception $e) {
        $pdo->rollBack();
        response(["error" => "Ошибка добавления"], 500);
    }
}

// === LIKES ENDPOINT ===

// Поставить/Убрать лайк
if ($method === 'POST' && preg_match('#^/posts/(\d+)/like$#', $uri, $matches)) {
    $user = requireAuth($pdo);
    $postId = $matches[1];

    $checkStmt = $pdo->prepare("SELECT 1 FROM likes WHERE user_id = ? AND post_id = ?");
    $checkStmt->execute([$user['id'], $postId]);
    $hasLiked = $checkStmt->fetch();

    $pdo->beginTransaction();
    try {
        if ($hasLiked) {
            $pdo->prepare("DELETE FROM likes WHERE user_id = ? AND post_id = ?")->execute([$user['id'], $postId]);
            $pdo->prepare("UPDATE posts SET likes_count = likes_count - 1 WHERE id = ?")->execute([$postId]);
            $action = "Лайк убран";
            $isLiked = false;
        } else {
            $pdo->prepare("INSERT INTO likes (user_id, post_id) VALUES (?, ?)")->execute([$user['id'], $postId]);
            $pdo->prepare("UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?")->execute([$postId]);
            $action = "Лайк поставлен";
            $isLiked = true;
        }
        
        $likesStmt = $pdo->prepare("SELECT likes_count FROM posts WHERE id = ?");
        $likesStmt->execute([$postId]);
        $currentLikes = $likesStmt->fetchColumn();

        $pdo->commit();
        response([
            "message" => $action,
            "is_liked" => $isLiked,
            "likes_count" => (int)$currentLikes
        ]);
    } catch (Exception $e) {
        $pdo->rollBack();
        response(["error" => "Ошибка при обработке лайка"], 500);
    }
}

// Получить публичный профиль пользователя по ID
if ($method === 'GET' && preg_match('#^/user/(\d+)$#', $uri, $matches)) {
    $stmt = $pdo->prepare("
        SELECT id, username, display_name, avatar_url 
        FROM users 
        WHERE id = ? AND deleted_at IS NULL
        LIMIT 1
    ");
    $stmt->execute([$matches[1]]);
    $profile = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$profile) response(["error" => "Пользователь не найден"], 404);

    $profile['id'] = (int)$profile['id'];
    response($profile);
}

// 404
response(["error" => "Эндпоинт не найден"], 404);
