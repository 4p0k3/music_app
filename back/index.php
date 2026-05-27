<?php
// ====================== STATIC ROUTING FOR PHP BUILT-IN SERVER ======================
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

if (php_sapi_name() === 'cli-server' && is_file(__DIR__ . $uri)) {
    return false;
}

// ====================== HEADERS ======================
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// ====================== HELPERS ======================
function response($data, int $status = 200): void {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function getJsonInput(): array {
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

    if (stripos($contentType, 'application/json') !== false) {
        $data = json_decode(file_get_contents('php://input'), true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            response(["error" => "Некорректный JSON"], 400);
        }

        return $data ?? [];
    }

    return [];
}

function validateLength(string $value, int $min, int $max, string $fieldName): void {
    $len = mb_strlen($value);

    if ($len < $min || $len > $max) {
        response([
            "error" => "$fieldName должен содержать от $min до $max символов"
        ], 400);
    }
}

function getAuthorizationHeader(): string {
    $headers = function_exists('getallheaders') ? getallheaders() : [];

    return $headers['Authorization']
        ?? $headers['authorization']
        ?? $_SERVER['HTTP_AUTHORIZATION']
        ?? '';
}

function getAuthUser(PDO $pdo): ?array {
    $auth = getAuthorizationHeader();

    if (preg_match('/Bearer\s(\S+)/', $auth, $matches)) {
        $stmt = $pdo->prepare("
            SELECT *
            FROM users
            WHERE api_token = ?
            AND is_banned = 0
            AND deleted_at IS NULL
            LIMIT 1
        ");

        $stmt->execute([$matches[1]]);

        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        return $user ?: null;
    }

    return null;
}

function requireAuth(PDO $pdo): array {
    $user = getAuthUser($pdo);

    if (!$user) {
        response([
            "error" => "Необходима авторизация"
        ], 401);
    }

    return $user;
}

function validateImage(array $file): string {
    if ($file['error'] !== UPLOAD_ERR_OK) {
        response(["error" => "Ошибка загрузки файла"], 400);
    }

    $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

    $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

    if (!in_array($extension, $allowedExtensions, true)) {
        response([
            "error" => "Недопустимый формат файла"
        ], 400);
    }

    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    $allowedMime = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp'
    ];

    if (!in_array($mime, $allowedMime, true)) {
        response([
            "error" => "Файл не является изображением"
        ], 400);
    }

    $uploadDir = __DIR__ . '/view/';

    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $newFileName = uniqid('upload_', true) . '.' . $extension;
    $destination = $uploadDir . $newFileName;

    if (!move_uploaded_file($file['tmp_name'], $destination)) {
        response([
            "error" => "Не удалось сохранить файл"
        ], 500);
    }

    return '/view/' . $newFileName;
}

function isAdmin(array $user): bool {
    return (int)$user['role_id'] === 1;
}

// ====================== DATABASE ======================
$dbFile = __DIR__ . '/database.sqlite';
$schemaFile = __DIR__ . '/schema.sql';

$isNewDatabase = !file_exists($dbFile);

try {
    $pdo = new PDO("sqlite:" . $dbFile);

    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $pdo->exec("PRAGMA foreign_keys = ON");

    if ($isNewDatabase && file_exists($schemaFile)) {
        $schema = file_get_contents($schemaFile);
        $pdo->exec($schema);
    }

} catch (PDOException $e) {
    response([
        "error" => "Ошибка базы данных"
    ], 500);
}

// ====================== REQUEST ======================
$method = $_SERVER['REQUEST_METHOD'];
$input = getJsonInput();

$basePath = '/api';

if (strpos($uri, $basePath) === 0) {
    $uri = substr($uri, strlen($basePath));
}

// ====================== AUTH ======================

// REGISTER
if ($method === 'POST' && $uri === '/register') {

    $username = trim($input['username'] ?? '');
    $displayName = trim($input['display_name'] ?? '');
    $password = $input['password'] ?? '';

    validateLength($username, 3, 32, 'Username');
    validateLength($displayName, 2, 64, 'Display name');
    validateLength($password, 6, 128, 'Password');

    $hash = password_hash($password, PASSWORD_DEFAULT);

    try {

        $stmt = $pdo->prepare("
            INSERT INTO users (username, display_name, password_hash)
            VALUES (?, ?, ?)
        ");

        $stmt->execute([$username, $displayName, $hash]);

        response([
            "message" => "Пользователь зарегистрирован"
        ], 201);

    } catch (PDOException $e) {

        response([
            "error" => "Пользователь уже существует"
        ], 409);
    }
}

// LOGIN
if ($method === 'POST' && $uri === '/login') {

    $username = trim($input['username'] ?? '');
    $password = $input['password'] ?? '';

    $stmt = $pdo->prepare("
        SELECT id, password_hash, is_banned, deleted_at
        FROM users
        WHERE username = ?
        LIMIT 1
    ");

    $stmt->execute([$username]);

    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || !password_verify($password, $user['password_hash'])) {
        response([
            "error" => "Неверный логин или пароль"
        ], 401);
    }

    if ($user['is_banned'] || $user['deleted_at'] !== null) {
        response([
            "error" => "Аккаунт заблокирован"
        ], 403);
    }

    $token = bin2hex(random_bytes(32));

    $stmt = $pdo->prepare("
        UPDATE users
        SET api_token = ?, last_login_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ");

    $stmt->execute([$token, $user['id']]);

    response([
        "token" => $token
    ]);
}

// ====================== USER ======================

// CURRENT USER
if ($method === 'GET' && $uri === '/user') {

    $user = requireAuth($pdo);

    response([
        "id" => (int)$user['id'],
        "username" => $user['username'],
        "display_name" => $user['display_name'],
        "avatar_url" => $user['avatar_url'],
        "role_id" => (int)$user['role_id']
    ]);
}

// PUBLIC USER
if ($method === 'GET' && preg_match('#^/user/(\d+)$#', $uri, $matches)) {

    $stmt = $pdo->prepare("
        SELECT id, username, display_name, avatar_url
        FROM users
        WHERE id = ?
        AND deleted_at IS NULL
        AND is_banned = 0
        LIMIT 1
    ");

    $stmt->execute([$matches[1]]);

    $profile = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$profile) {
        response([
            "error" => "Пользователь не найден"
        ], 404);
    }

    $profile['id'] = (int)$profile['id'];

    response($profile);
}

// EDIT PROFILE
if ($method === 'POST' && $uri === '/user/edit') {

    $user = requireAuth($pdo);

    $username = trim($_POST['username'] ?? $input['username'] ?? $user['username']);
    $displayName = trim($_POST['display_name'] ?? $input['display_name'] ?? $user['display_name']);

    validateLength($username, 3, 32, 'Username');
    validateLength($displayName, 2, 64, 'Display name');

    $avatarUrl = $user['avatar_url'];

    if (isset($_FILES['avatar'])) {
        $avatarUrl = validateImage($_FILES['avatar']);
    }

    try {

        $stmt = $pdo->prepare("
            UPDATE users
            SET username = ?,
                display_name = ?,
                avatar_url = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ");

        $stmt->execute([
            $username,
            $displayName,
            $avatarUrl,
            $user['id']
        ]);

        response([
            "message" => "Профиль обновлен",
            "user" => [
                "id" => (int)$user['id'],
                "username" => $username,
                "display_name" => $displayName,
                "avatar_url" => $avatarUrl
            ]
        ]);

    } catch (PDOException $e) {

        response([
            "error" => "Username уже занят"
        ], 409);
    }
}

// ====================== POSTS ======================

// GET POSTS
if ($method === 'GET' && $uri === '/posts') {

    $genre = $_GET['genre'] ?? null;
    $authorId = $_GET['author_id'] ?? null;

    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = min(100, max(1, (int)($_GET['limit'] ?? 10)));

    $offset = ($page - 1) * $limit;

    $authUser = getAuthUser($pdo);
    $authUserId = $authUser ? (int)$authUser['id'] : 0;

    $where = "
        p.status_id = 2
        AND p.deleted_at IS NULL
        AND u.deleted_at IS NULL
        AND u.is_banned = 0
    ";

    $params = [];

    if ($genre) {
        $where .= " AND p.genre = ?";
        $params[] = $genre;
    }

    if ($authorId) {
        $where .= " AND p.author_id = ?";
        $params[] = (int)$authorId;
    }

    $countStmt = $pdo->prepare("
        SELECT COUNT(*)
        FROM posts p
        JOIN users u ON p.author_id = u.id
        WHERE $where
    ");

    $countStmt->execute($params);

    $total = (int)$countStmt->fetchColumn();

    $sql = "
        SELECT
            p.id,
            p.title,
            p.content,
            p.genre,
            p.image_path,
            p.likes_count,
            p.comments_count,
            p.created_at,
            u.username AS author,
            CASE
                WHEN ? > 0 AND EXISTS(
                    SELECT 1 FROM likes
                    WHERE user_id = ?
                    AND post_id = p.id
                )
                THEN 1
                ELSE 0
            END AS is_liked
        FROM posts p
        JOIN users u ON p.author_id = u.id
        WHERE $where
        ORDER BY p.created_at DESC
        LIMIT $limit OFFSET $offset
    ";

    $stmt = $pdo->prepare($sql);

    $stmt->execute(array_merge([$authUserId, $authUserId], $params));

    $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($posts as &$post) {
        $post['id'] = (int)$post['id'];
        $post['likes_count'] = (int)$post['likes_count'];
        $post['comments_count'] = (int)$post['comments_count'];
        $post['is_liked'] = (bool)$post['is_liked'];
    }

    response([
        "page" => $page,
        "limit" => $limit,
        "total" => $total,
        "pages" => max(1, (int)ceil($total / $limit)),
        "data" => $posts
    ]);
}

// CREATE POST
if ($method === 'POST' && $uri === '/posts') {

    $user = requireAuth($pdo);

    $title = trim($_POST['title'] ?? $input['title'] ?? '');
    $content = trim($_POST['content'] ?? $input['content'] ?? '');
    $genre = trim($_POST['genre'] ?? $input['genre'] ?? 'General');

    validateLength($title, 3, 255, 'Title');
    validateLength($content, 1, 10000, 'Content');
    validateLength($genre, 1, 64, 'Genre');

    $imagePath = null;

    if (isset($_FILES['image'])) {
        $imagePath = validateImage($_FILES['image']);
    }

    $stmt = $pdo->prepare("
        INSERT INTO posts (
            author_id,
            title,
            content,
            genre,
            image_path,
            status_id
        )
        VALUES (?, ?, ?, ?, ?, 2)
    ");

    $stmt->execute([
        $user['id'],
        $title,
        $content,
        $genre,
        $imagePath
    ]);

    response([
        "message" => "Пост создан",
        "id" => (int)$pdo->lastInsertId(),
        "image_path" => $imagePath
    ], 201);
}

// GET POST
if ($method === 'GET' && preg_match('#^/posts/(\d+)$#', $uri, $matches)) {

    $postId = (int)$matches[1];

    $authUser = getAuthUser($pdo);
    $authUserId = $authUser ? (int)$authUser['id'] : 0;

    $stmt = $pdo->prepare("
        SELECT
            p.id,
            p.title,
            p.content,
            p.genre,
            p.image_path,
            p.likes_count,
            p.comments_count,
            p.created_at,
            u.username AS author,
            CASE
                WHEN ? > 0 AND EXISTS(
                    SELECT 1 FROM likes
                    WHERE user_id = ?
                    AND post_id = p.id
                )
                THEN 1
                ELSE 0
            END AS is_liked
        FROM posts p
        JOIN users u ON p.author_id = u.id
        WHERE p.id = ?
        AND p.status_id = 2
        AND p.deleted_at IS NULL
        LIMIT 1
    ");

    $stmt->execute([$authUserId, $authUserId, $postId]);

    $post = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$post) {
        response([
            "error" => "Пост не найден"
        ], 404);
    }

    $post['is_liked'] = (bool)$post['is_liked'];

    response($post);
}

// DELETE POST
if ($method === 'DELETE' && preg_match('#^/posts/(\d+)$#', $uri, $matches)) {

    $user = requireAuth($pdo);

    $postId = (int)$matches[1];

    $stmt = $pdo->prepare("
        SELECT author_id
        FROM posts
        WHERE id = ?
        AND deleted_at IS NULL
        LIMIT 1
    ");

    $stmt->execute([$postId]);

    $post = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$post) {
        response([
            "error" => "Пост не найден"
        ], 404);
    }

    if ((int)$post['author_id'] !== (int)$user['id'] && !isAdmin($user)) {
        response([
            "error" => "Недостаточно прав"
        ], 403);
    }

    $stmt = $pdo->prepare("
        UPDATE posts
        SET deleted_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ");

    $stmt->execute([$postId]);

    response([
        "message" => "Пост удален"
    ]);
}

// ====================== COMMENTS ======================

// GET COMMENTS
if ($method === 'GET' && preg_match('#^/posts/(\d+)/comments$#', $uri, $matches)) {

    $stmt = $pdo->prepare("
        SELECT
            c.id,
            c.content,
            c.created_at,
            u.username AS author,
            u.avatar_url AS author_avatar
        FROM comments c
        JOIN users u ON c.author_id = u.id
        WHERE c.post_id = ?
        AND c.deleted_at IS NULL
        ORDER BY c.created_at ASC
    ");

    $stmt->execute([$matches[1]]);

    response($stmt->fetchAll(PDO::FETCH_ASSOC));
}

// CREATE COMMENT
if ($method === 'POST' && preg_match('#^/posts/(\d+)/comments$#', $uri, $matches)) {

    $user = requireAuth($pdo);

    $postId = (int)$matches[1];

    $content = trim($_POST['content'] ?? $input['content'] ?? '');

    validateLength($content, 1, 3000, 'Comment');

    $checkPost = $pdo->prepare("
        SELECT 1
        FROM posts
        WHERE id = ?
        AND deleted_at IS NULL
        LIMIT 1
    ");

    $checkPost->execute([$postId]);

    if (!$checkPost->fetch()) {
        response([
            "error" => "Пост не найден"
        ], 404);
    }

    $pdo->beginTransaction();

    try {

        $stmt = $pdo->prepare("
            INSERT INTO comments (post_id, author_id, content)
            VALUES (?, ?, ?)
        ");

        $stmt->execute([
            $postId,
            $user['id'],
            $content
        ]);

        $pdo->prepare("
            UPDATE posts
            SET comments_count = comments_count + 1
            WHERE id = ?
        ")->execute([$postId]);

        $pdo->commit();

        response([
            "message" => "Комментарий добавлен"
        ], 201);

    } catch (Exception $e) {

        $pdo->rollBack();

        response([
            "error" => "Ошибка добавления комментария"
        ], 500);
    }
}

// DELETE COMMENT
if ($method === 'DELETE' && preg_match('#^/comments/(\d+)$#', $uri, $matches)) {

    $user = requireAuth($pdo);

    $commentId = (int)$matches[1];

    $stmt = $pdo->prepare("
        SELECT author_id, post_id
        FROM comments
        WHERE id = ?
        AND deleted_at IS NULL
        LIMIT 1
    ");

    $stmt->execute([$commentId]);

    $comment = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$comment) {
        response([
            "error" => "Комментарий не найден"
        ], 404);
    }

    if ((int)$comment['author_id'] !== (int)$user['id'] && !isAdmin($user)) {
        response([
            "error" => "Недостаточно прав"
        ], 403);
    }

    $pdo->beginTransaction();

    try {

        $pdo->prepare("
            UPDATE comments
            SET deleted_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ")->execute([$commentId]);

        $pdo->prepare("
            UPDATE posts
            SET comments_count = MAX(0, comments_count - 1)
            WHERE id = ?
        ")->execute([$comment['post_id']]);

        $pdo->commit();

        response([
            "message" => "Комментарий удален"
        ]);

    } catch (Exception $e) {

        $pdo->rollBack();

        response([
            "error" => "Ошибка удаления"
        ], 500);
    }
}

// ====================== LIKES ======================

// TOGGLE LIKE
if ($method === 'POST' && preg_match('#^/posts/(\d+)/like$#', $uri, $matches)) {

    $user = requireAuth($pdo);

    $postId = (int)$matches[1];

    $checkPost = $pdo->prepare("
        SELECT 1
        FROM posts
        WHERE id = ?
        AND deleted_at IS NULL
        LIMIT 1
    ");

    $checkPost->execute([$postId]);

    if (!$checkPost->fetch()) {
        response([
            "error" => "Пост не найден"
        ], 404);
    }

    $checkLike = $pdo->prepare("
        SELECT 1
        FROM likes
        WHERE user_id = ?
        AND post_id = ?
        LIMIT 1
    ");

    $checkLike->execute([$user['id'], $postId]);

    $liked = (bool)$checkLike->fetch();

    $pdo->beginTransaction();

    try {

        if ($liked) {

            $pdo->prepare("
                DELETE FROM likes
                WHERE user_id = ?
                AND post_id = ?
            ")->execute([$user['id'], $postId]);

            $pdo->prepare("
                UPDATE posts
                SET likes_count = MAX(0, likes_count - 1)
                WHERE id = ?
            ")->execute([$postId]);

            $liked = false;
            $message = "Лайк убран";

        } else {

            $pdo->prepare("
                INSERT INTO likes (user_id, post_id)
                VALUES (?, ?)
            ")->execute([$user['id'], $postId]);

            $pdo->prepare("
                UPDATE posts
                SET likes_count = likes_count + 1
                WHERE id = ?
            ")->execute([$postId]);

            $liked = true;
            $message = "Лайк поставлен";
        }

        $likesStmt = $pdo->prepare("
            SELECT likes_count
            FROM posts
            WHERE id = ?
        ");

        $likesStmt->execute([$postId]);

        $likesCount = (int)$likesStmt->fetchColumn();

        $pdo->commit();

        response([
            "message" => $message,
            "is_liked" => $liked,
            "likes_count" => $likesCount
        ]);

    } catch (Exception $e) {

        $pdo->rollBack();

        response([
            "error" => "Ошибка обработки лайка"
        ], 500);
    }
}

// ====================== 404 ======================
response([
    "error" => "Эндпоинт не найден"
], 404);
