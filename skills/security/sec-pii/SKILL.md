---
name: sec-pii
description: >-
  Detect and de-identify PII before sensitive data reaches an AI model, a log, or an external service. Triggers
  when an AI pipeline sends user data to an LLM, when handling names / emails / phone / national-id / credit
  card / IBAN / medical records / addresses, and on "anonymize", "redact", "mask PII", "sanitize before sending
  to the model", "GDPR / HIPAA", or "don't leak user data to the AI". Builds a redaction step with Microsoft
  Presidio (analyze → anonymize) — masking, redacting, hashing or encrypting PII, with built-in or custom
  recognizers, for text, images and DICOM.
allowed-tools: Read, Grep, Glob, Bash, Write, Edit
---

# PII shield — anonymize before data reaches the model

The fastest way to leak user data is to pipe raw input straight into an LLM (or a log, or a third-party API).
Put a **de-identification step in front**: detect PII, then mask / redact / hash / encrypt it *before* it leaves
your trust boundary. Microsoft **Presidio** (open-source, MIT) is the standard tool for this.

## The pattern
1. **Find where raw data crosses a boundary** — prompts, RAG documents, tool outputs, error logs, analytics —
   anything sent to an LLM or a third party.
2. **Analyze** — `presidio-analyzer` detects PII (NER + regex + checksums): `PERSON`, `EMAIL_ADDRESS`,
   `PHONE_NUMBER`, `CREDIT_CARD`, `IBAN_CODE`, `US_SSN` / national-id, `LOCATION`, `MEDICAL_LICENSE`, crypto
   wallets, dates, and more — across languages.
3. **Anonymize** — `presidio-anonymizer` applies an **operator** per entity:
   | Operator | Effect | Reach for it when |
   |---|---|---|
   | `redact` | removes it | you don't need it at all |
   | `replace` | a placeholder (`<PERSON>`) | the model needs the *shape*, not the value |
   | `mask` | partial (`****-**-1234`) | keep a recognizable tail |
   | `hash` | one-way hash | join / dedupe without the value |
   | `encrypt` | reversible with a key | you must restore it later (`decrypt` inside your boundary) |
4. **Re-identify only inside your boundary** (encrypt → decrypt with your key) — never at the model.

## Minimal example (Python)
```python
from presidio_analyzer import AnalyzerEngine
from presidio_anonymizer import AnonymizerEngine

text = "My name is Sara, card 4095-2609-9393-4932, email sara@acme.com"
found = AnalyzerEngine().analyze(text=text, language="en")
safe = AnonymizerEngine().anonymize(text=text, analyzer_results=found).text
# -> "My name is <PERSON>, card <CREDIT_CARD>, email <EMAIL_ADDRESS>"   → send `safe` to the model
```

## Beyond the basics
- **Custom recognizers** — add your own entities by **deny-list**, **regex**, or a **NER model**
  (spaCy / HuggingFace transformers); or plug in an external PII model. Domain IDs (member numbers, MRNs) →
  a regex recognizer with context words.
- **Images + medical** — `presidio-image-redactor` redacts PII text *in images* and in **DICOM** medical scans.
- **Scale & deploy** — a Python library; run it in **Docker** / **Kubernetes**, or over **PySpark** for big
  batches. Put it as a **gateway step** in the pipeline, not an afterthought.
- **Tune it** — read the analyzer's confidence scores, add context words, allow-list false positives. For
  anything leaving your boundary, prioritize **recall** (don't miss PII) over precision.

## Don't
Don't send raw PII to the model "just for the prototype", don't log it before redaction, and don't trust the
model to redact its own input. Redaction happens **before** the boundary, deterministically — not in the prompt.

---
*Built on Microsoft **Presidio** (`github.com/microsoft/presidio`, MIT) — analyzer + anonymizer + image/DICOM
redactor. Complements `sec-secrets-crypto` (which guards *your* secrets); this guards your *users'* PII. See
docs/ECOSYSTEM.md.*
