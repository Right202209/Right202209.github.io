"""Write the English twin of every Chinese post / Reading entry.

  python scripts/translate.py            # scan everything
  python scripts/translate.py FILE ...   # only these Chinese files

An English file is (re)written only when:
  - it does not exist yet, or
  - it carries `translated: auto` and the Chinese source changed since (source_hash).
English files without `translated: auto` are treated as hand-written and never touched.
"""
import glob, os, re, sys

from common import api_ready, read_doc, sha, translate_fields, write_doc

DIRS = {"_posts": "_posts/en", "_reading": "_reading/en"}


def sources(args):
    if args:
        return [p for p in args if os.path.dirname(p) in DIRS and p.endswith(".md")]
    return sorted(p for d in DIRS for p in glob.glob(f"{d}/*.md"))


def ensure_ref(path, meta, body):
    if meta.get("ref"):
        return meta
    name = os.path.splitext(os.path.basename(path))[0]
    meta["ref"] = re.sub(r"^\d{4}-\d{2}-\d{2}-", "", name)
    write_doc(path, meta, body)
    print(f"  added ref: {meta['ref']} -> {path}")
    return meta


def main():
    if not api_ready():
        print("TRANSLATE_API_KEY is not set; skipping translation.")
        return
    changed = []
    for src in sources(sys.argv[1:]):
        meta, body = read_doc(src)
        if meta.get("lang") and meta["lang"] != "zh-CN":
            continue
        dst = os.path.join(DIRS[os.path.dirname(src)], os.path.basename(src))
        if os.path.exists(dst):
            en_meta, _ = read_doc(dst)
            if en_meta.get("translated") != "auto":
                continue  # hand-written English, leave it alone
        meta = ensure_ref(src, meta, body)
        h = sha(open(src, encoding="utf-8").read())
        if os.path.exists(dst) and en_meta.get("source_hash") == h:
            continue

        print(f"translating {src} -> {dst}")
        fields = {"body": body}
        for k in ("title", "description", "tags"):
            if meta.get(k):
                fields[k] = meta[k]
        try:
            en = translate_fields(fields)
        except Exception as e:  # bad key, quota, timeout: keep the Chinese, warn, move on
            print(f"::warning file={src}::translation failed ({e}); English version not written")
            continue

        en_meta = dict(meta)
        for k in ("title", "description", "tags"):
            if k in en:
                en_meta[k] = en[k]
        en_meta.pop("lang", None)
        en_meta["translated"] = "auto"
        en_meta["source_hash"] = h
        write_doc(dst, en_meta, en["body"])
        changed.append(dst)

    print(f"done, {len(changed)} file(s) written")


if __name__ == "__main__":
    sys.path.insert(0, os.path.dirname(__file__))
    main()
