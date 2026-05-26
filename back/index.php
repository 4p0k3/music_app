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

// === AUTH ENDPOINTS ===

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

// === POSTS ENDPOINTS ===

// Получить посты
if ($method === 'GET' && $uri === '/posts') {
    $stmt = $pdo->query("
        SELECT p.id, p.title, p.content, p.likes_count, p.comments_count, p.created_at, u.username as author 
        FROM posts p 
        JOIN users u ON p.author_id = u.id 
        WHERE p.status_id = 2 
        ORDER BY p.created_at DESC
    ");
    response($stmt->fetchAll(PDO::FETCH_ASSOC));
}

// Создать пост
if ($method === 'POST' && $uri === '/posts') {
    $user = requireAuth($pdo);
    if (empty($input['title']) || empty($input['content'])) response(["error" => "Заполните заголовок и контент"], 400);
    
    $stmt = $pdo->prepare("INSERT INTO posts (author_id, title, content, status_id) VALUES (?, ?, ?, 2)"); // Сразу status 2 (approved) для теста
    $stmt->execute([$user['id'], $input['title'], $input['content']]);
    response(["message" => "Пост создан", "id" => $pdo->lastInsertId()], 201);
}

// Получить один пост
if ($method === 'GET' && preg_match('#^/posts/(\d+)$#', $uri, $matches)) {
    $stmt = $pdo->prepare("SELECT * FROM posts WHERE id = ?");
    $stmt->execute([$matches[1]]);
    $post = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$post) response(["error" => "Пост не найден"], 404);
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
        } else {
            $pdo->prepare("INSERT INTO likes (user_id, post_id) VALUES (?, ?)")->execute([$user['id'], $postId]);
            $pdo->prepare("UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?")->execute([$postId]);
            $action = "Лайк поставлен";
        }
        $pdo->commit();
        response(["message" => $action]);
    } catch (Exception $e) {
        $pdo->rollBack();
        response(["error" => "Ошибка при обработке лайка"], 500);
    }
}

// 404
response(["error" => "Эндпоинт не найден"], 404);