# Market_One - AI-Powered Product Aggregator

A modern Next.js application that provides intelligent product search using both text and image inputs, powered by your ML backend API.

## Features

- 🔍 **Text Search**: Natural language product search with AI-powered query refinement
- 🖼️ **Image Search**: Upload or drag-and-drop images to find similar products
- 🎯 **Smart Results**: View products in tiles or list format with detailed information
- 🧠 **AI Insights**: Expandable section showing LLM query analysis, keywords, and categories
- 📱 **Responsive Design**: Mobile-friendly interface with purple Market_One branding
- ⚡ **Real-time Loading**: Loading indicators and smooth transitions
- 🤖 **AI Chatbot**: Product-specific chat assistance
- 🔄 **Product Comparison**: Side-by-side comparison with AI insights
- 🏪 **Grouped Results**: Products organized by marketplace/source
- 🎛️ **Advanced Filters**: Dynamic filtering and sorting options

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui
- **Backend Integration**: RESTful API calls to your FastAPI backend
- **Styling**: Purple-themed design system

## Getting Started

### Prerequisites

- Node.js 18+ and npm/pnpm/yarn
- Your ML backend API running (see backend setup below)

### Installation

1. Clone or download this project
2. Install dependencies:

\`\`\`bash
npm install
# or
pnpm install
# or
yarn install
\`\`\`

3. Configure your backend URL:

Create a \`.env.local\` file in the root directory:

\`\`\`env
NEXT_PUBLIC_API_URL=http://localhost:8000
\`\`\`

Replace \`http://localhost:8000\` with your actual backend URL.

4. Run the development server:

\`\`\`bash
npm run dev
# or
pnpm dev
# or
yarn dev
\`\`\`

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Backend Integration

### API Endpoints

The frontend expects your backend to provide these endpoints:

#### Text Search
\`\`\`
POST /search-text
Content-Type: application/json

{
  "query": "wireless headphones"
}
\`\`\`

#### Image Search
\`\`\`
POST /search-image
Content-Type: multipart/form-data

file: [uploaded image file]
\`\`\`

#### Product Comparison
\`\`\`
POST /compare-products
Content-Type: application/json

{
  "product1": { ... },
  "product2": { ... }
}
\`\`\`

### Expected Response Format

Search endpoints should return:

\`\`\`json
{
  "items": [
    {
      "name": "Product Name",
      "price": "1500",
      "source": "daraz",
      "url": "https://product-url.com",
      "image": "https://image-url.com/image.jpg",
      "similarity": 0.85
    }
  ],
  "meta": {
    "core_term": "headphones",
    "positive_keywords": ["wireless", "bluetooth"],
    "negative_keywords": ["wired"],
    "categories": ["Electronics", "Audio"]
  }
}
\`\`\`

### Image Handling

The backend should handle product images in one of these ways:

1. **Full URLs**: Return complete image URLs in the response
2. **Relative paths**: Save images to a `/images` directory and return relative paths
3. **Static serving**: Serve images from your FastAPI static files

Example backend image setup:

\`\`\`python
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

app = FastAPI()

# Serve images from /images directory
app.mount("/images", StaticFiles(directory="images"), name="images")
\`\`\`

### Backend Setup

Your FastAPI backend should be running with CORS enabled. Based on your \`main.py\`:

\`\`\`bash
# Start your backend API
python main.py --api
\`\`\`

This will start the API server on \`http://localhost:8000\`.

## Configuration

### Environment Variables

- \`NEXT_PUBLIC_API_URL\`: Your backend API base URL (default: http://localhost:8000)

### Image Directory Structure

Create the following directory structure in your backend:

\`\`\`
backend/
├── images/           # Scraped product images
├── temp_uploads/     # Temporary image uploads
└── main.py
\`\`\`

## Features Overview

### Grouped Search Results
- Products are automatically grouped by source/marketplace
- Collapsible sections with preview and expanded views
- Stacked card design for visual appeal
- Dynamic source filtering based on available results

### Advanced Filtering
- **Dynamic Sources**: Automatically extracted from search results
- **Category Filtering**: Predefined categories with toggle selection
- **Sorting Options**: Multiple sorting criteria including price, name, and relevance
- **Real-time Updates**: Filters apply immediately to results

### View Modes
- **Tiles View**: 4-column responsive grid layout
- **List View**: Detailed list with larger images and more information
- **Responsive**: Adapts to different screen sizes

### AI Features
- **Product Chatbot**: Ask questions about specific products
- **Smart Comparison**: AI-powered product comparison with insights
- **LLM Analysis**: Query refinement and keyword extraction

## Project Structure

\`\`\`
market-one/
├── app/                    # Next.js App Router pages
│   ├── globals.css        # Global styles with enhanced animations
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── search-interface.tsx
│   ├── text-search.tsx
│   ├── image-search.tsx
│   ├── grouped-search-results.tsx
│   ├── search-filters.tsx
│   ├── product-chatbot.tsx
│   ├── enhanced-product-comparison.tsx
│   ├── hero-section.tsx
│   ├── stats-section.tsx
│   └── features-section.tsx
├── lib/                   # Utilities
│   └── api.ts            # API integration
├── types/                 # TypeScript types
│   └── search.ts
└── README.md
\`\`\`

## Development

### Adding New Features

1. **Enhanced Filtering**: Add more filter criteria in SearchFilters component
2. **Product Details**: Implement detailed product view modals
3. **User Accounts**: Add user authentication and saved searches
4. **Price Tracking**: Implement price history and alerts

### Styling

The app uses a purple color scheme for Market_One branding. Key colors:
- Primary: Purple-600 (\`#9333ea\`)
- Hover: Purple-700 (\`#7c3aed\`)
- Light: Purple-50/100 for backgrounds

### Image Optimization

For production, consider:
- Image compression and optimization
- CDN integration for faster loading
- Lazy loading for better performance
- WebP format support

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform

## Troubleshooting

### Common Issues

1. **Image Loading**: Ensure your backend serves images correctly and CORS is configured
2. **API Connection**: Check that \`NEXT_PUBLIC_API_URL\` is correctly set
3. **Filter Issues**: Verify that product data includes necessary fields for filtering
4. **View Mode Toggle**: Ensure ViewToggle component receives proper props

### Debug Mode

Enable debug logging by adding to your \`.env.local\`:

\`\`\`env
NODE_ENV=development
\`\`\`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
\`\`\`
