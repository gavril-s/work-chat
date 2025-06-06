# Чат-приложение

## Обзор проекта

Данное веб-приложение представляет собой полнофункциональную платформу для обмена сообщениями в реальном времени с поддержкой приватных и групповых чатов. Приложение разработано с использованием современного стека технологий, включающего Go для бэкенда и React для фронтенда. Система обеспечивает безопасный обмен сообщениями с шифрованием данных, поддержку отправки файлов, а также возможность редактирования и удаления сообщений.

## Технологический стек

### Бэкенд
- **Язык программирования**: Go 1.23
- **Веб-фреймворк**: Gorilla Mux (маршрутизация HTTP-запросов)
- **WebSocket**: Gorilla WebSocket (обеспечение коммуникации в реальном времени)
- **Сессии**: Gorilla Sessions (управление пользовательскими сессиями)
- **Шифрование**: Стандартная библиотека Go для шифрования сообщений

### Фронтенд
- **Фреймворк**: React 18
- **Маршрутизация**: React Router
- **Стилизация**: Bootstrap 5
- **HTTP-клиент**: Fetch API
- **Сборка**: Webpack

### База данных
- **СУБД**: PostgreSQL 16
- **Схема**: Реляционная модель с таблицами для пользователей, чатов, сообщений и связей

### Инфраструктура
- **Контейнеризация**: Docker и Docker Compose
- **Веб-сервер**: Nginx (обратный прокси)
- **Многоэтапная сборка**: Оптимизированные Docker-образы

### Тестирование
- **Фаззинг-тесты**: Go fuzzing для тестирования граничных случаев
- **Тестовые сценарии**: Аутентификация, обмен сообщениями, работа с файлами

## Архитектура проекта

Проект построен по принципу многослойной архитектуры с четким разделением ответственности между компонентами:

```
chat/
├── cmd/                  # Точка входа в приложение
├── internal/             # Внутренние пакеты приложения
│   ├── app/              # Обработчики HTTP и WebSocket
│   ├── config/           # Конфигурация приложения
│   ├── domain/           # Модели данных
│   ├── service/          # Сервисный слой
│   │   ├── cipher/       # Сервис шифрования
│   │   └── memory/       # Сервис управления памятью и сессиями
│   ├── storage/          # Слой доступа к данным
│   └── utils/            # Вспомогательные утилиты
├── frontend/             # Фронтенд на React
│   ├── public/           # Статические файлы
│   └── src/              # Исходный код React
│       ├── components/   # React-компоненты
│       │   ├── Auth/     # Компоненты аутентификации
│       │   ├── Chat/     # Компоненты чата
│       │   └── Common/   # Общие компоненты
│       └── services/     # Сервисы для работы с API
├── fuzzy/                # Фаззинг-тесты
├── docker-compose.yml    # Конфигурация Docker Compose
├── Dockerfile            # Сборка бэкенда
├── Dockerfile.frontend   # Сборка фронтенда
├── nginx.conf            # Конфигурация Nginx
└── init.sql              # Инициализация базы данных
```

### Детальное описание компонентов

#### Бэкенд (Go)

1. **cmd/main.go**
   - Точка входа в приложение
   - Инициализация конфигурации
   - Подключение к базе данных
   - Запуск HTTP-сервера

2. **internal/app/**
   - **app.go**: Основная структура приложения, инициализация маршрутов
   - **api.go**: Обработчики REST API запросов
   - **ws_chat.go**: Обработчик WebSocket соединений для чатов
   - **api_file.go**: Обработчик для работы с файлами

3. **internal/config/**
   - **config.go**: Структуры и функции для загрузки конфигурации из YAML-файла

4. **internal/domain/**
   - **models.go**: Определение основных моделей данных (User, Chat, Message, Client)

5. **internal/service/**
   - **cipher/cipher.go**: Сервис для шифрования и дешифрования сообщений
   - **memory/memory.go**: Сервис для управления сессиями и WebSocket-клиентами

6. **internal/storage/**
   - **db.go**: Инициализация подключения к базе данных
   - **user.go**: Операции с пользователями
   - **chat.go**: Операции с чатами
   - **message.go**: Операции с сообщениями

7. **internal/utils/**
   - **utils.go**: Вспомогательные функции

#### Фронтенд (React)

1. **frontend/src/App.jsx**
   - Корневой компонент приложения
   - Настройка маршрутизации
   - Управление аутентификацией через контекст

2. **frontend/src/components/Auth/**
   - **Login.jsx**: Форма входа
   - **Register.jsx**: Форма регистрации

3. **frontend/src/components/Chat/**
   - **ChatList.jsx**: Список доступных чатов
   - **ChatWindow.jsx**: Окно чата с сообщениями
   - **CreatePrivateChat.jsx**: Создание приватного чата
   - **CreateGroupChat.jsx**: Создание группового чата
   - **MessageInput.jsx**: Компонент ввода сообщений

4. **frontend/src/components/Common/**
   - **Header.jsx**: Верхняя панель навигации
   - **Loading.jsx**: Индикатор загрузки

5. **frontend/src/services/**
   - **api.js**: Функции для работы с REST API и WebSocket

#### Инфраструктура

1. **docker-compose.yml**
   - Определение трех сервисов: база данных, бэкенд, фронтенд
   - Настройка сети и томов
   - Проверка здоровья сервисов

2. **Dockerfile**
   - Многоэтапная сборка бэкенда
   - Использование Alpine Linux для минимального размера образа

3. **Dockerfile.frontend**
   - Сборка React-приложения
   - Настройка Nginx для раздачи статических файлов

4. **nginx.conf**
   - Настройка обратного прокси
   - Маршрутизация запросов к API и WebSocket
   - Обработка SPA-маршрутизации

## Схема базы данных

База данных PostgreSQL содержит следующие таблицы:

1. **users** - Пользователи системы
   - `id`: Уникальный идентификатор (SERIAL PRIMARY KEY)
   - `username`: Имя пользователя (TEXT, UNIQUE)
   - `name`: Имя (TEXT)
   - `surname`: Фамилия (TEXT)
   - `patronymic`: Отчество (TEXT)
   - `password`: Хешированный пароль (TEXT)
   - `status`: Статус пользователя (TEXT, DEFAULT 'offline')
   - `last_active`: Время последней активности (TIMESTAMP)

2. **chats** - Чаты (приватные и групповые)
   - `id`: Уникальный идентификатор (SERIAL PRIMARY KEY)
   - `name`: Название чата (TEXT)
   - `is_private`: Флаг приватности (BOOLEAN)
   - `creator_id`: Создатель чата (INT, REFERENCES users)
   - `created_at`: Время создания (TIMESTAMP)

3. **messages** - Сообщения в чатах
   - `id`: Уникальный идентификатор (SERIAL PRIMARY KEY)
   - `chat_id`: Идентификатор чата (INT, REFERENCES chats)
   - `user_id`: Идентификатор отправителя (INT, REFERENCES users)
   - `content`: Содержимое сообщения (TEXT)
   - `created_at`: Время отправки (TIMESTAMP)
   - `file_name`: Имя прикрепленного файла (TEXT)
   - `file_content`: Содержимое файла в base64 (TEXT)

4. **chat_users** - Связь между пользователями и чатами
   - `chat_id`: Идентификатор чата (INT, REFERENCES chats)
   - `user_id`: Идентификатор пользователя (INT, REFERENCES users)
   - `last_chat_visit`: Время последнего посещения чата (TIMESTAMP)
   - Составной первичный ключ (chat_id, user_id)

## Безопасность

### Аутентификация и авторизация
- Хеширование паролей с использованием bcrypt
- Сессионная аутентификация с использованием cookie
- Проверка прав доступа к чатам и сообщениям

### Шифрование данных
- Шифрование сообщений перед сохранением в базу данных
- Дешифрование сообщений перед отправкой клиенту
- Использование AES-256 для шифрования

## API-эндпоинты

### Аутентификация
- `POST /api/login` - Вход в систему
- `POST /api/register` - Регистрация нового пользователя
- `POST /api/logout` - Выход из системы

### Чаты
- `GET /api/chats` - Получение списка доступных чатов
- `GET /api/chat/{id}` - Получение информации о чате и его сообщениях
- `POST /api/create_private_chat` - Создание приватного чата
- `POST /api/create_group_chat` - Создание группового чата
- `GET /api/create_private_chat` - Получение списка пользователей для создания чата
- `GET /api/create_group_chat` - Получение списка пользователей для создания группового чата

### Сообщения
- `POST /api/edit-message` - Редактирование сообщения
- `POST /api/delete-message` - Удаление сообщения
- `GET /api/files/{id}` - Получение файла, прикрепленного к сообщению

### WebSocket
- `WS /ws/chat/{id}` - WebSocket-соединение для обмена сообщениями в реальном времени

## WebSocket-коммуникация

WebSocket используется для обеспечения обмена сообщениями в реальном времени. Основные особенности:

1. **Установка соединения**
   - Клиент устанавливает WebSocket-соединение с сервером по URL `/ws/chat/{id}`
   - Сервер проверяет аутентификацию и права доступа к чату

2. **Обмен сообщениями**
   - Клиент отправляет сообщения в формате JSON
   - Сервер шифрует сообщение и сохраняет в базу данных
   - Сервер рассылает сообщение всем подключенным клиентам в дешифрованном виде

3. **Типы сообщений**
   - Обычные текстовые сообщения
   - Сообщения с прикрепленными файлами
   - Уведомления о редактировании сообщений
   - Уведомления об удалении сообщений

4. **Обработка ошибок**
   - Автоматическое восстановление соединения при разрыве
   - Логирование ошибок на сервере

## Особенности реализации

### Бэкенд

1. **Многослойная архитектура**
   - Разделение на слои: обработчики, сервисы, хранилище
   - Четкие интерфейсы между слоями

2. **Управление сессиями**
   - Использование cookie для хранения идентификатора сессии
   - Хранение данных сессии на сервере

3. **Работа с WebSocket**
   - Хранение активных соединений в памяти
   - Группировка клиентов по чатам для эффективной рассылки

4. **Шифрование**
   - Симметричное шифрование сообщений
   - Хранение ключа шифрования в конфигурации

### Фронтенд

1. **Компонентный подход**
   - Разделение интерфейса на переиспользуемые компоненты
   - Использование функциональных компонентов и хуков React

2. **Управление состоянием**
   - Использование React Context для глобального состояния аутентификации
   - Локальное состояние компонентов для UI

3. **Работа с API**
   - Централизованные функции для работы с API
   - Обработка ошибок и индикация загрузки

4. **WebSocket-интеграция**
   - Установка соединения при входе в чат
   - Обработка различных типов сообщений
   - Автоматическое обновление UI при получении сообщений

## Тестирование

### Фаззинг-тесты

Проект включает фаззинг-тесты для проверки устойчивости к некорректным входным данным:

1. **auth_fuzz_test.go**
   - Тестирование процесса аутентификации
   - Проверка обработки некорректных учетных данных

2. **message_fuzz_test.go**
   - Тестирование обработки сообщений
   - Проверка граничных случаев в содержимом сообщений

3. **file_fuzz_test.go**
   - Тестирование загрузки файлов
   - Проверка обработки различных типов файлов и размеров

## Установка и запуск

### Требования
- Docker
- Docker Compose

### Локальный запуск

1. Клонирование репозитория:
```bash
git clone <url-репозитория>
cd chat
```

2. Запуск с помощью Docker Compose:
```bash
docker-compose up --build
```

3. Доступ к приложению:
   - Веб-интерфейс: http://localhost
   - API: http://localhost/api
   - База данных: localhost:5432 (доступна только локально)

### Разработка

1. Запуск бэкенда:
```bash
go run cmd/main.go
```

2. Запуск фронтенда:
```bash
cd frontend
npm install
npm run dev
```

## Функциональные возможности

### Пользовательские функции

1. **Аутентификация**
   - Регистрация новых пользователей
   - Вход в систему
   - Выход из системы

2. **Управление чатами**
   - Просмотр списка доступных чатов
   - Создание приватных чатов с другими пользователями
   - Создание групповых чатов с несколькими участниками
   - Просмотр участников чата и их статуса

3. **Обмен сообщениями**
   - Отправка текстовых сообщений
   - Отправка файлов
   - Редактирование своих сообщений
   - Удаление своих сообщений
   - Просмотр истории сообщений

4. **Уведомления**
   - Индикация непрочитанных сообщений
   - Браузерные уведомления о новых сообщениях
   - Отображение статуса пользователей (онлайн/оффлайн)

### Технические особенности

1. **Реальное время**
   - Мгновенная доставка сообщений через WebSocket
   - Обновление статуса сообщений (редактирование, удаление)

2. **Безопасность**
   - Шифрование сообщений в базе данных
   - Защита от несанкционированного доступа к чатам
   - Безопасное хранение паролей

3. **Производительность**
   - Оптимизированные запросы к базе данных
   - Эффективная работа с WebSocket-соединениями
   - Кэширование данных на клиенте

## Заключение

Данное чат-приложение представляет собой полнофункциональную платформу для обмена сообщениями с современной архитектурой и широким набором возможностей. Проект демонстрирует использование различных технологий и подходов к разработке веб-приложений, включая:

- Многослойную архитектуру бэкенда на Go
- Современный фронтенд на React
- Реализацию коммуникации в реальном времени через WebSocket
- Обеспечение безопасности с шифрованием данных
- Контейнеризацию с использованием Docker

Приложение может быть расширено дополнительными функциями, такими как поддержка аудио/видео сообщений, групповые звонки, поиск по сообщениям и другие возможности современных мессенджеров.
