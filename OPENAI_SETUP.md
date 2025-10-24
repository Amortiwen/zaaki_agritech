# OpenAI Integration Setup

## Prerequisites

1. **OpenAI API Key**: You need an OpenAI API key to use the chatbot functionality.

## Setup Instructions

### 1. Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the API key (it starts with `sk-`)

### 2. Configure Environment Variables

Add the following to your `.env` file:

```env
OPENAI_API_KEY=sk-your-actual-api-key-here
```

### 3. Optional Configuration

You can also customize the OpenAI settings in your `.env` file:

```env
OPENAI_MODEL=gpt-4o-mini
OPENAI_MAX_TOKENS=1000
OPENAI_TEMPERATURE=0.7
OPENAI_TIMEOUT=30
```

### 4. Test the Integration

1. Start your Laravel server: `php artisan serve`
2. Navigate to your prediction page
3. Click the chatbot button in the bottom-right corner
4. Try asking a question about your crop prediction

## Features

- **Real AI Responses**: Uses OpenAI's GPT models for intelligent responses
- **Context Awareness**: The AI has access to your crop prediction data
- **Web Search**: Toggle web search for current information
- **Chain of Thought**: AI explains its reasoning process
- **Smart Suggestions**: Context-aware follow-up questions

## Troubleshooting

### "OpenAI API key not configured" Error

- Make sure you've added `OPENAI_API_KEY` to your `.env` file
- Restart your Laravel server after adding the environment variable
- Check that the API key is valid and has sufficient credits

### API Rate Limits

- OpenAI has rate limits based on your account tier
- If you hit rate limits, the chatbot will show an error message
- Consider upgrading your OpenAI plan for higher limits

### Cost Management

- The chatbot uses `gpt-4o-mini` by default (cost-effective model)
- Each conversation uses tokens, which have a cost
- Monitor your OpenAI usage in the platform dashboard

## Support

If you encounter issues:

1. Check the Laravel logs: `storage/logs/laravel.log`
2. Verify your API key is correct
3. Ensure you have sufficient OpenAI credits
4. Check your internet connection

## Security Note

- Never commit your `.env` file to version control
- Keep your OpenAI API key secure
- Consider using environment-specific configurations for production
