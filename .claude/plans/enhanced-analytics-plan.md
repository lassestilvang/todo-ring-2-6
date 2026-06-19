# Enhanced Analytics Dashboard Implementation Plan

## Context

TaskPlanner has a basic analytics system with:
- `/api/analytics` - general stats endpoint
- `/api/analytics/dashboard` - dashboard metrics
- `/api/analytics/productivity` - productivity metrics
- `AnalyticsDashboard` component - basic visualization

The current implementation lacks:
- Comprehensive visualizations (charts, graphs)
- Time-based filtering (week/month/quarter/year)
- Export functionality
- Detailed insights
- Mobile-responsive design

## Goal

Enhance the analytics dashboard to provide users with actionable insights into their productivity, task completion patterns, and time management.

## Implementation Steps

### Phase 1: Backend API Enhancements

#### 1.1 Create New Analytics Endpoints

**File: `src/app/api/analytics/comprehensive/route.ts`**
- Extend existing analytics with additional metrics:
  - Task creation rate over time
  - Completion velocity (tasks/day)
  - Time estimate vs actual analysis
  - List/category performance
  - Recurring task completion rates
  - Habit streak data

**File: `src/app/api/analytics/insights/route.ts`**
- Generate actionable insights:
  - "You complete 3x more tasks on weekdays"
  - "Your average task takes 2.5 days to complete"
  - "You're 40% more productive in the morning"

#### 1.2 Database Query Optimizations

**File: `db/operations.ts`** (add new functions)
- `getTasksByDateRange(startDate, endDate)` - efficient date range queries
- `getTimeTrackingStats()` - estimate vs actual analysis
- `getListPerformanceStats()` - tasks completed per list
- `getHourlyProductivityPattern()` - when user is most active

### Phase 2: New Visualization Components

#### 2.1 Chart Components

**File: `src/components/analytics/charts/completion-chart.tsx`**
- Line chart for daily completion trend
- Area chart for cumulative progress
- Interactive tooltips

**File: `src/components/analytics/charts/priority-distribution.tsx`**
- Donut chart for priority breakdown
- Animated segments with hover details

**File: `src/components/analytics/charts/time-tracking-chart.tsx`**
- Bar chart comparing estimated vs actual time
- Over/under estimation analysis

**File: `src/components/analytics/charts/productivity-heatmap.tsx`**
- Calendar heatmap (like GitHub contributions)
- Shows daily activity patterns

#### 2.2 Metric Cards

**File: `src/components/analytics/metric-cards/average-completion-time.tsx`**
- Display average time to complete tasks
- Show trend vs previous period

**File: `src/components/analytics/metric-cards/productivity-score.tsx`**
- Overall productivity score (0-100)
- Based on completion rate, streaks, and consistency

### Phase 3: Dashboard UI Redesign

#### 3.1 Main Dashboard Component

**File: `src/components/enhanced-analytics-dashboard.tsx`**
- Tabbed interface: Overview, Trends, Insights, Reports
- Time range selector: Day, Week, Month, Quarter, Year
- Responsive grid layout
- Loading skeletons for each section

#### 3.2 Time Range Hook

**File: `src/hooks/use-analytics-range.ts`**
- Manage selected time range state
- Provide formatted date ranges
- Calculate comparative periods

### Phase 4: Export Functionality

#### 4.1 Export API

**File: `src/app/api/export/analytics/route.ts`**
- Support formats: PDF, CSV, Markdown
- Include all dashboard metrics
- Generate summary report

#### 4.2 Export Component

**File: `src/components/analytics/export-panel.tsx`**
- Format selection dropdown
- Date range picker
- Export button with loading state

### Phase 5: Mobile Responsiveness

#### 5.1 Mobile-Optimized Views

- Stack charts vertically on small screens
- Condensed metric cards
- Swipeable tabs
- Touch-friendly controls

## File Changes Summary

### New Files
```
src/app/api/analytics/comprehensive/route.ts
src/app/api/analytics/insights/route.ts
src/app/api/export/analytics/route.ts
src/components/analytics/charts/completion-chart.tsx
src/components/analytics/charts/priority-distribution.tsx
src/components/analytics/charts/time-tracking-chart.tsx
src/components/analytics/charts/productivity-heatmap.tsx
src/components/analytics/metric-cards/average-completion-time.tsx
src/components/analytics/metric-cards/productivity-score.tsx
src/components/enhanced-analytics-dashboard.tsx
src/components/analytics/export-panel.tsx
src/hooks/use-analytics-range.ts
```

### Modified Files
```
src/components/analytics-dashboard.tsx (enhance existing)
db/operations.ts (add new query functions)
src/lib/validations.ts (add export validation schemas)
```

## Technical Patterns to Follow

1. **API Response Format**: Use `jsonSuccess`/`jsonError` from `@/lib/api-response`
2. **Database Access**: Use `getDb()` from `@/db/db-client` with proper error handling
3. **Component Patterns**: 
   - Use `motion` from framer-motion for animations
   - Use `cn()` from `@/lib/utils` for class names
   - Follow existing card/stat styling patterns
4. **State Management**: Use React Query for server state, React hooks for UI state
5. **TypeScript**: Use existing type definitions from `@/types/index`

## Verification Plan

1. **Unit Tests**: Add tests for new API endpoints
2. **Integration Tests**: Test analytics data flow
3. **Manual Testing**:
   - Verify charts render correctly with data
   - Test responsive design on mobile
   - Verify export functionality
4. **Performance**: Ensure queries are efficient with proper indexing

## Estimated Effort

- **Backend**: 4-6 hours
- **Frontend Components**: 6-8 hours
- **Testing**: 2-3 hours
- **Total**: 12-17 hours