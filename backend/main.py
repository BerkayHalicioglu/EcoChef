from fastapi import FastAPI, File, UploadFile
import cv2
import numpy as np
from ultralytics import YOLO
import requests
import os
from dotenv import load_dotenv  

load_dotenv()

app = FastAPI(title="EcoChef API", description="Akıllı Mutfak Asistanı")

model = YOLO("yolov8n.pt") 

# Spoonacular API Ayarları
SPOONACULAR_API_KEY = os.getenv("SPOONACULAR_API_KEY")
SPOONACULAR_URL = "https://api.spoonacular.com/recipes/findByIngredients"

@app.get("/")
def read_root():
    return {"mesaj": "EcoChef backend'i başarıyla ayağa kalktı! Harika iş."}

@app.post("/detect-ingredients/")
async def detect_ingredients(file: UploadFile = File(...)):
    # 1. Fotoğrafı okuma ve YOLO ile analiz (Önceki yazdığımız kısım)
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    results = model(img)
    
    detected_items = []
    for r in results:
        for box in r.boxes:
            class_id = int(box.cls[0])
            class_name = model.names[class_id]
            detected_items.append(class_name)

    unique_items = list(set(detected_items))

    # Eğer fotoğrafta yiyecek bulunamadıysa uyarı verelim
    if not unique_items:
        return {"mesaj": "Fotoğrafta herhangi bir malzeme tespit edilemedi.", "tarifler": []}

    # 2. YENİ KISIM: Bulunan malzemeleri virgülle ayırarak Spoonacular'a gönderiyoruz
    ingredients_string = ",".join(unique_items)
    
    params = {
        "ingredients": ingredients_string,
        "number": 3, # Bize en iyi 3 tarifi getirsin
        "apiKey": SPOONACULAR_API_KEY
    }

    response = requests.get(SPOONACULAR_URL, params=params)
    recipes = response.json()

    # Sadece ihtiyacımız olan bilgileri (Tarif adı, fotoğrafı, eksik malzemeler) filtreleyelim
    formatted_recipes = []
    if response.status_code == 200:
        for recipe in recipes:
            formatted_recipes.append({
                "id": recipe.get("id"),
                "isim": recipe.get("title"),
                "gorsel": recipe.get("image"),
                "kullanilan_malzemeler": [ing["name"] for ing in recipe.get("usedIngredients", [])],
                "eksik_malzemeler": [ing["name"] for ing in recipe.get("missedIngredients", [])]
            })

    return {
        "tespit_edilen_malzemeler": unique_items,
        "bulunan_tarifler": formatted_recipes,
        "mesaj": "Malzemeler tespit edildi ve tarifler başarıyla getirildi!"
    }