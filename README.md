# Martial Arts Forms CRUD App

A full-stack MEN (MongoDB, Express, Node.js) application for managing Goju-Ryu martial arts forms.  
The app implements full **CRUD** (Create, Read, Update, Delete) functionality and uses **EJS** for server-rendered views.

---

## 📋 Features

- **Create** new martial arts forms with fields for:
  - Name, Rank Type (`Kyu`/`Dan`), Rank Number
  - Belt Color, Category (Kata, Bunkai, Kumite, Weapon, Other)
  - Description, Reference URL
- **Read** all forms in a styled index table or view single form details
- **Update** form data through a pre-filled edit page
- **Delete** forms (hard delete, removed from MongoDB)
- **Seed Script** (`scripts/seed.js`) to reset and repopulate the database with starter forms

---

## 🗂 Tech Stack

- **Backend**: Node.js, Express
- **Database**: MongoDB with Mongoose ODM
- **Templating**: EJS
- **Styling**: Custom `public/css/main.css` with page-specific body classes
- **Middleware**:
  - `express.urlencoded` – parse form data
  - `method-override` – allow PUT/DELETE in forms
  - `express.static` – serve CSS, JS, and images

---

## 📂 Project Structure

````plaintext
men-stack-crud-app-lab/
│
├── models/           # Mongoose schema and model
├── routes/           # CRUD route handlers (if separated)
├── scripts/          # seed.js to repopulate DB
├── views/            # EJS templates
│   ├── forms/        # index, show, edit pages
│   ├── partials/     # head/footer and shared includes
│   └── new.ejs       # create form page
├── public/           # static assets (css, images, fonts)
│   └── css/main.css  # shared and page-specific styles
├── db.js             # MongoDB connection logic
├── server.js         # main Express app
└── README.md         # project documentation

## 🚀 Getting Started

### 1. Install dependencies
```bash
npm install

MONGODB_URI=mongodb://localhost:27017/kata
PORT=3000

node scripts/seed.js

nodemon

Visit: http://localhost:3000

## 🔄 CRUD Routes

| Method  | Route            | Action   | Description                       |
|---------|------------------|----------|-----------------------------------|
| **GET** | `/forms`         | Index    | List all forms                    |
| **GET** | `/forms/new`     | New      | Show create form page             |
| **POST**| `/forms`         | Create   | Add new form to the database      |
| **GET** | `/forms/:id`     | Show     | View a single form’s details      |
| **GET** | `/forms/:id/edit`| Edit     | Show edit form page               |
| **PUT** | `/forms/:id`     | Update   | Update form in the database       |
| **DELETE** | `/forms/:id`  | Destroy  | Permanently delete form from DB   |

## 🎨 Styling

Although styling was not required for this assignment, the app includes:

- **Global CSS**
  - Located at `public/css/main.css`
  - Loaded on all pages via `partials/head.ejs`

- **Page-specific styles** (set using unique `<body>` classes):
  - `.home` – landing page
  - `.page-index-2` – forms index page
  - `.page-new` – create form page
  - `.page-show` – single form page
  - `.page-edit` – edit form page

- **Additional visual enhancements**:
  - Custom fonts
  - Gradient backgrounds
  - Hover effects
  - Styled scrollbars


## 🛠 Developer Notes

- **Hard delete** – Deleting a form removes it permanently from the database.
- **Seeding** – Run `node scripts/seed.js` to restore the starter forms.
- **Adding fields** – Update the schema (`models/Form.js`), form views, and table displays.
- **Recovering deleted data** – Rerun the seed script or manually re-add forms through `/new`.

## 📊 App Flow Diagram

```mermaid
flowchart TD
    A[User / Browser] -->|Sends Request| B[Express Routes]
    B -->|CRUD Operation| C[MongoDB via Mongoose]
    C -->|Returns Data| B
    B -->|Renders View| D[EJS Templates]
    D -->|HTML Response| A
````
