from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

from tensorflow.keras.models import load_model
from tensorflow.keras.layers import Dense

from PIL import Image
import numpy as np
import cv2
import json

# =====================================================
# PATCH FOR KERAS DESERIALIZATION ERROR
# =====================================================

# Fix unknown argument: quantization_config
_original_dense_init = Dense.__init__

def patched_dense_init(self, *args, **kwargs):
    kwargs.pop("quantization_config", None)
    _original_dense_init(self, *args, **kwargs)

Dense.__init__ = patched_dense_init


# =====================================================
# FASTAPI APP
# =====================================================

app = FastAPI(title="Diabetic Retinopathy Detection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================================
# DOWNLOAD MODEL FROM GOOGLE DRIVE
# =====================================================

MODEL_PATH = "Hybrid_DR_Model.h5"

if not os.path.exists(MODEL_PATH):

    print("Downloading model from Google Drive...")

    gdown.download(
        "https://drive.google.com/uc?id=1XhZIIlCM0UOkLkqnGHAWN-JSPO3p8p-5",
        MODEL_PATH,
        quiet=False
    )

    print("Model downloaded successfully!")

# =====================================================
# LOAD MODEL
# =====================================================

print("Loading model...")

model = load_model(
    MODEL_PATH,
    compile=False
)

print("Model loaded successfully!")

# =====================================================
# LOAD CLASS NAMES
# =====================================================

with open("class_names.json", "r") as f:
    class_names = json.load(f)

print("Classes:", class_names)

# =====================================================
# PREPROCESSING
# =====================================================

def preprocess_image(img):

    img = np.array(img)

    if img.dtype != np.uint8:
        if img.max() <= 1.0:
            img = (img * 255).clip(0, 255).astype(np.uint8)
        else:
            img = img.clip(0, 255).astype(np.uint8)

    img = np.ascontiguousarray(img)

    # Median blur
    img = cv2.medianBlur(img, 3)

    # CLAHE (LAB)
    lab = cv2.cvtColor(img, cv2.COLOR_RGB2LAB)
    l, a, b = cv2.split(lab)

    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    cl = clahe.apply(l)

    merged = cv2.merge((cl, a, b))
    img = cv2.cvtColor(merged, cv2.COLOR_LAB2RGB)

    img = img.astype(np.float32) / 255.0

    return img


# =====================================================
# ROUTES
# =====================================================

@app.get("/")
def home():
    return {"message": "Diabetic Retinopathy API Running"}


@app.get("/health")
def health():
    return {
        "status": "OK",
        "model": "Loaded"
    }


@app.post("/predict")
async def predict(file: UploadFile = File(...)):

    try:
        image = Image.open(file.file).convert("RGB")
        image = image.resize((224, 224))
        image = np.array(image)

        processed = preprocess_image(image)
        batch = np.expand_dims(processed, axis=0)

        prediction = model.predict(batch, verbose=0)

        predicted_index = int(np.argmax(prediction))
        predicted_class = class_names[predicted_index]

        confidence = float(np.max(prediction) * 100)

        probabilities = {
            cls: round(float(prob) * 100, 2)
            for cls, prob in zip(class_names, prediction[0])
        }

        return {
            "prediction": predicted_class,
            "confidence": round(confidence, 2),
            "probabilities": probabilities
        }

    except Exception as e:
        return {"error": str(e)}