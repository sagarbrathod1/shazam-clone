# main.py
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import requests
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"status": "OK", "message": "Shazam Clone API is running"}

@app.get("/test")
async def test():
    return {"message": "Test endpoint working"}

@app.post("/api/identify")
async def identify_song(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        
        AUDD_API_KEY = os.getenv("AUDD_API_KEY")
        if not AUDD_API_KEY:
            return {"error": "API key not configured"}
            
        data = {
            'api_token': AUDD_API_KEY,
            'return': 'apple_music,spotify',
        }
        files = {
            'file': ('audio_file.wav', contents, 'audio/wav')
        }
        
        response = requests.post('https://api.audd.io/', data=data, files=files)
        
        response_data = response.json()
        
        if 'error' in response_data:
            return {"error": response_data['error']['error_message']}
            
        return response_data

    except Exception as e:
        return {"error": str(e)}

