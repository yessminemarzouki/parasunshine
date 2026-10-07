# 🚀 Quick Start Guide - PharmaSoin

## Installation Steps

### 1. Extract the Project
Extract the `parapharmacy-project` folder to your preferred location.

### 2. Install Dependencies
```bash
cd parapharmacy-project/frontend
npm install
```

### 3. Configure Environment
Copy the example environment file:
```bash
cp .env.example .env
```

### 4. Start Development Server
```bash
npm run dev
```

Visit: `http://localhost:3000`

## ✅ What's Working

- ✅ Homepage with hero section
- ✅ Product catalog with cards
- ✅ Shopping cart (with localStorage persistence)
- ✅ Checkout process
- ✅ Login/Register pages
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Trust badges
- ✅ Category navigation
- ✅ Blog section

## 🔄 Next Steps (Backend Integration)

1. **Set up Laravel Backend**
   - Create new Laravel project
   - Configure database
   - Run migrations

2. **Connect Frontend to Backend**
   - Update `VITE_API_URL` in `.env`
   - Backend should run on `http://localhost:8000`

3. **Implement API Endpoints**
   - See `README.md` for required endpoints
   - All endpoints defined in `src/services/api.js`

## 📂 File Structure Overview

```
frontend/
├── src/
│   ├── components/     → Reusable UI components
│   ├── pages/          → Page components (routes)
│   ├── context/        → React Context (Cart state)
│   ├── services/       → API calls
│   └── styles/         → CSS files
├── index.html          → Entry HTML
├── package.json        → Dependencies
└── vite.config.js      → Vite configuration
```

## 🎨 Customization

### Change Colors
Edit CSS variables in `src/styles/index.css`:
```css
:root {
    --primary-green: #2D5F4F;
    --soft-green: #8FB5A8;
    /* ... more colors */
}
```

### Add New Pages
1. Create file in `src/pages/YourPage.jsx`
2. Add route in `src/App.jsx`
3. Create corresponding CSS file

### Modify Products
Currently using mock data. Replace with API calls in:
- `src/pages/Home.jsx`
- `src/pages/ProductList.jsx`
- `src/pages/ProductDetail.jsx`

## 🐛 Troubleshooting

**Port already in use?**
```bash
# Change port in vite.config.js or use:
npm run dev -- --port 3001
```

**Dependencies not installing?**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**API not connecting?**
- Check `.env` file exists
- Verify `VITE_API_URL` is correct
- Ensure backend is running

## 📚 Resources

- **React**: https://react.dev
- **Vite**: https://vitejs.dev
- **React Router**: https://reactrouter.com
- **Laravel**: https://laravel.com

## 💡 Tips

1. **Cart persists** - Uses localStorage, data saved between sessions
2. **Responsive** - Test on different screen sizes
3. **Mock data** - Replace with real API calls when backend is ready
4. **Icons** - Currently using emojis, can replace with icon library

## 🎯 Production Build

When ready to deploy:
```bash
npm run build
```

This creates a `dist/` folder ready for deployment.

---

Happy coding! 🌿
