# Fieldnote

A lightweight AI chatbot built with a static web frontend and a serverless backend powered by Groq.

## Overview

Fieldnote is a simple, deployable AI chatbot that provides conversational responses through a web-based interface.

The project uses a serverless backend to securely communicate with the Groq API while keeping the API key away from the client-side code.

## Features

- Clean web-based chat interface
- AI-powered conversational responses
- Serverless backend using Cloudflare Workers
- Secure API key handling through environment secrets
- Conversation history during the current session
- Responsive interface
- Deployable using GitHub Pages and Cloudflare Workers

## Tech Stack

**Frontend**
- HTML
- CSS
- JavaScript

**Backend**
- Cloudflare Workers
- JavaScript

**AI**
- Groq API
- `openai/gpt-oss-20b`

**Deployment**
- GitHub Pages
- Cloudflare Workers

## Architecture

```text
User
  │
  ▼
chatbot.html
  │
  │ POST /chat
  ▼
Cloudflare Worker
  │
  │ GROQ_API_KEY
  ▼
Groq API
  │
  ▼
AI Response
  │
  ▼
chatbot.html
