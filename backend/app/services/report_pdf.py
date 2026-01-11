from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class PdfRenderResult:
    filename: str
    content_type: str
    data: bytes


def _css() -> str:
    # Keep CSS conservative for WeasyPrint compatibility.
    return """
@page { margin: 18mm; }
html, body { font-family: Georgia, "Times New Roman", Times, serif; font-size: 11pt; color: #0f172a; }
body { overflow: visible; }
h1, h2, h3, h4 { font-family: -apple-system, system-ui, "Segoe UI", Roboto, Arial, sans-serif; color: #0f172a; }
h1 { font-size: 20pt; margin: 0 0 10pt 0; }
h2 { font-size: 14pt; margin: 14pt 0 6pt 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 4pt; }
h3 { font-size: 12pt; margin: 10pt 0 4pt 0; }
p { margin: 0 0 8pt 0; line-height: 1.45; }
ul, ol { margin: 0 0 8pt 18pt; }
li { margin: 0 0 3pt 0; }
code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace; font-size: 10pt; background: #f1f5f9; padding: 1pt 3pt; border-radius: 3pt; }
pre { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace; font-size: 9.5pt; background: #f8fafc; border: 1px solid #e2e8f0; padding: 10pt; border-radius: 6pt; white-space: pre-wrap; overflow-wrap: anywhere; }

/* Tables: wrap long text and paginate cleanly */
table { width: 100%; border-collapse: collapse; margin: 10pt 0; table-layout: fixed; }
thead { display: table-header-group; }
tfoot { display: table-footer-group; }
tr { page-break-inside: avoid; }
th, td { border: 1px solid #cbd5e1; padding: 6pt 6pt; vertical-align: top; word-break: break-word; overflow-wrap: anywhere; }
th { background: #f8fafc; font-weight: 600; text-align: left; }
a { color: #0f172a; text-decoration: underline; }
blockquote { margin: 8pt 0; padding: 0 0 0 10pt; border-left: 3px solid #e2e8f0; color: #334155; }
hr { border: 0; border-top: 1px solid #e2e8f0; margin: 12pt 0; }

/* Prefer sensible breaks */
h1, h2, h3 { page-break-after: avoid; }
"""


def markdown_to_pdf(*, report_markdown: str, filename: str) -> PdfRenderResult:
    """
    Convert markdown -> HTML (with tables) -> sanitized HTML -> PDF bytes.
    """
    # Imports are inside to keep the module importable even if optional deps aren't installed yet.
    try:
        import markdown as md  # type: ignore
        import bleach  # type: ignore
        from weasyprint import CSS, HTML  # type: ignore
    except Exception as e:  # pragma: no cover
        raise RuntimeError(
            "PDF export dependencies are missing. Install backend requirements (WeasyPrint, Markdown, bleach)."
        ) from e

    html_body = md.markdown(
        report_markdown or "",
        extensions=[
            "tables",
            "fenced_code",
            "sane_lists",
        ],
        output_format="html5",
    )

    allowed_tags = [
        # text
        "p",
        "br",
        "hr",
        "strong",
        "em",
        "b",
        "i",
        "u",
        "s",
        "code",
        "pre",
        "blockquote",
        # headings
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        # lists
        "ul",
        "ol",
        "li",
        # links
        "a",
        # tables
        "table",
        "thead",
        "tbody",
        "tr",
        "th",
        "td",
    ]
    allowed_attrs = {
        "a": ["href", "title"],
        "th": ["colspan", "rowspan"],
        "td": ["colspan", "rowspan"],
    }

    clean_body = bleach.clean(
        html_body,
        tags=allowed_tags,
        attributes=allowed_attrs,
        strip=True,
    )

    html_doc = f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Assessment Principles Report</title>
  </head>
  <body>
    {clean_body}
  </body>
</html>
"""

    # Some environments emit fontconfig warnings if cache dirs are unwritable.
    # Rendering still succeeds, so we don't treat these as fatal.
    pdf_bytes = HTML(string=html_doc, base_url=None).write_pdf(stylesheets=[CSS(string=_css())])
    return PdfRenderResult(filename=filename, content_type="application/pdf", data=pdf_bytes)

