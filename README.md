# DPaula — Sistema de Programação Diária de Equipamentos

Sistema web para substituir a planilha de controle diário de equipamentos, motoristas e obras.

## Como rodar

### 1. Banco de dados (Docker)

```bash
docker compose up -d
```

Isso sobe o PostgreSQL na porta 5432.

### 2. Backend (NestJS)

```bash
cd backend
cp .env.example .env   # já copiado
npm install
npm run start:dev
```

**Primeira execução — popular o banco:**
```bash
npm run seed
```

Cria: tipos de equipamento, obras, motoristas, equipamentos e o usuário admin:


Backend roda em: http://localhost:3001

### 3. Frontend (React 19)

```bash
cd frontend
npm install
npm run dev
```

Frontend roda em: http://localhost:5173

---

## Funcionalidades

| Tela | Descrição |
|------|-----------|
| `/login` | Login com email e senha |
| `/daily` | **Tela principal** — programação diária de todos os equipamentos |
| `/absences` | Registrar ausências de motoristas (doença, férias) |
| `/reports` | Histórico filtrável + export CSV |
| `/equipment` | Cadastro de equipamentos |
| `/drivers` | Cadastro de motoristas |
| `/work-sites` | Cadastro de obras |

### Programação diária
- Uma linha por equipamento ativo
- Selecione motorista + obra + observação inline
- **Auto-save** com debounce de 500ms
- Linhas sem alocação em amarelo claro
- Botão "Copiar de ontem"
- Motoristas ausentes ficam ocultos do dropdown
- Banner de aviso com ausentes do dia

---

## Stack

- **Frontend**: React 19 + Vite + TypeScript + Tailwind CSS
- **Backend**: NestJS + TypeORM + PostgreSQL
- **Auth**: JWT (access 15min) + Refresh Token (httpOnly cookie)

---

## Deploy (Railway)

1. Crie dois serviços no Railway: um para o backend, outro para o frontend
2. Adicione um PostgreSQL no Railway
3. Configure as variáveis de ambiente conforme `.env.example`
4. Para o backend: `npm run build && npm run start:prod`
5. Para o frontend: `npm run build` e sirva a pasta `dist/`
