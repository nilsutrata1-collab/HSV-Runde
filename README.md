# HSV-Runde – verbundene Web-App

Diese Version ist bereits mit dem Supabase-Projekt „HSV Runde“ verbunden.

## Was bereits funktioniert
- E-Mail-Registrierung und Login über Supabase Auth
- Benutzername wird bei Registrierung als Profil gespeichert
- Spiele werden aus `public.matches` geladen
- Teilnahme: Dabei / Vielleicht / Kann nicht
- Privater Grund liegt getrennt in `private_commitments` und ist per RLS nur für den eigenen Benutzer lesbar
- Teilnehmerübersicht aus den gespeicherten Antworten
- Privater Kalenderbereich
- Grundlegende Freundes-/Gruppenansicht
- Web-Ausgabe für Expo vorbereitet

## Start auf einem Computer
```bash
npm install
npx expo start --web
```

## Veröffentlichung
```bash
npx expo export --platform web
```
Danach kann der erzeugte `dist`-Ordner bei einem Web-Host veröffentlicht werden. Expo EAS Hosting ist ebenfalls möglich.

## Sicherheit
Die App enthält nur den Supabase **Publishable Key**. Der geheime `service_role`/Secret-Key ist nicht enthalten. Die Datenbankzugriffe werden über Supabase RLS geschützt.

## Noch nicht fertig
- automatische HSV-Spielplan-Synchronisierung
- echte Einladungslinks mit Beitrittslogik
- Push-Benachrichtigungen
- Admin-Oberfläche zum Anlegen/Bearbeiten von Spielen
- produktionsreife Gruppenberechtigungen und Datenschutz-/Impressumsseiten
- App-Store-Veröffentlichung
