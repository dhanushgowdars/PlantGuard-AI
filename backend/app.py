import os
import json
import io
import numpy as np
import tensorflow as tf
from PIL import Image
from flask import Flask, request, jsonify
from flask_cors import CORS
from tensorflow.keras.models import load_model
from pathlib import Path

# ---------------------------
# Project Paths
# ---------------------------
BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "models"
DATA_DIR = BASE_DIR / "data"
# ---------------------------
# Initialize Flask App
# ---------------------------
app = Flask(__name__)
CORS(app)

# ---------------------------
# Load Model
# ---------------------------
MODEL_PATH = MODEL_DIR / "plant_disease_model_finetuned.h5"

print("Loading model...")

try:
    model = load_model(MODEL_PATH)
    print("Model loaded successfully")
except Exception as e:
    print("ERROR loading model:", e)
    model = None

# ---------------------------
# Load Class Names
# ---------------------------
CLASS_NAMES_PATH = MODEL_DIR / "class_names.txt"

try:
    with open(CLASS_NAMES_PATH, "r") as f:
        class_names = [line.strip() for line in f.readlines()]
    print("Loaded", len(class_names), "classes")
except Exception as e:
    print("ERROR loading class names:", e)
    class_names = []

# ---------------------------
# Load Disease Details
# ---------------------------
try:
    with open(DATA_DIR / "disease_info.json") as f:
        disease_info_details = json.load(f)
except:
    disease_info_details = {}

# ---------------------------
# Load Encyclopedia Data
# ---------------------------
try:
    with open(DATA_DIR / "diseases.json") as f:
        disease_encyclopedia_data = json.load(f)
except:
    disease_encyclopedia_data = []


# ---------------------------
# Image Preprocessing
# ---------------------------
def preprocess_image(image_bytes):

    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize((224, 224))

    img_array = np.array(img) / 255.0
    img_array = np.expand_dims(img_array, axis=0)

    return img_array


# ---------------------------
# Root Route (optional but useful)
# ---------------------------
@app.route("/")
def home():
    return "PlantGuard AI Backend Running"


# ---------------------------
# Prediction API
# ---------------------------
@app.route("/predict", methods=["POST"])
def predict():

    if model is None:
        return jsonify({"error": "Model not loaded"}), 500

    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"error": "Empty file"}), 400

    try:
        image_bytes = file.read()

        img = preprocess_image(image_bytes)

        prediction = model.predict(img)

        predicted_index = int(np.argmax(prediction))
        confidence = float(np.max(prediction)) * 100

        predicted_class = class_names[predicted_index]

        details = disease_info_details.get(
            predicted_class,
            {
                "description": "No information available",
                "precautions": [],
                "treatment": {"chemical": [], "organic": []},
            },
        )

        return jsonify(
            {
                "prediction": predicted_class,
                "confidence": f"{confidence:.2f}%",
                "details": details,
            }
        )

    except Exception as e:
        print("Prediction Error:", e)
        return jsonify({"error": str(e)}), 500


# ---------------------------
# Encyclopedia API
# ---------------------------
@app.route("/diseases", methods=["GET"])
def get_diseases():
    return jsonify(disease_encyclopedia_data)


# ---------------------------
# Run Server
# ---------------------------
import os

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
