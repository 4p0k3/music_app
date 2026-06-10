# Music Forum REST API

REST API музыкального форума на PHP + SQLite.

## Возможности

- Регистрация и авторизация
- Bearer Token authentication
- Публикация постов
- Комментарии
- Лайки
- Загрузка изображений
- Pagination
- Soft delete
- Редактирование профиля
- Административные функции (бан/разбан)
- SQLite database
- JSON REST API

---

# Стек

- PHP 8+
- SQLite
- PDO
- JSON API

---

# Запуск

```bash
php -S localhost:8000
```

API:

```text
http://localhost:8000/api/
```

---

# Структура проекта

```text
project/
│
├── index.php
├── schema.sql
├── database.sqlite
├── README.md
│
└── view/
    ├── upload_xxx.png
    └── upload_xxx.jpg
```

---

# Авторизация

После логина сервер возвращает токен:

```json
{
  "token": "your_token",
  "id": 1
}
```

Передавать его нужно так:

```http
Authorization: Bearer your_token
```

---

# API Endpoints

# AUTH

## POST `/api/register`

Регистрация пользователя.

Принимает `multipart/form-data`.

### Поля

| Поле | Тип | Обязательно |
|---|---|---|
| username | string | ✓ |
| display_name | string | ✓ |
| password | string | ✓ |
| avatar | image | — |

### Ответ

```json
{
  "message": "Пользователь зарегистрирован"
}
```

---

## POST `/api/login`

Авторизация.

### JSON

```json
{
  "username": "fox",
  "password": "123456"
}
```

### Ответ

```json
{
  "token": "very_long_token",
  "id": 1
}
```

---

# USERS

## GET `/api/user`

Текущий пользователь (требует авторизации).

### Headers

```http
Authorization: Bearer token
```

### Ответ

```json
{
  "id": 1,
  "username": "fox",
  "display_name": "Fox",
  "avatar_url": "/view/avatar_xxx.png",
  "role_id": 1,
  "created_at": "2024-01-01 00:00:00"
}
```

---

## GET `/api/user/{id}`

Публичный профиль пользователя. Забаненные и удалённые пользователи не возвращаются.

### Ответ

```json
{
  "id": 1,
  "username": "fox",
  "display_name": "Fox",
  "avatar_url": "/view/avatar_xxx.png",
  "created_at": "2024-01-01 00:00:00"
}
```

---

## GET `/api/user/{id}/posts`

Все посты конкретного пользователя (включая удалённые не фильтруются на этом эндпоинте).

### Ответ

Массив постов.

---

## POST `/api/user/edit`

Редактирование профиля текущего пользователя.

Поддерживает:
- `multipart/form-data`
- `application/json`

### Поля

| Поле | Тип |
|---|---|
| username | string |
| display_name | string |
| avatar | image |

### Ответ

```json
{
  "message": "Профиль успешно обновлен",
  "user": {
    "id": 1,
    "username": "fox",
    "display_name": "Fox",
    "avatar_url": "/view/avatar_xxx.png"
  }
}
```

---

# POSTS

## GET `/api/posts`

Получить список постов. Возвращает только активные посты (`status_id = 2`) незабаненных пользователей. Если передан токен, в каждом посте присутствует поле `is_liked`.

### Query params

| Параметр | Описание |
|---|---|
| genre | Фильтр по жанру |
| author_id | ID автора |
| search | Поиск по заголовку и тексту (поддерживает несколько слов) |
| page | Номер страницы (по умолчанию: 1) |
| limit | Лимит постов на страницу (по умолчанию: 10, максимум: 100) |

### Ответ

Массив постов:

```json
[
  {
    "id": 1,
    "title": "Заголовок",
    "content": "Текст",
    "genre": "Рок",
    "image_path": "/view/post_xxx.jpg",
    "likes_count": 5,
    "comments_count": 2,
    "created_at": "2024-01-01 00:00:00",
    "author": "fox",
    "is_liked": false
  }
]
```

---

## GET `/api/posts/{id}`

Получить один пост. Включает данные автора.

### Ответ

```json
{
  "id": 1,
  "author_id": 1,
  "title": "Заголовок",
  "content": "Текст",
  "genre": "Рок",
  "image_path": "/view/post_xxx.jpg",
  "likes_count": 5,
  "comments_count": 2,
  "created_at": "2024-01-01 00:00:00",
  "username": "fox",
  "display_name": "Fox",
  "avatar_url": "/view/avatar_xxx.png"
}
```

---

## POST `/api/posts`

Создать пост. Требует авторизации.

### Поля

| Поле | Тип | Обязательно |
|---|---|---|
| title | string | ✓ |
| content | string | ✓ |
| genre | string | — (по умолчанию: General) |
| image | image | — |

### Ответ

```json
{
  "message": "Пост создан",
  "id": 1,
  "genre": "Рок",
  "image_path": "/view/post_xxx.jpg"
}
```

---

## DELETE `/api/posts/{id}`

Мягкое удаление поста.

Доступ:
- автор поста
- пользователь с `role_id >= 2` (модератор/администратор)

---

# COMMENTS

## GET `/api/posts/{id}/comments`

Получить комментарии поста. Комментарии забаненных и удалённых пользователей не возвращаются.

### Ответ

```json
[
  {
    "id": 1,
    "content": "Крутой пост",
    "created_at": "2024-01-01 00:00:00",
    "author_id": 2,
    "author": "wolf",
    "author_avatar": "/view/avatar_xxx.png"
  }
]
```

---

## POST `/api/posts/{id}/comments`

Создать комментарий. Требует авторизации.

### JSON

```json
{
  "content": "Крутой пост"
}
```

---

## DELETE `/api/comments/{id}`

Удалить комментарий. Доступ: автор комментария или пользователь с `role_id >= 2`.

---

# LIKES

## POST `/api/posts/{id}/like`

Поставить или убрать лайк (toggle). Требует авторизации.

### Ответ

```json
{
  "message": "Лайк поставлен",
  "is_liked": true,
  "likes_count": 6
}
```

---

# ADMIN

Все эндпоинты требуют авторизации и `role_id >= 2`.

## GET `/api/admin/users`

Список всех незадалённых пользователей.

### Ответ

```json
[
  {
    "id": 1,
    "username": "fox",
    "display_name": "Fox",
    "is_banned": 0,
    "created_at": "2024-01-01 00:00:00"
  }
]
```

---

## POST `/api/admin/users/{id}/ban`

Забанить пользователя.

### Ответ

```json
{
  "message": "Пользователь забанен"
}
```

---

## POST `/api/admin/users/{id}/unban`

Разбанить пользователя.

### Ответ

```json
{
  "message": "Пользователь разбанен"
}
```

---

# Поддерживаемые изображения

- JPG
- JPEG
- PNG
- GIF
- WEBP

---

# Валидация

## Username
- минимум: 3
- максимум: 32

## Password
- минимум: 6
- максимум: 128

## Post content
- максимум: 10000

## Comment content
- максимум: 3000

---

# Особенности

- soft delete вместо полного удаления
- забаненные пользователи не могут логиниться
- MIME type validation для загружаемых файлов
- защита от SQL injection через PDO prepared statements
- транзакции для лайков и комментариев
- `is_liked` в списке постов при авторизованном запросе

---

# HTTP Codes

| Код | Описание |
|---|---|
| 200 | Успешно |
| 201 | Создано |
| 400 | Неверные данные |
| 401 | Не авторизован |
| 403 | Доступ запрещён |
| 404 | Не найдено |
| 409 | Конфликт (например, никнейм занят) |
| 500 | Ошибка сервера |