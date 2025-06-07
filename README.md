# Personal Finance Dashboard

A modern web application for tracking and analyzing personal finances with AI-powered insights.

## Features

- 📁 **File Upload**: Drag-and-drop interface for uploading bank and credit card statements
- 🎨 **Modern UI**: Built with [shadcn/ui](https://github.com/shadcn-ui/ui) components
- 🔍 **AI Analysis**: OpenAI integration for intelligent transaction categorization and insights
- 💾 **Local Storage**: SQLite database for secure local data storage
- 📊 **Interactive Charts**: Data visualization for spending patterns and trends
- 🚫 **Duplicate Prevention**: Automatic detection and prevention of duplicate files and transactions
- 🧹 **Data Management**: Tools to clean up existing duplicate data

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI Components**: shadcn/ui, Tailwind CSS
- **Database**: Prisma with SQLite
- **File Handling**: react-dropzone
- **AI**: OpenAI API, LangChain
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Set up your environment variables:
   ```bash
   # Add your OpenAI API key to .env.local
   OPENAI_API_KEY=your_openai_api_key_here
   ```

3. Set up the database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Testing the Application

1. **Upload a sample file**: Use the provided `sample-statement.csv` file to test the AI processing
2. **File processing**: The app will use GPT-4.5 to extract and categorize transactions
3. **View results**: Navigate to the transactions page to see processed data
4. **Try your own data**: Create your own CSV with columns: Date, Description, Amount, Type

## Project Structure

```
src/
├── app/                 # Next.js app router
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
├── components/         # React components
│   ├── ui/            # shadcn/ui components
│   └── upload-modal.tsx # File upload modal
└── lib/               # Utilities and configurations

prisma/
└── schema.prisma      # Database schema
```

## Current Status

✅ **Completed:**
- Project setup with Next.js and TypeScript
- shadcn/ui component library integration  
- File upload modal with drag-and-drop functionality
- SQLite database setup with Prisma
- OpenAI GPT-4.5 integration for transaction processing
- File processing API with intelligent categorization
- Transaction dashboard and data visualization
- **Comprehensive duplicate prevention system**
- **Manual duplicate cleanup tools**
- **File content hashing for accurate detection**
- Sample CSV file for testing

🚧 **Next Steps:**
- PDF and Excel file processing
- Advanced data visualization with charts
- AI-powered financial insights and recommendations
- Budget tracking and goal setting features
- Export functionality for processed data

## How LLMs Will Enhance the Experience

Instead of traditional rule-based parsing, this application will leverage LLMs to:

1. **Smart Document Processing**: 
   - Extract structured data from various statement formats (PDF, CSV, XLS)
   - Handle inconsistent formatting across different banks and credit card companies
   - Understand context and extract relevant transaction information

2. **Intelligent Categorization**:
   - Categorize transactions based on merchant names and descriptions
   - Learn from user preferences and adapt over time
   - Suggest custom categories based on spending patterns

3. **Natural Language Insights**:
   - Generate human-readable financial summaries
   - Identify spending trends and anomalies
   - Provide personalized recommendations for budgeting and saving

4. **Future Enhancements**:
   - Natural language querying of financial data
   - Automated bill detection and reminders
   - Investment advice based on spending patterns

## Development

To add new shadcn/ui components:
```bash
npx shadcn@latest add [component-name]
```

To update the database schema:
```bash
npx prisma db push
```

## License

MIT License - see LICENSE file for details.

## Duplicate Prevention

The application now includes comprehensive duplicate prevention:

### File-Level Deduplication
- **Content Hash**: Files are hashed using SHA256 to detect identical content
- **Metadata Check**: Files with same name and size are flagged as potential duplicates
- **Smart Response**: When uploading a duplicate file, you'll get a notification instead of reprocessing

### Transaction-Level Deduplication
- **Unique Detection**: Transactions are identified by date, description, amount, and type
- **Batch Processing**: When processing a file, only unique transactions are added to the database
- **Skip Counter**: Shows how many duplicate transactions were skipped during processing

### Manual Cleanup
- **Clear Duplicates Button**: Remove existing duplicates from your database
- **Safe Operation**: Keeps the first occurrence of each duplicate transaction
- **Confirmation Dialog**: Prevents accidental data loss

### Usage Examples

1. **Upload the same file twice**: The second upload will be detected as duplicate
2. **Process overlapping statements**: Only new transactions will be added
3. **Clean existing data**: Use the "Clear Duplicates" button in the transactions page
