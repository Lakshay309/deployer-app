# 🚀 YOUR PROJECT NAME

A full-stack platform to deploy React applications straight from a GitHub repository. Paste a GitHub URL, and the platform clones, builds, and deploys your app automatically — with real-time log streaming so you can watch every step as it happens. Deployed projects are instantly accessible on their own subdomain.

> 🔒 Currently in **closed beta** — admin approval required to access the platform.

---

## 📦 Project Structure

```
deployer-app/
├── api-server/           # REST API — project management & deployment triggers
├── log-server/           # WebSocket server — streams live CloudWatch logs
├── reverse-proxy/        # Subdomain-based reverse proxy to serve deployed apps
├── builder-server/       # Deployed on AWS ECS — runs the build & upload pipeline
│   ├── builder/          # Clones the GitHub repo and builds the React app
│   └── uploader/         # Uploads build output to S3 & updates deployment status in DB
├── frontend/             # Next.js frontend — dashboard for projects & deployments
└── package.json          # Root package.json with monorepo dev script
```

---

## ⚙️ How It Works

1. User registers and waits for **admin approval** before accessing the platform
2. Once approved, user submits a GitHub repo URL from the frontend dashboard
3. **API Server** creates a deployment record in the database and spins up an **AWS ECS task** using a Docker image
4. The ECS task runs two containers from the **builder-server**:
   - **builder** — clones the repo and runs `npm run build`
   - **uploader** — uploads the build output to **AWS S3** and updates the deployment status in the database
5. Both containers write logs to **AWS CloudWatch**
6. **Log Server** polls CloudWatch and streams logs in real-time via **WebSocket** to the frontend
7. Once deployed, the app is live at `projectname.localhost:8000` served by the **Reverse Proxy**

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, Tailwind CSS |
| API Server | Node.js, Express |
| Log Server | Node.js, WebSocket (`ws`) |
| Reverse Proxy | Node.js, http-proxy |
| Builder / Uploader | Node.js, Docker, AWS ECS (Fargate) |
| Storage | AWS S3 |
| Logs | AWS CloudWatch |
| Database | Neon (PostgreSQL) + Drizzle ORM |
| Auth | Custom built (Email + Password) |
| Email | Nodemailer |

---

## 🔐 Authentication

The platform uses a fully custom-built auth system with no third-party auth libraries.

- **Email + Password** login and registration
- **Admin approval flow** — users register but cannot access the platform until an admin approves their account via email (powered by Nodemailer)
- Sessions managed server-side with secure tokens

---

## 🚀 Getting Started

### Prerequisites

- Node.js v20+
- Docker (for building and pushing builder-server images to AWS ECS)
- AWS account with ECS, S3, and CloudWatch configured
- Neon PostgreSQL database
- SMTP credentials for Nodemailer

### Installation

```bash
# Clone the repo
git clone https://github.com/your-username/your-repo.git
cd deployer-app

# Install root dependencies
npm install

# Install dependencies for each service
cd api-server && npm install && cd ..
cd log-server && npm install && cd ..
cd reverse-proxy && npm install && cd ..
cd frontend && npm install && cd ..
```

### Environment Variables

Each service has its own `.env` file inside its folder. For all required variable names, check the `demo.txt` file inside each service's folder — create a `.env` in the same folder and fill in your values.

---

## ▶️ Running Locally

Start all services at once from the root:

```bash
npm run dev
```

Uses `concurrently` with Node's `--env-file` flag so each service loads its own `.env` correctly.

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| API Server | http://localhost:8080 |
| Log Server (WebSocket) | ws://localhost:9000 |
| Reverse Proxy | http://localhost:8000 |

Deployed projects are accessible locally at:
```
http://projectname.localhost:8000
```

> **Note:** To test subdomains on localhost, add entries to your `hosts` file:
> `127.0.0.1 projectname.localhost`

---

## 🐳 Builder Server (ECS)

The `builder-server` is not run locally — it runs as a **Docker container on AWS ECS**.

```bash
# Build the images
cd builder-server
docker build -t builder -f builder/Dockerfile .
docker build -t uploader -f uploader/Dockerfile .

# Tag and push to AWS ECR
docker tag builder your-ecr-uri/builder:latest
docker push your-ecr-uri/builder:latest

docker tag uploader your-ecr-uri/uploader:latest
docker push your-ecr-uri/uploader:latest
```

Make sure your ECS task definition references the correct ECR image URIs for both containers.

---

## 🗄️ Database

Uses **Neon** (serverless PostgreSQL) with **Drizzle ORM**.

```bash
# Push schema to the database
cd api-server
npx drizzle-kit push
```

---

## 📡 API Endpoints

### `POST /project`
Triggers a new deployment.

**Request:**
```json
{
  "gitURL": "https://github.com/username/repo.git",
  "projectId": "my-project"
}
```

**Response:**
```json
{
  "taskId": "abc123def456",
  "status": "queued"
}
```

---

## 🔌 WebSocket — Live Log Streaming

```js
const ws = new WebSocket('ws://localhost:9000')

ws.onopen = () => {
  ws.send(JSON.stringify({ taskId: 'abc123def456' }))
}

ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  // data.type      → 'log' | 'done' | 'error'
  // data.container → 'builder' | 'uploader'
  // data.message   → log line string
  // data.timestamp → unix ms
}
```

---

## 🌐 Accessing Deployed Apps

Once a project is deployed it is accessible at:

```
http://projectname.localhost:8000      ← local development
https://projectname.yourdomain.com     ← production
```

The reverse proxy reads the subdomain, maps it to the project ID, and serves the static files directly from S3.

---

## 📄 License

MIT
