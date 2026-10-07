"""Turn an issue (made from the 文章 / 值得一读 issue forms) into a Markdown file.

Reads ISSUE_NUMBER, ISSUE_TITLE, ISSUE_BODY, ISSUE_LABELS (JSON list), ISSUE_CREATED_AT from the env.
Writes the file and prints `path=<file>` to $GITHUB_OUTPUT.
Editing the issue later rewrites the same file (matched by `issue:` in front matter).
"""
import glob, json, os, re, sys
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(__file__))
from common import english_slug, read_doc, slugify, write_doc

TZ = timezone(timedelta(hours=8))  # Asia/Shanghai, same as _config.yml


def sections(body):
    """Issue forms render as '### Label\\n\\nvalue'. Returns {label: value}."""
    out, key = {}, None
    for line in (body or "").replace("\r\n", "\n").split("\n"):
        m = re.match(r"^###\s+(.+?)\s*$", line)
        if m:
            key = m.group(1)
            out[key] = []
        elif key:
            out[key].append(line)
    clean = {}
    for k, v in out.items():
        text = "\n".join(v).strip()
        clean[k] = "" if text in ("_No response_", "None") else text
    return clean


def field(f, *names):
    for n in names:
        for k, v in f.items():
            if k.split("（")[0].split("(")[0].strip().lower() == n.lower():
                return v
    return ""


def find_existing(folder, number):
    for p in glob.glob(f"{folder}/*.md"):
        meta, _ = read_doc(p)
        if str(meta.get("issue")) == str(number):
            return p, meta
    return None, {}


def main():
    number = os.environ["ISSUE_NUMBER"]
    title = re.sub(r"^\s*\[(文章|值得一读|post|reading)\]\s*", "", os.environ["ISSUE_TITLE"], flags=re.I).strip()
    labels = [l.lower() for l in json.loads(os.environ.get("ISSUE_LABELS") or "[]")]
    created = datetime.fromisoformat(os.environ["ISSUE_CREATED_AT"].replace("Z", "+00:00")).astimezone(TZ)
    f = sections(os.environ.get("ISSUE_BODY", ""))

    kind = "reading" if "reading" in labels else "post" if "post" in labels else None
    if not kind:
        sys.exit("issue has neither the 'post' nor the 'reading' label")
    folder = "_reading" if kind == "reading" else "_posts"
    body = field(f, "正文", "body")
    if not body:
        sys.exit("正文 is empty")

    path, old = find_existing(folder, number)
    slug = slugify(field(f, "slug"))
    if not path:
        slug = slug or english_slug(title) or f"{kind}-{number}"
        name = f"{slug}.md" if kind == "reading" else f"{created:%Y-%m-%d}-{slug}.md"
        path = os.path.join(folder, name)
        if os.path.exists(path):
            path = path.replace(".md", f"-{number}.md")

    ref = old.get("ref") or re.sub(r"^\d{4}-\d{2}-\d{2}-", "", os.path.splitext(os.path.basename(path))[0])
    if kind == "post":
        tags = [t.strip() for t in re.split(r"[,，、\s]+", field(f, "标签", "tags")) if t.strip()]
        meta = {"title": title, "description": field(f, "摘要", "description") or None,
                "tags": tags or None, "ref": ref, "issue": int(number)}
    else:
        meta = {"title": title, "author": field(f, "作者", "author") or None,
                "date": old.get("date") or created.date(),
                "description": field(f, "一句话短评", "短评", "description") or None,
                "source": field(f, "原文链接", "source") or None, "ref": ref, "issue": int(number)}
    meta = {k: v for k, v in meta.items() if v is not None}

    write_doc(path, meta, body)
    print(f"wrote {path}")
    if os.environ.get("GITHUB_OUTPUT"):
        with open(os.environ["GITHUB_OUTPUT"], "a") as o:
            stem = os.path.splitext(os.path.basename(path))[0]
            url = f"/reading/{stem}/" if kind == "reading" else f"/blog/{stem[:4]}/{stem[11:]}/"
            o.write(f"path={path}\nkind={kind}\nref={ref}\nurl={url}\n")


if __name__ == "__main__":
    main()
