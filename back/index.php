<?php
// Маршрутизация статики при запуске через php -S
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if (php_sapi_name() === 'cli-server' && is_file(__DIR__ . $uri)) {
    return false;
}

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
    $auth = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    if (preg_match('/Bearer\s(\S+)/', $auth, $matches)) {
        $stmt = $pdo->prepare("SELECT * FROM users WHERE api_token = ? AND is_banned = 0 AND deleted_at IS NULL LIMIT 1");
        $stmt->execute([$matches[1]]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    return null;
}

function requireAuth($pdo) {
    $user = getAuthUser($pdo);
    if (!$user) response(["error" => "Необходима авторизация или ваш аккаунт заблокирован"], 401);
    return $user;
}

// 3. Роутинг
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true) ?? [];

$basePath = '/api'; 
if (strpos($uri, $basePath) === 0) {
    $uri = substr($uri, strlen($basePath));
}

// === AUTH & USER ENDPOINTS ===

// Регистрация
if ($method === 'POST' && $uri === '/register') {

    $username = trim($_POST['username'] ?? '');
    $displayName = trim($_POST['display_name'] ?? '');
    $password = $_POST['password'] ?? '';

    if (empty($username) || empty($password) || empty($displayName)) {
        response(["error" => "Заполните все поля"], 400);
    }

    $avatarUrl = null;

    if (isset($_FILES['avatar']) && $_FILES['avatar']['error'] === UPLOAD_ERR_OK) {

        $uploadDir = __DIR__ . '/view/';

        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $fileExt = strtolower(pathinfo($_FILES['avatar']['name'], PATHINFO_EXTENSION));

        $newFileName = uniqid('avatar_') . '.' . $fileExt;

        if (move_uploaded_file(
            $_FILES['avatar']['tmp_name'],
            $uploadDir . $newFileName
        )) {
            $avatarUrl = '/view/' . $newFileName;
        }
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);

    try {

        $stmt = $pdo->prepare("
            INSERT INTO users
            (username, display_name, password_hash, avatar_url)
            VALUES (?, ?, ?, ?)
        ");

        $stmt->execute([
            $username,
            $displayName,
            $hash,
            $avatarUrl
        ]);

        response(["message" => "Пользователь зарегистрирован", 201]);

    } catch (PDOException $e) {
        response(["error" => "Пользователь уже существует"], 409);
    }
}

// Авторизация
if ($method === 'POST' && $uri === '/login') {
    $username = trim($input['username'] ?? '');
    $password = $input['password'] ?? '';

    $stmt = $pdo->prepare("SELECT id, password_hash, is_banned, deleted_at FROM users WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user && password_verify($password, $user['password_hash'])) {
        if ($user['is_banned'] || $user['deleted_at'] !== null) {
            response(["error" => "Аккаунт заблокирован или удален"], 403);
        }
        $token = bin2hex(random_bytes(32));
        $pdo->prepare("UPDATE users SET api_token = ?, last_login_at = CURRENT_TIMESTAMP WHERE id = ?")->execute([$token, $user['id']]);
        response(["token" => $token,"id" => $user["id"]]);
        
        
    }
    response(["error" => "Неверный логин или пароль"], 401);
}

// Получить профиль текущего юзера
if ($method === 'GET' && $uri === '/user') {
    $user = requireAuth($pdo);
    response([
        "id" => (int)$user['id'],
        "username" => $user['username'],
        "display_name" => $user['display_name'],
        "avatar_url" => $user['avatar_url'],
        "role_id" => (int)$user['role_id'],
        "created_at" => $user['created_at']
    ]);
}

// Редактировать профиль текущего юзера
if ($method === 'POST' && $uri === '/user/edit') {
    $user = requireAuth($pdo);
    
    $username = trim($_POST['username'] ?? $input['username'] ?? '');
    $displayName = trim($_POST['display_name'] ?? $input['display_name'] ?? '');
    
    if ($username === '') $username = $user['username'];
    if ($displayName === '') $displayName = $user['display_name'];
    
    $avatarUrl = $user['avatar_url'];
    
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

// Получить посты
if ($method === 'GET' && $uri === '/posts') {
    $genre = $_GET['genre'] ?? null;
    $authorId = $_GET['author_id'] ?? null;
    
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
        WHERE p.status_id = 2 AND p.deleted_at IS NULL AND u.deleted_at IS NULL AND u.is_banned = 0
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
    
    $title = trim($_POST['title'] ?? $input['title'] ?? '');
    $content = trim($_POST['content'] ?? $input['content'] ?? '');
    $genre = trim($_POST['genre'] ?? $input['genre'] ?? 'General');
    
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
// Получить один пост
if ($method === 'GET' && preg_match('#^/posts/(\d+)$#', $uri, $matches)) {

    $postId = (int)$matches[1];

    $stmt = $pdo->prepare("
        SELECT
            p.id,
            p.author_id,
            p.title,
            p.content,
            p.genre,
            p.image_path,
            p.likes_count,
            p.comments_count,
            p.created_at,

            u.username,
            u.display_name,
            u.avatar_url

        FROM posts p
        JOIN users u ON p.author_id = u.id

        WHERE p.id = ?
        LIMIT 1
    ");

    $stmt->execute([$postId]);

    $post = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$post) {
        response(["error" => "Пост не найден"], 404);
    }

    response($post);
}

// Получить посты пользователя
if ($method === 'GET' && preg_match('#^/user/(\d+)/posts$#', $uri, $matches)) {

    $userId = (int)$matches[1];

    $stmt = $pdo->prepare("
        SELECT *
        FROM posts
        WHERE author_id = ?
        ORDER BY created_at DESC
    ");

    $stmt->execute([$userId]);

    response($stmt->fetchAll(PDO::FETCH_ASSOC));
}

// Удалить пост (Мягкое удаление)
if ($method === 'DELETE' && preg_match('#^/posts/(\d+)$#', $uri, $matches)) {
    $user = requireAuth($pdo);
    $postId = $matches[1];
    
    $stmt = $pdo->prepare("SELECT author_id FROM posts WHERE id = ? AND deleted_at IS NULL");
    $stmt->execute([$postId]);
    $post = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$post) response(["error" => "Пост не найден"], 404);
    
    // Удалить может только автор или модератор/админ (role_id > 1)
    if ($post['author_id'] != $user['id'] && (int)$user['role_id'] === 1) {
        response(["error" => "Недостаточно прав для удаления этого поста"], 403);
    }
    
    $pdo->prepare("UPDATE posts SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?")->execute([$postId]);
    response(["message" => "Пост успешно удален"]);
}

// === COMMENTS ENDPOINTS ===

// Получить комментарии поста
if ($method === 'GET' && preg_match('#^/posts/(\d+)/comments$#', $uri, $matches)) {

    $postId = (int)$matches[1];

    $stmt = $pdo->prepare("
        SELECT
            c.id,
            c.content,
            c.created_at,

            u.id as author_id,
            u.username as author,
            u.avatar_url as author_avatar

        FROM comments c
        JOIN users u ON c.author_id = u.id

        WHERE c.post_id = ?
        AND c.deleted_at IS NULL
        AND u.deleted_at IS NULL
        AND u.is_banned = 0

        ORDER BY c.created_at ASC
    ");

    $stmt->execute([$postId]);

    $comments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    response($comments);
}

// Написать комментарий
if ($method === 'POST' && preg_match('#^/posts/(\d+)/comments$#', $uri, $matches)) {
    $user = requireAuth($pdo);
    $postId = $matches[1];
    $content = trim($_POST['content'] ?? $input['content'] ?? '');
    
    if (empty($content)) {
        response(["error" => "Комментарий не может быть пустым"], 400);
    }
    
    // Проверим, существует ли активный пост
    $checkPost = $pdo->prepare("SELECT 1 FROM posts WHERE id = ? AND deleted_at IS NULL");
    $checkPost->execute([$postId]);
    if (!$checkPost->fetch()) response(["error" => "Пост не найден"], 404);
    
    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare("INSERT INTO comments (post_id, author_id, content) VALUES (?, ?, ?)");
        $stmt->execute([$postId, $user['id'], $content]);
        
        $pdo->prepare("UPDATE posts SET comments_count = comments_count + 1 WHERE id = ?")->execute([$postId]);
        $pdo->commit();
        response(["message" => "Комментарий добавлен"], 201);
    } catch (Exception $e) {
        $pdo->rollBack();
        response(["error" => "Ошибка добавления комментария"], 500);
    }
}

// Удалить комментарий
if ($method === 'DELETE' && preg_match('#^/comments/(\d+)$#', $uri, $matches)) {
    $user = requireAuth($pdo);
    $commentId = $matches[1];
    
    $stmt = $pdo->prepare("SELECT author_id, post_id FROM comments WHERE id = ? AND deleted_at IS NULL");
    $stmt->execute([$commentId]);
    $comment = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$comment) response(["error" => "Комментарий не найден"], 404);
    
    if ($comment['author_id'] != $user['id'] && (int)$user['role_id'] === 1) {
        response(["error" => "Недостаточно прав"], 403);
    }
    
    $pdo->beginTransaction();
    try {
        $pdo->prepare("UPDATE comments SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?")->execute([$commentId]);
        $pdo->prepare("UPDATE posts SET comments_count = MAX(0, comments_count - 1) WHERE id = ?")->execute([$comment['post_id']]);
        $pdo->commit();
        response(["message" => "Комментарий удален"]);
    } catch (Exception $e) {
        $pdo->rollBack();
        response(["error" => "Ошибка при удалении"], 500);
    }
}

// === LIKES ENDPOINT ===

// Поставить/Убрать лайк
if ($method === 'POST' && preg_match('#^/posts/(\d+)/like$#', $uri, $matches)) {
    $user = requireAuth($pdo);
    $postId = $matches[1];

    // Проверим существование поста перед лайком
    $checkPost = $pdo->prepare("SELECT 1 FROM posts WHERE id = ? AND deleted_at IS NULL");
    $checkPost->execute([$postId]);
    if (!$checkPost->fetch()) response(["error" => "Пост не найден"], 404);

    $checkLike = $pdo->prepare("SELECT 1 FROM likes WHERE user_id = ? AND post_id = ?");
    $checkLike->execute([$user['id'], $postId]);
    $hasLiked = $checkLike->fetch();

    $pdo->beginTransaction();
    try {
        if ($hasLiked) {
            $pdo->prepare("DELETE FROM likes WHERE user_id = ? AND post_id = ?")->execute([$user['id'], $postId]);
            $pdo->prepare("UPDATE posts SET likes_count = MAX(0, likes_count - 1) WHERE id = ?")->execute([$postId]);
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
        SELECT id, username, display_name, avatar_url, created_at
        FROM users
        WHERE id = ? AND deleted_at IS NULL AND is_banned = 0
        LIMIT 1
    ");
    $stmt->execute([$matches[1]]);
    $profile = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$profile) {
        response(["error" => "Пользователь не найден или заблокирован"], 404);
    }

    $profile['id'] = (int)$profile['id'];
    response($profile);
}

// 404 Fallback
response(["error" => "Эндпоинт не найден"], 404);
