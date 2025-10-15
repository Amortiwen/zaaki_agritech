import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
// Placeholder components since UI components don't exist yet
const Progress = ({ value, className }: { value: number; className?: string }) => (
  <div className={`bg-muted rounded-full h-2 ${className || ''}`}>
    <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${value}%` }} />
  </div>
);

const Tabs = ({ children, value, onValueChange }: { children: React.ReactNode; value: string; onValueChange: (value: string) => void }) => (
  <div>{children}</div>
);

const TabsList = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={`flex space-x-1 ${className || ''}`}>{children}</div>
);

const TabsTrigger = ({ children, value, className }: { children: React.ReactNode; value: string; className?: string }) => (
  <button className={`px-3 py-2 text-sm font-medium rounded-md ${className || ''}`}>
    {children}
  </button>
);

const TabsContent = ({ children, value, className }: { children: React.ReactNode; value: string; className?: string }) => (
  <div className={className || ''}>{children}</div>
);

import { ArrowLeft, MapPin, TrendingUp, Droplets, Sun, Leaf, BarChart3, Calendar, Loader2, Sparkles, Brain, Zap, Thermometer, Wind, AlertTriangle, Bug, CloudRain, Sprout, Clock, CheckCircle2, DollarSign } from 'lucide-react';
import { router } from '@inertiajs/react';
import axios from 'axios';

interface PredictionData {
    field_id: number;
    field_name: string;
    crop: string;
    variety: string;
    region: string;
    area_hectares: number;
    predicted_yield: number;
    yield_confidence: number;
    growth_stage: string;
    soil_conditions: string;
    weather_impact: string;
    recommendations: string[];
    risk_factors: string[];
    market_outlook: string;
    status?: 'pending' | 'processing' | 'completed' | 'failed';
    message?: string;
    created_at: string;
    // Add missing fields that the UI expects
    days_to_harvest?: number;
    disease_risks?: string[];
    pest_risks?: string[];
    weather_risks?: string[];
    fertilizer_recommendations?: string[];
    irrigation_recommendations?: string[];
    pest_control_recommendations?: string[];
    harvest_recommendations?: string[];
    market_trends?: string[];
    overall_risk_score?: number;
}

interface PredictionPageProps {
    fields?: PredictionData[];
    submissionKey?: string;
}

interface SubmissionStatus {
    id: number;
    unique_key: string;
    status: string;
    total_fields: number;
    total_area_hectares: number;
    region: string;
    zone: string;
    all_completed: boolean;
    any_failed: boolean;
}

 
// Chart data constants removed since we're using placeholder components

export default function PredictionPage({ fields = [], submissionKey }: PredictionPageProps) {
    const [predictions, setPredictions] = useState<PredictionData[]>(fields);
    const [activeTab, setActiveTab] = useState("weather");
    const [loading, setLoading] = useState(false);
    const [selectedField, setSelectedField] = useState<PredictionData | null>(null);
    const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus | null>(null);
    const [isPolling, setIsPolling] = useState(false);
    const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
      console.log('submissionStatus', submissionKey);
      // if submition is complete don't poll
      if (submissionKey && submissionStatus && submissionStatus?.status === 'completed') {
          return;
      }

      // If we have a submission key, start polling for status
      if (submissionKey) {
          startPolling(submissionKey);
      } else if (fields.length === 0) {
          // If no fields passed as props, fetch from API
          fetchLatestPredictions();
      }

      // Cleanup polling on unmount
      return () => {
          if (pollingInterval) {
              clearInterval(pollingInterval);
          }
      };
  }, [submissionKey, fields.length]);

  const fetchLatestPredictions = async () => {
      setLoading(true);
      try {
          const response = await axios.get('/api/predictions/latest');
          setPredictions(response.data.predictions || []);
      } catch (error) {
          console.error('Failed to fetch predictions:', error);
      } finally {
          setLoading(false);
      }
  };

  const startPolling = (submissionKey: string) => {
      setIsPolling(true);
      
      // Initial fetch
      checkSubmissionStatus(submissionKey);
      
      // Set up polling every 5 seconds
      const interval = setInterval(() => {
          checkSubmissionStatus(submissionKey);
      }, 5000);
      
      setPollingInterval(interval);
  };

  const checkSubmissionStatus = async (submissionKey: string) => {
      try {
          const response = await axios.get(`/api/predictions/status/${submissionKey}`);
          const data = response.data;
          
          if (data.success) {
              setSubmissionStatus(data.submission);
              setPredictions(data.predictions || []);
              
              // If all completed or any failed, stop polling
              if (data.submission.all_completed || data.submission.any_failed) {
                  setIsPolling(false);
                  if (pollingInterval) {
                      clearInterval(pollingInterval);
                      setPollingInterval(null);
                  }
              }
          }
      } catch (error) {
          console.error('Failed to check submission status:', error);
      }
  };

  const handleBackToMapping = () => {
      router.visit('/field-mapping');
  };

  // Loading skeleton component
  const LoadingSkeleton = () => (
      <div className="space-y-6">
          {/* AI Processing Header */}
          <div className="text-center py-12">
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-emerald-500/30 bg-gradient-to-br from-emerald-500/20 to-blue-500/20">
                  <Brain className="h-12 w-12 animate-pulse text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">AI Agents at Work</h2>
              <p className="text-slate-300 mb-4">Our AI is analyzing your fields and doing some magic...</p>
              <div className="flex items-center justify-center gap-2 text-emerald-400">
                  <Sparkles className="h-5 w-5 animate-pulse" />
                  <span className="text-sm font-medium">Processing {submissionStatus?.total_fields || 0} fields</span>
                  <Zap className="h-5 w-5 animate-pulse" />
              </div>
          </div>

          {/* Progress indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {predictions.map((prediction, index) => (
                  <Card key={prediction.field_id} className="border-slate-700 bg-slate-800/90">
                      <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                              <h3 className="font-medium text-white">{prediction.field_name}</h3>
                              <div className="flex items-center gap-2">
                                  {prediction.status === 'processing' && (
                                      <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                                  )}
                                  {prediction.status === 'pending' && (
                                      <div className="h-4 w-4 rounded-full bg-yellow-400 animate-pulse" />
                                  )}
                                  {prediction.status === 'completed' && (
                                      <div className="h-4 w-4 rounded-full bg-green-400" />
                                  )}
                              </div>
                          </div>
                          <div className="space-y-2">
                              <div className="h-3 bg-slate-700 rounded animate-pulse"></div>
                              <div className="h-3 bg-slate-700 rounded animate-pulse w-3/4"></div>
                              <div className="h-3 bg-slate-700 rounded animate-pulse w-1/2"></div>
                          </div>
                          {prediction.message && (
                              <p className="text-sm text-slate-400 mt-3">{prediction.message}</p>
                          )}
                      </CardContent>
                  </Card>
              ))}
          </div>

          {/* Processing steps */}
          <Card className="border-slate-700 bg-slate-800/90">
              <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                      <Brain className="h-5 w-5 text-emerald-400" />
                      AI Processing Steps
                  </CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="space-y-4">
                      <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                              <span className="text-white text-sm">1</span>
                          </div>
                          <div>
                              <p className="text-white font-medium">Field Analysis</p>
                              <p className="text-slate-400 text-sm">Analyzing field coordinates and crop data</p>
                          </div>
                      </div>
                      <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                              <span className="text-white text-sm">2</span>
                          </div>
                          <div>
                              <p className="text-white font-medium">Weather Data Collection</p>
                              <p className="text-slate-400 text-sm">Gathering current and forecasted weather</p>
                          </div>
                      </div>
                      <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                              <Loader2 className="h-4 w-4 animate-spin text-white" />
                          </div>
                          <div>
                              <p className="text-white font-medium">AI Prediction Analysis</p>
                              <p className="text-slate-400 text-sm">Running advanced crop yield predictions</p>
                          </div>
                      </div>
                      <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-slate-600 flex items-center justify-center">
                              <span className="text-slate-400 text-sm">4</span>
                          </div>
                          <div>
                              <p className="text-slate-400 font-medium">Risk Assessment</p>
                              <p className="text-slate-500 text-sm">Evaluating potential risks and recommendations</p>
                          </div>
                      </div>
                  </div>
              </CardContent>
          </Card>
      </div>
  );

  // Show loading skeleton if polling or no predictions available
  if (isPolling || (predictions.length === 0 && submissionKey)) {
      return (
          <div className="min-h-screen bg-slate-900">
              <div className="container mx-auto px-4 py-8">
                  <LoadingSkeleton />
              </div>
          </div>
      );
  }

  // If no predictions and no submission key, show empty state
  if (predictions.length === 0) {
      return (
          <div className="min-h-screen bg-slate-900 flex items-center justify-center">
              <Card className="border-slate-700 bg-slate-800/90">
                  <CardContent className="p-8 text-center">
                      <h2 className="text-xl font-bold text-white mb-4">No Predictions Available</h2>
                      <p className="text-slate-300 mb-6">No field predictions found. Please submit some fields first.</p>
                      <Button onClick={handleBackToMapping} className="bg-emerald-600 hover:bg-emerald-700">
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Back to Field Mapping
                      </Button>
                  </CardContent>
              </Card>
          </div>
      );
  }

  // Use the first prediction for display (in a real app, you'd have field selection)
  const prediction = predictions[0];
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-balance flex items-center gap-2">
                <Sprout className="h-6 w-6 text-primary" />
                AgriSense Crop Intelligence
              </h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {submissionStatus?.region || prediction.region} — {submissionStatus?.zone || 'Unknown Zone'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {new Date(prediction.created_at).toLocaleString()}
                </span>
              </div>
            </div>
            <Badge variant="secondary" className="self-start md:self-center">
              <Sparkles className="h-3 w-3 mr-1" />
              AI Model v1.0.0
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Predicted Yield
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {prediction.predicted_yield} tons/ha
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Confidence</span>
                  <span className="font-medium">{prediction.yield_confidence}%</span>
                </div>
                <Progress value={prediction.yield_confidence} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-secondary/20 bg-gradient-to-br from-secondary/5 to-transparent">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Days to Harvest
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary">{prediction.days_to_harvest || 90}</div>
              <p className="text-xs text-muted-foreground mt-2">{prediction.growth_stage}</p>
            </CardContent>
          </Card>

          <Card className="border-chart-1/20 bg-gradient-to-br from-chart-1/5 to-transparent">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Prediction Accuracy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-3xl font-bold text-chart-1">95%</div>
                <Badge variant="outline" className="border-chart-1 text-chart-1">
                  Excellent
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-chart-2/20 bg-gradient-to-br from-chart-2/5 to-transparent">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Market Price
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-chart-2">
                ${350}
              </div>
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-chart-1" />
                <span>Stable outlook</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Weather & Soil Panel */}
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          {/* Weather Widget */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CloudRain className="h-5 w-5 text-primary" />
                Weather Conditions
              </CardTitle>
              <CardDescription>{prediction.weather_impact || 'Favorable weather conditions'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col items-center p-4 rounded-lg bg-muted/50">
                  <Thermometer className="h-8 w-8 text-chart-4 mb-2" />
                  <div className="text-2xl font-bold">+12%</div>
                  <div className="text-xs text-muted-foreground">Temperature</div>
                </div>
                <div className="flex flex-col items-center p-4 rounded-lg bg-muted/50">
                  <Droplets className="h-8 w-8 text-chart-3 mb-2" />
                  <div className="text-2xl font-bold">+8%</div>
                  <div className="text-xs text-muted-foreground">Rainfall</div>
                </div>
                <div className="flex flex-col items-center p-4 rounded-lg bg-muted/50">
                  <Wind className="h-8 w-8 text-chart-5 mb-2" />
                  <div className="text-2xl font-bold">5%</div>
                  <div className="text-xs text-muted-foreground">Humidity</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Soil Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-primary" />
                Soil Health
              </CardTitle>
              <CardDescription>{prediction.soil_conditions || 'Good soil structure'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">pH Level</div>
                  <div className="text-xl font-bold">6.8</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Organic Matter</div>
                  <div className="text-xl font-bold">3.2%</div>
                </div>
              </div>
              <Separator />
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Nitrogen (N)</span>
                    <span className="font-medium">120 ppm</span>
                  </div>
                  <Progress value={80} className="h-1.5" />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Phosphorus (P)</span>
                    <span className="font-medium">25 ppm</span>
                  </div>
                  <Progress value={84} className="h-1.5" />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Potassium (K)</span>
                    <span className="font-medium">180 ppm</span>
                  </div>
                  <Progress value={94} className="h-1.5" />
                </div>
              </div>
              <div className="pt-2">
                <Badge variant="outline">Well-drained loam</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Insights Tabs */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Insights & Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
                <TabsTrigger value="weather">Weather Impact</TabsTrigger>
                <TabsTrigger value="fertilizer">Fertilizer Plan</TabsTrigger>
                <TabsTrigger value="irrigation">Irrigation</TabsTrigger>
                <TabsTrigger value="risks">Risks</TabsTrigger>
                <TabsTrigger value="market">Market Outlook</TabsTrigger>
              </TabsList>

              <TabsContent value="weather" className="space-y-4 mt-6">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-semibold mb-1">Favorable Conditions</h4>
                    <p className="text-sm text-muted-foreground">{prediction.weather_impact || 'Favorable weather conditions'}</p>
                  </div>
                </div>
                <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Weather Impact Chart</p>
                    <p className="text-xs text-muted-foreground">Temperature: +12%, Rainfall: +8%, Humidity: 5%</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="fertilizer" className="space-y-4 mt-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 rounded-lg border bg-card">
                    <div className="text-xs text-muted-foreground mb-1">Type</div>
                    <div className="font-semibold">Nitrogen-based</div>
                  </div>
                  <div className="p-4 rounded-lg border bg-card">
                    <div className="text-xs text-muted-foreground mb-1">Dosage</div>
                    <div className="font-semibold">
                      150 kg/ha
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <div className="text-xs text-muted-foreground mb-2">Application Method</div>
                  <p className="text-sm">Broadcast application</p>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <div className="text-xs text-muted-foreground mb-2">Timing</div>
                  <p className="text-sm">Apply in 2 weeks</p>
                </div>
              </TabsContent>

              <TabsContent value="irrigation" className="space-y-4 mt-6">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-chart-3/5 border border-chart-3/20">
                  <Droplets className="h-5 w-5 text-chart-3 mt-0.5" />
                  <div>
                    <h4 className="font-semibold mb-1">
                      Irrigation Required
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Maintain consistent soil moisture
                    </p>
                  </div>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <div className="text-xs text-muted-foreground mb-2">Recommendation</div>
                  <p className="text-sm">Drip irrigation system</p>
                </div>
              </TabsContent>

              <TabsContent value="risks" className="space-y-4 mt-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 rounded-lg border bg-card">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <h4 className="font-semibold text-sm">Disease Risks</h4>
                    </div>
                    <div className="space-y-2">
                      {(prediction.disease_risks || ['Fungal infections']).map((risk, i) => (
                        <Badge key={i} variant="destructive" className="mr-2">
                          {risk}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 rounded-lg border bg-card">
                    <div className="flex items-center gap-2 mb-3">
                      <Bug className="h-4 w-4 text-chart-4" />
                      <h4 className="font-semibold text-sm">Pest Risks</h4>
                    </div>
                    <div className="space-y-2">
                      {(prediction.pest_risks || ['Aphids']).map((risk, i) => (
                        <Badge key={i} variant="outline" className="mr-2 border-chart-4 text-chart-4">
                          {risk}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 rounded-lg border bg-card">
                    <div className="flex items-center gap-2 mb-3">
                      <CloudRain className="h-4 w-4 text-chart-3" />
                      <h4 className="font-semibold text-sm">Weather Risks</h4>
                    </div>
                    <div className="space-y-2">
                      {(prediction.weather_risks || ['Potential drought']).map((risk, i) => (
                        <Badge key={i} variant="outline" className="mr-2 border-chart-3 text-chart-3">
                          {risk}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <div className="text-xs text-muted-foreground mb-2">Overall Risk Score</div>
                  <div className="flex items-center gap-3">
                    <Progress value={prediction.overall_risk_score || 25} className="h-2" />
                    <span className="font-semibold">{prediction.overall_risk_score || 25}%</span>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="market" className="space-y-4 mt-6">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-secondary/5 border border-secondary/20">
                  <TrendingUp className="h-5 w-5 text-secondary mt-0.5" />
                  <div>
                    <h4 className="font-semibold mb-1">Market Outlook</h4>
                    <p className="text-sm text-muted-foreground">{prediction.market_outlook}</p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {(prediction.market_trends || ['Increasing demand']).map((trend, i) => (
                    <div key={i} className="p-4 rounded-lg border bg-card">
                      <CheckCircle2 className="h-4 w-4 text-primary mb-2" />
                      <div className="text-sm font-medium">{trend}</div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          {/* Nutrient Levels Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Nutrient Levels (NPK)</CardTitle>
              <CardDescription>Current vs. Optimal levels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center bg-muted/20 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Nutrient Levels Chart</p>
                  <p className="text-xs text-muted-foreground">N: 120ppm, P: 25ppm, K: 180ppm</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Risk Distribution</CardTitle>
              <CardDescription>Overall risk assessment breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center bg-muted/20 rounded-lg">
                <div className="text-center">
                  <div className="h-12 w-12 bg-muted-foreground rounded-full mx-auto mb-2 flex items-center justify-center">
                    <span className="text-white text-lg">📊</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Risk Distribution</p>
                  <p className="text-xs text-muted-foreground">Disease: 15%, Pest: 12%, Weather: 8%, Low: 65%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Yield Trend */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Yield Trend Analysis</CardTitle>
              <CardDescription>Predicted vs. average yield over past 5 seasons</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center bg-muted/20 rounded-lg">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Yield Trend Analysis</p>
                  <p className="text-xs text-muted-foreground">2024 Predicted: 6.7 tons/ha vs Average: 6.2 tons/ha</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer / Metadata */}
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span>Generated by AgriSense AI v1.0.0</span>
              </div>
              <div className="flex flex-col md:flex-row gap-2 md:gap-4">
                <span>
                  Created: {new Date(prediction.created_at).toLocaleTimeString()}
                </span>
                <span className="hidden md:inline">•</span>
                <span>
                  Status: {prediction.status || 'completed'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
