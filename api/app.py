import os
from pathlib import Path

import joblib
from flask import Flask, jsonify, request
from flask_cors import CORS

from preprocessing import nettoyer

MODEL_PATH = Path(__file__).parent / "model" / "agnews_svm.joblib"
MAX_CHARS = 20_000          # on coupe les textes trop longs
MAX_UPLOAD = 1 * 1024 * 1024  # 1 Mo pour les fichiers

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = MAX_UPLOAD
CORS(app, origins=os.environ.get("CORS_ORIGINS", "*").split(","))

bundle = joblib.load(MODEL_PATH)
pipeline = bundle["pipeline"]
LABELS = bundle["labels"]
LABELS_EN = ["World", "Sports", "Business", "Sci/Tech"]


def predire(texte):
    proba = pipeline.predict_proba([nettoyer(texte[:MAX_CHARS])])[0]
    ordre = proba.argsort()[::-1]
    return {
        "categorie": LABELS[ordre[0]],
        "categorie_en": LABELS_EN[ordre[0]],
        "probabilite": round(float(proba[ordre[0]]), 4),
        "detail": [{"categorie": LABELS[i], "probabilite": round(float(proba[i]), 4)} for i in ordre],
    }


@app.get("/")
def index():
    return jsonify({"service": "AG News classifier", "routes": ["/health", "/predict", "/predict-file"]})


@app.get("/health")
def health():
    return jsonify({"status": "ok", "modele": "TF-IDF + SVM linéaire calibré"})


@app.post("/predict")
def predict():
    data = request.get_json(silent=True) or {}
    texte = (data.get("text") or "").strip()
    if len(texte) < 3:
        return jsonify({"erreur": "Le texte est vide ou trop court."}), 400
    return jsonify(predire(texte))


@app.post("/predict-file")
def predict_file():
    f = request.files.get("file")
    if f is None or f.filename == "":
        return jsonify({"erreur": "Aucun fichier reçu."}), 400
    if not f.filename.lower().endswith(".txt"):
        return jsonify({"erreur": "Seuls les fichiers .txt sont acceptés."}), 400
    brut = f.read()
    try:
        texte = brut.decode("utf-8")
    except UnicodeDecodeError:
        texte = brut.decode("latin-1")
    texte = texte.strip()
    if len(texte) < 3:
        return jsonify({"erreur": "Le fichier est vide."}), 400
    res = predire(texte)
    res["fichier"] = f.filename
    return jsonify(res)


@app.errorhandler(413)
def trop_gros(_):
    return jsonify({"erreur": "Fichier trop volumineux (1 Mo max)."}), 413


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5001)), debug=True)
