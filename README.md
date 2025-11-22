# Audio Gear Catalog

Aplikacja webowa do przeglądania i zakupu sprzętu audio - sklep internetowy. Projekt zrealizowany w ramach przedmiotu Aplikacje Internetowe 2.

![Strona główna](home_page.png)

## Spis treści

- [Architektura](#architektura)
- [Funkcjonalności](#funkcjonalności)
- [Technologie](#technologie)
- [Instalacja i uruchomienie](#instalacja-i-uruchomienie)
- [Użytkownicy testowi](#użytkownicy-testowi)
- [API Documentation](#api-documentation)
- [Zrzuty ekranu](#zrzuty-ekranu)

## Architektura

Projekt składa się z dwóch głównych komponentów:

### Backend (FastAPI + SQLAlchemy)
```
backend/
├── app/
│   ├── main.py           # Główny plik aplikacji, konfiguracja CORS, inicjalizacja DB
│   ├── models.py         # Modele ORM (User, GearItem, CartItem)
│   ├── schemas.py        # Schematy Pydantic do walidacji
│   ├── auth.py           # Autentykacja JWT, logowanie/rejestracja
│   ├── db.py             # Konfiguracja połączenia z bazą danych
│   ├── docs.py           # Metadata dla dokumentacji API
│   └── routes/
│       ├── catalog.py    # Endpointy katalogu produktów
│       ├── cart.py       # Zarządzanie koszykiem
│       └── admin.py      # Panel administracyjny
└── requirements.txt
```

**Baza danych**: SQLite (`app.db`) z automatycznym seedowaniem danych

**Autoryzacja**: JWT tokens z hasłami hashowanymi przez bcrypt

**API**: RESTful z pełną dokumentacją OpenAPI/Swagger

### Frontend (React + TypeScript + Vite)
```
frontend/
├── src/
│   ├── main.tsx          # Entry point aplikacji
│   ├── App.tsx           # Routing i główny widok katalogu
│   ├── Header.tsx        # Nawigacja i info o użytkowniku
│   ├── Login.tsx         # Formularz logowania
│   ├── Register.tsx      # Formularz rejestracji
│   ├── ProductDetail.tsx # Szczegóły produktu
│   ├── Cart.tsx          # Widok koszyka
│   ├── AdminPanel.tsx    # Panel administracyjny
│   ├── api.ts            # Funkcje do komunikacji z API
│   ├── cart.ts           # Zarządzanie stanem koszyka
│   └── images.ts         # Mapowanie zdjęć produktów
├── attachments/          # Zdjęcia produktów
└── package.json
```

**Style**: Inline CSS z responsywnym designem

**Stan**: React hooks (useState, useEffect) + localStorage dla koszyka

## Funkcjonalności

### Dla wszystkich użytkowników:
- Przeglądanie katalogu sprzętu audio z filtrowaniem po kategorii (mikrofonы, słuchawki, interfejsy)
- Wyszukiwanie produktów po nazwie
- Szczegółowe informacje o produktach (opis, cena, ocena, dostępność, galeria zdjęć)
- Koszyk zakupowy z persistencją w localStorage

### Dla zalogowanych użytkowników:
- Rejestracja i logowanie z autoryzacją JWT
- Finalizacja zamówienia (złożenie zamówienia z produktów w koszyku)
- Historia zamówień

### Dla administratorów:
- Dodawanie nowych produktów
- Edycja istniejących produktów
- Usuwanie produktów
- Zarządzanie użytkownikami (nadawanie uprawnień admina)
- Przeglądanie wszystkich zamówień użytkowników

![Panel administracyjny](admin_panel.png)

## Technologie

### Backend:
- **FastAPI** 0.115.2 - nowoczesny framework webowy
- **SQLAlchemy** 2.0.36 - ORM do zarządzania bazą danych
- **Uvicorn** - serwer ASGI
- **python-jose** - obsługa JWT tokens
- **passlib[bcrypt]** - hashowanie haseł
- **SQLite** - baza danych

### Frontend:
- **React** 18.3.1 - biblioteka UI
- **TypeScript** 5.5.4 - typowany JavaScript
- **Vite** 5.4.8 - szybki build tool
- **React Router** - routing (zaimplementowany ręcznie)

## Instalacja i uruchomienie

### Wymagania:
- Python 3.11+
- Node.js 18+ i npm

### Backend

1. Przejdź do katalogu backend:
```bash
cd backend
```

2. Utwórz wirtualne środowisko Python:
```bash
python -m venv venv
```

3. Aktywuj środowisko:
- **Windows:**
  ```bash
  venv\Scripts\activate
  ```
- **Linux/Mac:**
  ```bash
  source venv/bin/activate
  ```

4. Zainstaluj zależności:
```bash
pip install -r requirements.txt
```

5. Uruchom serwer (z katalogu głównego projektu):
```bash
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend będzie dostępny pod adresem: `http://localhost:8000`

API Documentation (Swagger): `http://localhost:8000/docs`

### Frontend

1. Przejdź do katalogu frontend:
```bash
cd frontend
```

2. Zainstaluj zależności:
```bash
npm install
```

3. Uruchom serwer deweloperski:
```bash
npm run dev
```

Frontend będzie dostępny pod adresem: `http://localhost:5173`

### Build produkcyjny

Aby zbudować wersję produkcyjną frontendu:
```bash
cd frontend
npm run build
```

Zbudowana aplikacja znajdzie się w folderze `frontend/dist` i będzie automatycznie serwowana przez backend FastAPI.

## Użytkownicy testowi

Po pierwszym uruchomieniu backend automatycznie utworzy konto administratora oraz kilku użytkowników testowych:

### Administrator:
- **Login:** `admin`
- **Hasło:** `admin`

### Użytkownicy testowi:
- **user1** / `password1`
- **user2** / `password2`
- **testuser** / `test123`
- **jankowalski** / `kowalski123`
- **annanowak** / `nowak456`
- **testadmin** / `admin123` (ma uprawnienia admina)

## API Documentation

Backend udostępnia interaktywną dokumentację API:

- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

![Dokumentacja API](swagger.png)

### Główne endpointy:

#### Autoryzacja:
- `POST /auth/register` - Rejestracja nowego użytkownika
- `POST /auth/login` - Logowanie (zwraca JWT token)
- `GET /auth/me` - Informacje o zalogowanym użytkowniku

#### Katalog:
- `GET /api/catalog/items` - Lista wszystkich produktów
- `GET /api/catalog/items/{id}` - Szczegóły produktu
- `GET /api/catalog/categories` - Lista dostępnych kategorii

#### Koszyk:
- `GET /api/cart` - Zawartość koszyka zalogowanego użytkownika
- `POST /api/cart/add` - Dodaj produkt do koszyka
- `PUT /api/cart/update/{item_id}` - Aktualizuj ilość produktu
- `DELETE /api/cart/remove/{item_id}` - Usuń produkt z koszyka
- `POST /api/cart/checkout` - Finalizuj zamówienie

#### Admin (wymaga uprawnień administratora):
- `POST /api/admin/items` - Dodaj nowy produkt
- `PUT /api/admin/items/{id}` - Edytuj produkt
- `DELETE /api/admin/items/{id}` - Usuń produkt
- `GET /api/admin/users` - Lista wszystkich użytkowników
- `PUT /api/admin/users/{id}/admin` - Zmień uprawnienia użytkownika
- `GET /api/admin/orders` - Lista wszystkich zamówień

## 📸 Zrzuty ekranu

### Strona główna z katalogiem produktów
![Strona główna](home_page.png)

### Koszyk zakupowy
![Koszyk](cart.png)

### Panel administracyjny
![Panel administracyjny](admin_panel.png)

### Dokumentacja API (Swagger)
![Swagger](swagger.png)

## Struktura bazy danych

### Tabele:

**users**
- `id` - PRIMARY KEY
- `username` - UNIQUE
- `hashed_password`
- `is_admin` - BOOLEAN

**gear_items**
- `id` - PRIMARY KEY
- `name`
- `category` - (microphone, headphones, interface)
- `brand`
- `price`
- `rating`
- `description`
- `in_stock` - BOOLEAN

**cart_items**
- `id` - PRIMARY KEY
- `user_id` - FOREIGN KEY → users
- `item_id` - FOREIGN KEY → gear_items
- `quantity`
- `is_ordered` - BOOLEAN

## Bezpieczeństwo

- Hasła są hashowane przy użyciu bcrypt
- Autentykacja oparta na JWT tokens
- CORS skonfigurowany dla lokalnego developmentu
- Endpointy administracyjne chronione weryfikacją uprawnień
- Walidacja danych wejściowych przez Pydantic schemas

## Licencja

Projekt edukacyjny - Aplikacje Internetowe 2, 2025
