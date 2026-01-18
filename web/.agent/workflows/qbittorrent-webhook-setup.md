---
description: Jak skonfigurować qBittorrent do automatycznych aktualizacji (Webhooki)
---

Aby system automatycznie dowiadywał się o zakończeniu pobierania (bez czekania na polling), wykonaj poniższe kroki w qBittorrent:

1. Otwórz **qBittorrent**.
2. Przejdź do **Options** (Narzędzia -> Opcje) [Skrót: `Alt+O`].
3. Wybierz zakładkę **Downloads** (Pobieranie).
4. Przewiń na sam dół do sekcji **Run external program** (Uruchom zewnętrzny program).
5. Zaznacz opcję: **Run external program on torrent completion** (Uruchom zewnętrzny program po zakończeniu pobierania torrenta).
6. Wklej poniższą komendę (zakładając, że Twój serwer działa na `http://localhost:3002`):

```bash
curl -X POST "http://localhost:3002/api/webhooks/qbittorrent?name=%N&hash=%I&category=%L"
```

> [!IMPORTANT]
> - `%N` to nazwa torrenta.
> - `%I` to hash.
> - **`%L` (Category)** jest kluczowy - system używa go do dopasowania pliku do serii anime.

### Dlaczego to jest lepsze?
Zamiast co kilka minut sprawdzać wszystkie foldery, qBittorrent sam powiadomi backend w sekundę po zakończeniu pobierania. Backend natychmiast zmapuje odcinek i wyśle powiadomienie na Discord.
