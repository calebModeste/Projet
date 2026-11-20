// Route intermédiaire : le navigateur appelle Next, qui appelle l'API Flask.
// Ça évite les problèmes de CORS et l'URL de l'API reste côté serveur.

const API_URL = process.env.API_URL || "http://127.0.0.1:5001";

export async function POST(request) {
  const type = request.headers.get("content-type") || "";

  try {
    let res;
    if (type.includes("multipart/form-data")) {
      const form = await request.formData();
      res = await fetch(`${API_URL}/predict-file`, { method: "POST", body: form });
    } else {
      const body = await request.json();
      res = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: body.text ?? "" }),
      });
    }
    const data = await res.json();
    return Response.json(data, { status: res.status });
  } catch (e) {
    return Response.json(
      { erreur: "Impossible de joindre l'API (elle est peut-être en train de démarrer, réessayez dans 30 s)." },
      { status: 502 }
    );
  }
}
