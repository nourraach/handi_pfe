# ============================================================
#  HandiTalents — Parser de CV v3 FINAL
#  Detecte : Frontend, Backend, Data, Cyber, UX/Design,
#             Gestion projet, Marketing, Finance, Logistique
# ============================================================
import pdfplumber
import docx
import os
import re
from datetime import datetime

TECH_KEYWORDS = [
    # ── Frontend ──
    "react","next.js","nextjs","angular","vue","vuejs","typescript","javascript",
    "html","css","tailwind","bootstrap","jquery","sass","scss","webpack","vite",
    # ── Backend ──
    "node.js","nodejs","express","fastapi","django","flask","spring boot","springboot",
    "php","symfony","laravel","java","javaee","python","c#","dotnet","nestjs","graphql",
    # ── Mobile ──
    "flutter","kotlin","android","ios","react native","expo","swift",
    # ── Base de données ──
    "mysql","postgresql","mongodb","sql","nosql","redis","firebase","elasticsearch",
    "cassandra","oracle","sqlite","prisma","sequelize","mongoose",
    # ── DevOps / Cloud ──
    "docker","kubernetes","helm","terraform","ansible","jenkins","gitlab","github",
    "git","linux","ubuntu","aws","gcp","azure","vercel","nginx","ci/cd",
    # ── Data Science / IA ──
    "machine learning","deep learning","tensorflow","pytorch","keras","scikit-learn",
    "nlp","computer vision","data science","pandas","numpy","matplotlib","jupyter",
    "mlflow","huggingface","bert","sbert","llm","opencv","spark","airflow","dbt",
    "power bi","tableau","looker","ssis","data warehouse","etl","r",
    # ── Cybersécurité ──
    "pentest","siem","soc","owasp","burp suite","metasploit","nmap","wireshark",
    "kali linux","iso 27001","nist","rgpd","pci-dss","ceh","oscp","splunk",
    "qradar","firewall","ips","ids","waf","edr","forensic","ctf","cybersecurity",
    # ── UX / Design ──
    "figma","adobe xd","sketch","invision","zeplin","marvel","framer",
    "ux","ui","ux/ui","ui/ux","ux research","user research","user testing",
    "wireframe","wireframing","prototypage","prototype","maquette",
    "design thinking","design system","atomic design","user flow","user story",
    "accessibilite","accessibilité","wcag","aria","responsive","mobile first",
    "photoshop","illustrator","indesign","after effects","premiere",
    "canva","notion","maze","hotjar","miro","lottie","webflow","storybook",
    # ── Gestion de projet ──
    "scrum","agile","kanban","jira","confluence","trello","ms project",
    "product manager","product owner","scrum master","pmp","safe",
    # ── Architecture ──
    "microservices","rest","soap","api","architecture","devops","sre",
    "domain driven","event sourcing","cqrs","hexagonal",
    # ── Marketing / Commercial ──
    "google ads","facebook ads","seo","sem","google analytics","hubspot",
    "salesforce","mailchimp","linkedin ads","tiktok ads","meta ads",
    # ── Finance / Logistique ──
    "sap","sage","quickbooks","excel","erp","crm","supply chain","lean",
]

LANGUES_KEYWORDS = [
    "arabic","french","english","german","italian","spanish","portuguese",
    "arabe","francais","anglais","allemand","arabe","tunisien",
]

EDUCATION_MARKERS = [
    "université","university","school","école","institut","license","licence",
    "bachelor","master","baccalaureate","bts","dut","bac ","diplome","diploma",
    "formation","licence en","master en","ingenieur","doctorate","phd",
]

VILLES_TN = [
    "tunis","sfax","nabeul","sousse","monastir","bizerte","kairouan",
    "gabes","ariana","ben arous","manouba","zaghouan","mahdia",
    "sidi bouzid","siliana","le kef","jendouba","beja","medenine",
]


# ── Extraction texte brut ──────────────────────────────────

def lire_pdf(chemin: str) -> str:
    texte = ""
    with pdfplumber.open(chemin) as pdf:
        for page in pdf.pages:
            contenu = page.extract_text()
            if contenu:
                texte += contenu + "\n"
    return texte.strip()

def lire_docx(chemin: str) -> str:
    doc = docx.Document(chemin)
    return "\n".join(p.text for p in doc.paragraphs if p.text.strip())

def extraire_texte_cv(chemin: str) -> str:
    ext = os.path.splitext(chemin)[1].lower()
    if ext == ".pdf":
        return lire_pdf(chemin)
    elif ext in [".docx", ".doc"]:
        return lire_docx(chemin)
    else:
        raise ValueError(f"Format non supporté : {ext}")


# ── Extracteurs ────────────────────────────────────────────

def extraire_nom(texte: str) -> str:
    for ligne in texte.strip().split("\n")[:5]:
        ligne = re.sub(r'^(nom\s*:\s*)', '', ligne.strip(), flags=re.IGNORECASE).strip()
        if ligne and 2 < len(ligne) < 60 and not '@' in ligne:
            return " ".join(ligne.split()[:5])
    return "Inconnu"

def extraire_email(texte: str) -> str:
    match = re.search(r'[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}', texte)
    return match.group(0) if match else ""

def extraire_telephone(texte: str) -> str:
    match = re.search(r'(\+?\d[\d\s\-().]{7,15})', texte)
    return match.group(0).strip() if match else ""

def extraire_competences(texte: str) -> list:
    texte_lower = texte.lower()
    trouvees = set()
    for kw in TECH_KEYWORDS:
        kw_lower = kw.lower()
        # Pour mots simples : word boundary
        if " " not in kw_lower and "." not in kw_lower and "/" not in kw_lower:
            if re.search(r'\b' + re.escape(kw_lower) + r'\b', texte_lower):
                trouvees.add(kw)
        else:
            # Pour mots composés : recherche directe
            if kw_lower in texte_lower:
                trouvees.add(kw)
    return sorted(trouvees)

def extraire_langues(texte: str) -> list:
    texte_lower = texte.lower()
    return [l for l in LANGUES_KEYWORDS if l in texte_lower]

def extraire_formation(texte: str) -> str:
    mots = ["bachelor","master","licence","ingénieur","engineer",
            "baccalaureate","bts","dut","phd","doctorat","license","ingenieur"]
    texte_lower = texte.lower()
    for mot in mots:
        if mot in texte_lower:
            return mot.capitalize()
    return "Non précisé"

def extraire_region(texte: str) -> str:
    texte_lower = texte.lower()
    for ville in VILLES_TN:
        if ville in texte_lower:
            return ville.capitalize()
    return "Non précisé"


# ── Extraction expérience ──────────────────────────────────

def extraire_experience_stages(texte: str) -> dict:
    lignes = texte.split("\n")
    total_mois = 0
    annee_actuelle = datetime.now().year
    periodes = []

    pattern_mmyyyy = re.compile(
        r'(\d{1,2}/\d{4})\s*[-–—]\s*(\d{1,2}/\d{4}|current|present|présent|aujourd|aujourd\'hui)',
        re.IGNORECASE
    )
    pattern_yyyy = re.compile(
        r'\(?\s*(\d{4})\s*[-–—]\s*(\d{4}|current|present|présent|aujourd|aujourd\'hui)\s*\)?',
        re.IGNORECASE
    )

    for ligne in lignes:
        ligne_lower = ligne.lower()
        if any(m in ligne_lower for m in EDUCATION_MARKERS):
            continue

        for match in pattern_mmyyyy.finditer(ligne):
            try:
                debut = datetime.strptime(match.group(1), "%m/%Y")
                fin_str = match.group(2).lower()
                fin = datetime.now() if any(w in fin_str for w in ["current","present","présent","aujourd"]) else datetime.strptime(match.group(2), "%m/%Y")
                diff = (fin.year - debut.year) * 12 + (fin.month - debut.month)
                if 1 < diff < 600:
                    total_mois += diff
                    periodes.append(f"{match.group(1)} → {match.group(2)} ({diff} mois)")
            except:
                continue

        for match in pattern_yyyy.finditer(ligne):
            debut_a = int(match.group(1))
            fin_str = match.group(2).lower()
            if debut_a < 1970 or debut_a > annee_actuelle:
                continue
            if any(w in fin_str for w in ["current","present","présent","aujourd"]):
                fin_a = annee_actuelle
            else:
                fin_a = int(match.group(2))
                if fin_a > annee_actuelle + 1:
                    continue
            diff = (fin_a - debut_a) * 12
            if 1 < diff < 600:
                total_mois += diff
                periodes.append(f"{debut_a} → {fin_a} ({diff} mois)")

    if total_mois > 600:
        total_mois = total_mois // 2

    return {
        "nb_periodes": len(periodes),
        "periodes_detectees": periodes,
        "duree_totale_mois": total_mois,
        "duree_totale_annees": round(total_mois / 12, 1)
    }

def extraire_experience_mentionnee(texte: str) -> float:
    patterns = [
        r"(\d+)\s*ans?\s+d.exp[eé]rience",
        r"(\d+)\s*years?\s+of\s+experience",
        r"(\d+)\s*ann[eé]es?\s+d.exp[eé]rience",
        r"plus\s+de\s+(\d+)\s*ans?\s+d.exp[eé]rience",
    ]
    for p in patterns:
        match = re.search(p, texte, re.IGNORECASE)
        if match:
            return float(match.group(1))
    return 0.0


# ── Point d'entrée principal ───────────────────────────────

def analyser_cv_complet(chemin: str) -> dict:
    texte = extraire_texte_cv(chemin)
    exp_dates = extraire_experience_stages(texte)
    exp_mentionnee = extraire_experience_mentionnee(texte)
    exp_annees = max(exp_dates["duree_totale_annees"], exp_mentionnee)
    competences = extraire_competences(texte)

    return {
        "texte_brut":          texte,
        "nom":                 extraire_nom(texte),
        "email":               extraire_email(texte),
        "telephone":           extraire_telephone(texte),
        "region":              extraire_region(texte),
        "formation":           extraire_formation(texte),
        "experience_annees":   exp_annees,
        "experience_mois":     int(exp_annees * 12),
        "periodes_detectees":  exp_dates["periodes_detectees"],
        "exp_mentionnee":      exp_mentionnee,
        "competences":         competences,
        "langues":             extraire_langues(texte),
        "nb_competences":      len(competences),
    }
