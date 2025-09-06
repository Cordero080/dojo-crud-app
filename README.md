# Dojo App 🥋

A comprehensive full-stack martial arts forms management system built with the MEN stack (MongoDB, Express.js, Node.js). Designed specifically for Goju-Ryu practitioners to track their kata, bunkai, kumite, and weapon forms progression through the traditional kyu and dan ranking system.

---

## ✨ Key Features

### 🔐 User Authentication & Authorization

- **Secure user registration** with email validation and bcrypt password hashing
- **Session-based authentication** with MongoDB session store
- **User-scoped data** - each practitioner manages only their own forms
- **Protected routes** with authentication middleware

### 📋 Comprehensive Form Management

- **Full CRUD operations** for martial arts forms
- **Goju-Ryu specific data** including rank types (Kyu/Dan), belt colors, and categories
- **Form categories**: Kata, Bunkai, Kiso Kumite, Weapon, Other
- **Progress tracking** with "learned" status flags
- **Reference URLs** for instructional videos or documentation

### 🗑️ Advanced Data Management

- **Soft delete system** - forms are marked as deleted, not permanently removed
- **Trash management** - view and restore accidentally deleted forms
- **Hard delete option** for permanent removal
- **Duplicate prevention** - unique constraints per user for form/rank combinations

### 📊 Progress Analytics

- **Visual progress charts** showing form completion by rank
- **Requirements tracking** based on traditional Goju-Ryu syllabus
- **Belt progression visualization** with color-coded rank chips
- **Master forms reference** with traditional forms from white belt to 8th dan

### 🎯 Goju-Ryu Specific Features

- **Traditional ranking system**: 10th Kyu (White) to 8th Dan (Black)
- **Authentic form names** including Sanchin, Tensho, Seisan, Seipai, etc.
- **Weapon forms** including Bo, Sai, Tonfa, Nunchaku, and more
- **Kin Gai Ryu kata** for advanced practitioners

---

## 🛠 Tech Stack

### Backend

- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database with Mongoose ODM
- **bcryptjs** - Password hashing
- **express-session** - Session management with MongoDB store

### Frontend & Templating

- **EJS** - Embedded JavaScript templating
- **Custom CSS** - Responsive design with page-specific styling
- **Method Override** - Support for PUT/DELETE in forms
- **Interactive Charts** - Canvas-based progress visualization

---

## 📁 Project Structure

```
dojo-app/
├── models/
│   ├── User.js              # User authentication schema
│   └── Form.js              # Martial arts form schema with soft delete
├── routes/
│   ├── auth.js              # Authentication routes (login/signup/logout)
│   └── forms.js             # RESTful form CRUD operations
├── middleware/
│   └── requireAuth.js       # Authentication protection middleware
├── scripts/
│   ├── seed.js              # Database seeding with kata progression
│   └── sync-indexes.js      # MongoDB index synchronization
├── views/
│   ├── index.ejs            # Home page with animated Goju-Ryu logo
│   ├── new.ejs              # Create form with progress charts & requirements
│   ├── forms/
│   │   ├── index2.ejs       # Forms listing with delete confirmation
│   │   ├── show.ejs         # Individual form details
│   │   ├── edit.ejs         # Form editing interface
│   │   └── trash.ejs        # Deleted forms management
│   └── partials/            # Reusable view components
├── public/css/
│   ├── main.css             # Primary styling with custom fonts & animations
│   ├── chart.css            # Chart layout & belt progression styling
│   └── scroll.css           # Custom combobox & scrolling components
├── db.js                    # Database connection configuration
└── server.js                # Express application setup with session handling
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)

### Installation

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd dojo-app
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment setup**

   ```bash
   # Create .env file
   MONGODB_URI=mongodb://localhost:27017/forms_db
   PORT=3000
   SESSION_SECRET=your-secure-session-secret
   NODE_ENV=development
   ```

4. **Initialize database**

   ```bash
   # Seed with traditional Goju-Ryu kata
   node scripts/seed.js

   # Sync database indexes
   node scripts/sync-indexes.js
   ```

5. **Start development server**

   ```bash
   nodemon server.js
   # or
   node server.js
   ```

6. **Access application**
   ```
   http://localhost:3000
   ```

---

## 📋 API Routes

### Authentication Routes

| Method | Route          | Description               |
| ------ | -------------- | ------------------------- |
| GET    | `/auth/signup` | User registration page    |
| POST   | `/auth/signup` | Create new user account   |
| GET    | `/auth/login`  | User login page           |
| POST   | `/auth/login`  | Authenticate user session |
| POST   | `/auth/logout` | Destroy user session      |

### Form Management Routes (Protected)

| Method | Route                | Description               |
| ------ | -------------------- | ------------------------- |
| GET    | `/`                  | Home page with navigation |
| GET    | `/forms`             | List user's forms         |
| GET    | `/forms/new`         | Create form with charts   |
| POST   | `/forms`             | Add form to database      |
| GET    | `/forms/:id`         | View form details         |
| GET    | `/forms/:id/edit`    | Edit form page            |
| PUT    | `/forms/:id`         | Update form data          |
| DELETE | `/forms/:id`         | Soft delete form          |
| GET    | `/forms/trash`       | View deleted forms        |
| POST   | `/forms/:id/restore` | Restore deleted form      |
| DELETE | `/forms/:id?hard=1`  | Permanently delete form   |

---

## 🎨 User Interface Features

### User Interface Features

### Responsive Design

- **Mobile-first** CSS architecture with Formation Sans font
- **Animated home page** with 3D Goju-Ryu logo animation
- **Visual rank progression** with color-coded belt chips
- **Interactive charts** showing training progress by rank
- **Custom scrollbars** with gradient styling

### Component Architecture

- **Modular EJS partials** for consistent UI elements
- **Dynamic navigation** with authentication state awareness
- **Shared error handling** with reusable error display component
- **Consistent head/footer** across all pages

### Form Creation Experience

- **Smart combobox** with type-to-filter functionality for form names
- **Real-time requirements** display showing traditional syllabus
- **Progress visualization** with canvas-based charts
- **Belt color integration** with authentic Goju-Ryu progression

### Data Management

- **Confirmation dialogs** for delete operations
- **Trash system** with restore and hard delete options
- **Form validation** with detailed error messaging
- **Responsive tables** for form listings

---

## 🗄️ Database Schema

### User Model

```javascript
{
  email: String (required, unique),
  passwordHash: String (required),
  timestamps: { createdAt, updatedAt }
}
```

### Form Model

```javascript
{
  owner: ObjectId (ref: User, required, indexed),
  name: String (required, min: 2 chars),
  rankType: Enum ['Kyu', 'Dan'] (required),
  rankNumber: Number (required, min: 1),
  beltColor: String,
  category: Enum ['Kata', 'Bunkai', 'Kumite', 'Weapon', 'Other'],
  description: String,
  referenceUrl: String (URL validation),
  learned: Boolean (default: false),
  deletedAt: Date (soft delete),
  timestamps: { createdAt, updatedAt }
}
```

### Indexes

- **Unique constraint**: `{ owner, name, rankType, rankNumber }` (alive forms only)
- **Owner index**: Fast queries by user
- **Deletion filter**: Partial index excluding soft-deleted records

---

## 🥋 Traditional Goju-Ryu Integration

### Ranking System

- **Kyu Grades**: 10th (White) → 1st (Brown)
- **Dan Degrees**: 1st → 8th (Black)
- **Belt Colors**: White, Orange, Green, Purple, Brown, Black
- **Gradient Chips**: Visual representation of intermediate ranks

### Master Forms Reference

The application includes 48+ traditional forms:

- **Foundation**: Sanchin, Tensho, Basic Kata series
- **Intermediate**: Geikisai series, Saifa, Seisan
- **Advanced**: Sanseiru, Kururunfa, Shisochin
- **Weapons**: Bo, Sai, Tonfa, Nunchaku, Kama
- **Master Level**: Kin Gai Ryu series

### Requirements Tracking

- **Kyu Requirements**: Forms needed for each belt promotion
- **Dan Requirements**: Advanced kata and weapon forms
- **Progress Charts**: Visual completion tracking by rank

---

## 🔧 Advanced Features

### Authentication & Security

- **Session-based auth** with MongoDB store
- **Password hashing** using bcrypt with salt rounds
- **CSRF protection** via session validation
- **User isolation** - complete data separation between users

### Performance Optimizations

- **Database indexing** for fast owner-scoped queries
- **Soft delete system** preserving data integrity
- **Optimized aggregation** for progress analytics
- **Lazy loading** of reference data

### Development Tools

- **Database seeding** with authentic kata progression
- **Index synchronization** for schema updates
- **Environment configuration** for development/production
- **Method override** for RESTful form operations

---

## 🎯 Form Categories

### Kata (Forms)

Traditional solo exercises demonstrating martial arts techniques in sequence

### Bunkai (Applications)

Practical applications of kata movements with partner training

### Kiso Kumite (Basic Sparring)

Structured sparring exercises building combat skills progressively

### Weapon Forms

Traditional Okinawan weapons including Bo, Sai, Tonfa, and others

### Other

Specialized training forms and modern adaptations

---

## 🛠️ Development Workflow

### Database Operations

```bash
# Reset and reseed database
node scripts/seed.js

# Update database indexes
node scripts/sync-indexes.js

# Connect to MongoDB shell
mongosh $MONGODB_URI
```

### Development Commands

```bash
# Development with auto-reload
npm run dev

# Production start
npm start

# Database inspection
mongosh $MONGODB_URI
```

---

## 📈 Roadmap

### Phase 1: Enhanced User Experience

- [ ] Video integration for form demonstrations
- [ ] Advanced search and filtering
- [ ] Export functionality for training logs
- [ ] Mobile app development

### Phase 2: Community Features

- [ ] Multi-dojo support with instructor roles
- [ ] Form sharing between practitioners
- [ ] Tournament registration and tracking
- [ ] Achievement badges and milestones

### Phase 3: Advanced Analytics

- [ ] Training pattern analysis
- [ ] Progress prediction algorithms
- [ ] Integration with wearable devices
- [ ] Comparative progress reports

---

## 🤝 Contributing

This project welcomes contributions from:

- **Goju-Ryu practitioners** with syllabus knowledge
- **Full-stack developers** interested in martial arts applications
- **UI/UX designers** for enhanced user experience
- **Database architects** for optimization recommendations

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- **Traditional Goju-Ryu syllabus** from Okinawan martial arts lineage
- **Chi-I-Do** (International Organization) for form standardization
- **Open source community** for the excellent MEN stack ecosystem
- **Formation Sans** font family for authentic martial arts presentation

---

**Built with 💙 for the martial arts community**
