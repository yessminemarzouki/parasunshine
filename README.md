# PharmaSoin - Parapharmacy E-commerce Platform

A modern, responsive e-commerce platform for a parapharmacy built with React (Frontend) and Laravel (Backend).

## 🚀 Features

- **Modern Design**: Clean, trust-inspiring interface with medical-grade professionalism
- **Responsive**: Mobile-first approach that works on all devices
- **Shopping Cart**: Full cart functionality with persistent storage
- **Product Catalog**: Browse products by category with filtering
- **User Authentication**: Login/Register system
- **Checkout Process**: Complete order flow with multiple payment options
- **SEO-Ready**: Blog section for content marketing

## 📁 Project Structure

```
parapharmacy-project/
├── frontend/                 # React frontend application
│   ├── public/              # Static assets
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   │   ├── Header.jsx
│   │   │   ├── Navigation.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── ProductCard.jsx
│   │   │   └── PromoBanner.jsx
│   │   ├── pages/           # Page components
│   │   │   ├── Home.jsx
│   │   │   ├── ProductList.jsx
│   │   │   ├── ProductDetail.jsx
│   │   │   ├── Cart.jsx
│   │   │   ├── Checkout.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── context/         # React Context for state management
│   │   │   └── CartContext.jsx
│   │   ├── services/        # API integration
│   │   │   └── api.js
│   │   ├── styles/          # CSS files
│   │   ├── App.jsx          # Main app component
│   │   └── main.jsx         # Entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── backend/                 # Laravel backend (to be implemented)
```

## 🛠️ Technologies

### Frontend
- **React 18** - UI library
- **React Router DOM** - Routing
- **Vite** - Build tool
- **Axios** - HTTP client
- **CSS3** - Styling (Vanilla CSS for performance)

### Backend (To be implemented)
- **Laravel** - PHP framework
- **MySQL/PostgreSQL** - Database
- **Laravel Sanctum** - Authentication

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Frontend Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```bash
VITE_API_URL=http://localhost:8000/api
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🎨 Design System

### Color Palette
- **Primary Green**: `#2D5F4F` - Trust and nature
- **Soft Green**: `#8FB5A8` - Calm and wellness
- **Accent Sage**: `#B8C5B3` - Subtle highlights
- **Cream**: `#F8F6F3` - Warm backgrounds
- **Gold Accent**: `#D4AF37` - Premium touches

### Typography
- **Headings**: Playfair Display (Serif)
- **Body**: Work Sans (Sans-serif)

## 🔌 API Integration

The frontend is configured to connect to a Laravel backend API. Update the API endpoints in `src/services/api.js` as needed.

### Key API Endpoints (To be implemented in Laravel)

**Authentication**
- `POST /api/login`
- `POST /api/register`
- `POST /api/logout`
- `GET /api/user`

**Products**
- `GET /api/products` - List products with filters
- `GET /api/products/{slug}` - Get product details
- `GET /api/products/featured` - Featured products
- `GET /api/products/new` - New products

**Categories**
- `GET /api/categories`

**Orders**
- `POST /api/orders` - Create order
- `GET /api/orders` - User order history

**Blog**
- `GET /api/posts`
- `GET /api/posts/{slug}`

## 🛒 Cart System

The cart uses React Context and localStorage for persistence:
- Items persist across page refreshes
- Automatic quantity updates
- Real-time cart count in header
- Free shipping calculation (>99 DT)

## 📱 Responsive Breakpoints

- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## 🔒 Security Features

- CORS configuration for API
- CSRF protection (Laravel Sanctum)
- Input validation
- Secure password handling
- XSS protection

## 🚀 Deployment

### Frontend Deployment

1. Build the production bundle:
```bash
npm run build
```

2. Deploy the `dist` folder to your hosting provider:
   - Vercel
   - Netlify
   - AWS S3 + CloudFront
   - Any static hosting service

### Environment Variables

Create a `.env.production` file:
```
VITE_API_URL=https://your-api-domain.com/api
```

## 📝 Backend Implementation (Next Steps)

1. Set up Laravel project
2. Configure database
3. Create migrations for:
   - users
   - products
   - categories
   - orders
   - order_items
   - posts
   - newsletter_subscribers

4. Implement API routes
5. Set up Laravel Sanctum
6. Create controllers and models
7. Add validation and middleware

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 👥 Team

- Frontend: React + Vite
- Backend: Laravel (To be implemented)
- Design: Custom design system

## 📧 Support

For support, contact: support@pharmasoin.tn

---

Built with ❤️ for PharmaSoin
