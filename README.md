# Running Locally on Ports Above 10k

### 1. Backend (Port 10002)
```powershell
cd signagex\backend
.\.venv\Scripts\uvicorn.exe server:app --host 0.0.0.0 --port 10002
```

### 2. Frontend (Port 10001)
```powershell
cd signagex\frontend
$env:PORT='10001' ; $env:REACT_APP_BACKEND_URL='http://localhost:10002' ; yarn start
```