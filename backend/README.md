# Backend (FastAPI)

## Setup

1. Create a virtualenv and install deps:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

2. Create `.env`:

```bash
cp .env.example .env
```

3. Run:

```bash
uvicorn app.main:app --reload --port 8000
```

## API
- `POST /api/runs` (multipart): create run (text + optional PDF/DOCX)
- `POST /api/runs/{run_id}/evaluate`: start background evaluation
- `GET /api/runs/{run_id}`: get run + results + report (if generated)
- `POST /api/runs/{run_id}/report`: generate report from stored results

