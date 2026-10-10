"""Shared helpers: front matter, slugs, and the translation API (OpenAI-compatible)."""
import hashlib, json, os, re, urllib.error, urllib.request

import yaml

FM_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n?(.*)$", re.S)


def read_doc(path):
    text = open(path, encoding="utf-8").read()
    m = FM_RE.match(text)
    if not m:
        return {}, text
    return (yaml.safe_load(m.group(1)) or {}), m.group(2)


def dump_doc(meta, body):
    fm = yaml.safe_dump(meta, allow_unicode=True, sort_keys=False, width=1000).strip()
    return f"---\n{fm}\n---\n\n{body.strip()}\n"


def write_doc(path, meta, body):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(dump_doc(meta, body))


def sha(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]


def slugify(s):
    s = re.sub(r"[^a-zA-Z0-9\s-]", "", s or "").strip().lower()
    return re.sub(r"[\s-]+", "-", s)[:60].strip("-")


# ---------------- translation ----------------

SYSTEM_PROMPT = """You translate a personal blog from Chinese into English.
The author writes briefly, quietly, with a philosophical, slightly literary tone. Keep that voice: plain words, short sentences, no added flourish.
Rules:
- Keep all Markdown exactly: headings, lists, quotes, links, images, tables, footnotes.
- Never translate code blocks, inline code, URLs, file paths, or Liquid tags like {{ }} and {% %}.
- Keep proper names; use the established English title for well-known books and people.
- Return only a JSON object with the same keys you were given."""


def api_ready():
    return bool(os.environ.get("TRANSLATE_API_KEY"))


def chat_json(payload, instruction):
    base = (os.environ.get("TRANSLATE_BASE_URL") or "https://api.openai.com/v1").rstrip("/")
    model = os.environ.get("TRANSLATE_MODEL") or "gpt-4o-mini"
    req = urllib.request.Request(
        f"{base}/chat/completions",
        data=json.dumps({
            "model": model,
            "temperature": 0.3,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": instruction + "\n\n" + json.dumps(payload, ensure_ascii=False)},
            ],
        }).encode("utf-8"),
        headers={"Authorization": f"Bearer {os.environ['TRANSLATE_API_KEY']}", "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            content = json.load(r)["choices"][0]["message"]["content"]
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", "replace")[:300]
        raise RuntimeError(f"HTTP {e.code} from {base} (model {model}): {detail}") from e
    content = re.sub(r"^```(?:json)?\s*|\s*```$", "", content.strip())
    return json.loads(content)


def translate_fields(fields):
    """fields: dict of str or list[str]. Returns the same keys in English."""
    out = chat_json(fields, "Translate every value of this JSON object into English.")
    return {k: out.get(k, v) for k, v in fields.items()}


def english_slug(title):
    if not api_ready():
        return ""
    try:
        out = chat_json({"title": title}, 'Give a short English URL slug (2 to 5 lowercase words, hyphenated) for this title. Reply as {"slug": "..."}.')
        return slugify(out.get("slug", ""))
    except Exception as e:  # a failed slug must never block publishing
        print(f"::warning::slug generation failed ({e}); using a fallback slug")
        return ""
