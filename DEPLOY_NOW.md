# Deploy Your Chatbot NOW - Quick Guide

## Step 1: Install Supabase CLI (If not installed)

```bash
npm install -g supabase
```

## Step 2: Login and Link Project

```bash
# Login to Supabase
supabase login

# Link your project (get project ref from Supabase Dashboard > Settings > General)
supabase link --project-ref YOUR_PROJECT_REF
```

## Step 3: Run Database Migration

```bash
# This adds vector search capability
supabase db push
```

## Step 4: Deploy Edge Function

```bash
# Deploy the chat function
supabase functions deploy chat

# Set OpenRouter API key
supabase secrets set OPENROUTER_API_KEY=sk-or-v1-YOUR_KEY_HERE
```

**Get OpenRouter Key:**
- Go to https://openrouter.ai/keys
- Create new key
- Copy it

## Step 5: Test It!

Go to your Publish page and send a message. You should now get real AI responses!

---

## Troubleshooting

### Error: "Project ref not found"
Run `supabase projects list` to see your projects

### Error: "Function already exists"
That's OK! It means it's updating the existing function

### Error: "Authentication required"
Run `supabase login` again

### Still seeing "Preview mode" message?
1. Check if function deployed: `supabase functions list`
2. Check secrets: `supabase secrets list`
3. Check function logs: `supabase functions logs chat`

---

## Alternative: Test Locally First

```bash
# Start local Supabase
supabase start

# Serve functions locally
supabase functions serve chat --env-file .env.local

# Create .env.local file:
OPENROUTER_API_KEY=your_key_here
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=your_local_service_role_key
```

Then update your `.env` file:
```
VITE_SUPABASE_URL=http://localhost:54321
```

Restart your dev server and test!
