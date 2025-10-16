# TMDB API Key Setup Guide

## Why do you need a TMDB API key?

Chilly Movies uses The Movie Database (TMDB) API to:
- Search for movies and TV shows
- Fetch metadata (titles, descriptions, release dates)
- Download posters and backdrop images
- Get ratings and cast information

Without a TMDB API key, the discovery and search features won't work.

## How to get your TMDB API key

### Step 1: Create a TMDB Account

1. Go to https://www.themoviedb.org/signup
2. Fill in your details and create a free account
3. Verify your email address

### Step 2: Request an API Key

1. Log in to your TMDB account
2. Go to your account settings: https://www.themoviedb.org/settings/api
3. Click on "Request an API Key"
4. Choose **"Developer"** option (not commercial)
5. Fill out the form:
   - **Application Name**: Chilly Movies (or your preferred name)
   - **Application URL**: http://localhost (for local development)
   - **Application Summary**: Personal movie downloader and library manager
6. Accept the terms and conditions
7. Submit the form

### Step 3: Copy Your API Key

1. Once approved (usually instant), you'll see your API Key (v3 auth)
2. Copy the **API Key** (it's a long string of letters and numbers)
3. **Keep it secret** - don't share it publicly or commit it to git

### Step 4: Add to Your Project

1. In the ChillyMovies project root, copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Open the `.env` file in your editor

3. Replace `your_tmdb_api_key_here` with your actual API key:
   ```
   TMDB_API_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
   ```

4. Save the file

### Step 5: Verify It Works

1. Start the development server:
   ```bash
   npm run dev
   ```

2. In the Chilly Movies app, go to the Discovery view

3. Try searching for a movie (e.g., "Inception")

4. If you see results with posters and movie information, it's working! 🎉

## Troubleshooting

### "TMDB API key not configured" error

- Make sure you created the `.env` file (not `.env.example`)
- Check that the key is on the line `TMDB_API_KEY=your_actual_key`
- Make sure there are no spaces around the `=` sign
- Restart the development server after adding the key

### "Invalid API key" error

- Double-check you copied the entire API key
- Make sure you're using the **API Key (v3 auth)**, not the API Read Access Token (v4)
- Verify the key is active in your TMDB account settings

### No search results

- Check your internet connection
- Make sure the API key is correctly set
- Check the browser console (DevTools) for error messages

## API Rate Limits

TMDB free tier includes:
- **40 requests per 10 seconds**
- **No daily limit**

Chilly Movies automatically:
- Caches search results locally
- Implements retry logic with exponential backoff
- Respects rate limits with built-in throttling

## Privacy & Security

- Your TMDB API key is stored only in the `.env` file on your local machine
- The `.gitignore` file ensures your `.env` is never committed to version control
- API keys are never sent to any server except TMDB's official API

## Need Help?

If you have any issues:
1. Check the console output when starting the app
2. Look for error messages in the browser DevTools console
3. Make sure all environment variables are correctly set in `.env`
4. Try regenerating your API key in TMDB settings

---

**Got your API key ready?** Just provide it when needed and I'll help you add it to the `.env` file!
