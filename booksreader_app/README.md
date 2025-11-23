# BooksReader App

BooksReader is a cross‑platform Flutter application that lets users read, organize, and track their e‑books (PDF, EPUB, TXT). It includes:

- **Library management** – browse, search, and sort your collection.
- **Reading experience** – smooth page turning, dark mode, text selection, and highlighting.
- **Analytics** – view reading statistics over day/week/month/year periods.
- **User authentication** – powered by Clerk SDK for secure sign‑in/up.
- **Bookmarks & highlights** – persist positions and highlights across sessions.
- **Responsive design** – works on only Android currently

## Getting Started

1. **Prerequisites**

   - Flutter SDK (>=3.19)
   - Dart >=3.2
   - Android emulator or device

2. **Clone the repository**

```bash
git clone https://github.com/your-org/BooksReader.git
cd BooksReader/booksreader_app
```

3. **Install dependencies**

```bash
flutter pub get
```

4. **Run the app**

```bash
flutter run
```

## Configuration

- **Clerk authentication** – add your Clerk publishable key to `.env`:

```
CLERK_PUBLISHABLE_KEY=your_key_here
CLERK_SECRET_KEY=your_key_here
```
