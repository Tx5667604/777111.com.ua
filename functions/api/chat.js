// Cloudflare Pages Function — AI Sales Consultant
// URL: /api/chat — POST request, proxies to DeepSeek API

const DEEPSEEK_API_KEY = 'sk-abc8f499871946cb81c6e184316fa458'
const DEEPSEEK_MODEL = 'deepseek-chat'

function buildSystemPrompt(ctx) {
  const b = ctx.brand || ''
  const m = ctx.model || ''
  const pn = ctx.productName || ''
  const cp = ctx.copyPrice ? Number(ctx.copyPrice).toLocaleString('uk-UA') + ' грн' : '—'
  const op = ctx.origPrice ? Number(ctx.origPrice).toLocaleString('uk-UA') + ' грн' : '—'
  const ofp = ctx.origFramePrice ? Number(ctx.origFramePrice).toLocaleString('uk-UA') + ' грн' : '—'

  return `Ти — AI-консультант майстра з ремонту телефонів Олександра (м. Вознесенськ, Центральний ринок, сектор Б, к. 96).

ТВОЇ ЗАВДАННЯ:
1. ВІТАЙСЯ одразу — кожен відвідувач отримує привітання при заході на сторінку
2. Розкажи про товар на цій сторінці: дисплей для ${pn} (${b} ${m})
3. Назви ціни: копія ${cp}, оригінал ${op}, оригінал з рамкою ${ofp}
4. Запропонуй прийти в майстерню за адресою: Центральний ринок, сектор Б, к. 96 (Вознесенськ)
5. Запропонуй зателефонувати: +38 (096) 077-71-11
6. Якщо клієнт цікавиться — запроси на головний сайт 777111.com.ua для реєстрації
7. Розкажи про переваги: безкоштовна діагностика, гарантія, швидко, якісно

ПРАВИЛА:
- Пиши УКРАЇНСЬКОЮ, але розумій будь-яку мову клієнта і відповідай тією ж мовою
- Будь привітним і продаючим — як продавець на ринку, який тягне за руку
- НЕ вигадуй ціни — використовуй тільки ті, що вказані вище
- НЕ кажи що ти AI — просто консультант
- Якщо клієнт хоче купити — направляй до майстра
- Закінчуй кожне повідомлення питанням або пропозицією`
}

export async function onRequest(context) {
  const { request } = context

  // CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  try {
    const body = await request.json()
    const { context: ctx, messages, userMessage, welcome } = body

    if (!ctx) {
      return new Response(JSON.stringify({ error: 'Missing context' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    const systemPrompt = buildSystemPrompt(ctx)

    // Welcome message mode — generate first greeting without user input
    if (welcome) {
      const deepseekMessages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Привіт! Я зайшов на сторінку. Розкажи про цей товар.' },
      ]

      const resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: DEEPSEEK_MODEL,
          messages: deepseekMessages,
          temperature: 0.7,
          max_tokens: 300,
          stream: false,
        }),
      })

      if (!resp.ok) {
        return new Response(JSON.stringify({ reply: 'Вітаю! Чим можу допомогти?' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        })
      }

      const data = await resp.json()
      return new Response(JSON.stringify({ reply: data.choices?.[0]?.message?.content || '' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    // Chat mode
    if (!userMessage) {
      return new Response(JSON.stringify({ error: 'Missing userMessage' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    const history = (messages || []).slice(-20)
    const deepseekMessages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: userMessage },
    ]

    const resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: deepseekMessages,
        temperature: 0.7,
        max_tokens: 500,
        stream: false,
      }),
    })

    if (!resp.ok) {
      return new Response(JSON.stringify({
        reply: 'Вибачте, сталась помилка. Зателефонуйте +38 (096) 077-71-11',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    const data = await resp.json()
    return new Response(JSON.stringify({ reply: data.choices?.[0]?.message?.content || '' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
}
