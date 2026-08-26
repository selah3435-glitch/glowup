"""Build Palm Beach County ICP email workbook from Apify Maps + prior WPB scrape."""
from __future__ import annotations

import json
import re
from pathlib import Path
from urllib.parse import urlparse

from openpyxl import Workbook
from openpyxl.chart import PieChart, Reference
from openpyxl.chart.label import DataLabelList
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

ROOT = Path(__file__).resolve().parent
NEW_RAW = ROOT / "pbc-apify-raw.json"
OLD_RAW = ROOT / "wpb-apify-raw.json"
OUT_NAME = "glowup-pbc-email-leads.xlsx"

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
LEFT = Alignment(vertical="center", wrap_text=True)
CENTER = Alignment(vertical="center", horizontal="center")

JUNK_EMAIL = re.compile(
    r"(booksy\.com|godaddy\.com|wixpress\.com|wix\.com|mysite\.com|example\.com|"
    r"sentry\.io|privacydomain|domainprivacy|noreply|no-reply|donotreply|"
    r"^filler@|^privacy@|^webmaster@|"
    r"vagaro\.com|fresha\.com|styleseat\.com|squareup\.com|thecut\.co|"
    r"glossgenius\.com|mindbodyonline\.com|boulevard\.io)",
    re.I,
)

HQ_EMAIL_NOTE = {
    "hsafrit@solasalons.com": "Sola HQ leasing (same address on multiple floors)",
    "corporate@solasalons.com": "Sola corporate (same address on multiple floors)",
    "contact@salonsbyjc.com": "Salons by JC HQ (same address on multiple floors)",
}

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


def load_json(path: Path) -> list[dict]:
    if not path.exists():
        return []
    data = json.loads(path.read_text(encoding="utf-8"))
    assert isinstance(data, list)
    return data


def norm_phone(p: str) -> str:
    digits = re.sub(r"\D+", "", p or "")
    return digits[-10:] if len(digits) >= 10 else digits


def norm_title(t: str) -> str:
    t = (t or "").strip().lower()
    t = re.sub(r"\s+", " ", t)
    t = re.sub(r"[^a-z0-9 &+'-]", "", t)
    return t


def domain_of(url: str) -> str:
    if not url:
        return ""
    try:
        host = urlparse(url if "://" in url else "http://" + url).netloc.lower()
    except Exception:
        return ""
    return host[4:] if host.startswith("www.") else host


def dedupe_key(row: dict) -> str:
    title = norm_title(row.get("title") or "")
    city = re.sub(r"\s+", " ", (row.get("city") or "").strip().lower())
    addr = re.sub(r"\s+", " ", (row.get("address") or "").strip().lower())
    phone = norm_phone(row.get("phone") or "")
    place_id = str(row.get("placeId") or "").strip()
    if place_id:
        return f"id:{place_id}"
    if title and addr:
        return f"a:{title}|{addr}"
    if title and city and phone:
        return f"cp:{title}|{city}|{phone}"
    if title and city:
        return f"c:{title}|{city}"
    if title and phone:
        return f"p:{title}|{phone}"
    site = domain_of(row.get("website") or "")
    if title and site:
        return f"w:{title}|{site}"
    return f"t:{title}"


def merge_rows(old: list[dict], new: list[dict]) -> list[dict]:
    by_key: dict[str, dict] = {}
    for src, batch in ((old, "Prior WPB"), (new, "PBC 22 Aug 2026")):
        for raw in src:
            row = dict(raw)
            row["_batch"] = batch
            key = dedupe_key(row)
            if key not in by_key:
                by_key[key] = row
                continue
            keep = by_key[key]
            # union emails / instagrams; prefer newer non-empty website/phone/city
            keep_emails = list(keep.get("emails") or [])
            for e in row.get("emails") or []:
                if e not in keep_emails:
                    keep_emails.append(e)
            keep["emails"] = keep_emails
            keep_ig = list(keep.get("instagrams") or [])
            for i in row.get("instagrams") or []:
                if i not in keep_ig:
                    keep_ig.append(i)
            keep["instagrams"] = keep_ig
            for field in ("website", "phone", "address", "city", "categoryName", "totalScore", "reviewsCount"):
                if not keep.get(field) and row.get(field):
                    keep[field] = row[field]
            if keep.get("_batch") != batch:
                keep["_batch"] = "Both runs"
    return list(by_key.values())


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
    batch = row.get("_batch") or ""
    title_l = title.lower()
    cat_l = category.lower()

    skip_reason = ""
    icp_fit = "Yes — salon / beauty floor"
    if "beauty supply" in cat_l or "supply store" in cat_l or "beauty supplies" in title_l or "beauty supply" in title_l:
        skip_reason = "Retail beauty supply, not a salon floor"
        icp_fit = "No — skip (supply store)"
    elif "ulta" in title_l or "cosmetics store" in cat_l:
        skip_reason = "Retail cosmetics chain, not a salon floor"
        icp_fit = "No — skip (retail)"
    elif "commercial agent" in cat_l and "sola beauty supplies" in title_l:
        skip_reason = "Sola supply desk, not a salon floor"
        icp_fit = "No — skip (supply)"
    elif "madison reed" in title_l:
        icp_fit = "Maybe — national chain color bar"
    elif "sola salon" in title_l or "salons by jc" in title_l or "image studios" in title_l or "salon suites" in title_l or "luna salon suites" in title_l:
        icp_fit = "Yes — suite / booth floor"
    elif "barber" in cat_l and "salon" not in cat_l:
        icp_fit = "Maybe — barber shop"
    elif "nail" in cat_l:
        icp_fit = "Maybe — nails (adjacent)"
    elif "medical spa" in cat_l or "wellness" in cat_l or "facial spa" in cat_l or "skin care" in cat_l:
        icp_fit = "Maybe — medspa / wellness"
    elif "permanent make-up" in cat_l or "waxing" in cat_l or "eyelash" in cat_l or "laser hair" in cat_l:
        icp_fit = "Yes — beauty specialist"

    hq_note = ""
    for e in emails_keep:
        note = HQ_EMAIL_NOTE.get(e.lower())
        if note:
            hq_note = note
            break

    signals = []
    if igs or "instagram.com" in website.lower():
        signals.append("Public Instagram")
    if tool:
        signals.append(f"Already on {tool}")
    if "instagram.com" in website.lower() and not tool:
        signals.append("IG listed as website (DM / social book)")
    if search in ("color bar salon", "sola salon studios", "salons by jc"):
        signals.append(f"Came up on {search}")
    if "suite" in title_l or "sola" in title_l or "salons by jc" in title_l:
        signals.append("Suite / multi-operator floor")
    if isinstance(reviews, (int, float)) and reviews >= 100:
        signals.append(f"{int(reviews)} Google reviews (established listing)")
    if emails_junk:
        signals.append("Dropped placeholder email: " + "; ".join(emails_junk))
    if hq_note:
        signals.append(hq_note)

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
        "City": city or "(city missing)",
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
        "Batch": batch,
        "HQ email note": hq_note,
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
    "Batch",
    "ICP signals (facts only)",
    "Dropped emails",
    "Skip reason",
    "Source",
]

COLS_EMAIL = [
    "Salon",
    "Email",
    "All public emails",
    "HQ email note",
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
    "Batch",
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
    "Batch",
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
    "Batch",
]


def style_header(ws, cols: int, fill_hex=INK):
    fill = PatternFill("solid", fgColor=fill_hex)
    for col in range(1, cols + 1):
        cell = ws.cell(1, col)
        cell.font = HEADER_FONT
        cell.fill = fill
        cell.alignment = Alignment(vertical="center", wrap_text=True)
        cell.border = THIN
    ws.freeze_panes = "A2"
    ws.row_dimensions[1].height = 28
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
            if h in ("Email",) and isinstance(val, str) and "@" in val:
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


def add_cover(
    ws,
    rows: list[dict],
    n_email: int,
    n_phone: int,
    n_skip: int,
    n_listing: int,
    n_unique_emails: int,
    n_new_email: int,
):
    ws.sheet_view.showGridLines = False
    ws.merge_cells("A1:F1")
    ws["A1"] = "GlowUP · Palm Beach County salon emails"
    ws["A1"].font = TITLE_FONT
    ws.merge_cells("A2:F2")
    ws["A2"] = "Company Lead Scout · public website emails only · 22 Aug 2026"
    ws["A2"].font = SUB_FONT

    summary = [
        ("Unique places after merge", len(rows)),
        ("Usable public emails (outreach rows)", n_email),
        ("Distinct email addresses", n_unique_emails),
        ("New email rows this run (not in prior WPB)", n_new_email),
        ("Phone or Instagram only", n_phone),
        ("Listing only (no phone / IG / email)", n_listing),
        ("Skipped (not ICP / junk contact)", n_skip),
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
    labels = Reference(ws, min_col=1, min_row=7, max_row=12)
    data = Reference(ws, min_col=2, min_row=7, max_row=12)
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
            "Google Maps (this run)",
            "Apify actor compass/crawler-google-places. Search strings: hair salon, color bar salon, beauty salon, sola salon studios, salons by jc. Location: Palm Beach County, Florida, USA. scrapeContacts=true, website=withWebsite, skipClosedPlaces=true. 40 places per search. Run BeXoqoZAA3ckLMZiN, dataset IoMnpEVPF6gNlAKwF. 139 places.",
        ),
        (
            "Prior West Palm Beach scrape",
            "Merged in. Same actor, WPB-only searches (hair salon / beauty salon / color bar). Slim JSON at wpb-apify-raw.json. Dedupe by salon name + phone/address.",
        ),
        (
            "What an email means here",
            "Public address published on the salon’s own website (mailto / contact page), pulled by Apify scrapeContacts. Nothing invented. Nothing guessed from a name.",
        ),
        (
            "Dropped as unusable",
            "Booksy, GoDaddy, Wix, mysite, Vagaro/Fresha/StyleSeat/Square support inboxes, noreply. Beauty supply retail and Ulta are on Skip.",
        ),
        (
            "HQ emails (do not blast 8 times)",
            "hsafrit@solasalons.com, corporate@solasalons.com, and contact@salonsbyjc.com repeat across suite floors. Locations stay on Outreach so you can pick a floor; the HQ note column flags the shared inbox.",
        ),
        (
            "ICP kept in",
            "Independent salons, color bars, beauty floors, and suite buildings (Sola, Salons by JC, Image Studios, Luna, Salon Suites). Adjacent specialists stay with a Maybe flag. Madison Reed is Maybe (national chain). No occupancy, ticket, or conversion numbers were added.",
        ),
        (
            "Sheets in this file",
            "Outreach — emails = send from this tab. All Maps results = every unique place. Phone & Instagram = no usable email yet. Skip = not a GlowUP company prospect. This cover = method and counts.",
        ),
        (
            "Files next to this workbook",
            f"{NEW_RAW.name} + {OLD_RAW.name}",
        ),
    ]

    start = 16
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
        ws.row_dimensions[i].height = 52 if detail else 22

    ws.column_dimensions["A"].width = 46
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
        "ICP fit": 32,
        "Email": 36,
        "All public emails": 42,
        "Dropped emails": 28,
        "Phone": 18,
        "City": 20,
        "Address": 42,
        "Website": 38,
        "Instagram": 38,
        "Category": 26,
        "Google rating": 14,
        "Google reviews": 16,
        "Booking tool on listing": 22,
        "Search used": 18,
        "Source": 28,
        "ICP signals (facts only)": 52,
        "Skip reason": 36,
        "Batch": 18,
        "HQ email note": 42,
    }
    return {get_column_letter(i): preset.get(h, 18) for i, h in enumerate(headers, 1)}


def main():
    merged = merge_rows(load_json(OLD_RAW), load_json(NEW_RAW))
    classified = [classify(r) for r in merged]
    rank = {"Email ready": 0, "Phone / IG only": 1, "Listing only": 2, "Skip": 3}
    classified.sort(
        key=lambda r: (
            rank.get(r["Status"], 9),
            0 if r["ICP fit"].startswith("Yes") else 1 if r["ICP fit"].startswith("Maybe") else 2,
            -(r["Google reviews"] or 0),
            (r["City"] or "").lower(),
            r["Salon"].lower(),
        )
    )

    emails = [r for r in classified if r["Status"] == "Email ready"]
    phones = [r for r in classified if r["Status"] == "Phone / IG only"]
    listing = [r for r in classified if r["Status"] == "Listing only"]
    skips = [r for r in classified if r["Status"] == "Skip"]
    unique_emails = {e.lower() for r in emails for e in (r["All public emails"] or "").split("; ") if e}
    new_email = [r for r in emails if r["Batch"] != "Prior WPB"]

    wb = Workbook()
    cover = wb.active
    cover.title = "How found"
    add_cover(
        cover,
        classified,
        len(emails),
        len(phones),
        len(skips),
        len(listing),
        len(unique_emails),
        len(new_email),
    )

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
        ws.oddHeader.left.text = "GlowUP · Palm Beach County scrape"
        ws.oddFooter.left.text = "Public listing facts only — no invented emails or occupancy"

    dests = [
        ROOT / OUT_NAME,
        Path(r"C:\Users\Aepfr\Downloads") / OUT_NAME,
    ]
    for p in dests:
        p.parent.mkdir(parents=True, exist_ok=True)
        wb.save(p)
        print(
            f"wrote {p}  emails={len(emails)} unique_addr={len(unique_emails)} "
            f"new_email_rows={len(new_email)} phone={len(phones)} listing={len(listing)} "
            f"skip={len(skips)} all={len(classified)}"
        )


if __name__ == "__main__":
    main()
