# FlavorCraft - Your Personal Cooking Assistant

A modern web application that helps users discover, create, and share recipes based on their pantry ingredients.

## Features

### 🍳 Core Features
- **Community Feed** - Discover recipes shared by the community
- **Recipe Generator** - AI-powered recipe suggestions based on pantry items
- **User Profiles** - Personal stats, saved recipes, and cooking history
- **Pantry Management** - Track ingredients with categories and quantities

### 🎨 Design Features
- Modern, responsive UI with Tailwind CSS
- Beautiful recipe cards with images
- Intuitive navigation between sections
- Mobile-first design approach

### 🔧 Technical Features
- React 18 with Vite for fast development
- Node.js/Express backend with Supabase
- JWT authentication
- Real-time data with React Query
- Image upload support
- RESTful API design

## Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **React Query** - Data fetching and caching
- **Axios** - HTTP client
- **Lucide React** - Beautiful icons

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **Supabase** - PostgreSQL database
- **JWT** - JSON Web Tokens for authentication
- **Bcrypt** - Password hashing
- **OpenAI API** - AI-powered recipe generation
- **Spoonacular API** - Global cuisine recipe database
- **TheMealDB API** - Free recipe database

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- Supabase account
- npm or yarn

### Installation

1. **Clone and install dependencies:**
   ```bash
   cd hackathon
   npm run install-all
   ```

2. **Set up environment variables:**
   ```bash
   cd server
   cp env.example .env
   # Edit .env with your Supabase credentials, JWT secret, and API keys
   ```

3. **Start the development servers:**
   ```bash
   npm run dev
   ```

This will start:
- Backend server on `http://localhost:5001`
- Frontend dev server on `http://localhost:3000`

### Database Setup

The application uses Supabase PostgreSQL. Follow the setup instructions in `SUPABASE_SETUP.md`.

## Project Structure

```
hackathon/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── contexts/     # React contexts
│   │   ├── services/      # API services
│   │   └── main.jsx       # App entry point
│   └── package.json
├── server/                # Node.js backend
│   ├── services/         # Business logic
│   ├── routes/           # API routes
│   ├── middleware/        # Custom middleware
│   └── index.js          # Server entry point
└── package.json          # Root package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Recipes
- `GET /api/recipes` - Get all recipes (community feed)
- `GET /api/recipes/:id` - Get single recipe
- `POST /api/recipes` - Create new recipe
- `POST /api/recipes/generate` - Generate recipe from pantry
- `GET /api/recipes/search?q=query` - AI-powered recipe search

### Pantry
- `GET /api/pantry` - Get user's pantry
- `POST /api/pantry/items` - Add pantry item
- `PUT /api/pantry/items/:id` - Update pantry item
- `DELETE /api/pantry/items/:id` - Remove pantry item

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

## Features in Detail

### 🏠 Community Feed
- Browse recipes shared by the community
- Search with AI-powered suggestions
- Collapsible recipe cards with detailed views
- Real-time updates

### 🤖 Recipe Generator
- AI-powered recipe suggestions from Spoonacular, TheMealDB, and OpenAI
- Based on available pantry items
- Color-coded ingredient availability
- Save generated recipes

### 👤 User Profile
- Personal cooking statistics
- Manage pantry items by category
- Edit pantry item quantities
- Profile customization

### 📦 Pantry Management
- Categorized ingredient tracking
- Quantity and unit management
- Smart recipe suggestions based on available ingredients

## Development

### Adding New Features
1. Create components in `client/src/components/`
2. Add API routes in `server/routes/`
3. Update database models if needed
4. Test with the development server

## Deployment

### Frontend (Vercel/Netlify)
```bash
cd client
npm run build
# Deploy the dist/ folder
```

### Backend (Railway/Heroku)
```bash
cd server
# Set environment variables
# Deploy with your preferred platform
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for your hackathon!

## Support

For questions or issues, please open a GitHub issue or contact the development team.

---

**Happy Cooking! 🍳✨**
