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
  "token": "your_token"
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

### JSON

```json
{
  "username": "fox",
  "password": "123456",
  "display_name": "Fox"
}
```

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
  "token": "very_long_token"
}
```

---

# USERS

## GET `/api/user`

Текущий пользователь.

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
  "avatar_url": "/view/upload_xxx.png",
  "role_id": 1
}
```

---

## GET `/api/user/{id}`

Публичный профиль пользователя.

---

## POST `/api/user/edit`

Редактирование профиля.

Поддерживает:
- multipart/form-data
- application/json

### Поля

| Поле | Тип |
|---|---|
| username | string |
| display_name | string |
| avatar | image |

---

# POSTS

## GET `/api/posts`

Получить список постов.

### Query params

| Параметр | Описание |
|---|---|
| genre | Фильтр по жанру |
| author_id | ID автора |
| page | Номер страницы |
| limit | Лимит |

### Ответ

```json
{
  "page": 1,
  "limit": 10,
  "total": 52,
  "pages": 6,
  "data": []
}
```

---

## GET `/api/posts/{id}`

Получить один пост.

---

## POST `/api/posts`

Создать пост.

### Поля

| Поле | Тип |
|---|---|
| title | string |
| content | string |
| genre | string |
| image | image |

---

## DELETE `/api/posts/{id}`

Удаление поста.

Доступ:
- автор
- администратор

---

# COMMENTS

## GET `/api/posts/{id}/comments`

Получить комментарии.

---

## POST `/api/posts/{id}/comments`

Создать комментарий.

### JSON

```json
{
  "content": "Крутой пост"
}
```

---

## DELETE `/api/comments/{id}`

Удалить комментарий.

---

# LIKES

## POST `/api/posts/{id}/like`

Поставить/убрать лайк.

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
- banned users не могут логиниться
- MIME type validation
- защита от SQL injection
- pagination metadata
- transactions для лайков и комментариев

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
| 409 | Конфликт |
| 500 | Ошибка сервера |

