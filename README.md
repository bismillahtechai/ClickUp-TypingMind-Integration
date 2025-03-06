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

### GitHub Container Registry Deployment

1. Build the Docker image:
   ```bash
   docker build -t clickup-typingmind-integration:1.0.0 -f docker/Dockerfile .
   ```

2. Tag the image for GitHub Container Registry:
   ```bash
   docker tag clickup-typingmind-integration:1.0.0 ghcr.io/bismillahtechai/clickup-typingmind-integration:1.0.0
   ```

3. Authenticate with GitHub Container Registry:
   ```bash
   # Login with your GitHub username and personal access token
   echo $GITHUB_TOKEN | docker login ghcr.io -u bismillahtechai --password-stdin
   ```

4. Push the image to GitHub Container Registry:
   ```bash
   docker push ghcr.io/bismillahtechai/clickup-typingmind-integration:1.0.0
   ```

5. Make your package public (optional):
   - Go to your GitHub profile → Packages
   - Select your package
   - Go to Package settings
   - Change visibility to "Public"

### Azure Deployment

1. Set up an Azure Web App:
   - Create a new Web App in the Azure Portal
   - Select "Docker Container" as the publish method
   - Choose "Single Container" as the container type

2. Configure the container settings:
   - Repository source: Docker Hub or other registries
   - Image: clickup-typingmind-integration
   - Login server URL: ghcr.io
   - Username: bismillahtechai
   - Password: your GitHub Personal Access Token
   - Dockerfile location: docker/Dockerfile

3. Configure environment variables:
   - In the "Configuration" section, add the following Application settings:
     - `PORT`: 3000
     - `NODE_ENV`: production
     - `API_KEYS`: Your comma-separated list of API keys
     - `CLICKUP_API_TOKEN`: Your ClickUp API token (starts with `pk_`)
     - `TYPINGMIND_API_ENDPOINT`: The TypingMind API endpoint URL
     - `TOKEN_ENCRYPTION_KEY`: A secure key for encrypting stored tokens
     - `MAX_TASKS_LIMIT`: Optional, maximum number of tasks to retrieve (default: 100)

4. Deploy the container:
   - Azure will pull the container image from GitHub Container Registry
   - The application will be available at your Azure Web App URL

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

## Troubleshooting & Maintenance

### Common Issues

1. **Authentication Failures**:
   - Verify API keys are correctly set in environment variables
   - Ensure the ClickUp token is valid and has the necessary permissions
   - Check for typos in the API keys or tokens

2. **Container Issues**:
   - Verify the container is running: `docker ps`
   - Check container logs: `docker logs [container-id]`
   - Ensure the container has network access to ClickUp API

3. **Azure Deployment Issues**:
   - Check Application Logs in the Azure Portal
   - Verify environment variables are correctly set
   - Ensure the container is being pulled from the correct registry
   - Check "Diagnose and solve problems" in Azure for common solutions

4. **TypingMind Integration Issues**:
   - Verify the endpoint URL in TypingMind settings
   - Check that your API endpoint is accessible from TypingMind's servers
   - Verify your firewall isn't blocking requests

### Updating the Application

To update to a new version:

1. Make your code changes
2. Build and tag a new Docker image with an updated version number:
   ```bash
   docker build -t clickup-typingmind-integration:1.0.1 -f docker/Dockerfile .
   docker tag clickup-typingmind-integration:1.0.1 ghcr.io/bismillahtechai/clickup-typingmind-integration:1.0.1
   ```
3. Push the new image:
   ```bash
   docker push ghcr.io/bismillahtechai/clickup-typingmind-integration:1.0.1
   ```
4. Update your Azure deployment to use the new tag

### Monitoring

- Set up Azure Application Insights for monitoring
- Use Azure Log Analytics for log management
- Configure alerts for critical errors or performance issues 