# Music Forum REST API

## 🚀 Как запустить
- **Встроенный PHP сервер:** Открой терминал в папке проекта и введи:
  `php -S localhost:8000`
  API будет доступно по адресу `http://localhost:8000/api/...`

---

## Endpoints и Примеры

### AUTH

#### 1. Регистрация
**POST** `/api/register`
*Входные данные (JSON):*
```json
{
  "username": "new_user",
  "password": "my_password",
  "display_name": "New User"
}
```
*Выходные данные (201):*
```json
{"message": "Пользователь зарегистрирован"}
```

#### 2. Логин
**POST** `/api/login`
*Входные данные (JSON):*
```json
{
  "username": "audiophile99",
  "password": "password"
}
```
*Выходные данные (200):* Токен нужно передавать в заголовке `Authorization: Bearer <token>` для закрытых методов.
```json
{"token": "f2a3...длинный_токен...8b9"}
```

---

### USERS

#### 3. Получить профиль текущего пользователя
**GET** `/api/user`
Headers: `Authorization: Bearer <токен>`

*Выходные данные (200):*
```json
{
  "id": 1,
  "username": "audiophile99",
  "display_name": "Alex",
  "avatar_url": "/view/avatar_653b4c1a.png"
}
```

#### 4. Получить публичный профиль пользователя по ID
**GET** `/api/user/{id}`

*Выходные данные (200):*
```json
{
  "id": 1,
  "username": "audiophile99",
  "display_name": "Alex",
  "avatar_url": "/view/avatar_653b4c1a.png"
}
```

#### 5. Редактировать профиль текущего пользователя
**POST** `/api/user/edit`
Headers: `Authorization: Bearer <токен>`

Принимает `multipart/form-data` (для загрузки аватарки) или `application/json`.

*Входные данные:*
```
display_name  (string, опционально)
username      (string, опционально)
avatar        (file: jpg/jpeg/png/gif/webp, опционально)
```

*Выходные данные (200):*
```json
{
  "message": "Профиль успешно обновлен",
  "user": {
    "id": 1,
    "username": "audiophile99",
    "display_name": "Alex",
    "avatar_url": "/view/avatar_6abc123.png"
  }
}
```

---

### POSTS

#### 6. Получить все посты
**GET** `/api/posts`

Поддерживает query-параметры:
| Параметр    | Тип    | Описание                             |
|-------------|--------|--------------------------------------|
| `genre`     | string | Фильтр по жанру                      |
| `author_id` | int    | Фильтр по ID автора                  |
| `page`      | int    | Номер страницы (по умолчанию: 1)     |
| `limit`     | int    | Постов на страницу (по умолчанию: 10, макс: 100) |

Headers (опционально): `Authorization: Bearer <токен>` — включает поле `is_liked`

*Выходные данные (200):*
```json
[
  {
    "id": 1,
    "title": "Настройка ViPER4Android",
    "content": "Ребят, кто как настраивает ViPER4Android для наушников KZ?",
    "genre": "Audio",
    "image_path": null,
    "likes_count": 1,
    "comments_count": 1,
    "created_at": "2023-10-25 10:00:00",
    "author": "audiophile99",
    "is_liked": false
  }
]
```

#### 7. Получить один пост
**GET** `/api/posts/{id}`

Headers (опционально): `Authorization: Bearer <токен>` — включает поле `is_liked`

*Выходные данные (200):* Структура аналогична одному объекту из п. 6.

#### 8. Создать пост
**POST** `/api/posts`
Headers: `Authorization: Bearer <токен>`

Принимает `multipart/form-data` (для загрузки изображения) или `application/json`.

*Входные данные:*
```
title    (string, обязательно)
content  (string, обязательно)
genre    (string, опционально)
image    (file: jpg/jpeg/png/gif/webp, опционально)
```

*Выходные данные (201):*
```json
{
  "message": "Пост создан",
  "id": 2,
  "genre": "Rock",
  "image_path": "/view/post_654b2c1d.jpg"
}
```

---

### LIKES

#### 9. Поставить / убрать лайк
**POST** `/api/posts/{id}/like`
Headers: `Authorization: Bearer <токен>`

Тоггл: ставит лайк, если его нет, и убирает, если есть.

*Выходные данные (200):*
```json
{
  "message": "Лайк поставлен",
  "is_liked": true,
  "likes_count": 2
}
```

---

### COMMENTS

#### 10. Получить комментарии поста
**GET** `/api/posts/{id}/comments`

*Выходные данные (200):*
```json
[
  {
    "id": 1,
    "content": "Попробуй пресеты для Poweramp, звучит намного чище.",
    "created_at": "2023-10-25 10:05:00",
    "author": "basshead"
  }
]
```

#### 11. Оставить комментарий
**POST** `/api/posts/{id}/comments`
Headers: `Authorization: Bearer <токен>`

*Входные данные (JSON):*
```json
{"content": "Крутой пост, спасибо!"}
```

*Выходные данные (201):*
```json
{"message": "Комментарий добавлен"}
```

---

## Коды ошибок

| Код | Описание                                   |
|-----|--------------------------------------------|
| 400 | Неверные входные данные                    |
| 401 | Требуется авторизация / неверный токен     |
| 404 | Ресурс не найден                           |
| 409 | Конфликт (например, никнейм уже занят)     |
| 500 | Внутренняя ошибка сервера                  |
