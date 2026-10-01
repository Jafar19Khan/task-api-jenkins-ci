# Task API with Jenkins CI

A small Node.js REST API (zero dependencies) with a complete **Jenkins CI pipeline**.
Every push to GitHub triggers Jenkins, which runs a syntax check, the test suite, a Docker
build and a container smoke test.

```
git push -> GitHub -> Webhook -> Jenkins (AWS EC2) -> Lint -> Test -> Docker Build -> Smoke Test
```

## Features

- REST API for managing tasks (create, list, read, update, delete)
- Built with only Node.js built-ins (`http`, `node:test`), so there is nothing to install
- 11 automated tests using the built-in Node.js test runner
- `Jenkinsfile` (pipeline as code) with JUnit test reports
- `Dockerfile` with a non-root user and a health check
- Setup script and step-by-step guide for Jenkins on AWS EC2

## Tech stack

Node.js 22, Docker, Jenkins, GitHub, AWS EC2 (Ubuntu), Bash

## Project structure

```
task-api-jenkins-ci/
├── src/
│   ├── server.js        # Entry point (starts the HTTP server)
│   ├── app.js           # Routes and request handling
│   └── store.js         # In-memory task store and validation
├── test/
│   ├── api.test.js      # HTTP-level tests
│   └── store.test.js    # Unit tests for the store
├── scripts/
│   ├── check-syntax.js          # Dependency-free "lint" step
│   └── install-jenkins-ubuntu.sh # Installs Jenkins, Docker and Node on Ubuntu
├── docs/
│   └── jenkins-setup.md # Full Jenkins + GitHub webhook guide
├── Jenkinsfile          # CI pipeline definition
├── Dockerfile
├── package.json
├── LICENSE
└── README.md
```

## Run locally

Requirements: Node.js 20 or newer.

```bash
npm run lint    # syntax check
npm test        # run all tests
npm start       # start the API on http://localhost:3000
```

## API reference

| Method | Endpoint       | Description                                   |
|--------|----------------|-----------------------------------------------|
| GET    | `/health`      | Health check                                  |
| GET    | `/tasks`       | List all tasks                                |
| POST   | `/tasks`       | Create a task. Body: `{"title": "..."}`       |
| GET    | `/tasks/:id`   | Get one task                                  |
| PUT    | `/tasks/:id`   | Update a task. Body: `{"title": "...", "done": true}` |
| DELETE | `/tasks/:id`   | Delete a task                                 |

Example:

```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Learn Jenkins"}'

curl http://localhost:3000/tasks
```

Tasks are stored in memory, so they reset when the server restarts.

## Run with Docker

```bash
docker build -t task-api .
docker run -p 3000:3000 task-api
```

## CI pipeline stages

| Stage             | What it does                                              |
|-------------------|-----------------------------------------------------------|
| Checkout          | Pulls the code from GitHub                                |
| Tooling Check     | Prints Node, npm and Docker versions                      |
| Lint              | Runs `npm run lint` (syntax check on all JS files)        |
| Test              | Runs `npm run test:ci` and publishes JUnit results        |
| Docker Build      | Builds the image tagged with the build number and `latest`|
| Docker Smoke Test | Starts the container and calls `/health`                  |

A failure in any stage stops the pipeline, so a broken change never reaches the Docker build.

## Set up Jenkins

Follow [docs/jenkins-setup.md](docs/jenkins-setup.md) for the full guide (EC2, Jenkins,
pipeline job and GitHub webhook).

## Security notes

- Never commit secrets, keys or `.env` files. The `.gitignore` already excludes common ones.
- Do not leave Jenkins port 8080 open to the whole internet on a long-running server.
  Restrict it to your IP, or put it behind HTTPS.
- Stop or terminate the EC2 instance when you are done to avoid AWS charges.

## License

MIT. See [LICENSE](LICENSE).
