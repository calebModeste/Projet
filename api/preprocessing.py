import html
import re


def nettoyer(texte: str) -> str:
    """Même nettoyage que dans le notebook (il faut que ce soit identique)."""
    t = texte.replace("\\", " ")
    t = html.unescape(t)
    t = re.sub(r"#\d+;", "'", t)
    t = re.sub(r"&?(quot|lt|gt|amp);", " ", t)
    t = re.sub(r"<[^>]+>", " ", t)
    t = re.sub(r"\s+", " ", t)
    return t.strip().lower()
