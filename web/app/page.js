"use client";

import { useRef, useState } from "react";

const COULEURS = {
  Monde: "#2f6fbd",
  Sport: "#2e9b5f",
  Business: "#d9822b",
  "Sci/Tech": "#8a4fc7",
};

const EXEMPLES = [
  "Manchester United came back from two goals down to beat Arsenal 3-2 at Old Trafford on Saturday.",
  "Shares of Boeing fell 4% after the company cut its delivery forecast for the rest of the year.",
  "NASA's new telescope captured images of a distant galaxy formed shortly after the Big Bang.",
  "The UN Security Council met on Tuesday to discuss the growing humanitarian crisis in the region.",
];

export default function Home() {
  const [texte, setTexte] = useState("");
  const [fichier, setFichier] = useState(null);
  const [resultat, setResultat] = useState(null);
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);
  const [survol, setSurvol] = useState(false);
  const inputRef = useRef(null);

  function choisirFichier(f) {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".txt")) {
      setErreur("Merci de choisir un fichier .txt");
      return;
    }
    setErreur("");
    setFichier(f);
    // on affiche aussi le contenu dans la zone de texte pour que l'utilisateur voie ce qui est envoyé
    f.text().then((t) => setTexte(t.slice(0, 5000)));
  }

  async function analyser(e) {
    e.preventDefault();
    setErreur("");
    setResultat(null);

    if (!fichier && texte.trim().length < 3) {
      setErreur("Écrivez un texte ou chargez un fichier .txt");
      return;
    }

    setChargement(true);
    try {
      let res;
      if (fichier) {
        const form = new FormData();
        form.append("file", fichier);
        res = await fetch("/api/predict", { method: "POST", body: form });
      } else {
        res = await fetch("/api/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: texte }),
        });
      }
      const data = await res.json();
      if (!res.ok) setErreur(data.erreur || "Erreur inconnue");
      else setResultat(data);
    } catch {
      setErreur("Le serveur ne répond pas.");
    } finally {
      setChargement(false);
    }
  }

  function reinitialiser() {
    setTexte("");
    setFichier(null);
    setResultat(null);
    setErreur("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <main className="page">
      <header>
        <h1>Classifieur d'articles de presse</h1>
        <p className="sous-titre">
          Collez un article (en anglais) ou chargez un fichier <code>.txt</code> : le modèle prédit s'il
          parle de <b>Monde</b>, <b>Sport</b>, <b>Business</b> ou <b>Sciences/Tech</b>.
        </p>
      </header>

      <form onSubmit={analyser} className="carte">
        <label htmlFor="texte" className="label">Texte de l'article</label>
        <textarea
          id="texte"
          rows={7}
          placeholder="Ex : Apple reported record quarterly revenue driven by strong iPhone sales..."
          value={texte}
          onChange={(e) => {
            setTexte(e.target.value);
            setFichier(null);
          }}
        />

        <div className="exemples">
          <span>Essayer un exemple :</span>
          {EXEMPLES.map((ex, i) => (
            <button
              type="button"
              key={i}
              className="puce"
              onClick={() => {
                setTexte(ex);
                setFichier(null);
                setResultat(null);
              }}
            >
              Exemple {i + 1}
            </button>
          ))}
        </div>

        <div
          className={`depot ${survol ? "survol" : ""}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setSurvol(true);
          }}
          onDragLeave={() => setSurvol(false)}
          onDrop={(e) => {
            e.preventDefault();
            setSurvol(false);
            choisirFichier(e.dataTransfer.files[0]);
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".txt,text/plain"
            hidden
            onChange={(e) => choisirFichier(e.target.files[0])}
          />
          {fichier ? (
            <span>
              Fichier chargé : <b>{fichier.name}</b> ({(fichier.size / 1024).toFixed(1)} Ko)
            </span>
          ) : (
            <span>Ou glissez un fichier .txt ici (ou cliquez pour parcourir)</span>
          )}
        </div>

        <div className="actions">
          <button type="submit" className="btn" disabled={chargement}>
            {chargement ? "Analyse..." : "Classer l'article"}
          </button>
          <button type="button" className="btn secondaire" onClick={reinitialiser}>
            Effacer
          </button>
        </div>

        {erreur && <p className="erreur">{erreur}</p>}
      </form>

      {resultat && (
        <section className="carte resultat">
          <p className="label">Catégorie prédite</p>
          <div className="prediction">
            <span className="badge" style={{ background: COULEURS[resultat.categorie] }}>
              {resultat.categorie}
            </span>
            <span className="proba">{(resultat.probabilite * 100).toFixed(1).replace(".", ",")} %</span>
          </div>
          {resultat.probabilite < 0.6 && (
            <p className="note">
              Le modèle hésite : le texte touche probablement à plusieurs domaines.
            </p>
          )}

          <div className="barres">
            {resultat.detail.map((d) => (
              <div key={d.categorie} className="ligne">
                <span className="nom">{d.categorie}</span>
                <div className="piste">
                  <div
                    className="rempli"
                    style={{ width: `${d.probabilite * 100}%`, background: COULEURS[d.categorie] }}
                  />
                </div>
                <span className="valeur">{(d.probabilite * 100).toFixed(1).replace(".", ",")} %</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <footer>
        Modèle : TF-IDF (mots + bigrammes) + SVM linéaire calibré, entraîné sur AG News (120 000 articles).
        Accuracy sur le jeu de test : 92,1 %.
      </footer>
    </main>
  );
}
