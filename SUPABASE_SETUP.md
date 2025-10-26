# Supabase Setup Guide for FlavorCraft

This guide will help you set up Supabase as the database for your FlavorCraft application.

## 🚀 Step 1: Create Supabase Project

1. **Sign up for Supabase**
   - Go to [supabase.com](https://supabase.com)
   - Click "Start your project" and sign up with GitHub, Google, or email

2. **Create a new project**
   - Click "New Project"
   - Choose your organization
   - Fill in project details:
     - **Name**: `FlavorCraft`
     - **Database Password**: Choose a strong password (save this!)
     - **Region**: Select closest to your location
   - Click "Create new project"
   - Wait for the project to be set up (2-3 minutes)

## 🗄️ Step 2: Set Up Database Schema

1. **Access the SQL Editor**
   - In your Supabase dashboard, go to the "SQL Editor" tab
   - Click "New query"

2. **Run the Schema Script**
   - Copy the contents of `server/database/schema.sql`
   - Paste it into the SQL editor
   - Click "Run" to execute the script

   This will create:
   - `users` table with authentication
   - `recipes` table with full recipe data
   - `pantries` table for user ingredient tracking
   - `user_follows` table for social features
   - Proper indexes and relationships
   - Row Level Security (RLS) policies

## 🔑 Step 3: Get API Keys

1. **Find your project URL and API key**
   - Go to "Settings" → "API" in your Supabase dashboard
   - Copy the following values:
     - **Project URL** (looks like: `https://your-project-ref.supabase.co`)
     - **anon public** key (starts with `eyJ...`)

2. **Update environment variables**
   - Copy `server/env.example` to `server/.env`
   - Fill in your Supabase credentials:

```env
NODE_ENV=development
PORT=5000
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=your_jwt_secret_key_here
```

## 🔐 Step 4: Configure Authentication (Optional)

1. **Set up email authentication**
   - Go to "Authentication" → "Settings" in your Supabase dashboard
   - Configure email settings if you want email verification
   - Set "Site URL" to `http://localhost:3000` for development

2. **Configure RLS policies**
   - The schema already includes Row Level Security policies
   - These ensure users can only access their own data
   - Public recipes are viewable by everyone

## 🧪 Step 5: Test the Connection

1. **Install dependencies**
   ```bash
   cd server
   npm install
   ```

2. **Start the server**
   ```bash
   npm run dev
   ```

3. **Test the API**
   - Visit `http://localhost:5000/api/health`
   - You should see: `{"status":"OK","message":"FlavorCraft API is running"}`

## 📊 Step 6: View Your Data

1. **Access the Table Editor**
   - Go to "Table Editor" in your Supabase dashboard
   - You should see your tables: `users`, `recipes`, `pantries`, `user_follows`

2. **Test data insertion**
   - Try creating a user through your app
   - Check the `users` table to see the data

## 🔧 Step 7: Advanced Configuration (Optional)

### Enable Real-time Features
1. Go to "Database" → "Replication" in your Supabase dashboard
2. Enable real-time for tables you want to sync in real-time

### Set up Storage (for images)
1. Go to "Storage" in your Supabase dashboard
2. Create a bucket called "recipe-images"
3. Configure policies for public access

### Configure Email Templates
1. Go to "Authentication" → "Email Templates"
2. Customize the email templates for your app

## 🚀 Production Deployment

### Environment Variables for Production
```env
NODE_ENV=production
PORT=5000
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your_production_anon_key
JWT_SECRET=your_production_jwt_secret
```

### Database Backups
- Supabase automatically backs up your database
- You can also create manual backups in the dashboard

## 🆘 Troubleshooting

### Common Issues

1. **Connection Error**
   - Check your `SUPABASE_URL` and `SUPABASE_ANON_KEY`
   - Ensure your project is not paused

2. **Permission Denied**
   - Check that RLS policies are correctly set up
   - Verify your JWT secret matches

3. **Schema Errors**
   - Make sure you ran the complete schema.sql script
   - Check the SQL Editor for any error messages

### Getting Help
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [GitHub Issues](https://github.com/supabase/supabase/issues)

## ✅ Verification Checklist

- [ ] Supabase project created
- [ ] Database schema executed successfully
- [ ] Environment variables configured
- [ ] API connection working
- [ ] Tables visible in Table Editor
- [ ] Authentication working (optional)

Your FlavorCraft application is now ready to use Supabase as its database! 🎉

## 🎯 Next Steps

1. Start your development servers:
   ```bash
   npm run dev
   ```

2. Test the application:
   - Register a new user
   - Create a recipe
   - Add items to pantry
   - Generate AI recipes

3. Deploy to production when ready!

---

**Happy Cooking! 🍳✨**
