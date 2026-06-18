# yellow-luke-2

Discord-бот для мониторинга JKA-серверов: статус-сообщения, slash-команды управления серверами и автоматическое переименование текстового канала с количеством активных игроков.

## Требования

- Node.js >= 22.12.0
- Discord-бот с токеном и включёнными Server Members / Guilds intents

## Запуск локально

```bash
cp .env.example .env   # заполнить DISCORD_TOKEN, CLIENT_ID
npm install
npm run start:dev      # или npm start
```

## Запуск в Docker

```bash
cp .env.example .env   # заполнить DISCORD_TOKEN, CLIENT_ID
docker compose up -d --build
```

## Переменные окружения

См. `.env.example`:

- `DISCORD_TOKEN` — токен бота
- `CLIENT_ID` — id приложения/бота (для регистрации slash-команд)
- `EMOJI_GUILD_ID` — (опц.) id гильдии с эмодзи-«точкой» онлайна

## Файлы данных (не в git)

Рантайм-данные хранятся в JSON-файлах рядом с проектом и примонтированы в контейнер (`docker-compose.yml`). Они намеренно не в git (`.gitignore`), поэтому оператор должен подготовить их на хосте.

| Файл | Mount | Обязателен для приложения |
| --- | --- | --- |
| `servers.json` | rw | да |
| `mapUrl.json` | ro | да |
| `textChannelPlayers.json` | rw | нет |

### Нюанс: `textChannelPlayers.json` и Docker bind-mount

В самом коде этот файл **необязателен**: при отсутствии он читается как пустой список, а при первом обновлении канала создаётся автоматически. Это работает при локальном запуске (`npm start`).

Но в Docker bind-mount `./textChannelPlayers.json:/app/textChannelPlayers.json` ведёт себя иначе: **если файла на хосте нет, Docker создаст на его месте директорию**, и тогда чтение/запись упадут с `EISDIR`. Поэтому перед первым `docker compose up` файл нужно создать вручную:

```bash
echo '[]' > textChannelPlayers.json
docker compose up -d --build
```

После этого приложение само поддерживает файл актуальным.
