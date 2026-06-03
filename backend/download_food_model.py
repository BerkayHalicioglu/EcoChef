"""
EcoChef — Food-Specific YOLO Model İndirici
============================================
Bu script, genel amaçlı yolov8n.pt yerine yiyecek tespitine
özelleştirilmiş bir model indirir.

Kullanım:
    cd backend
    python download_food_model.py

Model sonrasında backend/.env dosyasında belirtilen yola kopyalanır.
config.py'da YOLO_MODEL_PATH değişkenini güncelleyin.
"""

import sys
from pathlib import Path

BASE_DIR = Path(__file__).parent

# ---------------------------------------------------------------------------
# Seçenek 1: keremberke/yolov8n-food-detection (HuggingFace)
# 101 yiyecek kategorisi — hazır yemek tespiti (pizza, sushi, waffle vb.)
# ---------------------------------------------------------------------------
def indir_huggingface():
    try:
        from huggingface_hub import hf_hub_download
    except ImportError:
        print("huggingface_hub kurulu değil. Kuruluyor...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "huggingface_hub"])
        from huggingface_hub import hf_hub_download

    print("Hugging Face'ten food detection modeli indiriliyor...")
    path = hf_hub_download(
        repo_id="keremberke/yolov8n-food-detection",
        filename="best.pt",
        local_dir=str(BASE_DIR),
        local_dir_use_symlinks=False,
    )
    dest = BASE_DIR / "yolov8n-food.pt"
    Path(path).rename(dest)
    print(f"Model indirildi: {dest}")
    print()
    print("Sonraki adım:")
    print("  backend/.env dosyasına şunu ekleyin:")
    print("  YOLO_MODEL_PATH=yolov8n-food.pt")
    return dest


# ---------------------------------------------------------------------------
# Seçenek 2: Ultralytics YOLOv8 ile doğrudan eğitim (opsiyonel)
# Kendi veri setinizle fine-tune etmek isterseniz kullanın.
# ---------------------------------------------------------------------------
def fine_tune_talimatlar():
    print("""
Kendi modelinizi eğitmek için:

1. Roboflow'dan bir malzeme veri seti indirin:
   https://universe.roboflow.com/search?q=food+ingredient+detection

2. YOLOv8 ile fine-tune:
   from ultralytics import YOLO
   model = YOLO("yolov8n.pt")
   model.train(data="veri_seti.yaml", epochs=50, imgsz=640)

3. En iyi modeli kopyalayın:
   cp runs/detect/train/weights/best.pt backend/yolov8n-custom.pt

4. backend/.env'e ekleyin:
   YOLO_MODEL_PATH=yolov8n-custom.pt
""")


# ---------------------------------------------------------------------------
# Seçenek 3: keremberke/yolov8s-food-detection (S = daha büyük, daha doğru)
# yolov8n'den ~3x daha iyi accuracy, demo için önerilir
# ---------------------------------------------------------------------------
def indir_huggingface_s():
    try:
        from huggingface_hub import hf_hub_download
    except ImportError:
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "huggingface_hub"])
        from huggingface_hub import hf_hub_download

    print("Hugging Face'ten food detection S modeli indiriliyor...")
    path = hf_hub_download(
        repo_id="keremberke/yolov8s-food-detection",
        filename="best.pt",
        local_dir=str(BASE_DIR),
        local_dir_use_symlinks=False,
    )
    dest = BASE_DIR / "yolov8s-food.pt"
    Path(path).rename(dest)
    print(f"Model indirildi: {dest}")
    print()
    print("Sonraki adım:")
    print("  backend/.env dosyasına şunu ekleyin:")
    print("  YOLO_MODEL_PATH=yolov8s-food.pt")
    print("  YOLO_CONFIDENCE=0.45")
    return dest


if __name__ == "__main__":
    print("=" * 60)
    print("EcoChef — Food Model İndirici")
    print("=" * 60)
    print()
    print("Seçenekler:")
    print("  1) yolov8n-food (N — hızlı, 101 kategori)")
    print("  2) yolov8s-food (S — daha doğru, ÖNERİLİR demo için)")
    print("     Limon/portakal ve domates/elma karışıklığını azaltır")
    print("  3) Kendi modelini eğitmek için talimatları göster")
    print()
    secim = input("Seçim (1/2/3): ").strip()

    if secim == "1":
        indir_huggingface()
    elif secim == "2":
        indir_huggingface_s()
    elif secim == "3":
        fine_tune_talimatlar()
    else:
        print("Geçersiz seçim.")
