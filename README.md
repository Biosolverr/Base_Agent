# Base Agent 🔍

ИИ агент для анализа кошельков и торговых сигналов на Base L2.
Полностью бесплатно: GitHub Actions (бэкенд) + Vercel (фронт).

## Стек

| Часть | Технология | Цена |
|-------|-----------|------|
| Бэкенд / cron | GitHub Actions | Бесплатно |
| Onchain данные | Basescan API | Бесплатно |
| ИИ анализ | Grok (xAI) или GLM-4-flash | Ключи свои |
| Фронтенд | Next.js на Vercel | Бесплатно |

## Структура репозитория

```
base-agent/
├── .github/workflows/agent.yml   # cron-агент
├── agent/
│   ├── index.js                  # точка входа
│   ├── chain.js                  # Basescan API
│   ├── ai.js                     # Grok / GLM
│   └── package.json
├── frontend/                     # Next.js на Vercel
│   └── app/
│       ├── api/report/route.js   # читает отчёт из GitHub
│       ├── api/trigger/route.js  # запускает агент вручную
│       ├── page.js
│       └── page.module.css
└── reports/                      # JSON отчёты (коммитятся ботом)
    └── 0xADDRESS.json
```

## Шаг 1 — GitHub репозиторий

1. Создай новый репо на GitHub (публичный или приватный)
2. Загрузи весь код
3. Добавь **GitHub Secrets** (`Settings → Secrets → Actions`):

| Secret | Значение |
|--------|---------|
| `GROK_API_KEY` | ключ от xAI |
| `GLM_API_KEY` | ключ от ZhipuAI |
| `AI_PROVIDER` | `grok` или `glm` |
| `ETHERSCAN_API_KEY` | ключ от basescan.org |
| `WALLETS` | `["0xАДРЕС1","0xАДРЕС2"]` |

4. Создай **Fine-grained token** (`Settings → Developer settings → Personal access tokens`):
   - Repository: твой репо
   - Permissions: `Contents: Read & Write`, `Actions: Read & Write`
   - Скопируй токен — понадобится для Vercel

## Шаг 2 — Vercel

1. Зайди на vercel.com → New Project → Import Git Repository
2. **Root Directory** укажи: `frontend`
3. Добавь **Environment Variables**:

| Variable | Значение |
|----------|---------|
| `GITHUB_RAW_BASE` | `https://raw.githubusercontent.com/USER/REPO/main/reports` |
| `GITHUB_TOKEN` | токен из шага выше |
| `GITHUB_REPO` | `username/repo-name` |

4. Deploy ✓

## Как работает

1. **Cron**: каждые 6 часов GitHub Actions берёт адреса из `WALLETS` секрета → запрашивает Basescan → отдаёт данные в Grok/GLM → сохраняет JSON в `reports/` → коммитит
2. **Фронт**: пользователь вводит адрес → Vercel читает `reports/0xADDRESS.json` напрямую из GitHub Raw
3. **Если адрес новый**: фронт триггерит GitHub Actions через API → агент запускается сразу

## Получить API ключи (бесплатно)

- **Basescan**: https://basescan.org/apis — регистрация, бесплатный tier
- **Grok**: https://console.x.ai — стартовые кредиты бесплатно
- **GLM**: https://open.bigmodel.cn — glm-4-flash бесплатная квота

## Локальный запуск агента

```bash
cd agent
npm install
GROK_API_KEY=xxx ETHERSCAN_API_KEY=xxx AI_PROVIDER=grok WALLETS='["0xYOUR_ADDRESS"]' node index.js
```
