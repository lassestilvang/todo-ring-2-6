'use client';

import * as React from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function AdvancedReporting() {
  const [selectedPeriod, setSelectedPeriod] = React.useState('7d');
  const [reportType, setReportType] = React.useState('productivity');

  const handleExport = (format: 'pdf' | 'csv' | 'json') => {
    window.open(`/api/export/report?period=${selectedPeriod}&format=${format}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Advanced Reporting</h2>
          <p className="text-muted-foreground">
            Detailed insights into your productivity and team performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
            <Download className="w-4 h-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">127</CardTitle>
            <CardDescription>Tasks Completed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-green-600">+12% from last period</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">85%</CardTitle>
            <CardDescription>Completion Rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-green-600">+5% from last period</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">2.3d</CardTitle>
            <CardDescription>Avg. Completion Time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-red-600">+0.2d from last period</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">12</CardTitle>
            <CardDescription>Team Members</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-green-600">2 new this month</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Time Period</label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="year">This year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Report Type</label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="productivity">Productivity</SelectItem>
                <SelectItem value="team">Team Performance</SelectItem>
                <SelectItem value="projects">Project Progress</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button className="w-full" onClick={() => handleExport('pdf')}>
            <Download className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}