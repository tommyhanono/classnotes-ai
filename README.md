# 📒 ClassNotes AI

Toma apuntes de clase automáticamente con inteligencia artificial. Presiona un botón cuando habla la profesora — la app transcribe su voz y genera apuntes organizados con Claude AI cada 60 segundos.

## Requisitos

- **Google Chrome** — el Web Speech API solo funciona en Chrome
- **Anthropic API key** — obtén una gratis en [console.anthropic.com](https://console.anthropic.com)

## Cómo usar

1. Abre la app en Google Chrome
2. Ingresa el nombre de la materia y tu API key de Anthropic
3. Haz clic en **"Comenzar clase →"**
4. Presiona el botón verde **"🎙️ PROFESORA HABLANDO"** cada vez que hable la profesora
5. Los apuntes se generan automáticamente cada 60 segundos (o toca **"✨ Procesar ahora"**)
6. Al terminar, exporta a Word (.docx) o copia como Markdown

## Deploy propio

```bash
git clone https://github.com/tommyhanono/classnotes-ai.git
cd classnotes-ai
npm install
npm run deploy
```

## Privacidad

Tu API key se guarda **solo en tu dispositivo** (localStorage). Nunca pasa por ningún servidor — las llamadas van directo de tu navegador a `api.anthropic.com`.

## 🔗 Links

- **App en vivo:** https://tommyhanono.github.io/classnotes-ai/
- **Repositorio:** https://github.com/tommyhanono/classnotes-ai
