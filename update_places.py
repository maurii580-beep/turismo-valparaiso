import json
from pathlib import Path

p = Path(r"c:\Users\mauri\OneDrive\Desktop\turismo-valparaiso\data\lugares.json")
arr = json.loads(p.read_text(encoding="utf-8"))

for obj in arr:
    txt = (
        obj.get("nombre", "")
        + " "
        + obj.get("categoria", "")
        + " "
        + obj.get("descripcionHistorica", "")
    ).lower()

    estacionamiento = "Gratis en zona cercana"
    acceso = "Sí"

    if any(k in txt for k in ["cerro", "quebrada", "sendero", "calle", "acantilado", "ladera"]):
        estacionamiento = "No disponible"
        acceso = "No"
    elif any(k in txt for k in ["ascensor", "funicular", "escalera"]):
        estacionamiento = "Pago en estacionamiento cercano"
        acceso = "Sí"
    elif any(k in txt for k in ["playa", "balneario", "parque", "jardin", "jardín", "museo", "palacio", "patrimonio", "arquitectura", "paseo", "muelle", "quinta", "botánico", "cultural", "teatro", "monumento", "laguna", "humedal", "faro", "mirador", "fortaleza", "isla", "costa"]):
        estacionamiento = "Gratis en zona cercana"
        acceso = "Sí"

    if any(k in txt for k in ["cerro", "quebrada", "sendero", "calle"]):
        estacionamiento = "No disponible"
    if any(k in txt for k in ["ascensor", "funicular"]):
        estacionamiento = "Pago en estacionamiento cercano"
        acceso = "Sí"

    obj["estacionamiento"] = estacionamiento
    obj["accesoSillaRuedas"] = acceso

p.write_text(json.dumps(arr, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"count={len(arr)}")
print(f"all_ok={all('estacionamiento' in o and 'accesoSillaRuedas' in o for o in arr)}")
print(f"sample={arr[0]['nombre']} | {arr[0]['estacionamiento']} | {arr[0]['accesoSillaRuedas']}")
