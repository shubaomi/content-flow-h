import { config } from 'dotenv'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

// 显式从项目根目录加载 .env（不依赖 process.cwd()）
const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dirname, '..', '.env') })

import express from 'express'
import cors from 'cors'
import OpenAI from 'openai'
import { readFileSync } from 'fs'
import { join as pathJoin } from 'path'
import { homedir } from 'os'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json({ limit: '1mb' }))

// 读取 content-risk-detector skill 的规则文件
function loadSkillRules(): string {
  // Docker 中挂载到 /skills，本地开发时通过环境变量或默认路径查找
  const skillDir = process.env.SKILLS_DIR || pathJoin(homedir(), '.claude', 'skills', 'content-risk-detector', 'references')
  const files = [
    'common-rules.md',
    'douyin-specific.md',
    'xiaohongshu-specific.md',
    'shipinhao-specific.md',
  ]

  const rules: string[] = []
  for (const file of files) {
    try {
      const content = readFileSync(pathJoin(skillDir, file), 'utf-8')
      rules.push(`## ${file}\n\n${content}`)
    } catch {
      console.warn(`[server] 无法读取规则文件: ${file}`)
    }
  }

  return rules.join('\n\n---\n\n')
}

// 构造 system prompt
function buildSystemPrompt(): string {
  const rules = loadSkillRules()

  return `你是一位专业的短视频内容合规审查专家，精通抖音、小红书、视频号三大平台的社区规范。
你的任务是分析用户提供的短视频逐字稿，识别潜在违规风险。

## 规则库

${rules}

## 输出格式

你必须返回一个 JSON 数组，每个元素代表一个风险发现。如果没有发现风险，返回空数组 []。

每个风险发现的格式：
{
  "rule": "风险类别（如 虚假宣传、恶意导流、无资质医疗建议 等）",
  "level": "风险等级，只能是以下之一：critical（严重/红色）、high（高/橙色）、medium（中/黄色）、low（低/蓝色）",
  "evidence": "逐字稿中的问题原文片段（必须精确引用原文）",
  "message": "为什么有风险的说明（1-2句话）",
  "suggestion": "具体的修改建议"
}

## 判定原则

1. 每个风险点必须引用原文片段作为证据
2. 不只指出问题，更要给出具体可行的修改方案
3. 避免过度敏感，正常内容不要误判
4. 对于模糊情况，标注级别为 medium 或 low，而非 high
5. 最多返回 10 个风险发现，按严重程度从高到低排序

## 用户输入

用户会提供一段短视频逐字稿文本，请分析并返回 JSON 数组。

重要：你的回复必须是纯 JSON 数组，不要包含任何其他文字、markdown 标记或代码块标记。`
}

// 初始化 OpenAI 客户端（兼容 DeepSeek）
function getClient(): OpenAI {
  const apiKey = process.env.DEEPSEEK_API_KEY
  const baseURL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'

  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY 未设置。请在环境变量或 .env 文件中配置。')
  }

  return new OpenAI({ apiKey, baseURL })
}

async function detectRisk(content: string) {
  const client = getClient()
  const systemPrompt = buildSystemPrompt()

  const response = await client.chat.completions.create({
    model: 'deepseek-v4-flash',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `请检查以下短视频逐字稿的内容合规风险：\n\n${content}` },
    ],
    temperature: 0.1,
    max_tokens: 4096,
  })

  const text = response.choices[0]?.message?.content?.trim() || '[]'

  // 尝试提取 JSON（处理模型可能包裹 markdown 代码块的情况）
  let jsonText = text
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) {
    jsonText = jsonMatch[1].trim()
  }

  try {
    return JSON.parse(jsonText)
  } catch {
    console.error('[server] JSON 解析失败，原始响应:', text)
    throw new Error('AI 返回格式异常，请重试')
  }
}

// API 路由
app.post('/api/detect-risk', async (req, res) => {
  const { content } = req.body as { content?: string }

  if (!content || typeof content !== 'string' || !content.trim()) {
    res.status(400).json({ error: '请提供要检测的文本内容' })
    return
  }

  try {
    const findings = await detectRisk(content)
    res.json(findings)
  } catch (error) {
    const message = error instanceof Error ? error.message : '检测失败'
    console.error('[server] 检测错误:', message)
    res.status(500).json({ error: message })
  }
})

// 健康检查
app.get('/api/health', (_req, res) => {
  const apiKey = process.env.DEEPSEEK_API_KEY
  res.json({
    status: 'ok',
    deepseekConfigured: !!apiKey,
    rulesLoaded: !!process.env.DEEPSEEK_API_KEY,
  })
})

app.listen(PORT, () => {
  console.log(`[server] 内容风险检测 API 运行在 http://localhost:${PORT}`)
  console.log(`[server] DeepSeek API: ${process.env.DEEPSEEK_API_KEY ? '已配置' : '未配置'}`)
})
