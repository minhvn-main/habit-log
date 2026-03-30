import os
import shutil
import threading
from datetime import date, datetime
from pathlib import Path
from zoneinfo import ZoneInfo
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, send_file
from sqlalchemy import cast, Integer as SAInteger, func

from config import Config
from models import db, Schueler, Beitragserwartung, Bankbuchung, Zuordnung, ImportBatch, Beitragsplan, GelernteZuordnung
from tools.import_csv import importiere_csv
from tools.abgleich import fuehre_abgleich_durch, lerne_aus_manueller_zuordnung
from tools.sync_schueler import synchronisiere_schueler, erzeuge_monatliche_erwartungen

_BERLIN = ZoneInfo("Europe/Berlin")


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    db.init_app(app)

    with app.app_context():
        db.create_all()

    @app.context_processor
    def inject_sidebar_context():
        token_file = app.config["GOOGLE_TOKEN_FILE"]
        creds_file = app.config["GOOGLE_CREDENTIALS_FILE"]
        sheet_id = app.config.get("GOOGLE_SHEET_ID", "")
        if not os.path.exists(creds_file) or not bool(sheet_id):
            sheets_status = "nicht_eingerichtet"
        elif not os.path.exists(token_file):
            sheets_status = "nicht_autorisiert"
        else:
            sheets_status = "token_abgelaufen"
            try:
                import json as _json
                with open(token_file) as _f:
                    _tok = _json.load(_f)
                _expiry_str = _tok.get("expiry")
                if _expiry_str:
                    from datetime import timezone as _tz
                    _expiry = datetime.fromisoformat(_expiry_str.replace("Z", "+00:00"))
                    if _expiry >= datetime.now(_tz.utc):
                        sheets_status = "verbunden"
            except Exception:
                sheets_status = "token_abgelaufen"
        return dict(sidebar_sheets_status=sheets_status)

    @app.template_filter("format_dt")
    def format_dt(dt):
        """Formatiert ein UTC-DateTime als CET/CEST (Europe/Berlin)."""
        if not dt:
            return "—"
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=ZoneInfo("UTC"))
        return dt.astimezone(_BERLIN).strftime("%d.%m.%Y %H:%M")

    # --- Dashboard ---

    _MONATE_DE = ["Januar","Februar","März","April","Mai","Juni",
                  "Juli","August","September","Oktober","November","Dezember"]

    def _monat_label(m: str) -> str:
        """'2026-03' → 'März 2026'"""
        try:
            y, mo = m.split("-")
            return f"{_MONATE_DE[int(mo)-1]} {y}"
        except Exception:
            return m

    @app.route("/")
    def dashboard():
        heute_monat = date.today().strftime("%Y-%m")
        gewaehlter_monat = request.args.get("monat", heute_monat)
        alle_monate = gewaehlter_monat == "alle"

        # Available months from DB for the selector
        monate_raw = (
            db.session.query(Beitragserwartung.monat)
            .distinct()
            .order_by(Beitragserwartung.monat.desc())
            .all()
        )
        verfuegbare_monate = [m[0] for m in monate_raw]

        if alle_monate:
            erwartungen = Beitragserwartung.query.all()
        else:
            erwartungen = Beitragserwartung.query.filter_by(monat=gewaehlter_monat).all()

        bezahlt = sum(1 for e in erwartungen if e.status == "zugeordnet")
        offen = sum(1 for e in erwartungen if e.status == "offen")
        markiert = sum(1 for e in erwartungen if e.gepinnt)
        erlassen = sum(1 for e in erwartungen if e.status == "erlassen")
        teilweise = sum(1 for e in erwartungen if e.status == "teilweise")
        neu = 0 if alle_monate else sum(1 for e in erwartungen if e.erster_monat)
        gesamt_erwartungen = len(erwartungen)
        prozent_abgeglichen = int(bezahlt / gesamt_erwartungen * 100) if gesamt_erwartungen > 0 else 0

        summe_erwartet = sum(e.erwarteter_betrag for e in erwartungen)
        summe_bezahlt = sum(
            e.erwarteter_betrag for e in erwartungen if e.status == "zugeordnet"
        )

        schueler_aktiv = Schueler.query.filter_by(status="aktiv").count()
        schueler_ki = Schueler.query.filter_by(status="kuendigung_initiiert").count()
        schueler_gkd = Schueler.query.filter_by(status="gekuendigt").count()
        schueler_gesamt = schueler_aktiv + schueler_ki + schueler_gkd

        letzte_imports = ImportBatch.query.order_by(
            ImportBatch.importiert_am.desc()
        ).limit(5).all()

        batch_zeitraeume = {}
        batch_abgeglichen = {}
        for b in letzte_imports:
            min_max = db.session.query(
                func.min(Bankbuchung.buchungstag),
                func.max(Bankbuchung.buchungstag),
            ).filter(Bankbuchung.import_batch_id == b.id).first()
            batch_zeitraeume[b.id] = min_max
            total = db.session.query(func.count(Bankbuchung.id)).filter(
                Bankbuchung.import_batch_id == b.id
            ).scalar() or 0
            matched = db.session.query(func.count(Bankbuchung.id)).filter(
                Bankbuchung.import_batch_id == b.id,
                Bankbuchung.status == "zugeordnet",
            ).scalar() or 0
            batch_abgeglichen[b.id] = (matched, total)

        letzte_sync = db.session.query(db.func.max(Schueler.sync_zeitpunkt)).scalar()

        creds_file = app.config["GOOGLE_CREDENTIALS_FILE"]
        token_file = app.config["GOOGLE_TOKEN_FILE"]
        sheet_id = app.config.get("GOOGLE_SHEET_ID", "")
        google_konfiguriert = os.path.exists(creds_file)
        google_verbunden = False
        google_token_abgelaufen = False
        if os.path.exists(token_file):
            try:
                import json as _json
                with open(token_file) as _f:
                    _tok = _json.load(_f)
                _expiry_str = _tok.get("expiry")
                if _expiry_str:
                    from datetime import timezone as _tz
                    _expiry = datetime.fromisoformat(_expiry_str.replace("Z", "+00:00"))
                    if _expiry < datetime.now(_tz.utc):
                        google_token_abgelaufen = True
                    else:
                        google_verbunden = True
                else:
                    google_verbunden = True
            except Exception:
                google_token_abgelaufen = True

        return render_template(
            "dashboard.html",
            aktueller_monat=gewaehlter_monat,
            alle_monate=alle_monate,
            verfuegbare_monate=verfuegbare_monate,
            monat_label=_monat_label(gewaehlter_monat) if not alle_monate else "Alle Monate",
            bezahlt=bezahlt,
            offen=offen,
            markiert=markiert,
            teilweise=teilweise,
            neu=neu,
            summe_erwartet=summe_erwartet,
            summe_bezahlt=summe_bezahlt,
            schueler_aktiv=schueler_aktiv,
            schueler_ki=schueler_ki,
            schueler_gkd=schueler_gkd,
            schueler_gesamt=schueler_gesamt,
            letzte_imports=letzte_imports,
            letzte_sync=letzte_sync,
            google_konfiguriert=google_konfiguriert,
            google_verbunden=google_verbunden,
            google_token_abgelaufen=google_token_abgelaufen,
            sheet_id_gesetzt=bool(sheet_id),
            prozent_abgeglichen=prozent_abgeglichen,
            gesamt_erwartungen=gesamt_erwartungen,
            erlassen=erlassen,
            batch_zeitraeume=batch_zeitraeume,
            batch_abgeglichen=batch_abgeglichen,
        )

    # --- Schüler_innen ---

    @app.route("/schueler")
    def schueler_liste():
        status_filter = request.args.get("status", "")
        klasse_filter = request.args.get("klasse", "")
        kategorie_filter = request.args.get("kategorie", "")
        suche = request.args.get("suche", "")
        zuordnung_filter = request.args.get("zuordnung", "")
        iban_filter = request.args.get("iban", "")
        sort_field = request.args.get("sort", "sheet_id")
        sort_dir = request.args.get("dir", "asc")

        query = Schueler.query

        if status_filter:
            query = query.filter_by(status=status_filter)
        if klasse_filter:
            query = query.filter(Schueler.klasse.ilike(f"%{klasse_filter}%"))
        if kategorie_filter:
            query = query.filter(Schueler.klasse.ilike(f"%{kategorie_filter}%"))
        if suche:
            query = query.filter(
                db.or_(
                    Schueler.vorname.ilike(f"%{suche}%"),
                    Schueler.name.ilike(f"%{suche}%"),
                    Schueler.email.ilike(f"%{suche}%"),
                )
            )
        if iban_filter == "ohne":
            query = query.filter(db.or_(Schueler.iban == None, Schueler.iban == ""))
        if zuordnung_filter == "vollstaendig":
            aktueller_monat_str = date.today().strftime("%Y-%m")
            offene_ids = db.session.query(Beitragserwartung.schueler_id).filter(
                Beitragserwartung.status == "offen",
                Beitragserwartung.monat <= aktueller_monat_str,
            ).subquery()
            query = query.filter(~Schueler.id.in_(offene_ids))
        elif zuordnung_filter == "offen":
            aktueller_monat_str = date.today().strftime("%Y-%m")
            offene_ids = db.session.query(Beitragserwartung.schueler_id).filter(
                Beitragserwartung.status.in_(["offen", "teilweise"]),
                Beitragserwartung.monat <= aktueller_monat_str,
            ).subquery()
            query = query.filter(Schueler.id.in_(offene_ids))

        SORT_COLS = {
            "sheet_id": [cast(Schueler.sheet_id, SAInteger)],
            "name": [Schueler.vorname, Schueler.name],
            "klasse": [Schueler.klasse],
            "alter": [Schueler.geburtsdatum],
            "beitrag": [Schueler.monatsbeitrag],
            "mitglied": [Schueler.mitglied_seit],
            "status": [Schueler.status],
        }
        cols = SORT_COLS.get(sort_field, [Schueler.sheet_id])
        # Alter invertiert: "asc" = jünger zuerst = geburtsdatum desc
        if sort_field == "alter":
            order_cols = [c.desc() if sort_dir == "asc" else c.asc() for c in cols]
        elif sort_dir == "desc":
            order_cols = [c.desc() for c in cols]
        else:
            order_cols = [c.asc() for c in cols]

        schueler = query.order_by(*order_cols).all()

        klassen_raw = db.session.query(Schueler.klasse).distinct().order_by(Schueler.klasse).all()
        klassen_set = set()
        for (k,) in klassen_raw:
            if k:
                for part in k.split("/"):
                    p = part.strip()
                    if p:
                        klassen_set.add(p)
        klassen = sorted(klassen_set)

        # Globale Statistiken für Header
        schueler_stats_gesamt = Schueler.query.count()
        schueler_stats_aktiv = Schueler.query.filter_by(status="aktiv").count()
        schueler_stats_ki = Schueler.query.filter_by(status="kuendigung_initiiert").count()
        schueler_stats_gkd = Schueler.query.filter_by(status="gekuendigt").count()

        return render_template(
            "schueler.html",
            schueler=schueler,
            klassen=klassen,
            status_filter=status_filter,
            klasse_filter=klasse_filter,
            kategorie_filter=kategorie_filter,
            suche=suche,
            zuordnung_filter=zuordnung_filter,
            iban_filter=iban_filter,
            sort_field=sort_field,
            sort_dir=sort_dir,
            schueler_stats_gesamt=schueler_stats_gesamt,
            schueler_stats_aktiv=schueler_stats_aktiv,
            schueler_stats_ki=schueler_stats_ki,
            schueler_stats_gkd=schueler_stats_gkd,
        )

    @app.route("/schueler/<int:schueler_id>")
    def schueler_detail(schueler_id):
        s = Schueler.query.get_or_404(schueler_id)
        erwartungen = (
            Beitragserwartung.query
            .filter_by(schueler_id=s.id)
            .order_by(Beitragserwartung.monat.desc())
            .all()
        )
        return render_template("schueler_detail.html", schueler=s, erwartungen=erwartungen)

    @app.route("/schueler/<int:schueler_id>/beitrag", methods=["POST"])
    def schueler_beitrag_update(schueler_id):
        s = Schueler.query.get_or_404(schueler_id)
        override = request.form.get("beitrag_override", "").strip()
        if override:
            s.beitrag_override = float(override)
        else:
            s.beitrag_override = None
        db.session.commit()
        flash(f"Beitrag für {s.voller_name} aktualisiert.", "success")
        return redirect(request.referrer or url_for("schueler_detail", schueler_id=s.id))

    # --- Abgleich ---

    @app.route("/abgleich")
    def abgleich():
        # Default: aktueller Monat (nur "Alle Monate" wenn monat="" explizit übergeben)
        if "monat" not in request.args:
            monat_filters = [date.today().strftime("%Y-%m")]
        else:
            monat_filters = [m for m in request.args.getlist("monat") if m]
        alle_monate = not monat_filters
        aktueller_monat = monat_filters[0] if len(monat_filters) == 1 else ""
        status_filters = request.args.getlist("status")
        klasse_filters = request.args.getlist("klasse")
        alterskategorie_filters = [a for a in request.args.getlist("alterskategorie") if a]
        suche = request.args.get("suche", "").strip()
        mismatch_filter = request.args.get("mismatch", "")
        konfidenz_filter = request.args.get("konfidenz", "")
        sort_field = request.args.get("sort", "name")
        sort_dir   = request.args.get("dir",  "asc")

        query = Beitragserwartung.query.join(Schueler)
        if monat_filters:
            query = query.filter(Beitragserwartung.monat.in_(monat_filters))

        if status_filters:
            query = query.filter(Beitragserwartung.status.in_(status_filters))
        if klasse_filters:
            from sqlalchemy import or_ as sa_or
            query = query.filter(sa_or(*[Schueler.klasse.ilike(f"%{k}%") for k in klasse_filters]))
        if alterskategorie_filters:
            from sqlalchemy import or_ as sa_or_kat
            query = query.filter(sa_or_kat(*[Schueler.klasse.ilike(f"%{a}%") for a in alterskategorie_filters]))
        if suche:
            from sqlalchemy import or_ as sa_or2
            query = query.filter(sa_or2(
                Schueler.vorname.ilike(f"%{suche}%"),
                Schueler.name.ilike(f"%{suche}%"),
            ))

        # Konfidenz-Filter: Erwartungen nach Vorschlag-Konfidenz filtern
        if konfidenz_filter == "hoch":
            kf_sq = db.session.query(Zuordnung.erwartung_id).filter(
                Zuordnung.bestaetigt == False,
                Zuordnung.konfidenz >= 80,
            ).subquery()
            query = query.filter(Beitragserwartung.id.in_(kf_sq))
        elif konfidenz_filter == "mittel":
            kf_sq = db.session.query(Zuordnung.erwartung_id).filter(
                Zuordnung.bestaetigt == False,
                Zuordnung.konfidenz >= 60,
                Zuordnung.konfidenz < 80,
            ).subquery()
            query = query.filter(Beitragserwartung.id.in_(kf_sq))
        elif konfidenz_filter == "manuell":
            kf_sq = db.session.query(Zuordnung.erwartung_id).filter(
                Zuordnung.typ == "manuell",
            ).subquery()
            query = query.filter(Beitragserwartung.id.in_(kf_sq))

        # Mismatch-Filter: Erwartungen mit Betrag- oder Monats-Diskrepanz
        if mismatch_filter in ("betrag", "beide"):
            mismatch_sq_b = db.session.query(Zuordnung.erwartung_id).filter(
                Zuordnung.betrag_stimmt == False
            ).subquery()
            query = query.filter(Beitragserwartung.id.in_(mismatch_sq_b))
        if mismatch_filter in ("monat", "beide"):
            mismatch_sq_m = db.session.query(Zuordnung.erwartung_id).filter(
                Zuordnung.monat_stimmt == False
            ).subquery()
            query = query.filter(Beitragserwartung.id.in_(mismatch_sq_m))

        # Sortierung
        _sort_map = {
            "name":   [Schueler.vorname, Schueler.name],
            "monat":  [Beitragserwartung.monat],
            "status": [Beitragserwartung.status],
            "betrag": [Beitragserwartung.erwarteter_betrag],
        }
        if sort_field == "konfidenz":
            from sqlalchemy import func, nullslast
            k_sq = (
                db.session.query(
                    Zuordnung.erwartung_id.label("eid"),
                    func.max(Zuordnung.konfidenz).label("maxk"),
                )
                .filter(Zuordnung.bestaetigt == False)
                .group_by(Zuordnung.erwartung_id)
                .subquery()
            )
            query = query.outerjoin(k_sq, Beitragserwartung.id == k_sq.c.eid)
            order_col = k_sq.c.maxk.desc() if sort_dir == "desc" else k_sq.c.maxk.asc()
            if alle_monate:
                erwartungen = query.order_by(nullslast(order_col), Beitragserwartung.monat.desc()).all()
            else:
                erwartungen = query.order_by(nullslast(order_col)).all()
        else:
            sort_cols = _sort_map.get(sort_field, [Schueler.vorname, Schueler.name])
            if sort_dir == "desc":
                sort_cols = [c.desc() for c in sort_cols]
            if alle_monate and sort_field == "name":
                erwartungen = query.order_by(Beitragserwartung.monat.desc(), *sort_cols).all()
            else:
                erwartungen = query.order_by(*sort_cols).all()

        # "Neu"-Schüler_innen: erste Erwartung liegt im aktuellen Monat
        if not alle_monate and aktueller_monat and erwartungen:
            sids = [e.schueler_id for e in erwartungen]
            erste_monate = dict(
                db.session.query(
                    Beitragserwartung.schueler_id,
                    db.func.min(Beitragserwartung.monat)
                )
                .filter(Beitragserwartung.schueler_id.in_(sids))
                .group_by(Beitragserwartung.schueler_id)
                .all()
            )
            neu_schueler_ids = {
                sid for sid, first in erste_monate.items() if first == aktueller_monat
            }
        else:
            neu_schueler_ids = set()

        # Unzugeordnete Buchungen — split into positive (for matching) and negative (refunds)
        offene_buchungen_q = Bankbuchung.query.filter(
            Bankbuchung.zugeordnet == False,
            Bankbuchung.status != "negiert",
            Bankbuchung.refund_of_id == None,
        ).order_by(Bankbuchung.buchungstag.desc())
        freie_buchungen = offene_buchungen_q.filter(Bankbuchung.betrag > 0).all()
        offene_refunds = offene_buchungen_q.filter(Bankbuchung.betrag < 0).all()
        negierte_buchungen = Bankbuchung.query.filter_by(status="negiert").order_by(
            Bankbuchung.buchungstag.desc()
        ).all()
        verlinkte_refunds = Bankbuchung.query.filter(
            Bankbuchung.refund_of_id != None
        ).order_by(Bankbuchung.buchungstag.desc()).all()

        # Alle positiven, nicht-negierten Buchungen für Manuell-Modal (inkl. bereits verlinkte)
        alle_pos_buchungen = Bankbuchung.query.filter(
            Bankbuchung.betrag > 0,
            Bankbuchung.status != "negiert",
            Bankbuchung.refund_of_id == None,
        ).order_by(Bankbuchung.buchungstag.desc()).all()

        # Stats für Übersichts-Zeile
        from collections import Counter
        _status_counts = Counter(e.status for e in erwartungen)
        _vorschlag_hoch = 0
        _vorschlag_mittel = 0
        _vorschlag_niedrig = 0
        _vorschlag_ohne = 0
        for e in erwartungen:
            if e.status in ("zugeordnet", "erlassen"):
                continue
            v = e.zuordnungen.filter_by(bestaetigt=False).order_by(Zuordnung.konfidenz.desc()).first()
            if v:
                if v.konfidenz >= 80:
                    _vorschlag_hoch += 1
                elif v.konfidenz >= 60:
                    _vorschlag_mittel += 1
                else:
                    _vorschlag_niedrig += 1
            else:
                _vorschlag_ohne += 1
        stats = {
            "offen": _status_counts.get("offen", 0),
            "vorschlag": _vorschlag_hoch + _vorschlag_mittel + _vorschlag_niedrig,
            "vorschlag_hoch": _vorschlag_hoch,
            "vorschlag_mittel": _vorschlag_mittel,
            "vorschlag_niedrig": _vorschlag_niedrig,
            "vorschlag_ohne": _vorschlag_ohne,
            "zugeordnet": _status_counts.get("zugeordnet", 0),
            "teilweise": _status_counts.get("teilweise", 0),
            "erlassen": _status_counts.get("erlassen", 0),
            "gesamt": len(erwartungen),
            "freie_buchungen": len(freie_buchungen),
            "offene_refunds": len(offene_refunds),
        }

        # Zugeordnete Buchungen für separate Section
        zugeordnete_buchungen = (
            Bankbuchung.query
            .filter(Bankbuchung.zugeordnet == True, Bankbuchung.betrag > 0)
            .order_by(Bankbuchung.buchungstag.desc())
            .limit(200)
            .all()
        )

        klassen_raw = db.session.query(Schueler.klasse).distinct().order_by(Schueler.klasse).all()
        klassen_set = set()
        for (k,) in klassen_raw:
            if k:
                for part in k.split("/"):
                    p = part.strip()
                    if p:
                        klassen_set.add(p)
        klassen = sorted(klassen_set)
        alterskategorien = sorted(set(k.split()[0] for k in klassen_set if k and k.split()))

        verfuegbare_monate = [m for (m,) in
            db.session.query(Beitragserwartung.monat)
            .distinct().order_by(Beitragserwartung.monat.desc()).all()
        ]

        return render_template(
            "abgleich.html",
            erwartungen=erwartungen,
            freie_buchungen=freie_buchungen,
            alle_pos_buchungen=alle_pos_buchungen,
            offene_refunds=offene_refunds,
            negierte_buchungen=negierte_buchungen,
            verlinkte_refunds=verlinkte_refunds,
            aktueller_monat=aktueller_monat,
            alle_monate=alle_monate,
            neu_schueler_ids=neu_schueler_ids,
            status_filters=status_filters,
            klasse_filters=klasse_filters,
            alterskategorie_filters=alterskategorie_filters,
            alterskategorien=alterskategorien,
            klassen=klassen,
            verfuegbare_monate=verfuegbare_monate,
            monat_filters=monat_filters,
            suche=suche,
            mismatch_filter=mismatch_filter,
            konfidenz_filter=konfidenz_filter,
            sort_field=sort_field,
            sort_dir=sort_dir,
            stats=stats,
            zugeordnete_buchungen=zugeordnete_buchungen,
        )

    @app.route("/abgleich/bestaetigen/<int:zuordnung_id>", methods=["POST"])
    def zuordnung_bestaetigen(zuordnung_id):
        z = Zuordnung.query.get_or_404(zuordnung_id)
        z.bestaetigt = True
        z.erwartung.status = "zugeordnet"
        z.buchung.zugeordnet = True
        db.session.commit()
        flash("Zuordnung bestätigt.", "success")

        if request.headers.get("HX-Request"):
            return render_template("_erwartung_zeile.html", e=z.erwartung)
        return redirect(url_for("abgleich", monat=z.erwartung.monat))

    @app.route("/abgleich/ablehnen/<int:zuordnung_id>", methods=["POST"])
    def zuordnung_ablehnen(zuordnung_id):
        z = Zuordnung.query.get_or_404(zuordnung_id)
        erwartung = z.erwartung
        buchung = z.buchung
        monat = erwartung.monat

        buchung.zugeordnet = False
        erwartung.status = "offen"
        db.session.delete(z)
        db.session.commit()
        flash("Zuordnung abgelehnt.", "info")

        if request.headers.get("HX-Request"):
            return render_template("_erwartung_zeile.html", e=erwartung)
        return redirect(url_for("abgleich", monat=monat))

    @app.route("/abgleich/manuell", methods=["POST"])
    def zuordnung_manuell():
        erwartung_id = int(request.form["erwartung_id"])
        buchung_id = int(request.form["buchung_id"])
        # aktion: "zugeordnet" (force full), "teilweise" (force partial), "auto" (detect)
        aktion = request.form.get("aktion", "auto")

        erwartung = Beitragserwartung.query.get_or_404(erwartung_id)
        buchung = Bankbuchung.query.get_or_404(buchung_id)

        # Bestehende Zuordnungen lösen wenn force_reassign gesetzt
        if request.form.get("force_reassign") == "1":
            for alt_z in buchung.zuordnungen.filter_by(bestaetigt=True).all():
                alt_z.buchung.zugeordnet = False
                alt_z.erwartung.status = "offen"
                db.session.delete(alt_z)
            db.session.flush()

        # Compute available amount BEFORE adding the new Zuordnung
        betrag_verfuegbar = buchung.betrag_verfuegbar

        if betrag_verfuegbar < 0.01:
            if request.headers.get("X-Fetch"):
                return jsonify({"error": "Buchung hat kein verfügbares Guthaben mehr."}), 400
            flash("Fehler: Buchung hat kein verfügbares Guthaben mehr.", "error")
            return redirect(request.referrer or url_for("abgleich"))

        if aktion == "keep_open":
            # Consume only up to what the expectation needs; leave any residual in the pool
            consumed = min(erwartung.erwarteter_betrag, betrag_verfuegbar)
            z = Zuordnung(
                erwartung_id=erwartung_id,
                buchung_id=buchung_id,
                typ="manuell",
                konfidenz=100,
                bestaetigt=True,
                zugeordneter_betrag=consumed,
            )
            db.session.add(z)
            # If booking fully covers expectation, mark expectation done
            if consumed >= erwartung.erwarteter_betrag - 0.01:
                erwartung.status = "zugeordnet"
            else:
                erwartung.status = "teilweise"
            # Keep booking in pool only if there's still a residual
            buchung.zugeordnet = betrag_verfuegbar - consumed < 0.01
        else:
            # Consume the full available amount of the booking
            z = Zuordnung(
                erwartung_id=erwartung_id,
                buchung_id=buchung_id,
                typ="manuell",
                konfidenz=100,
                bestaetigt=True,
                zugeordneter_betrag=betrag_verfuegbar,
            )
            db.session.add(z)
            buchung.zugeordnet = True

            if aktion == "zugeordnet":
                erwartung.status = "zugeordnet"
            elif aktion == "teilweise":
                erwartung.status = "teilweise"
            else:
                # auto: compare available amount to expectation
                if abs(betrag_verfuegbar - erwartung.erwarteter_betrag) < 0.01:
                    erwartung.status = "zugeordnet"
                else:
                    erwartung.status = "teilweise"

        db.session.flush()
        lerne_aus_manueller_zuordnung(z)
        db.session.commit()

        alle_z = erwartung.zuordnungen.all()
        summe_fuer_erwartung = sum(
            (zz.zugeordneter_betrag if zz.zugeordneter_betrag is not None else zz.buchung.betrag)
            for zz in alle_z
        )
        restbetrag = round(max(0.0, erwartung.erwarteter_betrag - summe_fuer_erwartung), 2)

        if request.headers.get("X-Fetch"):
            return jsonify({
                "status": erwartung.status,
                "erwartung_id": erwartung_id,
                "buchung_id": buchung_id,
                "restbetrag": restbetrag,
                "buchung_bleibt_offen": aktion == "keep_open" and not buchung.zugeordnet,
                "buchung_betrag_verfuegbar": buchung.betrag_verfuegbar,
            })

        flash(f"Manuell zugeordnet: {buchung.auftraggeber} → {erwartung.schueler.voller_name}", "success")
        if request.headers.get("HX-Request"):
            return render_template("_erwartung_zeile.html", e=erwartung)
        return redirect(request.referrer or url_for("abgleich", monat=erwartung.monat))

    @app.route("/abgleich/erwartung/<int:erwartung_id>/zeile")
    def erwartung_zeile(erwartung_id):
        """Return just the <tr> HTML for a single expectation row (for JS DOM update)."""
        e = Beitragserwartung.query.get_or_404(erwartung_id)
        return render_template("_erwartung_zeile.html", e=e)

    @app.route("/abgleich/refund-link", methods=["POST"])
    def link_refund():
        """Link a refund (negative amount) to its original positive transaction."""
        refund_id = int(request.form["refund_id"])
        original_id = int(request.form["original_id"])

        refund = Bankbuchung.query.get_or_404(refund_id)
        original = Bankbuchung.query.get_or_404(original_id)

        # Verify refund is negative and original is positive
        if refund.betrag >= 0:
            flash("Refund muss negativer Betrag sein.", "error")
            return redirect(request.referrer or url_for("abgleich"))

        if original.betrag <= 0:
            flash("Original muss positiver Betrag sein.", "error")
            return redirect(request.referrer or url_for("abgleich"))

        keep_original_open = request.headers.get("X-Keep-Original-Open") == "true"

        # Link them
        refund.refund_of_id = original.id
        refund.status = "zugeordnet"
        refund.zugeordnet = True  # Remove from unmatched pool
        if not keep_original_open:
            original.zugeordnet = True  # Remove original from free pool too
        db.session.commit()

        if request.headers.get("X-Fetch"):
            return jsonify({"ok": True})
        flash(f"Refund (-{abs(refund.betrag):.2f}€) mit Zahlung (+{original.betrag:.2f}€) verlinkt.", "success")
        return redirect(request.referrer or url_for("abgleich"))

    @app.route("/abgleich/refund-unlink/<int:refund_id>", methods=["POST"])
    def refund_unlink(refund_id):
        """Remove the link between a refund and its original transaction."""
        refund = Bankbuchung.query.get_or_404(refund_id)
        original = refund.refund_of
        refund.refund_of_id = None
        refund.status = "offen"
        refund.zugeordnet = False
        # Originalbuchung wieder freigeben, wenn sie nicht anderweitig zugeordnet ist
        if original and not original.zuordnungen.filter_by(bestaetigt=True).first():
            original.zugeordnet = False
        db.session.commit()
        if request.headers.get("X-Fetch"):
            return jsonify({"ok": True})
        flash("Verlinkung aufgehoben.", "info")
        return redirect(request.referrer or url_for("abgleich"))

    @app.route("/abgleich/negieren/<int:buchung_id>", methods=["POST"])
    def buchung_negieren(buchung_id):
        """Mark a booking (positive or negative) as intentionally ignored/negated."""
        b = Bankbuchung.query.get_or_404(buchung_id)
        notiz = request.form.get("notiz", "").strip()

        b.status = "negiert"
        b.zugeordnet = True  # Remove from unmatched pool
        if notiz:
            b.notiz = notiz

        db.session.commit()
        flash(f"Betrag {abs(b.betrag):.2f}€ als ignoriert markiert.", "info")

        if request.headers.get("X-Fetch"):
            return jsonify({
                "id": b.id,
                "buchungstag": b.buchungstag.strftime("%d.%m.%Y"),
                "auftraggeber": b.auftraggeber or "—",
                "verwendungszweck": b.verwendungszweck or "—",
                "notiz": b.notiz or "—",
                "betrag": b.betrag,
            })
        if request.headers.get("HX-Request"):
            return ""  # Just remove from UI
        return redirect(request.referrer or url_for("abgleich"))

    @app.route("/abgleich/buchung-reaktivieren/<int:buchung_id>", methods=["POST"])
    def buchung_reaktivieren(buchung_id):
        """Reset a negated booking back to open."""
        b = Bankbuchung.query.get_or_404(buchung_id)
        b.status = "offen"
        b.zugeordnet = False
        b.notiz = None
        db.session.commit()
        if request.headers.get("HX-Request") or request.headers.get("X-Fetch"):
            return "", 200
        flash("Buchung reaktiviert.", "info")
        return redirect(request.referrer or url_for("abgleich"))

    @app.route("/abgleich/buchung-pinnen/<int:buchung_id>", methods=["POST"])
    def buchung_pinnen(buchung_id):
        """Toggle the visual pin flag on a booking."""
        b = Bankbuchung.query.get_or_404(buchung_id)
        b.gepinnt = not b.gepinnt
        db.session.commit()
        return jsonify({"gepinnt": b.gepinnt})

    @app.route("/abgleich/erwartung-pinnen/<int:erwartung_id>", methods=["POST"])
    def erwartung_pinnen(erwartung_id):
        """Toggle the visual pin flag on an expectation."""
        e = Beitragserwartung.query.get_or_404(erwartung_id)
        e.gepinnt = not e.gepinnt
        db.session.commit()
        if request.headers.get("HX-Request"):
            return render_template("_erwartung_zeile.html", e=e)
        return redirect(request.referrer or url_for("abgleich", monat=e.monat))

    @app.route("/abgleich/batch-negieren", methods=["POST"])
    def batch_negieren():
        """Mark multiple bookings as ignored in one action."""
        ids = request.form.getlist("ids")
        notiz = request.form.get("notiz", "").strip()
        count = 0
        negated_ids = []
        negated_bookings = []
        for bid in ids:
            b = Bankbuchung.query.get(int(bid))
            if b and b.status != "negiert":
                b.status = "negiert"
                b.zugeordnet = True
                if notiz:
                    b.notiz = notiz
                count += 1
                negated_ids.append(bid)
                negated_bookings.append({
                    "id": b.id,
                    "buchungstag": b.buchungstag.strftime("%d.%m.%Y"),
                    "auftraggeber": b.auftraggeber or "—",
                    "verwendungszweck": b.verwendungszweck or "—",
                    "notiz": b.notiz or "—",
                    "betrag": b.betrag,
                })
        db.session.commit()
        return jsonify({"count": count, "ids": negated_ids, "bookings": negated_bookings})

    @app.route("/abgleich/sammel-bestaetigen", methods=["POST"])
    def sammel_bestaetigen():
        monat = request.form.get("monat") or None
        konfidenz_stufe = request.form.get("konfidenz_stufe", "hoch")
        _STUFEN = {"hoch": 80, "mittel": 60, "alle": 0}
        min_konfidenz = _STUFEN.get(konfidenz_stufe, 80)

        q = (
            Zuordnung.query
            .join(Beitragserwartung)
            .filter(
                Zuordnung.bestaetigt == False,
                Zuordnung.konfidenz >= min_konfidenz,
            )
        )
        if monat:
            q = q.filter(Beitragserwartung.monat == monat)
        zuordnungen = q.all()

        count = 0
        for z in zuordnungen:
            z.bestaetigt = True
            z.erwartung.status = "zugeordnet"
            z.buchung.zugeordnet = True
            count += 1

        db.session.commit()
        flash(f"{count} Zuordnungen bestätigt.", "success")
        return redirect(request.referrer or url_for("abgleich"))

    @app.route("/abgleich/sammel-loesen", methods=["POST"])
    def sammel_loesen():
        monat = request.form.get("monat") or None
        max_konfidenz = request.form.get("max_konfidenz", type=int)

        q = (
            Zuordnung.query
            .join(Beitragserwartung)
        )
        if monat:
            q = q.filter(Beitragserwartung.monat == monat)
        if max_konfidenz is not None:
            q = q.filter(Zuordnung.konfidenz <= max_konfidenz)

        zuordnungen = q.all()
        count = 0
        for z in zuordnungen:
            z.buchung.zugeordnet = False
            z.erwartung.status = "offen"
            db.session.delete(z)
            count += 1

        db.session.commit()
        flash(f"{count} Zuordnungen gelöst.", "info")
        return redirect(request.referrer or url_for("abgleich"))

    @app.route("/abgleich/auto-abgleich", methods=["POST"])
    def auto_abgleich():
        monat = request.form.get("monat")
        stats = fuehre_abgleich_durch(monat=monat or None)

        # Alle aktuellen unbestätigten Vorschläge (nicht nur neue)
        vorschlaege_q = (
            db.session.query(Zuordnung)
            .filter(Zuordnung.bestaetigt == False)
            .join(Beitragserwartung)
        )
        if monat:
            vorschlaege_q = vorschlaege_q.filter(Beitragserwartung.monat == monat)
        n_hoch_ges = vorschlaege_q.filter(Zuordnung.konfidenz >= 80).count()
        n_mittel_ges = vorschlaege_q.filter(
            Zuordnung.konfidenz >= 60, Zuordnung.konfidenz < 80
        ).count()

        offen_ohne_q = Beitragserwartung.query.filter_by(status="offen").filter(
            ~Beitragserwartung.zuordnungen.any()
        )
        if monat:
            offen_ohne_q = offen_ohne_q.filter_by(monat=monat)
        n_ohne = offen_ohne_q.count()

        neu_info = f" ({stats['gesamt']} neu)" if stats["gesamt"] > 0 else ""
        flash(
            f"Vorschläge: {n_hoch_ges} Hoch (≥80), {n_mittel_ges} Mittel (60–79){neu_info} · {n_ohne} ohne Treffer.",
            "success" if (n_hoch_ges + n_mittel_ges) > 0 else "info",
        )
        return redirect(request.referrer or url_for("abgleich"))

    @app.route("/abgleich/status/<int:erwartung_id>", methods=["POST"])
    def erwartung_status(erwartung_id):
        e = Beitragserwartung.query.get_or_404(erwartung_id)
        neuer_status = request.form.get("status")
        notiz = request.form.get("notiz", "")

        if neuer_status in ("markiert", "erlassen", "offen"):
            e.status = neuer_status
            if notiz:
                e.notiz = notiz
            db.session.commit()
            flash(f"Status auf '{neuer_status}' gesetzt.", "info")

        if request.headers.get("HX-Request"):
            return render_template("_erwartung_zeile.html", e=e)
        return redirect(url_for("abgleich", monat=e.monat))

    # --- Gelernte Zuordnungen ---

    @app.route("/einstellungen/gelernte-zuordnungen")
    def gelernte_zuordnungen():
        eintraege = (
            GelernteZuordnung.query
            .join(Schueler)
            .order_by(Schueler.vorname, Schueler.name, GelernteZuordnung.erstellt_am.desc())
            .all()
        )
        schueler_liste = (
            Schueler.query
            .filter(Schueler.status.in_(["aktiv", "kuendigung_initiiert"]))
            .order_by(Schueler.vorname, Schueler.name)
            .all()
        )
        return render_template("gelernte_zuordnungen.html", eintraege=eintraege, schueler_liste=schueler_liste)

    @app.route("/einstellungen/gelernte-zuordnungen/<int:eintrag_id>/loeschen", methods=["POST"])
    def gelernte_zuordnung_loeschen(eintrag_id):
        eintrag = GelernteZuordnung.query.get_or_404(eintrag_id)
        db.session.delete(eintrag)
        db.session.commit()
        flash("Gelerntes Muster gelöscht.", "info")
        if request.headers.get("HX-Request"):
            return ""
        return redirect(url_for("gelernte_zuordnungen"))

    @app.route("/einstellungen/gelernte-zuordnungen/loeschen-by-buchung", methods=["POST"])
    def gelernte_zuordnung_loeschen_by_buchung():
        from tools.abgleich import _normalisiere
        schueler_id = request.form.get("schueler_id", type=int)
        buchung_id = request.form.get("buchung_id", type=int)
        erwartung_id = request.form.get("erwartung_id", type=int)

        buchung = Bankbuchung.query.get_or_404(buchung_id)
        eintrag = None

        if buchung.iban:
            eintrag = GelernteZuordnung.query.filter_by(
                schueler_id=schueler_id, iban=buchung.iban
            ).first()
        if not eintrag and buchung.auftraggeber:
            auftr_norm = _normalisiere(buchung.auftraggeber)
            eintrag = GelernteZuordnung.query.filter_by(
                schueler_id=schueler_id, auftraggeber_muster=auftr_norm
            ).first()

        if eintrag:
            db.session.delete(eintrag)
            db.session.commit()
            flash("Lernmuster gelöscht.", "info")

        if request.headers.get("HX-Request") and erwartung_id:
            e = Beitragserwartung.query.get(erwartung_id)
            if e:
                return render_template("_erwartung_zeile.html", e=e)
        return redirect(url_for("gelernte_zuordnungen"))

    @app.route("/einstellungen/gelernte-zuordnungen/anlegen", methods=["POST"])
    def gelernte_zuordnung_anlegen():
        schueler_id = request.form.get("schueler_id", type=int)
        iban = request.form.get("iban", "").strip().upper() or None
        auftraggeber_muster = request.form.get("auftraggeber_muster", "").strip().lower() or None

        if not schueler_id:
            flash("Schüler_in erforderlich.", "error")
            return redirect(url_for("gelernte_zuordnungen"))
        if not iban and not auftraggeber_muster:
            flash("Mindestens IBAN oder Auftraggeber-Muster erforderlich.", "error")
            return redirect(url_for("gelernte_zuordnungen"))

        q = GelernteZuordnung.query.filter_by(schueler_id=schueler_id)
        if iban:
            q = q.filter_by(iban=iban)
        if auftraggeber_muster:
            q = q.filter_by(auftraggeber_muster=auftraggeber_muster)
        if q.first():
            flash("Dieses Muster existiert bereits.", "warning")
        else:
            db.session.add(GelernteZuordnung(
                schueler_id=schueler_id,
                iban=iban,
                auftraggeber_muster=auftraggeber_muster,
            ))
            db.session.commit()
            flash("Lernmuster angelegt.", "success")

        return redirect(url_for("gelernte_zuordnungen"))

    # --- CSV Import ---

    @app.route("/import", methods=["GET"])
    def import_seite():
        batches = ImportBatch.query.order_by(ImportBatch.importiert_am.desc()).limit(20).all()
        return render_template("import.html", batches=batches)

    @app.route("/import/upload", methods=["POST"])
    def import_upload():
        dateien = request.files.getlist("csv_datei")
        dateien = [d for d in dateien if d.filename]

        if not dateien:
            flash("Keine Datei ausgewählt.", "error")
            return redirect(url_for("import_seite"))

        gesamt_neu = 0
        alle_fehler = []

        for datei in dateien:
            inhalt = datei.read()
            ergebnis = importiere_csv(inhalt, datei.filename)
            gesamt_neu += ergebnis["zeilen_neu"]
            alle_fehler.extend(ergebnis["fehler"])

            if ergebnis["zeilen_neu"] > 0:
                msg = f"{datei.filename}: {ergebnis['zeilen_neu']} neue Buchungen importiert"
                if ergebnis["zeilen_duplikat"]:
                    msg += f", {ergebnis['zeilen_duplikat']} Duplikate übersprungen"
                flash(msg, "success")
            else:
                flash(f"{datei.filename}: Keine neuen Buchungen (alle bereits importiert).", "info")

        for fehler in alle_fehler:
            flash(fehler, "error")

        # Auto-Abgleich starten wenn neue Buchungen importiert wurden
        if gesamt_neu > 0:
            abgleich_count = fuehre_abgleich_durch()
            if abgleich_count["gesamt"] > 0:
                flash(f"Auto-Abgleich: {abgleich_count['gesamt']} Vorschläge erstellt ({abgleich_count['hoch']} hoch, {abgleich_count['mittel']} mittel).", "info")

        return redirect(url_for("import_seite"))

    # --- Google Sheets Sync ---

    @app.route("/sync/schueler", methods=["POST"])
    def sync_schueler_route():
        try:
            ergebnis = synchronisiere_schueler()
            neu = ergebnis["neu"]
            aktualisiert = ergebnis["aktualisiert"]
            gekuendigt = ergebnis["gekuendigt"]
            fehler = ergebnis["fehler"]

            if neu or aktualisiert or gekuendigt:
                msg = f"Sync abgeschlossen: {neu} neu, {aktualisiert} aktualisiert"
                if gekuendigt:
                    msg += f", {gekuendigt} Kündigungen"
                flash(msg, "success")
            else:
                flash("Sync abgeschlossen — keine Änderungen.", "info")

            _y, _m = 2026, 1
            _heute = date.today()
            _monate = []
            while (_y, _m) <= (_heute.year, _heute.month):
                _monate.append(f"{_y:04d}-{_m:02d}")
                _m += 1
                if _m > 12:
                    _m = 1
                    _y += 1
            gesamt_neu = sum(erzeuge_monatliche_erwartungen(mo) for mo in _monate)
            if gesamt_neu > 0:
                flash(
                    f"{gesamt_neu} neue Beitragserwartungen für {len(_monate)} Monate erstellt "
                    f"(2026-01 bis {_monate[-1]}).",
                    "info",
                )

            for f in fehler:
                flash(f, "warning")

        except RuntimeError as e:
            flash(str(e), "error")
        except Exception as e:
            flash(f"Sync fehlgeschlagen: {e}", "error")

        return redirect(url_for("dashboard"))

    @app.route("/sync/erwartungen", methods=["POST"])
    def sync_erwartungen_route():
        monat = request.form.get("monat", date.today().strftime("%Y-%m"))
        try:
            neu = erzeuge_monatliche_erwartungen(monat)
            if neu > 0:
                flash(f"{neu} Beitragserwartungen für {monat} erstellt.", "success")
            else:
                flash(f"Alle Erwartungen für {monat} bereits vorhanden.", "info")
        except Exception as e:
            flash(f"Fehler: {e}", "error")
        return redirect(url_for("dashboard"))

    @app.route("/google/token-erneuern", methods=["POST"])
    def google_token_erneuern():
        token_file = app.config["GOOGLE_TOKEN_FILE"]
        try:
            if os.path.exists(token_file):
                os.remove(token_file)
                flash("Token gelöscht. Beim nächsten Sync wird ein neuer OAuth-Flow gestartet.", "info")
            else:
                flash("Kein Token vorhanden.", "info")
        except Exception as e:
            flash(f"Fehler beim Löschen des Tokens: {e}", "error")
        return redirect(url_for("dashboard"))

    # --- Alle Buchungen ---

    @app.route("/buchungen")
    def buchungen_liste():
        nur_freie = request.args.get("freie", "")
        suche = request.args.get("suche", "")
        query = Bankbuchung.query
        if nur_freie:
            query = query.filter_by(zugeordnet=False)
        if suche:
            query = query.filter(
                db.or_(
                    Bankbuchung.auftraggeber.ilike(f"%{suche}%"),
                    Bankbuchung.iban.ilike(f"%{suche}%"),
                    Bankbuchung.verwendungszweck.ilike(f"%{suche}%"),
                )
            )
        buchungen = query.order_by(Bankbuchung.buchungstag.desc()).all()
        return render_template(
            "buchungen.html",
            buchungen=buchungen,
            nur_freie=nur_freie,
            suche=suche,
        )

    # --- Admin ---

    @app.route("/admin")
    def admin():
        backup_dir = Path(app.instance_path).parent / "data" / "backups"
        backups = sorted(backup_dir.glob("*.db"), reverse=True) if backup_dir.exists() else []
        return render_template("admin.html", backups=[b.name for b in backups])

    @app.route("/admin/reset-db", methods=["POST"])
    def admin_reset_db():
        bestaetigung = request.form.get("bestaetigung", "")
        if bestaetigung != "RESET":
            flash("Falsches Bestätigungswort. DB wurde nicht zurückgesetzt.", "error")
            return redirect(url_for("admin"))

        db.drop_all()
        db.create_all()

        # Beitragsplan neu anlegen
        plaene = [
            ("Minis", 50.0),
            ("Kids", 60.0),
            ("Juniors", 65.0),
            ("Adults", 65.0),
            ("Adults 30+", 65.0),
            ("Originals", 65.0),
            ("Originals 2x", 85.0),
        ]
        for klasse, beitrag in plaene:
            db.session.add(Beitragsplan(klasse=klasse, monatsbeitrag=beitrag))
        db.session.commit()

        flash("Datenbank vollständig zurückgesetzt. Beitragsplan neu angelegt.", "success")
        return redirect(url_for("dashboard"))

    @app.route("/admin/backfill-erwartungen", methods=["POST"])
    def admin_backfill_erwartungen():
        start_y, start_m = 2026, 1
        heute = date.today()
        monate = []
        y, m = start_y, start_m
        while (y, m) <= (heute.year, heute.month):
            monate.append(f"{y:04d}-{m:02d}")
            m += 1
            if m > 12:
                m = 1
                y += 1
        gesamt = 0
        for monat_str in monate:
            gesamt += erzeuge_monatliche_erwartungen(monat_str)
        flash(
            f"{gesamt} neue Beitragserwartungen für {len(monate)} Monate erstellt "
            f"(2026-01 bis {monate[-1]}). Bereits vorhandene wurden übersprungen.",
            "success",
        )
        return redirect(url_for("admin"))

    @app.route("/admin/recompute-hashes", methods=["POST"])
    def admin_recompute_hashes():
        """Recomputed dedup_hashes aller Bankbuchungen mit dem aktuellen Hash-Algorithmus."""
        from tools.import_csv import _make_hash
        buchungen = Bankbuchung.query.all()
        aktualisiert = 0
        for b in buchungen:
            neuer_hash = _make_hash(
                b.buchungstag, b.betrag, b.iban, b.auftraggeber,
                b.verwendungszweck, b.buchungstext, b.mandatsreferenz
            )
            if b.dedup_hash != neuer_hash:
                b.dedup_hash = neuer_hash
                aktualisiert += 1
        db.session.commit()
        flash(f"{aktualisiert} von {len(buchungen)} Buchungen neu gehasht.", "success")
        return redirect(url_for("admin"))

    # --- Datenaustausch (Export / Import / Backup) ---

    @app.route("/admin/export-db")
    def admin_export_db():
        db_pfad = Path(app.instance_path).parent / "data" / "monatsbeitrag.db"
        dateiname = f"monatsbeitrag_{date.today().isoformat()}.db"
        return send_file(str(db_pfad), as_attachment=True, download_name=dateiname)

    @app.route("/admin/import-db", methods=["POST"])
    def admin_import_db():
        datei = request.files.get("datenbank")
        if not datei or not datei.filename:
            flash("Keine Datei ausgewählt.", "error")
            return redirect(url_for("admin"))

        inhalt = datei.read()
        if not inhalt.startswith(b"SQLite format 3"):
            flash("Ungültige Datei — keine SQLite-Datenbank.", "error")
            return redirect(url_for("admin"))

        db_pfad = Path(app.instance_path).parent / "data" / "monatsbeitrag.db"
        backup_pfad = Path(app.instance_path).parent / "data" / f"monatsbeitrag_backup_{date.today().isoformat()}.db"

        # Alte DB sichern
        shutil.copy2(str(db_pfad), str(backup_pfad))

        # Neue DB einsetzen
        db.engine.dispose()
        with open(str(db_pfad), "wb") as f:
            f.write(inhalt)

        flash(f"Datenbank erfolgreich importiert. Backup gesichert unter: {backup_pfad.name}", "success")
        return redirect(url_for("dashboard"))

    @app.route("/admin/download-backup/<dateiname>")
    def admin_download_backup(dateiname):
        backup_dir = Path(app.instance_path).parent / "data" / "backups"
        pfad = backup_dir / dateiname
        if not pfad.exists() or not pfad.suffix == ".db":
            flash("Backup nicht gefunden.", "error")
            return redirect(url_for("admin"))
        return send_file(str(pfad), as_attachment=True, download_name=dateiname)

    # --- Import Batch Details ---

    @app.route("/import/<int:batch_id>/buchungen")
    def import_buchungen(batch_id):
        batch = ImportBatch.query.get_or_404(batch_id)
        buchungen = Bankbuchung.query.filter_by(import_batch_id=batch_id).order_by(
            Bankbuchung.buchungstag.desc()
        ).all()
        return render_template("import_buchungen.html", batch=batch, buchungen=buchungen)

    @app.route("/import/<int:batch_id>/loeschen", methods=["POST"])
    def import_batch_loeschen(batch_id):
        batch = ImportBatch.query.get_or_404(batch_id)

        # Prüfen ob bestätigte Zuordnungen existieren
        buchungen = Bankbuchung.query.filter_by(import_batch_id=batch_id).all()
        hat_zuordnungen = any(
            b.zuordnungen.filter_by(bestaetigt=True).first() for b in buchungen
        )

        if hat_zuordnungen:
            flash("Batch kann nicht gelöscht werden — enthält bestätigte Zuordnungen.", "error")
            return redirect(url_for("import_seite"))

        for b in buchungen:
            # Unbestätigte Zuordnungen + Erwartungen zurücksetzen
            for z in b.zuordnungen.all():
                z.erwartung.status = "offen"
                db.session.delete(z)
            db.session.delete(b)

        db.session.delete(batch)
        db.session.commit()
        flash(f"Import '{batch.dateiname}' und {len(buchungen)} Buchungen gelöscht.", "success")
        return redirect(url_for("import_seite"))

    return app


def erstelle_monatlichen_backup(app):
    """Erstellt monatlichen Backup der DB in data/backups/, behält letzte 12."""
    backup_dir = Path(app.instance_path).parent / "data" / "backups"
    backup_dir.mkdir(parents=True, exist_ok=True)

    monat = date.today().strftime("%Y-%m")
    backup_pfad = backup_dir / f"monatsbeitrag_{monat}.db"
    if backup_pfad.exists():
        return  # Bereits diesen Monat gesichert

    db_pfad = Path(app.instance_path).parent / "data" / "monatsbeitrag.db"
    shutil.copy2(str(db_pfad), str(backup_pfad))
    print(f"[Backup] Monatlicher Backup erstellt: {backup_pfad.name}")

    # Alte Backups löschen (nur letzte 12 behalten)
    alle = sorted(backup_dir.glob("monatsbeitrag_*.db"), reverse=True)
    for alt in alle[12:]:
        alt.unlink()
        print(f"[Backup] Altes Backup gelöscht: {alt.name}")


def starte_hintergrund_sync(app):
    """Startet automatischen Hintergrund-Sync (5s nach Start, dann alle 60 Min)."""
    letzter_backup_monat = [None]

    def sync_loop():
        with app.app_context():
            try:
                ergebnis = synchronisiere_schueler()
                erzeuge_monatliche_erwartungen()
                neu = ergebnis.get("neu", 0)
                akt = ergebnis.get("aktualisiert", 0)
                if neu or akt:
                    print(f"[Sync] {neu} neu, {akt} aktualisiert.")
            except Exception as e:
                print(f"[Sync] Übersprungen: {e}")

            # Monatlichen Backup prüfen
            aktueller_monat = date.today().strftime("%Y-%m")
            if letzter_backup_monat[0] != aktueller_monat:
                try:
                    erstelle_monatlichen_backup(app)
                    letzter_backup_monat[0] = aktueller_monat
                except Exception as e:
                    print(f"[Backup] Fehler: {e}")

        t = threading.Timer(3600, sync_loop)
        t.daemon = True
        t.start()

    t = threading.Timer(5, sync_loop)
    t.daemon = True
    t.start()


if __name__ == "__main__":
    app = create_app()
    # Hintergrund-Sync nur im eigentlichen Server-Prozess starten (nicht im Reloader-Elternprozess)
    if os.environ.get("WERKZEUG_RUN_MAIN") == "true":
        starte_hintergrund_sync(app)
    app.run(debug=True, port=5050)
