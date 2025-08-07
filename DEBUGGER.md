# 🐛 Debugger System

A comprehensive debugging utility for easier development of the CertiFree application.

## Features

- **Error Tracking**: Automatic capture of errors and unhandled promise rejections
- **Performance Monitoring**: Track API calls and component render times
- **Data Logging**: Structured logging with timestamps and component context
- **Debug Panel**: Visual interface for viewing logs, performance metrics, and statistics
- **Storage Persistence**: Logs are saved to localStorage for persistence across sessions
- **Development Only**: Automatically disabled in production builds

## Quick Start

### 1. Debug Toggle Button

In development mode, you'll see a bug icon (🐛) in the bottom-right corner of the screen. Click it to open the debug panel.

### 2. Using the Debugger in Components

```typescript
import { useDebug } from '@/hooks/useDebug';

const MyComponent = () => {
  const debug = useDebug('MyComponent');
  
  // Log component renders
  debug.log('Component mounted');
  
  // Log state changes
  const [state, setState] = useState({});
  debug.logState(state, 'initial');
  
  // Log errors
  try {
    // some code
  } catch (error) {
    debug.logError(error, 'data processing');
  }
  
  // Performance tracking
  debug.startTimer('dataFetch');
  // ... fetch data
  debug.endTimer('dataFetch');
  
  return <div>...</div>;
};
```

### 3. Using the Debugger in Hooks

```typescript
import { componentDebug, startTimer, endTimer } from '@/lib/debugger';

export const useMyHook = () => {
  const debug = componentDebug('useMyHook');
  
  useEffect(() => {
    startTimer('useMyHook:fetchData');
    debug.log('Starting data fetch');
    
    // ... fetch logic
    
    debug.log('Data fetched successfully', { count: data.length });
    endTimer('useMyHook:fetchData');
  }, []);
};
```

## Debug Panel Features

### 1. Logs Tab
- View recent log entries with timestamps
- Filter by log level (error, warn, info, debug)
- Export logs to JSON file
- Clear all logs

### 2. Performance Tab
- View active performance timers
- See execution times for tracked operations
- Monitor API call durations

### 3. Stats Tab
- Error count
- Warning count
- Total log entries
- Active timers

### 4. Actions Tab
- Log browser information
- Log environment variables
- Clear localStorage/sessionStorage
- Reload page

## API Reference

### Core Debugger Functions

```typescript
import {
  devDebugger,     // Main debugger instance
  error,           // Log error level
  warn,            // Log warning level
  info,            // Log info level
  debug as debugLog, // Log debug level
  startTimer,      // Start performance timer
  endTimer,        // End performance timer
  componentDebug,  // Get component-specific debugger
  inspect,         // Inspect data structure
  logState,        // Log state changes
  logApiCall,      // Log API calls
  logError,        // Log errors
  getStats,        // Get debug statistics
  clearLogs,       // Clear all logs
  exportLogs,      // Export logs to JSON
  loadLogsFromStorage // Load logs from localStorage
} from '@/lib/debugger';
```

### Component Debugger

```typescript
const debug = componentDebug('ComponentName');

debug.log(message, data?, action?);
debug.error(message, data?, action?);
debug.warn(message, data?, action?);
debug.info(message, data?, action?);
debug.startTimer(name);
debug.endTimer(name);
```

### useDebug Hook

```typescript
const debug = useDebug('ComponentName');

debug.debug.log(message, data);
debug.inspect(data, label);
debug.logState(state, action);
debug.logProps(props);
debug.logError(error, context);
debug.logInfo(message, data);
debug.startTimer(name);
debug.endTimer(name);
```

## Error Boundary

The debugger includes a React Error Boundary that automatically logs errors:

```typescript
import ErrorBoundaryWrapper from '@/components/ErrorBoundary';

<ErrorBoundaryWrapper componentName="MyComponent">
  <MyComponent />
</ErrorBoundaryWrapper>
```

## Configuration

The debugger is configured in `src/lib/debugger.ts`:

```typescript
export const devDebugger = new Debugger({
  enabled: import.meta.env.DEV, // Only in development
  logLevel: 'debug',            // Minimum log level
  showTimestamps: true,         // Include timestamps
  trackPerformance: true,       // Track performance metrics
  logToConsole: true,          // Log to console
  logToStorage: true,          // Save to localStorage
});
```

## Best Practices

### 1. Component Debugging
```typescript
const MyComponent = ({ data, onAction }) => {
  const debug = useDebug('MyComponent');
  
  // Log props changes
  useEffect(() => {
    debug.logProps({ data, onAction });
  }, [data, onAction]);
  
  // Log state changes
  const [state, setState] = useState({});
  const handleStateChange = (newState) => {
    debug.logState(newState, 'user action');
    setState(newState);
  };
  
  return <div>...</div>;
};
```

### 2. Hook Debugging
```typescript
export const useDataFetch = (url) => {
  const debug = componentDebug('useDataFetch');
  
  useEffect(() => {
    debug.startTimer('fetch');
    debug.log('Starting fetch', { url });
    
    fetch(url)
      .then(response => {
        debug.log('Fetch successful', { status: response.status });
        return response.json();
      })
      .catch(error => {
        debug.error('Fetch failed', { error: error.message });
      })
      .finally(() => {
        debug.endTimer('fetch');
      });
  }, [url]);
};
```

### 3. Error Handling
```typescript
const handleUserAction = async () => {
  const debug = componentDebug('UserAction');
  
  try {
    debug.startTimer('userAction');
    debug.log('User action started');
    
    const result = await performAction();
    
    debug.log('User action completed', { result });
    debug.endTimer('userAction');
    
    return result;
  } catch (error) {
    debug.error('User action failed', { error: error.message });
    throw error;
  }
};
```

## Troubleshooting

### 1. Debug Panel Not Showing
- Ensure you're in development mode (`import.meta.env.DEV` is true)
- Check browser console for any errors
- Verify the DebugToggle component is imported and rendered

### 2. Logs Not Appearing
- Check log level configuration
- Verify debugger is enabled
- Check localStorage for saved logs

### 3. Performance Issues
- Disable performance tracking if not needed
- Clear logs periodically
- Monitor log storage size

## Integration with Existing Code

The debugger has been integrated into:

- `useAuth` hook - Authentication and profile fetching
- `useCertifications` hook - Certification data fetching
- Error boundaries for component error catching
- Global error handlers for unhandled errors

## Console Access

In development, the debugger is available globally:

```javascript
// In browser console
window.devDebugger.log('Custom message', { data: 'value' });
window.devDebugger.getStats();
window.devDebugger.exportLogs();
```

This comprehensive debugger system will help you track down issues, monitor performance, and understand the application's behavior during development. 