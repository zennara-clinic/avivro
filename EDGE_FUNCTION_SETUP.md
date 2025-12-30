# Supabase Edge Function Setup Guide

## Issue: 500 Internal Server Error

Your chatbot Edge Function is failing because required environment variables are not configured in Supabase.

## Required Secrets

The Edge Function needs these environment variables set in your Supabase project:

### 1. OPENROUTER_API_KEY
- **Description**: API key for OpenRouter (AI model provider)
- **How to get**: Sign up at https://openrouter.ai/keys
- **Required for**: AI chat responses and embeddings

### 2. SUPABASE_URL
- **Description**: Your Supabase project URL
- **How to get**: Found in Supabase Dashboard → Project Settings → API
- **Format**: `https://your-project.supabase.co`

### 3. SUPABASE_SERVICE_ROLE_KEY
- **Description**: Service role key for backend database access
- **How to get**: Found in Supabase Dashboard → Project Settings → API → Service Role (secret)
- **Warning**: Keep this secret! Never expose in frontend code

## How to Set Edge Function Secrets

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to **Edge Functions** section
3. Click on **Settings** or **Secrets**
4. Add each secret:
   ```
   Name: OPENROUTER_API_KEY
   Value: sk-or-v1-xxxxxxxxxxxxx
   ```
   ```
   Name: SUPABASE_URL
   Value: https://your-project.supabase.co
   ```
   ```
   Name: SUPABASE_SERVICE_ROLE_KEY
   Value: your-service-role-key
   ```

### Option 2: Using Supabase CLI

```bash
# Login to Supabase
npx supabase login

# Link your project
npx supabase link --project-ref your-project-ref

# Set secrets
npx supabase secrets set OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx
npx supabase secrets set SUPABASE_URL=https://your-project.supabase.co
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Deploying the Edge Function

After setting secrets, deploy the function:

```bash
# Deploy the chat function
npx supabase functions deploy chat
```

## Testing

Once secrets are set and function is deployed, test in your Publish page:

1. Go to Dashboard → Publish
2. Enter a test message
3. You should see a proper AI response instead of 500 error

## Troubleshooting

### Still getting 500 error?

1. **Check Edge Function Logs**:
   - Dashboard → Edge Functions → chat → Logs
   - Look for specific error messages

2. **Verify Secrets are Set**:
   ```bash
   npx supabase secrets list
   ```

3. **Check Database Tables**:
   - Ensure migrations have run: `agents`, `conversations`, `messages`, `knowledge_sources`, etc.

4. **Verify OpenRouter API Key**:
   - Test at https://openrouter.ai/playground
   - Make sure you have credits/free tier available

### Common Errors

- **"OPENROUTER_API_KEY is undefined"**: Secret not set in Supabase
- **"Agent not found"**: Database not initialized or agent doesn't exist
- **"Failed to create conversation"**: Database permissions issue or missing tables

## Local Development

For local testing with Supabase CLI:

1. Create `.env.local` in `supabase/functions/chat/`:
   ```
   OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx
   SUPABASE_URL=http://localhost:54321
   SUPABASE_SERVICE_ROLE_KEY=your-local-service-role-key
   ```

2. Run locally:
   ```bash
   npx supabase functions serve chat --env-file supabase/functions/chat/.env.local
   ```

## Next Steps

1. ✅ Get OpenRouter API key from https://openrouter.ai/keys
2. ✅ Find Supabase credentials in Dashboard → Settings → API
3. ✅ Set all three secrets in Supabase
4. ✅ Redeploy Edge Function
5. ✅ Test chatbot in Publish page
