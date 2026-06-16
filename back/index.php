<?php
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if (php_sapi_name() === 'cli-server' && is_file(__DIR__ . $uri)) {
    return false;
}

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// ── 1. БД ────────────────────────────────────────────────────
$dbFile     = __DIR__ . '/database.sqlite';
$schemaFile = __DIR__ . '/schema.sql';
$isNewDb    = !file_exists($dbFile);

try {
    $pdo = new PDO('sqlite:' . $dbFile);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec('PRAGMA foreign_keys = ON;');
    $pdo->exec('PRAGMA journal_mode = WAL;');

    if ($isNewDb && file_exists($schemaFile)) {
        $pdo->exec(file_get_contents($schemaFile));
    }
} catch (PDOException $e) {
    error_log('DB init error: ' . $e->getMessage());
    response(['error' => 'Внутренняя ошибка сервера'], 500);
}

// ── 2. Константы ─────────────────────────────────────────────
const ALLOWED_GENRES  = ['Поп', 'Хип-Хоп', 'Рок', 'EDM', 'R&B', 'Hyperpop', 'General'];
const ALLOWED_IMG_EXT = ['jpg', 'jpeg', 'png', 'webp'];
const ALLOWED_IMG_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;   // 5 МБ
const UPLOAD_DIR       = __DIR__ . '/view/';

// ── 3. Вспомогательные функции ───────────────────────────────

/** Завершает запрос JSON-ответом */
function response(array $data, int $status = 200): never {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/** Возвращает авторизованного пользователя или null */
function getAuthUser(PDO $pdo): ?array {
    $headers = getallheaders();
    $auth    = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    if (!preg_match('/Bearer\s(\S+)/', $auth, $m)) return null;

    $token = $m[1];
    // Токен – hex-строка 64 символа; всё остальное отклоняем сразу
    if (!preg_match('/^[0-9a-f]{64}$/', $token)) return null;

    $stmt = $pdo->prepare('
        SELECT * FROM users
        WHERE api_token = ? AND is_banned = 0 AND deleted_at IS NULL
        LIMIT 1
    ');
    $stmt->execute([$token]);
    return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
}

/** Возвращает авторизованного пользователя или завершает с 401 */
function requireAuth(PDO $pdo): array {
    $user = getAuthUser($pdo);
    if (!$user) response(['error' => 'Необходима авторизация или аккаунт заблокирован'], 401);
    return $user;
}

/**
 * Валидирует username:
 *  - 5–30 символов
 *  - только латиница, цифры, подчёркивание
 *  - первый символ – буква
 */
function validateUsername(string $username): ?string {
    $username = trim($username);
    if (!preg_match('/^[a-zA-Z][a-zA-Z0-9_]{4,29}$/', $username)) {
        return 'Никнейм должен быть 5–30 символов, начинаться с буквы и содержать только латиницу, цифры и _';
    }
    return null;
}

/**
 * Валидирует display_name: 1–50 символов, не пустой
 */
function validateDisplayName(string $name): ?string {
    $name = trim($name);
    $len  = mb_strlen($name);
    if ($len < 1 || $len > 50) {
        return 'Отображаемое имя должно быть от 1 до 50 символов';
    }
    return null;
}

/**
 * Проверяет пароль: минимум 8 символов, только ASCII (без кириллицы)
 */
function validatePassword(string $password): ?string {
    if (strlen($password) < 8) {
        return 'Пароль должен содержать минимум 8 символов';
    }
    if (preg_match('/[а-яёА-ЯЁ]/u', $password)) {
        return 'Пароль должен содержать только латиницу и спецсимволы';
    }
    return null;
}

/**
 * Сохраняет загруженный файл изображения.
 * Проверяет: расширение, MIME, размер.
 * Возвращает путь вида /view/xxx.jpg или вызывает response() с ошибкой.
 */
function saveUploadedImage(array $file, string $prefix): string {
    if ($file['error'] !== UPLOAD_ERR_OK) {
        response(['error' => 'Ошибка загрузки файла (код: ' . $file['error'] . ')'], 400);
    }

    // Размер
    if ($file['size'] > MAX_UPLOAD_BYTES) {
        response(['error' => 'Файл слишком большой. Максимум 5 МБ'], 400);
    }

    // Расширение
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, ALLOWED_IMG_EXT, true)) {
        response(['error' => 'Недопустимый формат. Доступны: jpg, jpeg, png, webp'], 400);
    }

    // MIME по реальному содержимому файла (защита от переименованных .php)
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime  = $finfo->file($file['tmp_name']);
    if (!in_array($mime, ALLOWED_IMG_MIME, true)) {
        response(['error' => 'Недопустимый тип файла'], 400);
    }

    if (!is_dir(UPLOAD_DIR)) {
        mkdir(UPLOAD_DIR, 0755, true);
    }

    $newName = $prefix . bin2hex(random_bytes(8)) . '.' . $ext;
    $dest    = UPLOAD_DIR . $newName;

    if (!move_uploaded_file($file['tmp_name'], $dest)) {
        response(['error' => 'Не удалось сохранить файл'], 500);
    }

    return '/view/' . $newName;
}

// ── 4. Роутинг ───────────────────────────────────────────────
$method = $_SERVER['REQUEST_METHOD'];
$input  = json_decode(file_get_contents('php://input'), true) ?? [];

$basePath = '/api';
if (str_starts_with($uri, $basePath)) {
    $uri = substr($uri, strlen($basePath));
}

// ════════════════════════════════════════════════════════════
//  AUTH & USER
// ════════════════════════════════════════════════════════════

// ── Регистрация ──────────────────────────────────────────────
if ($method === 'POST' && $uri === '/register') {

    $username    = trim($_POST['username']    ?? '');
    $displayName = trim($_POST['display_name'] ?? '');
    $password    =      $_POST['password']    ?? '';

    if ($username === '' || $password === '' || $displayName === '') {
        response(['error' => 'Заполните все поля'], 400);
    }

    // Валидация
    if ($err = validateUsername($username))    response(['error' => $err], 422);
    if ($err = validateDisplayName($displayName)) response(['error' => $err], 422);
    if ($err = validatePassword($password))    response(['error' => $err], 422);

    $avatarUrl = null;
    if (!empty($_FILES['avatar']) && $_FILES['avatar']['error'] !== UPLOAD_ERR_NO_FILE) {
        $avatarUrl = saveUploadedImage($_FILES['avatar'], 'avatar_');
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);

    try {
        $stmt = $pdo->prepare('
            INSERT INTO users (username, display_name, password_hash, avatar_url)
            VALUES (?, ?, ?, ?)
        ');
        $stmt->execute([$username, $displayName, $hash, $avatarUrl]);

        response(['message' => 'Пользователь зарегистрирован'], 201);

    } catch (PDOException $e) {
        response(['error' => 'Этот никнейм уже занят'], 409);
    }
}

// ── Авторизация ──────────────────────────────────────────────
if ($method === 'POST' && $uri === '/login') {

    $username = trim($input['username'] ?? '');
    $password =      $input['password'] ?? '';

    if ($username === '' || $password === '') {
        response(['error' => 'Заполните все поля'], 400);
    }

    $stmt = $pdo->prepare('
        SELECT id, password_hash, is_banned, deleted_at
        FROM users
        WHERE username = ?
        LIMIT 1
    ');
    $stmt->execute([$username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // password_verify уже константного времени; заглушка нужна только если запись не найдена
    $dummyHash = '$2y$10$invalidhashfordummyverification00000000000000000000000u';
    $hash      = $user ? $user['password_hash'] : $dummyHash;

    if ($user && password_verify($password, $hash)) {
        if ($user['is_banned'] || $user['deleted_at'] !== null) {
            response(['error' => 'Аккаунт заблокирован или удалён'], 403);
        }

        $token = bin2hex(random_bytes(32));
        $pdo->prepare('UPDATE users SET api_token = ?, last_login_at = CURRENT_TIMESTAMP WHERE id = ?')
            ->execute([$token, $user['id']]);

        response(['token' => $token, 'id' => (int)$user['id']]);
    }

    response(['error' => 'Неверный логин или пароль'], 401);
}

// ── Получить профиль текущего пользователя ───────────────────
if ($method === 'GET' && $uri === '/user') {
    $user = requireAuth($pdo);
    response([
        'id'           => (int)$user['id'],
        'username'     => $user['username'],
        'display_name' => $user['display_name'],
        'avatar_url'   => $user['avatar_url'],
        'role_id'      => (int)$user['role_id'],
        'created_at'   => $user['created_at'],
    ]);
}

// ── Редактировать профиль ────────────────────────────────────
if ($method === 'POST' && $uri === '/user/edit') {
    $user = requireAuth($pdo);

    $username    = trim($_POST['username']     ?? $input['username']     ?? '');
    $displayName = trim($_POST['display_name'] ?? $input['display_name'] ?? '');

    // Если поле не передано – оставляем текущее
    if ($username    === '') $username    = $user['username'];
    if ($displayName === '') $displayName = $user['display_name'];

    // Валидация, только если значение изменилось
    if ($username !== $user['username']) {
        if ($err = validateUsername($username)) response(['error' => $err], 422);
    }
    if ($err = validateDisplayName($displayName)) response(['error' => $err], 422);

    $avatarUrl = $user['avatar_url'];
    if (!empty($_FILES['avatar']) && $_FILES['avatar']['error'] !== UPLOAD_ERR_NO_FILE) {
        $avatarUrl = saveUploadedImage($_FILES['avatar'], 'avatar_');
        unlink($user['avatar_url']);
    }

    try {
        $pdo->prepare('
            UPDATE users
            SET username = ?, display_name = ?, avatar_url = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ')->execute([$username, $displayName, $avatarUrl, $user['id']]);

        response([
            'message' => 'Профиль успешно обновлён',
            'user'    => [
                'id'           => (int)$user['id'],
                'username'     => $username,
                'display_name' => $displayName,
                'avatar_url'   => $avatarUrl,
            ],
        ]);
    } catch (PDOException $e) {
        response(['error' => 'Этот никнейм уже занят'], 409);
    }
}

// ════════════════════════════════════════════════════════════
//  POSTS
// ════════════════════════════════════════════════════════════

// ── Получить список постов ───────────────────────────────────
if ($method === 'GET' && $uri === '/posts') {

    $genre    = isset($_GET['genre'])     ? trim($_GET['genre'])     : null;
    $authorId = isset($_GET['author_id']) ? (int)$_GET['author_id'] : null;
    $search   = isset($_GET['search'])    ? trim($_GET['search'])    : null;
    $artist   = isset($_GET['artist'])    ? trim($_GET['artist'])    : null;
    $release  = isset($_GET['release'])   ? trim($_GET['release'])   : null;
    $page     = max(1,   (int)($_GET['page']  ?? 1));
    $limit    = min(100, max(1, (int)($_GET['limit'] ?? 20)));
    $offset   = ($page - 1) * $limit;

    $authUser = getAuthUser($pdo);
    $userId   = $authUser ? (int)$authUser['id'] : 0;

    // Валидация жанра (если передан)
    if ($genre !== null && !in_array($genre, ALLOWED_GENRES, true)) {
        response(['error' => 'Недопустимый жанр'], 422);
    }

    $sql = '
        SELECT
            p.id, p.author_id, p.title, p.content, p.genre,
            p.image_path, p.likes_count, p.comments_count, p.created_at,
            u.username AS author,
            CASE WHEN :uid > 0 AND EXISTS(
                SELECT 1 FROM likes WHERE user_id = :uid AND post_id = p.id
            ) THEN 1 ELSE 0 END AS is_liked
        FROM posts p
        JOIN users u ON p.author_id = u.id
        WHERE p.status_id = 2
          AND p.deleted_at  IS NULL
          AND u.deleted_at  IS NULL
          AND u.is_banned   = 0
    ';

    $params = [':uid' => $userId];

    if ($genre !== null) {
        $sql .= ' AND p.genre = :genre';
        $params[':genre'] = $genre;
    }

    if ($authorId !== null) {
        $sql .= ' AND p.author_id = :author_id';
        $params[':author_id'] = $authorId;
    }

    // Поиск по словам через LIKE (каждое слово отдельно, OR)
    if ($search !== null && $search !== '') {
        $words = array_filter(array_slice(explode(' ', $search), 0, 10)); // не более 10 слов
        $conds = [];
        $i = 0;
        foreach ($words as $word) {
            $key = ':sw' . $i++;
            $conds[] = "(p.title LIKE $key OR p.content LIKE $key)";
            $params[$key] = '%' . str_replace(['%', '_', '\\'], ['\\%', '\\_', '\\\\'], $word) . '%';
        }
        if ($conds) $sql .= ' AND (' . implode(' OR ', $conds) . ')';
    }

    // Поиск по артисту/релизу (для секции «Ожидаемые релизы»)
    if ($artist !== null || $release !== null) {
        $searchTerm = trim(($artist ?? '') . ' ' . ($release ?? ''));
        if ($searchTerm !== '') {
            $params[':artrel'] = '%' . str_replace(['%','_','\\'], ['\\%','\\_','\\\\'], $searchTerm) . '%';
            $sql .= ' AND (p.title LIKE :artrel OR p.content LIKE :artrel)';
        }
    }

    $sql .= ' ORDER BY p.created_at DESC LIMIT :lim OFFSET :off';
    $params[':lim']  = $limit;
    $params[':off']  = $offset;

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($posts as &$p) {
        $p['id']         = (int)$p['id'];
        $p['author_id']  = (int)$p['author_id'];
        $p['likes_count']    = (int)$p['likes_count'];
        $p['comments_count'] = (int)$p['comments_count'];
        $p['is_liked']   = (bool)$p['is_liked'];
    }

    response($posts);
}

// ════════════════════════════════════════════════════════════
//  RELEASES (ОЖИДАЕМЫЕ РЕЛИЗЫ)
// ════════════════════════════════════════════════════════════

// ── Получить список ожидаемых релизов (доступно всем) ───────
if ($method === 'GET' && $uri === '/releases') {
    $stmt = $pdo->query('SELECT * FROM expected_releases ORDER BY created_at DESC');
    response($stmt->fetchAll(PDO::FETCH_ASSOC));
}

// ── Добавить новый релиз (только админ/модератор) ───────────
if ($method === 'POST' && $uri === '/admin/releases') {
    $user = requireAuth($pdo);
    if ((int)$user['role_id'] < 2) response(['error' => 'Нет доступа'], 403);
    $artist = trim($_POST['artist'] ?? '');
    $name   = trim($_POST['name'] ?? '');
    $genre  = trim($_POST['genre'] ?? '');
    if ($artist === '' || $name === '') {
        response(['error' => 'Заполните поля Артист и Название'], 400);
    }
    $coverPath = null;
    if (!empty($_FILES['cover']) && $_FILES['cover']['error'] !== UPLOAD_ERR_NO_FILE) {
        $coverPath = saveUploadedImage($_FILES['cover'], 'release_');
    }
    $stmt = $pdo->prepare('INSERT INTO expected_releases (artist, name, genre, cover_path) VALUES (?, ?, ?, ?)');
    $stmt->execute([$artist, $name, $genre, $coverPath]);
    response([
        'message' => 'Релиз добавлен',
        'id'      => (int)$pdo->lastInsertId()
    ], 201);
}

// ── Удалить релиз (только админ/модератор) ──────────────────
if ($method === 'DELETE' && preg_match('#^/admin/releases/(\d+)$#', $uri, $m)) {
    $user = requireAuth($pdo);
    if ((int)$user['role_id'] < 2) response(['error' => 'Нет доступа'], 403);
    $releaseId = (int)$m[1];
    $stmt = $pdo->prepare('SELECT cover_path FROM expected_releases WHERE id = ?');
    $stmt->execute([$releaseId]);
    $release = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$release) {
        response(['error' => 'Релиз не найден'], 404);
    }
    $pdo->prepare('DELETE FROM expected_releases WHERE id = ?')->execute([$releaseId]);
    if (!empty($release['cover_path'])) {
        $filePath = __DIR__ . '/' . ltrim($release['cover_path'], '/');        
        if (file_exists($filePath) && is_file($filePath)) {
            unlink($filePath);
        }
    }
    response(['message' => 'Релиз и обложка успешно удалены']);
}

// ── Создать пост ─────────────────────────────────────────────
if ($method === 'POST' && $uri === '/posts') {
    $user = requireAuth($pdo);

    $title   = trim($_POST['title']   ?? $input['title']   ?? '');
    $content = trim($_POST['content'] ?? $input['content'] ?? '');
    $genre   = trim($_POST['genre']   ?? $input['genre']   ?? 'General');

    if ($title === '' || $content === '') {
        response(['error' => 'Заполните заголовок и текст поста'], 400);
    }
    if (mb_strlen($title) > 100) {
        response(['error' => 'Заголовок не должен превышать 100 символов'], 422);
    }
    if (mb_strlen($content) > 10000) {
        response(['error' => 'Текст поста не должен превышать 10 000 символов'], 422);
    }
    if (!in_array($genre, ALLOWED_GENRES, true)) {
        response(['error' => 'Недопустимый жанр. Выберите из списка'], 422);
    }

    $imagePath = null;
    if (!empty($_FILES['image']) && $_FILES['image']['error'] !== UPLOAD_ERR_NO_FILE) {
        $imagePath = saveUploadedImage($_FILES['image'], 'post_');
    }

    $stmt = $pdo->prepare('
        INSERT INTO posts (author_id, title, content, genre, image_path, status_id)
        VALUES (?, ?, ?, ?, ?, 2)
    ');
    $stmt->execute([$user['id'], $title, $content, $genre, $imagePath]);

    response([
        'message'    => 'Пост создан',
        'id'         => (int)$pdo->lastInsertId(),
        'genre'      => $genre,
        'image_path' => $imagePath,
    ], 201);
}

// ── Получить один пост ───────────────────────────────────────
if ($method === 'GET' && preg_match('#^/posts/(\d+)$#', $uri, $m)) {

    $postId = (int)$m[1];

    $stmt = $pdo->prepare('
        SELECT
            p.id, p.author_id, p.title, p.content, p.genre,
            p.image_path, p.likes_count, p.comments_count, p.created_at,
            u.username, u.display_name, u.avatar_url
        FROM posts p
        JOIN users u ON p.author_id = u.id
        WHERE p.id = ?
          AND p.deleted_at IS NULL
          AND p.status_id = 2
        LIMIT 1
    ');
    $stmt->execute([$postId]);
    $post = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$post) response(['error' => 'Пост не найден'], 404);

    $post['id']              = (int)$post['id'];
    $post['author_id']       = (int)$post['author_id'];
    $post['likes_count']     = (int)$post['likes_count'];
    $post['comments_count']  = (int)$post['comments_count'];

    response($post);
}

// ── Посты конкретного пользователя ───────────────────────────
if ($method === 'GET' && preg_match('#^/user/(\d+)/posts$#', $uri, $m)) {

    $userId = (int)$m[1];

    $stmt = $pdo->prepare('
        SELECT
            p.id, p.author_id, p.title, p.content, p.genre,
            p.image_path, p.likes_count, p.comments_count, p.created_at
        FROM posts p
        WHERE p.author_id = ?
          AND p.deleted_at IS NULL
          AND p.status_id  = 2
        ORDER BY p.created_at DESC
    ');
    $stmt->execute([$userId]);
    $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($posts as &$p) {
        $p['id']              = (int)$p['id'];
        $p['author_id']       = (int)$p['author_id'];
        $p['likes_count']     = (int)$p['likes_count'];
        $p['comments_count']  = (int)$p['comments_count'];
    }

    response($posts);
}

// ── Удалить пост (мягкое удаление) ───────────────────────────
if ($method === 'DELETE' && preg_match('#^/posts/(\d+)$#', $uri, $m)) {
    $user   = requireAuth($pdo);
    $postId = (int)$m[1];   // ФИX: был $matches[1] без приведения к int

    $stmt = $pdo->prepare('SELECT author_id FROM posts WHERE id = ? AND deleted_at IS NULL');
    $stmt->execute([$postId]);
    $post = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$post) response(['error' => 'Пост не найден'], 404);

    if ((int)$post['author_id'] !== (int)$user['id'] && (int)$user['role_id'] === 1) {
        response(['error' => 'Недостаточно прав для удаления этого поста'], 403);
    }

    $pdo->prepare('UPDATE posts SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?')
        ->execute([$postId]);

    response(['message' => 'Пост удалён']);
}

// ════════════════════════════════════════════════════════════
//  COMMENTS
// ════════════════════════════════════════════════════════════

// ── Получить комментарии поста ───────────────────────────────
if ($method === 'GET' && preg_match('#^/posts/(\d+)/comments$#', $uri, $m)) {

    $postId = (int)$m[1];

    $stmt = $pdo->prepare('
        SELECT
            c.id, c.content, c.created_at,
            u.id         AS author_id,
            u.username   AS author,
            u.avatar_url AS author_avatar
        FROM comments c
        JOIN users u ON c.author_id = u.id
        WHERE c.post_id    = ?
          AND c.deleted_at IS NULL
          AND u.deleted_at IS NULL
          AND u.is_banned  = 0
        ORDER BY c.created_at ASC
    ');
    $stmt->execute([$postId]);
    $comments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($comments as &$c) {
        $c['id']        = (int)$c['id'];
        $c['author_id'] = (int)$c['author_id'];
    }

    response($comments);
}

// ── Написать комментарий ─────────────────────────────────────
if ($method === 'POST' && preg_match('#^/posts/(\d+)/comments$#', $uri, $m)) {
    $user    = requireAuth($pdo);
    $postId  = (int)$m[1];
    $content = trim($_POST['content'] ?? $input['content'] ?? '');

    if ($content === '') {
        response(['error' => 'Комментарий не может быть пустым'], 400);
    }
    if (mb_strlen($content) > 1000) {
        response(['error' => 'Комментарий не должен превышать 1 000 символов'], 422);
    }

    $check = $pdo->prepare('SELECT 1 FROM posts WHERE id = ? AND deleted_at IS NULL AND status_id = 2');
    $check->execute([$postId]);
    if (!$check->fetch()) response(['error' => 'Пост не найден'], 404);

    $pdo->beginTransaction();
    try {
        $pdo->prepare('INSERT INTO comments (post_id, author_id, content) VALUES (?, ?, ?)')
            ->execute([$postId, $user['id'], $content]);

        $pdo->prepare('UPDATE posts SET comments_count = comments_count + 1 WHERE id = ?')
            ->execute([$postId]);

        $pdo->commit();
        response(['message' => 'Комментарий добавлен'], 201);
    } catch (Exception $e) {
        $pdo->rollBack();
        error_log('Comment insert error: ' . $e->getMessage());
        response(['error' => 'Ошибка добавления комментария'], 500);
    }
}

// ── Удалить комментарий ──────────────────────────────────────
if ($method === 'DELETE' && preg_match('#^/comments/(\d+)$#', $uri, $m)) {
    $user      = requireAuth($pdo);
    $commentId = (int)$m[1];   // ФИX: был $matches[1] без приведения к int

    $stmt = $pdo->prepare('
        SELECT author_id, post_id
        FROM comments
        WHERE id = ? AND deleted_at IS NULL
    ');
    $stmt->execute([$commentId]);
    $comment = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$comment) response(['error' => 'Комментарий не найден'], 404);

    if ((int)$comment['author_id'] !== (int)$user['id'] && (int)$user['role_id'] === 1) {
        response(['error' => 'Недостаточно прав'], 403);
    }

    $pdo->beginTransaction();
    try {
        $pdo->prepare('UPDATE comments SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?')
            ->execute([$commentId]);

        $pdo->prepare('UPDATE posts SET comments_count = MAX(0, comments_count - 1) WHERE id = ?')
            ->execute([$comment['post_id']]);

        $pdo->commit();
        response(['message' => 'Комментарий удалён']);
    } catch (Exception $e) {
        $pdo->rollBack();
        response(['error' => 'Ошибка при удалении'], 500);
    }
}

// ════════════════════════════════════════════════════════════
//  LIKES
// ════════════════════════════════════════════════════════════

if ($method === 'POST' && preg_match('#^/posts/(\d+)/like$#', $uri, $m)) {
    $user   = requireAuth($pdo);
    $postId = (int)$m[1];

    $check = $pdo->prepare('SELECT 1 FROM posts WHERE id = ? AND deleted_at IS NULL AND status_id = 2');
    $check->execute([$postId]);
    if (!$check->fetch()) response(['error' => 'Пост не найден'], 404);

    $checkLike = $pdo->prepare('SELECT 1 FROM likes WHERE user_id = ? AND post_id = ?');
    $checkLike->execute([$user['id'], $postId]);
    $hasLiked = (bool)$checkLike->fetch();

    $pdo->beginTransaction();
    try {
        if ($hasLiked) {
            $pdo->prepare('DELETE FROM likes WHERE user_id = ? AND post_id = ?')
                ->execute([$user['id'], $postId]);
            $pdo->prepare('UPDATE posts SET likes_count = MAX(0, likes_count - 1) WHERE id = ?')
                ->execute([$postId]);
            $isLiked = false;
            $action  = 'Лайк убран';
        } else {
            $pdo->prepare('INSERT INTO likes (user_id, post_id) VALUES (?, ?)')
                ->execute([$user['id'], $postId]);
            $pdo->prepare('UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?')
                ->execute([$postId]);
            $isLiked = true;
            $action  = 'Лайк поставлен';
        }

        $count = (int)$pdo->prepare('SELECT likes_count FROM posts WHERE id = ?')
            ->execute([$postId]) ? $pdo->query("SELECT likes_count FROM posts WHERE id = $postId")->fetchColumn() : 0;

        $pdo->commit();
        response(['message' => $action, 'is_liked' => $isLiked, 'likes_count' => (int)$count]);
    } catch (Exception $e) {
        $pdo->rollBack();
        response(['error' => 'Ошибка при обработке лайка'], 500);
    }
}

// ════════════════════════════════════════════════════════════
//  PUBLIC PROFILE
// ════════════════════════════════════════════════════════════

if ($method === 'GET' && preg_match('#^/user/(\d+)$#', $uri, $m)) {

    $profileId = (int)$m[1];

    $stmt = $pdo->prepare('
        SELECT id, username, display_name, avatar_url, created_at
        FROM users
        WHERE id = ? AND deleted_at IS NULL AND is_banned = 0
        LIMIT 1
    ');
    $stmt->execute([$profileId]);
    $profile = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$profile) response(['error' => 'Пользователь не найден или заблокирован'], 404);

    $profile['id'] = (int)$profile['id'];
    response($profile);
}

// ════════════════════════════════════════════════════════════
//  ADMIN
// ════════════════════════════════════════════════════════════

// ── Список всех пользователей ────────────────────────────────
if ($method === 'GET' && $uri === '/admin/users') {
    $user = requireAuth($pdo);
    if ((int)$user['role_id'] < 2) response(['error' => 'Нет доступа'], 403);

    $stmt = $pdo->query('
        SELECT id, username, display_name, role_id, is_banned, created_at
        FROM users
        WHERE deleted_at IS NULL
        ORDER BY created_at DESC
    ');
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($rows as &$r) {
        $r['id']        = (int)$r['id'];
        $r['role_id']   = (int)$r['role_id'];
        $r['is_banned'] = (int)$r['is_banned'];
    }
    response($rows);
}

// ── Забанить пользователя ────────────────────────────────────
if ($method === 'POST' && preg_match('#^/admin/users/(\d+)/ban$#', $uri, $m)) {
    $user     = requireAuth($pdo);
    $targetId = (int)$m[1];

    if ((int)$user['role_id'] < 2) response(['error' => 'Нет доступа'], 403);

    // Нельзя забанить самого себя
    if ($targetId === (int)$user['id']) {
        response(['error' => 'Нельзя забанить самого себя'], 400);
    }

    // Нельзя забанить другого админа/модератора
    $targetStmt = $pdo->prepare('SELECT role_id FROM users WHERE id = ? AND deleted_at IS NULL');
    $targetStmt->execute([$targetId]);
    $target = $targetStmt->fetch(PDO::FETCH_ASSOC);

    if (!$target) response(['error' => 'Пользователь не найден'], 404);
    if ((int)$target['role_id'] >= (int)$user['role_id']) {
        response(['error' => 'Нельзя забанить пользователя с равными или высшими правами'], 403);
    }

    $pdo->prepare('UPDATE users SET is_banned = 1 WHERE id = ?')->execute([$targetId]);
    response(['message' => 'Пользователь забанен']);
}

// ── Разбанить пользователя ───────────────────────────────────
if ($method === 'POST' && preg_match('#^/admin/users/(\d+)/unban$#', $uri, $m)) {
    $user     = requireAuth($pdo);
    $targetId = (int)$m[1];

    if ((int)$user['role_id'] < 2) response(['error' => 'Нет доступа'], 403);
    if ($targetId === (int)$user['id']) response(['error' => 'Нельзя разбанить самого себя'], 400);

    $pdo->prepare('UPDATE users SET is_banned = 0 WHERE id = ?')->execute([$targetId]);
    response(['message' => 'Пользователь разбанен']);
}

// ── 404 fallback ─────────────────────────────────────────────
response(['error' => 'Эндпоинт не найден'], 404);