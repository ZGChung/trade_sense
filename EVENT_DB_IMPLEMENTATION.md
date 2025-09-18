# Event Database Implementation

## Overview
This implementation replaces the static mock data in TradeSense with a dynamic database system that can fetch real financial news events from Alpha Vantage API while maintaining backward compatibility.

## Architecture

### 1. Core Data Database
- **DatabaseService**: Core Data manager for storing companies and events
- **CompanyEntity**: Core Data entity for company information (symbol, name)
- **EventEntity**: Core Data entity for historical events (description, date, performance, etc.)

### 2. API Integration
- **AlphaVantageService**: Fetches real financial news and company data from Alpha Vantage API
- Free tier: 25 requests per day
- Provides news sentiment analysis and company overviews

### 3. Data Migration
- **DataMigrationService**: Handles initial migration from mock data to database
- Provides daily fetching mechanism to stay within API limits
- Maintains same interface as original MockData class

## Setup Instructions

### 1. Get Alpha Vantage API Key
1. Visit https://www.alphavantage.co/support/#api-key
2. Sign up for a free API key
3. Replace `YOUR_API_KEY_HERE` in `AlphaVantageService.swift` with your actual key

### 2. Database Initialization
The app will automatically:
1. Create Core Data database on first launch
2. Migrate all existing mock data to the database
3. Use database for all future operations

### 3. Daily Data Fetching
The system implements round-robin fetching:
- Fetches data for 2 companies per day
- Cycles through all companies over time
- Stays within Alpha Vantage's free tier limits (25 requests/day)

## File Structure

```
TradeSense/
├── Services/
│   ├── DatabaseService.swift      # Core Data management
│   ├── AlphaVantageService.swift  # API integration
│   └── DataMigrationService.swift # Data migration & daily fetching
├── Models/
│   ├── CompanyEntity.swift        # Core Data company entity
│   ├── EventEntity.swift          # Core Data event entity
│   ├── TradeSenseData.xcdatamodeld/ # Core Data model
│   └── TradingSession.swift       # Updated to use database
└── TradeSenseApp.swift            # Database initialization
```

## Backward Compatibility

The implementation maintains full backward compatibility:
- Same `EventGroup` and `HistoricalEvent` structures
- Same method signatures in `TradingSession`
- Fallback to mock data if database is unavailable
- All existing views continue to work unchanged

## Benefits

1. **Real Data**: Gradually replaces mock data with real financial events
2. **Scalable**: Can handle unlimited historical data
3. **Offline Capable**: Database works without internet connection
4. **Cost Effective**: Stays within free API tier limits
5. **Maintainable**: Clean separation between data storage and business logic

## Future Enhancements

1. **Background Fetching**: Implement iOS Background Tasks for daily updates
2. **Data Enrichment**: Add more data sources beyond Alpha Vantage
3. **Performance Tracking**: Compare actual stock performance with predictions
4. **User Preferences**: Allow users to select which companies to follow
5. **Data Export**: Export event history for analysis

## API Rate Limits

- **Alpha Vantage Free Tier**: 25 requests per day
- **Current Implementation**: 2 companies per day (2 requests)
- **Buffer**: 23 requests remaining for other operations or future features

## Database Schema

### CompanyEntity
- symbol: String (primary key)
- name: String

### EventEntity
- id: String (UUID)
- symbol: String (foreign key)
- description: String
- date: String (YYYY-MM-DD)
- performance: Double (e.g., 0.05 for +5%)
- daysAfterEvent: Int32

This implementation provides a solid foundation for transitioning from mock data to real financial data while maintaining the app's core functionality and user experience.