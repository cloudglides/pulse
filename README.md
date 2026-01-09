<p align="center">
  <img src="https://github.com/user-attachments/assets/3cb26d88-3d53-47f9-97b7-20594af2ca09" width="160" />
</p>

<p align="center">
  <img src="https://img.shields.io/github/stars/cloudglides/pulse?style=flat-square" />
  <img src="https://img.shields.io/github/issues/cloudglides/pulse?style=flat-square" />
  <img src="https://img.shields.io/github/license/cloudglides/pulse?style=flat-square" />
  <img src="https://img.shields.io/github/last-commit/cloudglides/pulse?style=flat-square" />
</p>

---

<p align="center">
  A Tiny Dashboard For My Homelab
</p>

<img width="1880" height="1359" alt="image" src="https://github.com/user-attachments/assets/e76925d7-a7c9-4a58-8a92-423d1ac4481f" />

## Installation

Choose one of the following methods:

<details>
<summary><strong>Docker Compose (Recommended)</strong></summary>
<br>

Clone the repository and start Pulse with Docker Compose:

```bash
git clone https://github.com/cloudglides/pulse.git
cd pulse
docker compose up -d
```

The dashboard will be available at `http://localhost:3000`

To view logs:

```bash
docker compose logs -f
```

To stop:

```bash
docker compose down
```

<hr>
</details>

<details>
<summary><strong>Docker Manual</strong></summary>
<br>

Build and run the image manually:

```bash
git clone https://github.com/cloudglides/pulse.git
cd pulse
docker build -t pulse .
docker run -d \
  -p 3000:3000 \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  -v /proc:/host/proc:ro \
  -v /sys:/host/sys:ro \
  --restart unless-stopped \
  --name pulse \
  pulse
```

View logs:

```bash
docker logs -f pulse
```

<hr>
</details>

<details>
<summary><strong>Local Development</strong></summary>
<br>

Requirements: Node.js 20+, pnpm

```bash
git clone https://github.com/cloudglides/pulse.git
cd pulse
pnpm install
pnpm dev
```

Open `http://localhost:3000`

<hr>
</details>
