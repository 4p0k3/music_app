-- Таблица для отслеживания примененных миграций
CREATE TABLE IF NOT EXISTS schema_version (
    version TEXT PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1. Справочники
CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS post_statuses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
);

-- Таблица users
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    avatar_url TEXT, -- Сюда сохраняется путь к аватарке (/view/avatar_...)
    password_hash TEXT NOT NULL,
    api_token TEXT UNIQUE,
    role_id INTEGER NOT NULL DEFAULT 1,
    is_banned INTEGER NOT NULL DEFAULT 0,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE RESTRICT
);

-- Таблица posts
CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    genre TEXT, -- ДОБАВЛЕНО: Жанр/категория поста
    image_path TEXT, -- ДОБАВЛЕНО: Путь к прикрепленному изображению (/view/post_...)
    status_id INTEGER NOT NULL,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE RESTRICT,
    FOREIGN KEY (status_id) REFERENCES post_statuses (id) ON DELETE RESTRICT
);

-- Таблица expected_releases (Ожидаемые релизы)
CREATE TABLE IF NOT EXISTS expected_releases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    artist TEXT NOT NULL,
    name TEXT NOT NULL,
    genre TEXT NOT NULL,
    cover_path TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица comments
CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    author_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Таблица likes
CREATE TABLE IF NOT EXISTS likes (
    user_id INTEGER NOT NULL,
    post_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, post_id),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE
);

-- Таблица post_moderation
CREATE TABLE IF NOT EXISTS post_moderation (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    moderator_id INTEGER,
    action TEXT NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE RESTRICT,
    FOREIGN KEY (moderator_id) REFERENCES users (id) ON DELETE SET NULL
);

-- Заполнение справочников
INSERT OR IGNORE INTO roles (id, name) VALUES (1, 'user'), (2, 'moderator'), (3, 'admin');
INSERT OR IGNORE INTO post_statuses (id, name) VALUES (1, 'pending'), (2, 'approved'), (3, 'rejected');

-- Индексы для оптимизации запросов и пагинации
CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts (author_id);
CREATE INDEX IF NOT EXISTS idx_posts_status_id_created_at_desc ON posts (status_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_id_created_at ON comments (post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_likes_user_post ON likes (user_id, post_id);

-- Тестовые данные для музыкального форума
INSERT OR IGNORE INTO users (id, username, display_name, password_hash, role_id) VALUES 
    (1, 'audiophile99', 'Alex', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1), -- Пароль: password
    (2, 'basshead', 'Max', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
    (3, 'admin', 'AdMin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 2);

INSERT OR IGNORE INTO posts (id, author_id, title, content, genre, image_path, status_id, likes_count, comments_count) VALUES 
    (1, 1, 'Настройка ViPER4Android', 'Ребят, кто как настраивает ViPER4Android для наушников KZ? Пытаюсь выжать максимум из звучания.', 'Audio', NULL, 2, 1, 1);

INSERT OR IGNORE INTO comments (post_id, author_id, content) VALUES 
    (1, 2, 'Попробуй пресеты для Poweramp, звучит намного чище и бас плотнее.');

INSERT OR IGNORE INTO likes (user_id, post_id) VALUES (2, 1);
