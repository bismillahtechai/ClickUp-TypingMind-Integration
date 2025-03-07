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

### Azure CLI Deployment (Automated Method)

For a streamlined deployment process, you can use the following Azure CLI script:

1. Save this script to a file (e.g., `deploy-clickup-integration.sh`):

```bash
#!/bin/bash

# Set all variables with your values
SUBSCRIPTION="your-subscription-id"
RESOURCE_GROUP="ClickUP_API"
LOCATION="centralus"
APP_NAME="clickup-api"
ENVIRONMENT_NAME="managedEnvironment-ClickUPAPI"
GITHUB_USERNAME="bismillahtechai"
GITHUB_TOKEN="your-github-token"
IMAGE="ghcr.io/bismillahtechai/clickup-typingmind-integration:1.0.0"

# Generate secure keys or use your own
API_KEYS="your-generated-api-key"
TOKEN_ENCRYPTION_KEY="your-encryption-key"
CLICKUP_API_TOKEN="your-clickup-api-token"

# Set subscription
az account set --subscription $SUBSCRIPTION

# Create resource group if it doesn't exist
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create Container App Environment
az containerapp env create \
  --name $ENVIRONMENT_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION

# Create Container App
az containerapp create \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --environment $ENVIRONMENT_NAME \
  --image $IMAGE \
  --registry-server "ghcr.io" \
  --registry-username $GITHUB_USERNAME \
  --registry-password $GITHUB_TOKEN \
  --env-vars "PORT=3000" "NODE_ENV=production" "API_KEYS=$API_KEYS" "CLICKUP_API_TOKEN=$CLICKUP_API_TOKEN" "TOKEN_ENCRYPTION_KEY=$TOKEN_ENCRYPTION_KEY" "MAX_TASKS_LIMIT=100" \
  --target-port 3000 \
  --ingress external \
  --min-replicas 1 \
  --max-replicas 3

# Get the deployed URL
APP_URL=$(az containerapp show --name $APP_NAME --resource-group $RESOURCE_GROUP --query properties.configuration.ingress.fqdn -o tsv)

echo "=========================================================================="
echo "DEPLOYMENT COMPLETE!"
echo "=========================================================================="
echo "Your Container App is deployed at: https://$APP_URL"
echo ""
echo "IMPORTANT: Save these details for TypingMind configuration:"
echo "------------------------------------------------------------------------"
echo "URL for TypingMind: https://$APP_URL/context/clickup"
echo "API Key: $API_KEYS"
echo "Example full URL: https://$APP_URL/context/clickup?workspaceId={WORKSPACE_ID}&dataType=tasks&limit=10&api_key=$API_KEYS"
echo "=========================================================================="
```

2. Before running the script:
   - Replace placeholders with your actual values
   - For API keys, you can generate secure random keys using: `openssl rand -hex 16`
   - Ensure you have the Azure CLI installed and are logged in

3. Make the script executable and run it:
   ```bash
   chmod +x deploy-clickup-integration.sh
   ./deploy-clickup-integration.sh
   ```

4. After deployment:
   - The script will output the URL for your deployed application
   - It will also provide the full URL format for TypingMind configuration
   - Save your API key for use with TypingMind

This automated method handles resource creation, configuration, and deployment in a single script, making it easier to redeploy if needed.

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

### Step 2: Generate API Keys

To secure your integration, you need to generate API keys that will authorize requests between TypingMind and your integration:

1. **Using OpenSSL (Recommended)**:
   ```bash
   # Generate a 32-character random hexadecimal string
   openssl rand -hex 16
   # Example output: 8f742a07e368b5624ae9591fa95e6617
   ```

2. **Using Online UUID Generator**:
   - Visit https://www.uuidgenerator.net/
   - Use the generated UUID (remove hyphens if desired)

3. **Creating Your Own Format**:
   - Follow a pattern like: `api_[yourname]_[randomstring]_[timestamp]`
   - Example: `api_bismillah_a7f3bc92_20240306`

4. **Add to Environment Variables**:
   - Add your generated key(s) to the `API_KEYS` environment variable in your deployment
   - If using multiple keys, separate them with commas
   - Example: `API_KEYS=8f742a07e368b5624ae9591fa95e6617,f47ac10b58cc4372a5670e02b2c3d479`

5. **Use in TypingMind Configuration**:
   - When configuring Dynamic Context in TypingMind, include your API key in the URL
   - Example: `https://your-deployed-url.com/context/clickup?workspaceId={WORKSPACE_ID}&dataType=tasks&limit=10&api_key=8f742a07e368b5624ae9591fa95e6617`

### Step 3: Register ClickUp Token

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

### Enhanced Logging

This application includes a comprehensive logging system designed to help diagnose issues with the ClickUp-TypingMind integration:

1. **Log Levels**: The application supports different log levels:
   - `ERROR`: Only critical errors
   - `WARN`: Warnings and errors
   - `INFO`: General information plus warnings and errors
   - `DEBUG`: Detailed information for debugging
   - `TRACE`: Very verbose logging

2. **Request Tracking**: Each request receives a unique ID that is logged across all operations related to that request.

3. **ClickUp API Logging**: All interactions with the ClickUp API are carefully logged, including:
   - Request details (with sensitive information masked)
   - Response status and timing
   - Error details when failures occur

4. **Contextual Information**: All logs include contextual information such as:
   - Timestamp
   - Log level
   - Module/component
   - Request ID (when available)
   - Additional metadata relevant to the operation

5. **Configuring Log Level**: Set the desired log level in the environment variables:
   ```
   LOG_LEVEL=info  # Options: error, warn, info, debug, trace
   ```

Example log output:
```
[2023-05-16T12:34:56.789Z][INFO][server] Server is running on port 3000
[2023-05-16T12:35:01.123Z][INFO][http][req:a1b2c3] HTTP GET /context/clickup
[2023-05-16T12:35:01.456Z][DEBUG][clickup-service][req:a1b2c3] API Request: GET https://api.clickup.com/api/v2/team/12345/task
[2023-05-16T12:35:01.789Z][INFO][http][req:a1b2c3] HTTP Response: 200 (332ms)
```

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