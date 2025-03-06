# ClickUp Integration for TypingMind Dynamic Context

This project creates a RESTful API that integrates ClickUp with TypingMind's Dynamic Context feature, allowing AI assistants to access and reference ClickUp data during conversations.

## Features

- **Dynamic Context API**: Serves formatted ClickUp data for AI context
- **Comprehensive ClickUp Integration**: Access workspaces, spaces, folders, lists, tasks, and more
- **Token Management**: Secure handling of ClickUp API tokens
- **Docker Support**: Easy deployment with Docker

## Architecture

The integration consists of:

1. **Backend API Server**: Node.js/Express application that:
   - Authenticates requests
   - Retrieves data from ClickUp
   - Formats responses for AI context
   - Exposes endpoints for TypingMind

2. **ClickUp API Client**: Handles interaction with ClickUp's API

3. **Token Management**: Securely stores and retrieves ClickUp API tokens

## Setup & Installation

### Prerequisites

- Node.js 14+
- Docker (optional, for containerized deployment)
- ClickUp API token (starts with `pk_`)

### Local Development

1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd clickup-typingmind-integration
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file:
   ```
   PORT=3000
   NODE_ENV=development
   API_KEYS=your-typingmind-api-key-1,your-typingmind-api-key-2
   ```

4. Start the server:
   ```bash
   npm run dev
   ```

### Docker Setup

1. Build and run using Docker Compose:
   ```bash
   docker-compose up -d
   ```

## Deployment on Render

1. Create a new Web Service on Render
2. Connect your repository
3. Select "Docker" as the environment
4. Configure environment variables:
   - `PORT`: 3000
   - `NODE_ENV`: production
   - `API_KEYS`: Comma-separated list of API keys

## Integrating with TypingMind

### Step 1: Configure Dynamic Context in TypingMind

1. Navigate to your TypingMind workspace settings
2. Go to the "Dynamic Context" section
3. Click "Add New Context Source"
4. Select "Read from HTTP endpoint"
5. Configure:
   - Context Name: "ClickUp Tasks"
   - HTTP Method: GET
   - Endpoint URL: `https://your-deployed-url.com/context/clickup?workspaceId={WORKSPACE_ID}&dataType=tasks&limit=10&api_key={API_KEY}`
   - Enable Cache: Optional (recommended for better performance)

### Step 2: Register ClickUp Token

Before using the integration, you need to register your ClickUp API token:

```bash
curl -X POST https://your-deployed-url.com/api/register-token \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"userId": "your-user-id", "token": "your-clickup-token"}'
```

Replace:
- `your-deployed-url.com` with your actual deployment URL
- `your-api-key` with a valid API key from your configuration
- `your-user-id` with your user identifier
- `your-clickup-token` with your ClickUp API token (starts with `pk_`)

## API Endpoints

### Dynamic Context Endpoint

```
GET /context/clickup
```

Query Parameters:
- `workspaceId`: Required. Your ClickUp workspace ID
- `dataType`: Optional. Type of data to retrieve (tasks, spaces, lists, folders)
- `limit`: Optional. Number of items to retrieve (default: 10)
- `api_key`: Your API key for authentication

### Authentication

```
POST /api/register-token
```

Request Body:
```json
{
  "userId": "your-user-id",
  "token": "your-clickup-token"
}
```

Headers:
- `X-API-Key`: Your API key

## Security Considerations

- Use HTTPS for all communications
- Store API keys and tokens securely
- In production, implement proper authentication mechanisms
- Consider implementing rate limiting

## License

MIT 