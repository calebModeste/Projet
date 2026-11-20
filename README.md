# Classification d'articles de presse (AG News)

Classer automatiquement un article de presse dans l'une des 4 rubriques suivantes : **Monde, Sport, Business, Sci/Tech**.

- Dataset : [AG News](https://huggingface.co/datasets/fancyzhx/ag_news), 127 600 articles (120 000 train / 7 600 test)
- Modèle retenu : TF-IDF (mots + bigrammes) + SVM linéaire calibré, **92,2 % d'accuracy** sur le test

## Contenu du dossier

```
Projet/
├── data/                  train.csv et test.csv (colonnes text, label)
├── notebook/              AG_News_Classification.ipynb : exploration, modèles ML/DL, comparaison
├── api/                   API Flask qui sert le modèle
│   ├── app.py
│   ├── preprocessing.py   même nettoyage que dans le notebook
│   └── model/agnews_svm.joblib
├── web/                   interface Next.js
├── soutenance/            Soutenance_AG_News.pptx
└── render.yaml            config de déploiement de l'API sur Render
```

Labels : 0 = Monde, 1 = Sport, 2 = Business, 3 = Sci/Tech.

## Résultats

| Modèle | Accuracy test | Entraînement (CPU) |
|---|---|---|
| **TF-IDF + SVM linéaire** | **92,21 %** | 40 s |
| TF-IDF + Régression logistique | 92,12 % | 1 min 45 |
| CNN 1D | 90,97 % | 8 min |
| BiLSTM | 90,83 % | 11 min 45 |
| TF-IDF + Naive Bayes | 90,68 % | 37 s |
| Embeddings moyennés + bigrammes (fastText) | 90,54 % | 6 min |

## Lancer le projet en local

### 1. Notebook
```bash
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
jupyter notebook notebook/AG_News_Classification.ipynb
```
L'exécution complète prend environ 30 min sur CPU (surtout le CNN et le BiLSTM). La dernière partie régénère `api/model/agnews_svm.joblib`.

### 2. API Flask
```bash
cd api
pip install -r requirements.txt
python app.py          # http://127.0.0.1:5001
```
Le port 5001 est utilisé parce que, sur macOS, le 5000 est déjà pris par AirPlay.

Routes :
- `GET /health`
- `POST /predict` avec le JSON `{"text": "..."}`
- `POST /predict-file` en multipart, champ `file` (fichier `.txt`)

```bash
curl -X POST http://127.0.0.1:5001/predict -H "Content-Type: application/json" \
     -d '{"text": "Apple unveils a new chip for its laptops"}'
```

### 3. Interface Next.js
```bash
cd web
cp .env.example .env.local     # API_URL=http://127.0.0.1:5001
npm install
npm run dev                    # http://localhost:3000
```

## Mise en ligne

1. Pousser le dossier `Projet/` sur un dépôt GitHub (le modèle fait ~42 Mo, ça passe sans Git LFS).
2. **API sur Render** : New > Blueprint, puis choisir le dépôt. Le fichier `render.yaml` configure tout. On récupère une URL du type `https://agnews-api.onrender.com`.
3. **Interface sur Vercel** : importer le dépôt, mettre *Root Directory* = `web` et ajouter la variable d'environnement `API_URL` = l'URL Render.

Sur l'offre gratuite de Render, l'API se met en veille après 15 min sans requête. La première prédiction peut alors prendre 30 à 60 s, le temps qu'elle redémarre.
