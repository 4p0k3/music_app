# Music Forum REST API

## 🚀 Как запустить
- **Встроенный PHP сервер:** Открой терминал в папке проекта и введи:
  `php -S localhost:8000`
  API будет доступно по адресу `http://localhost:8000/api/...`

---

## Endpoints и Примеры

#### 1. Регистрация
**POST** `/api/register`
*Входные данные (JSON):*
```json
{
  "username": "new_user",
  "password": "my_password",
  "display_name": "New User"
}```
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
*Выходные данные (200)*: Токен нужно передавать в заголовке Authorization: Bearer <token> для закрытых методов.
```json
{"token": "f2a3...длинный_токен...8b9"}
```

#### 3. Получить все посты (Открытый метод)
**GET** `/api/posts`
*Выходные данные (200):*
```json
[
  {
    "id": 1,
    "title": "Настройка ViPER4Android",
    "content": "Ребят, кто как настраивает ViPER4Android для наушников KZ? Пытаюсь выжать максимум из звучания.",
    "likes_count": 1,
    "comments_count": 1,
    "created_at": "2023-10-25 10:00:00",
    "author": "audiophile99"
  }
]
```

#### 4. Создать пост (Требуется Авторизация)
**POST** `/api/posts`
Headers: Authorization: Bearer <твой_токен>
*Входные данные (JSON):*
```json
{
  "title": "Тест усилителя",
  "content": "Взял новый портативный ЦАП, давайте обсудим!"
}
```
*Выходные данные (201):*
```json
{"message": "Пост создан", "id": 2}
```

#### 5. Лайкнуть пост (Требуется Авторизация)
**POST** `/api/posts/1/like`
Headers: Authorization: Bearer <твой_токен>
*Выходные данные (200):* (Тоггл: ставит лайк, если нет, и убирает, если есть)
```json
{"message": "Лайк поставлен"}
```

#### 6. Оставить комментарий (Требуется Авторизация)
**POST** `/api/posts/1/comments`
Headers: Authorization: Bearer <твой_токен>
*Входные данные (JSON):*
```json
{"content": "Крутой пост, спасибо!"}
```
*Выходные данные (201):*
```json
{"message": "Комментарий добавлен"}
```

#### 7. Получить комментарии поста (Открытый метод)
**GET** `/api/posts/1/comments``
*Выходные данные (200):*
```json
[
  {
    "id": 1,
    "content": "Попробуй пресеты для Poweramp, звучит намного чище и бас плотнее.",
    "created_at": "2023-10-25 10:05:00",
    "author": "basshead"
  }
]
```