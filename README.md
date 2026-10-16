# Tesseract XR

Interaktive Darstellung eines 4D-Hyperwürfels (Tesseract) für die **Meta Quest 3 im AR-Modus (Passthrough)**, gebaut mit WebXR und three.js. Ziel ist, die vierte Dimension greifbar zu machen. Man dreht den Tesseract mit Drehknöpfen in den 6 Ebenen des 4D-Raums und sieht ihn gleichzeitig in einer **Rissansicht** wie auf einem Bauplan.

Version 1 · Stand Oktober 2026

---

## Starten

WebXR läuft nur über **HTTPS** (oder `localhost`). Ein Build-Schritt ist nicht nötig. Der ganze Ordner wird so ausgeliefert, wie er ist; three.js kommt per Import-Map vom CDN (jsDelivr, Version 0.160.0).

| Weg | Vorgehen |
|---|---|
| Lokal am PC testen | `python3 -m http.server 8000` im Projektordner, dann `http://localhost:8000` öffnen |
| Quest 3 | Ordner auf einen HTTPS-Webserver legen (Netlify Drop, GitHub Pages, eigener Server mit Zertifikat), Adresse im **Meta Quest Browser** öffnen, „Start AR“ antippen |
| Quest per USB, ohne Server | `adb reverse tcp:8000 tcp:8000`, dann auf der Brille `http://localhost:8000` öffnen (localhost gilt als sicher) |

Einfach die `index.html` per Doppelklick zu öffnen funktioniert nicht, weil ES-Module über `file://` blockiert werden.

---

## Was man sieht

### Rissansicht (Standard)

Die Logik stammt aus der Dreitafelprojektion: **Jede Ansicht lässt eine Achse weg und liegt entlang genau dieser Achse versetzt.**

| Darstellung | Position | zeigt | Besonderheit |
|---|---|---|---|
| Zentrum | Mitte | X Y Z | umschaltbar: **perspektivisch** (Würfel im Würfel, 4D-Kamera auf der W-Achse) oder **orthogonal** („ohne W“) |
| ohne X | rechts | W Y Z | W liegt auf der X-Richtung |
| ohne Y | oben | X W Z | W liegt auf der Y-Richtung |
| ohne Z | hinten | X Y W | W liegt auf der Z-Richtung (zum Ansehen um den Aufbau herumgehen oder ihn drehen) |

Die Seitenansichten sind immer orthogonal. Bei 0° zeigt jede Ansicht einfach einen Würfel, denn die Kanten der fehlenden Achse fallen zu Punkten zusammen. Es ist wie beim Grundriss eines Würfels, auf dem die senkrechten Kanten unsichtbar sind.

### Farben

| Element | Bedeutung |
|---|---|
| Rot / Grün / Blau / Magenta | Kante parallel zu X / Y / Z / W (je 8 Stück) |
| Kantendicke | näher in W = dicker |
| Gold / Türkis / Weiß | markierte Ecken 1–3 |
| Magenta-Bögen | Viertelkreise, die die W-Koordinate zwischen Seitenansichten übertragen |
| Rahmenfarbe einer Seitenansicht | die Achse, die dort fehlt |

### Ordnungslinien

Tippt man eine Ecke an, wird sie in allen Ansichten markiert und verbunden:
- **Zentrum ↔ Seitenansicht:** gerade Linie. Im orthogonalen Zentrum ist sie achsparallel, weil beide Ansichten zwei Koordinaten teilen.
- **Seitenansicht ↔ Seitenansicht:** gerade Linie bis zur Versatz-Ebene, dann ein **Viertelkreis** und wieder gerade. Das ist die klassische Konstruktion aus dem technischen Zeichnen.

### Info-Elemente

| Element | Ort | Inhalt |
|---|---|---|
| Statuszeile | unter dem Aufbau | aktive Drehebene, welche Ebene fest bleibt, Winkel, worauf der Strahl zeigt, Modus und Zoom |
| Legende + Drehmatrix | linkes Handgelenk (erscheint, wenn man den Controller zum Gesicht dreht), am Desktop links | Farbbedeutungen und die 4×4-Matrix; Spalte = wohin die ursprüngliche Achse jetzt zeigt |
| Ecken-Tooltip | über markierter Ecke | aktuelle Koordinaten (x, y, z, w) |

Die Knopfwinkel zeigen, wie weit an diesem Knopf gedreht wurde. Die **tatsächliche Lage beschreibt nur die Matrix**, weil 4D-Drehungen (wie 3D-Drehungen) von der Reihenfolge abhängen.

---

## Bedienung

### Quest 3 – Controller

| Aktion | Eingabe |
|---|---|
| Ebene drehen | Strahl auf einen Knopf, Trigger oder Grip halten, **Handgelenk drehen** (wie ein Drehregler); alternativ Stick links/rechts |
| Schaltfläche | Strahl drauf + Trigger |
| Ecke markieren / Markierung entfernen | Strahl auf Ecke + Trigger |
| Aufbau verschieben und drehen | Trigger oder Grip im leeren Raum halten und Hand bewegen |
| Näher holen / wegschieben | dabei Stick vor/zurück |
| Zoomen (0,3× – 5×) | mit **beiden** Händen greifen, Hände auseinander/zusammen |
| Auto-Rotation an/aus | A oder X |
| Auswahl löschen | B |
| Info-Panel anheften/lösen | Y |
| Aufbau neu vor sich platzieren | linken Stick drücken |
| Stärke der 4D-Perspektive | rechter Stick links/rechts (ohne zu greifen) |

**Hand-Tracking:** Pinch entspricht dem Trigger. Drehen am Knopf funktioniert ebenfalls über das Handgelenk.

Wichtig: Wenn man den Aufbau greift und dreht, ändert sich nur der **Blickwinkel**. Matrix und Seitenansichten bleiben gleich. Die Knöpfe XY/XZ/YZ dagegen drehen den Tesseract **in seinem 4D-Raum**.

### Desktop (zum Entwickeln)

Knopf mit der Maus ziehen, Ecke klicken, Hintergrund ziehen zum Umsehen, Mausrad zum Zoomen.

| Taste | Funktion |
|---|---|
| 1–6 | aktive Ebene: XY, XZ, XW, YZ, YW, ZW |
| ← → | aktive Ebene um 5° drehen |
| Leertaste | Auto-Rotation |
| P | Zentrum perspektivisch/orthogonal |
| V | Rissansicht / nur Tesseract |
| R | zurücksetzen |
| C | Auswahl löschen |

In der Browser-Konsole steht `window.__tesseract` (state, views, setup, scene …) zum Experimentieren bereit, z. B. `__tesseract.state.turn(2, Math.PI/4)`.

---

## Aufbau des Codes

```
index.html              Seite, Import-Map (three.js), Desktop-Hilfe
src/
  config.js             alle Konstanten: Farben, Ebenen, Maße, Geschwindigkeiten
  main.js               Szene, Platzierung, Verdrahtung der Module, Render-Schleife
  core/
    math4d.js           4D-Drehung, Projektionen, Zahlenformat (ohne Three.js)
    tesseract.js        16 Ecken, 32 Kanten (mit Achse), Eckennamen
    state.js            AppState: Matrix, Knopfwinkel, Modi, Auswahl, version-Zähler
  render/
    batches.js          instanzierte Zylinder/Kugeln (ein Draw-Call je Batch)
    views.js            Zentrum + 3 Seitenansichten, Rahmen, Beschriftung, Ecken-Picking
    links.js            Ordnungslinien und Viertelkreisbögen
  ui/
    canvasPanel.js      Canvas-Textur als Fläche/Sprite, Text-Helfer, UI-Farben
    pult.js             Bedienpult mit 6 Knöpfen und Schaltflächen
    statusLine.js       Statuszeile
    infoPanel.js        Legende + Drehmatrix
    vertexLabels.js     Koordinaten-Tooltips
  input/
    interaction.js      Zeiger (XR-Controller, Hände, Maus), Treffer, Gamepad-Tasten
    manipulator.js      Aufbau greifen, verschieben, zoomen
```

### Datenfluss pro Frame

```
Interaction.update   Eingaben lesen → state ändern (turn, toggle…)
AppState.update      Auto-Rotation, Projektions-Überblendung, Matrix nachorthonormieren
ViewSet.update       Ecken drehen (M·v) und projizieren → Kanten/Ecken-Batches
Links.update         Ordnungslinien für markierte Ecken
UI-Module            zeichnen ihre Canvas nur neu, wenn sich state.version ändert (gedrosselt)
renderer.render
```

### Mathematik in Kürze

- **Orientierung:** 4×4-Matrix `M` (zeilenweise im Array). Ecke `v` wird zu `M·v`.
- **Drehung in Ebene (a, b) um θ:** Zeilen a und b von `M` werden gemischt (`M ← G·M`). Die Drehung bezieht sich also immer auf die festen Achsen der Ansicht, nicht auf die schon gedrehten.
- **Feste Ebene:** Bei Drehung in (a, b) bleibt die Ebene der beiden anderen Achsen komplett unverändert (XW ↔ YZ, YW ↔ XZ, ZW ↔ XY).
- **Perspektive:** Kamera bei w = d, Faktor `d / (d − w)`. Die Überblendung zur orthogonalen Projektion läuft mit `1 + t·(Faktor − 1)`.
- **Seitenansicht ohne a:** Koordinate a wird durch w ersetzt, dann um `SIDE_OFFSET` entlang a versetzt.

---

## Weiterentwickeln

| Vorhaben | Wo ansetzen |
|---|---|
| Farben, Größen, Abstände | nur `config.js` |
| Neue Schaltfläche | `Pult.buttons` (Beschriftung) + `Pult.action` + Methode in `AppState` |
| Neue Darstellung (z. B. Schnitt-Modus) | neues Modul in `render/` nach dem Muster von `views.js`, in `main.js` einhängen, Moduswert in `state.viewMode` |
| Andere 4D-Körper (z. B. 16-Zeller, 24-Zeller) | `core/tesseract.js` durch eigene Ecken/Kanten ersetzen. Für die Kantenfarben pro Achse muss jede Kante eine `axis` haben; bei schrägen Kanten stattdessen nach Richtung mischen. |
| Weitere Eingabe | `Interaction.press/release/update`; Zeiger liefern nur einen Strahl und ein Quaternion |

### Geplante Ausbaustufen

1. **Version 2:** Hinweise bei besonderen Momenten (z. B. bei 90°: „X und W haben getauscht“), Flächen der aktiven Ebene hervorheben, die 8 Zellen einzeln anwählen
2. **Version 3:** Tesseract direkt mit den Händen drehen (rechte Hand verschieben = XW/YW/ZW), Analogie-Modus 3D→2D (Würfel auf Fläche), Schnitt-Modus (3D-Querschnitt bei w = c)

### Bekannte Grenzen

- Auf echter Hardware noch nicht getestet. Ausprobiert wurde nur die Desktop-Ansicht im Browser.
- Die Ansicht „ohne Z“ liegt hinter dem Zentrum. Von vorn ist sie verdeckt, dafür muss man den Kopf seitlich bewegen oder den Aufbau drehen.
- Die Linienstärken sind auf eine Betrachtung aus etwa 50–80 cm abgestimmt. Bei starkem Zoom-out werden sie dünn.
- Die Knopfwinkel werden auf ±180° gefaltet angezeigt.
