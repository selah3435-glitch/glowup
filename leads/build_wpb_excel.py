"""Build the West Palm Beach ICP scrape workbook from wpb-apify-raw.json."""
from __future__ import annotations

import json
import re
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.chart import PieChart, Reference
from openpyxl.chart.label import DataLabelList

ROOT = Path(__file__).resolve().parent
RAW = ROOT / "wpb-apify-raw.json"
OUT_NAME = "glowup-wpb-scrape-all.xlsx"

INK = "1C1917"
GOLD = "C9A227"
CREAM = "FBF7F0"
ROW_ALT = "F7F1E6"
GREEN = "166534"
GREEN_BG = "DCFCE7"
AMBER = "92400E"
AMBER_BG = "FEF3C7"
SLATE = "44403C"
SKIP_BG = "F5F5F4"
SKIP_FG = "57534E"
WHITE = "FFFFFF"
LINK = "1D4ED8"
THIN = Border(
    left=Side(style="thin", color="E7E5E4"),
    right=Side(style="thin", color="E7E5E4"),
    top=Side(style="thin", color="E7E5E4"),
    bottom=Side(style="thin", color="E7E5E4"),
)
HEADER_FONT = Font(name="Calibri", bold=True, color=WHITE, size=11)
TITLE_FONT = Font(name="Calibri", bold=True, color=INK, size=18)
SUB_FONT = Font(name="Calibri", color=SLATE, size=11)
BODY = Font(name="Calibri", color=INK, size=11)
BOLD = Font(name="Calibri", bold=True, color=INK, size=11)
LINK_FONT = Font(name="Calibri", color=LINK, size=11, underline="single")
WRAP = Alignment(wrap_text=True, vertical="center")
LEFT = Alignment(vertical="center", wrap_text=True)
CENTER = Alignment(vertical="center", horizontal="center")

JUNK_EMAIL = re.compile(
    r"(booksy\.com|godaddy\.com|wixpress\.com|wix\.com|mysite\.com|example\.com|"
    r"sentry\.io|privacydomain|domainprivacy|noreply|no-reply|donotreply|"
    r"^filler@|^privacy@|^webmaster@)",
    re.I,
)

BOOKING_HINTS = [
    ("GlossGenius", r"glossgenius"),
    ("Booksy", r"booksy"),
    ("Acuity / as.me", r"as\.me"),
    ("The Cut", r"thecut\.co"),
    ("Vagaro", r"vagaro"),
    ("Fresha", r"fresha"),
    ("StyleSeat", r"styleseat"),
    ("Square", r"squareup|square\.site"),
    ("Mindbody", r"mindbody"),
    ("Boulevard", r"boulevard"),
]


def load_rows() -> list[dict]:
    data = json.loads(RAW.read_text(encoding="utf-8"))
    assert isinstance(data, list)
    return data


def clean_emails(emails: list | None) -> tuple[list[str], list[str]]:
    keep, junk = [], []
    for raw in emails or []:
        e = str(raw).strip()
        if not e or "@" not in e:
            continue
        if JUNK_EMAIL.search(e):
            junk.append(e)
        else:
            keep.append(e)
    # de-dupe preserve order
    def uniq(xs):
        seen = set()
        out = []
        for x in xs:
            k = x.lower()
            if k in seen:
                continue
            seen.add(k)
            out.append(x)
        return out

    return uniq(keep), uniq(junk)


def first(xs) -> str:
    return xs[0] if xs else ""


def booking_tool(website: str, emails: list[str]) -> str:
    blob = " ".join([website or ""] + emails)
    for label, pat in BOOKING_HINTS:
        if re.search(pat, blob, re.I):
            return label
    return ""


def classify(row: dict) -> dict:
    title = (row.get("title") or "").strip()
    website = (row.get("website") or "").strip()
    phone = (row.get("phone") or "").strip()
    address = (row.get("address") or "").strip()
    city = (row.get("city") or "").strip()
    category = (row.get("categoryName") or "").strip()
    search = (row.get("searchString") or "").strip()
    emails_keep, emails_junk = clean_emails(row.get("emails"))
    igs = [str(x).strip() for x in (row.get("instagrams") or []) if str(x).strip()]
    rating = row.get("totalScore")
    reviews = row.get("reviewsCount")
    tool = booking_tool(website, (row.get("emails") or []) + emails_keep)

    cat_l = category.lower()
    skip_reason = ""
    icp_fit = "Yes — salon / beauty floor"
    if "beauty supply" in cat_l or "supply store" in cat_l:
        skip_reason = "Retail beauty supply, not a salon floor"
        icp_fit = "No — skip (supply store)"
    elif "sola salon" in title.lower() or "salons by jc" in title.lower():
        icp_fit = "Yes — suite / booth floor"
    elif "barber" in cat_l and "salon" not in cat_l:
        icp_fit = "Maybe — barber shop"
    elif "nail" in cat_l:
        icp_fit = "Maybe — nails (adjacent)"
    elif "medical spa" in cat_l or "wellness" in cat_l:
        icp_fit = "Maybe — medspa / wellness"
    elif "permanent make-up" in cat_l or "waxing" in cat_l:
        icp_fit = "Yes — beauty specialist"

    signals = []
    if igs or "instagram.com" in website.lower():
        signals.append("Public Instagram")
    if tool:
        signals.append(f"Already on {tool}")
    if "instagram.com" in website.lower() and not tool:
        signals.append("IG listed as website (DM / social book)")
    if search == "color bar salon":
        signals.append("Came up on color-bar search")
    if "suite" in title.lower() or "sola" in title.lower() or "salons by jc" in title.lower():
        signals.append("Suite / multi-operator floor")
    if isinstance(reviews, (int, float)) and reviews >= 100:
        signals.append(f"{int(reviews)} Google reviews (established listing)")
    if emails_junk:
        signals.append("Dropped placeholder email: " + "; ".join(emails_junk))

    if skip_reason:
        status = "Skip"
    elif emails_keep:
        status = "Email ready"
    elif phone or igs:
        status = "Phone / IG only"
    else:
        status = "Listing only"

    return {
        "Salon": title,
        "Status": status,
        "ICP fit": icp_fit,
        "Email": first(emails_keep),
        "All public emails": "; ".join(emails_keep),
        "Dropped emails": "; ".join(emails_junk),
        "Phone": phone,
        "City": city,
        "Address": address,
        "Website": website,
        "Instagram": first(igs),
        "Category": category,
        "Google rating": rating if isinstance(rating, (int, float)) else None,
        "Google reviews": reviews if isinstance(reviews, (int, float)) else None,
        "Booking tool on listing": tool,
        "Search used": search,
        "Source": "Google Maps (Apify compass/crawler-google-places) + website contact scrape",
        "ICP signals (facts only)": "; ".join(signals) if signals else "Listing only — no extra copy scored",
        "Skip reason": skip_reason,
    }


COLS_ALL = [
    "Salon",
    "Status",
    "ICP fit",
    "Email",
    "All public emails",
    "Phone",
    "City",
    "Address",
    "Website",
    "Instagram",
    "Category",
    "Google rating",
    "Google reviews",
    "Booking tool on listing",
    "Search used",
    "ICP signals (facts only)",
    "Dropped emails",
    "Skip reason",
    "Source",
]

COLS_EMAIL = [
    "Salon",
    "Email",
    "Phone",
    "City",
    "Website",
    "Instagram",
    "Category",
    "Google rating",
    "Google reviews",
    "Booking tool on listing",
    "Address",
    "ICP fit",
    "ICP signals (facts only)",
]

COLS_PHONE = [
    "Salon",
    "Phone",
    "Instagram",
    "Website",
    "City",
    "Address",
    "Category",
    "Google rating",
    "Google reviews",
    "Booking tool on listing",
    "ICP fit",
    "ICP signals (facts only)",
]

COLS_SKIP = [
    "Salon",
    "Skip reason",
    "Dropped emails",
    "Phone",
    "Website",
    "Category",
    "Address",
]


def style_header(ws, cols: int, fill_hex=INK):
    fill = PatternFill("solid", fgColor=fill_hex)
    for col in range(1, cols + 1):
        cell = ws.cell(1, col)
        cell.font = HEADER_FONT
        cell.fill = fill
        cell.alignment = Alignment(vertical="center", wrap_text=True)
        cell.border = THIN
    ws.auto_filter.ref = ws.dimensions
    ws.freeze_panes = "A2"
    ws.row_dimensions[1].height = 28
    ws.auto_filter.ref = f"A1:{get_column_letter(cols)}{ws.max_row}"
    ws.sheet_view.showGridLines = False


def autosize(ws, widths: dict[str, float]):
    for col, width in widths.items():
        ws.column_dimensions[col].width = width


def write_table(ws, headers: list[str], rows: list[dict], status_col: str | None = "Status"):
    for c, h in enumerate(headers, 1):
        ws.cell(1, c, h)

    status_fills = {
        "Email ready": (GREEN_BG, GREEN),
        "Phone / IG only": (AMBER_BG, AMBER),
        "Skip": (SKIP_BG, SKIP_FG),
        "Listing only": ("E7E5E4", SKIP_FG),
    }

    for r_i, row in enumerate(rows, 2):
        alt = PatternFill("solid", fgColor=ROW_ALT if r_i % 2 == 0 else CREAM)
        for c, h in enumerate(headers, 1):
            val = row.get(h)
            cell = ws.cell(r_i, c, val if val not in (None, "") else "")
            cell.font = BODY
            cell.alignment = LEFT
            cell.border = THIN
            cell.fill = alt
            if h in ("Website", "Instagram") and isinstance(val, str) and val.startswith("http"):
                cell.hyperlink = val
                cell.font = LINK_FONT
            if h == "Email" and isinstance(val, str) and "@" in val:
                cell.hyperlink = f"mailto:{val}"
                cell.font = LINK_FONT
            if h == "Google rating" and isinstance(val, (int, float)):
                cell.number_format = "0.0"
                cell.alignment = CENTER
            if h == "Google reviews" and isinstance(val, (int, float)):
                cell.number_format = "#,##0"
                cell.alignment = CENTER
            if status_col and h == status_col:
                bg, fg = status_fills.get(str(val), (None, None))
                if bg:
                    cell.fill = PatternFill("solid", fgColor=bg)
                    cell.font = Font(name="Calibri", bold=True, color=fg, size=11)
                    cell.alignment = CENTER
        ws.row_dimensions[r_i].height = 22

    style_header(ws, len(headers))
    ws.auto_filter.ref = f"A1:{get_column_letter(len(headers))}{max(ws.max_row, 1)}"


def add_cover(ws, rows: list[dict], n_email: int, n_phone: int, n_skip: int, n_listing: int):
    ws.sheet_view.showGridLines = False
    ws.merge_cells("A1:F1")
    ws["A1"] = "GlowUP · West Palm Beach salon scrape"
    ws["A1"].font = TITLE_FONT
    ws.merge_cells("A2:F2")
    ws["A2"] = "Company Lead Scout · ICP salons with public contact facts only · 20 Aug 2026"
    ws["A2"].font = SUB_FONT

    summary = [
        ("Places from Google Maps", len(rows)),
        ("Usable public emails (outreach)", n_email),
        ("Phone or Instagram only", n_phone),
        ("Listing only (no phone / IG / email)", n_listing),
        ("Skipped (not ICP / junk contact)", n_skip),
        ("Emails in ScrapingBee Google snippets", 0),
    ]
    ws["A4"] = "Counts"
    ws["A4"].font = Font(name="Calibri", bold=True, size=13, color=INK)
    ws["A5"] = "What"
    ws["B5"] = "Number"
    for col in (1, 2):
        ws.cell(5, col).font = HEADER_FONT
        ws.cell(5, col).fill = PatternFill("solid", fgColor=INK)
        ws.cell(5, col).alignment = CENTER
    for i, (label, n) in enumerate(summary, 6):
        ws.cell(i, 1, label).font = BODY
        ws.cell(i, 1).fill = PatternFill("solid", fgColor=CREAM if i % 2 else ROW_ALT)
        ws.cell(i, 1).border = THIN
        c = ws.cell(i, 2, n)
        c.font = BOLD
        c.alignment = CENTER
        c.fill = PatternFill("solid", fgColor=CREAM if i % 2 else ROW_ALT)
        c.border = THIN
        c.number_format = "0"

    chart = PieChart()
    chart.title = "Pipeline mix"
    labels = Reference(ws, min_col=1, min_row=7, max_row=10)
    data = Reference(ws, min_col=2, min_row=7, max_row=10)
    chart.add_data(data, from_rows=False, titles_from_data=False)
    chart.set_categories(labels)
    chart.dataLabels = DataLabelList()
    chart.dataLabels.showPercent = True
    chart.dataLabels.showVal = True
    chart.dataLabels.showCatName = False
    chart.width = 12
    chart.height = 7
    ws.add_chart(chart, "D4")

    how = [
        ("How found", ""),
        (
            "Google Maps",
            "Apify actor compass/crawler-google-places. Search strings: hair salon, beauty salon, color bar salon. Location: West Palm Beach, FL. scrapeContacts=true, website=true. Dataset PbTF6aA5dn3vgRZCJ (run cIlSjHSMKYFN3RGGI stopped at the place cap).",
        ),
        (
            "Google search (ScrapingBee)",
            "Same city / ICP queries through ScrapingBee Google SERP. 38 organic hits. Zero emails in snippets — Bee is discovery, not a contact scrape.",
        ),
        (
            "What an email means here",
            "Public address published on the salon’s own website (mailto / contact page), pulled by Apify scrapeContacts. Nothing invented. Nothing guessed from a name.",
        ),
        (
            "Dropped as unusable",
            "Booksy help.us@, GoDaddy filler@, mysite.com, and other platform placeholders. Beauty supply retail (Beauty Exchange) is on Skip, not outreach.",
        ),
        (
            "ICP kept in",
            "Independent salons, color bars, beauty floors, and suite buildings (Sola, Salons by JC). Adjacent specialists (wax, PMU, medspa) stay on the full list with a Maybe flag. No occupancy, ticket, or conversion numbers were added.",
        ),
        (
            "Sheets in this file",
            "Outreach — emails = send from this tab. All Maps results = every place. Phone & Instagram = no usable email yet. Skip = not a GlowUP company prospect. This cover = method and counts.",
        ),
        (
            "Files next to this workbook",
            str(RAW),
        ),
    ]

    start = 14
    ws.cell(start, 1, "Method").font = Font(name="Calibri", bold=True, size=13, color=INK)
    ws.cell(start + 1, 1, "Topic").font = HEADER_FONT
    ws.cell(start + 1, 1).fill = PatternFill("solid", fgColor=GOLD)
    ws.cell(start + 1, 2, "Detail").font = HEADER_FONT
    ws.cell(start + 1, 2).fill = PatternFill("solid", fgColor=GOLD)
    ws.merge_cells(start_row=start + 1, start_column=2, end_row=start + 1, end_column=6)
    for i, (topic, detail) in enumerate(how, start + 2):
        a = ws.cell(i, 1, topic)
        a.font = BOLD
        a.alignment = Alignment(wrap_text=True, vertical="top")
        a.fill = PatternFill("solid", fgColor=ROW_ALT)
        a.border = THIN
        ws.merge_cells(start_row=i, start_column=2, end_row=i, end_column=6)
        b = ws.cell(i, 2, detail)
        b.font = BODY
        b.alignment = Alignment(wrap_text=True, vertical="top")
        b.fill = PatternFill("solid", fgColor=CREAM)
        b.border = THIN
        ws.row_dimensions[i].height = 48 if detail else 22

    ws.column_dimensions["A"].width = 42
    ws.column_dimensions["B"].width = 22
    for col in "CDEF":
        ws.column_dimensions[col].width = 18
    ws.row_dimensions[1].height = 28
    ws.freeze_panes = "A4"
    ws.print_title_rows = "1:2"
    ws.page_setup.orientation = "landscape"
    ws.page_setup.fitToPage = True
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 1
    ws.sheet_properties.pageSetUpPr.fitToPage = True


def widths_for(headers: list[str]) -> dict[str, float]:
    preset = {
        "Salon": 36,
        "Status": 18,
        "ICP fit": 28,
        "Email": 34,
        "All public emails": 36,
        "Dropped emails": 28,
        "Phone": 18,
        "City": 18,
        "Address": 42,
        "Website": 38,
        "Instagram": 38,
        "Category": 26,
        "Google rating": 14,
        "Google reviews": 16,
        "Booking tool on listing": 22,
        "Search used": 16,
        "Source": 28,
        "ICP signals (facts only)": 48,
        "Skip reason": 36,
    }
    return {get_column_letter(i): preset.get(h, 18) for i, h in enumerate(headers, 1)}


def main():
    classified = [classify(r) for r in load_rows()]
    # stable sort: email ready first, then phone, then listing, skip last; then reviews desc
    rank = {"Email ready": 0, "Phone / IG only": 1, "Listing only": 2, "Skip": 3}
    classified.sort(
        key=lambda r: (
            rank.get(r["Status"], 9),
            -(r["Google reviews"] or 0),
            r["Salon"].lower(),
        )
    )

    emails = [r for r in classified if r["Status"] == "Email ready"]
    phones = [r for r in classified if r["Status"] == "Phone / IG only"]
    listing = [r for r in classified if r["Status"] == "Listing only"]
    skips = [r for r in classified if r["Status"] == "Skip"]

    wb = Workbook()
    cover = wb.active
    cover.title = "How found"
    add_cover(cover, classified, len(emails), len(phones), len(skips), len(listing))

    ws_e = wb.create_sheet("Outreach — emails", 1)
    write_table(ws_e, COLS_EMAIL, emails, status_col=None)
    autosize(ws_e, widths_for(COLS_EMAIL))
    for cell in ws_e[1]:
        cell.fill = PatternFill("solid", fgColor=GREEN)

    ws_all = wb.create_sheet("All Maps results", 2)
    write_table(ws_all, COLS_ALL, classified)
    autosize(ws_all, widths_for(COLS_ALL))

    ws_p = wb.create_sheet("Phone & Instagram", 3)
    write_table(ws_p, COLS_PHONE, phones, status_col=None)
    autosize(ws_p, widths_for(COLS_PHONE))
    for cell in ws_p[1]:
        cell.fill = PatternFill("solid", fgColor="B45309")

    ws_s = wb.create_sheet("Skip", 4)
    write_table(ws_s, COLS_SKIP, skips, status_col=None)
    autosize(ws_s, widths_for(COLS_SKIP))
    for cell in ws_s[1]:
        cell.fill = PatternFill("solid", fgColor="57534E")

    for ws in (ws_e, ws_all, ws_p, ws_s):
        ws.page_setup.orientation = "landscape"
        ws.page_setup.fitToPage = True
        ws.page_setup.fitToWidth = 1
        ws.page_setup.fitToHeight = 0
        ws.page_setup.paperSize = ws.PAPERSIZE_TABLOID
        ws.print_title_rows = "1:1"
        ws.sheet_properties.pageSetUpPr.fitToPage = True
        ws.oddHeader.left.text = "GlowUP · West Palm Beach scrape"
        ws.oddFooter.left.text = "Public listing facts only — no invented emails or occupancy"

    dests = [
        ROOT / OUT_NAME,
        Path(r"C:\Users\Aepfr\Downloads") / OUT_NAME,
    ]
    for p in dests:
        p.parent.mkdir(parents=True, exist_ok=True)
        wb.save(p)
        print(f"wrote {p}  emails={len(emails)} phone={len(phones)} listing={len(listing)} skip={len(skips)} all={len(classified)}")


if __name__ == "__main__":
    main()
