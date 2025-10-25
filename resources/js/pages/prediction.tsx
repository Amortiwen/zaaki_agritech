'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    AlertTriangle,
    Bug,
    Calendar,
    CheckCircle2,
    Clock,
    CloudRain,
    DollarSign,
    Droplets,
    Leaf,
    MapPin,
    Sparkles,
    Sprout,
    Thermometer,
    TrendingUp,
    Wind,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { AIChatbot } from '@/components/ai-chatbot';

// Chart data
const nutrientData = [
    { name: 'Nitrogen', value: 120, optimal: 150 },
    { name: 'Phosphorus', value: 21, optimal: 25 },
    { name: 'Potassium', value: 169, optimal: 180 },
];

const riskDistribution = [
    { name: 'Disease Risk', value: 15, color: 'hsl(var(--chart-4))' },
    { name: 'Pest Risk', value: 12, color: 'hsl(var(--chart-5))' },
    { name: 'Weather Risk', value: 8, color: 'hsl(var(--chart-3))' },
    { name: 'Low Risk', value: 65, color: 'hsl(var(--chart-1))' },
];

const yieldTrend = [
    { season: '2020', predicted: 5.2, average: 4.8 },
    { season: '2021', predicted: 5.8, average: 5.1 },
    { season: '2022', predicted: 6.1, average: 5.5 },
    { season: '2023', predicted: 6.4, average: 5.9 },
    { season: '2024', predicted: 6.7, average: 6.2 },
];

const weatherImpact = [
    { factor: 'Temperature', impact: 15 },
    { factor: 'Rainfall', impact: 15 },
    { factor: 'Humidity', impact: -3 },
];

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

export default function AgriSenseDashboard({
    submissionKey,
}: {
    submissionKey: string;
}) {
    const [prediction, setPrediction] = useState<any>([]);
    const [activeTab, setActiveTab] = useState('weather');
    const [loading, setLoading] = useState(false);
    const [selectedField, setSelectedField] = useState<PredictionData | null>(
        null,
    );
    const [submissionStatus, setSubmissionStatus] =
        useState<SubmissionStatus | null>(null);
    const [isPolling, setIsPolling] = useState(false);
    const [pollingInterval, setPollingInterval] =
        useState<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (submissionKey) {
            fetchLatestPrediction(submissionKey);
        }
    }, [submissionKey]);

    // useEffect(() => {
    //   // If submission is complete, don't poll
    //   if (submissionKey && submissionStatus?.status === "completed") {
    //     return
    //   }

    //   // If we have a submission key, start polling for status
    //   if (submissionKey) {
    //     startPolling(submissionKey)
    //   }

    //   // Cleanup polling on unmount
    //   return () => {
    //     if (pollingInterval) {
    //       clearInterval(pollingInterval)
    //     }
    //   }
    // }, [submissionKey, predictions.length])

    const fetchLatestPrediction = async (submissionKey: string) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/predictions/${submissionKey}`);
            if (!response.ok) throw new Error('Failed to fetch predictions');
            const data = await response.json();

            if (data.success) {
                if (data.processing) {
                    // Predictions are still processing
                    setPrediction(null);
                    setIsPolling(true);
                    // Start polling for updates
                    setTimeout(() => {
                        fetchLatestPrediction(submissionKey);
                    }, 5000);
                } else {
                    setPrediction(data.data);
                    setIsPolling(false);
                }
            } else {
                console.error('API Error:', data.message);
                setPrediction(null);
            }
        } catch (error) {
            console.error('Failed to fetch predictions:', error);
            setPrediction(null);
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
            const response = await fetch(
                `/api/predictions/status/${submissionKey}`,
            );
            if (!response.ok) throw new Error('Failed to check status');
            const data = await response.json();

            if (data.success) {
                setSubmissionStatus(data.submission);
                setPrediction(data.data || []);

                // If all completed or any failed, stop polling
                if (
                    data.submission.all_completed ||
                    data.submission.any_failed
                ) {
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
        window.location.href = '/field-mapping';
    };

    // Enhanced loading skeleton component
    const LoadingSkeleton = () => (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50">
            <header className="sticky top-0 z-50 border-b border-white/20 bg-white/80 backdrop-blur-xl shadow-lg">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="flex items-center gap-2 text-2xl font-bold text-balance bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                                <Sprout className="h-6 w-6 text-green-600 animate-pulse" />
                                AgriSense Crop Intelligence
                            </h1>
                            <div className="mt-2 flex items-center gap-4 text-sm text-slate-600">
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="h-4 w-4 animate-bounce" />
                                    Processing...
                                </span>
                            </div>
                        </div>
                        <Badge
                            variant="secondary"
                            className="self-start md:self-center bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-lg animate-pulse"
                        >
                            <Sparkles className="mr-1 h-3 w-3 animate-spin" />
                            AI Processing
                        </Badge>
                    </div>
                </div>
            </header>
            <main className="container mx-auto px-4 py-8">
                <div className="py-16 text-center">
                    <div className="mx-auto mb-8 flex h-32 w-32 items-center justify-center rounded-full border-4 border-green-200 bg-gradient-to-br from-green-400 via-green-500 to-emerald-600 shadow-2xl animate-pulse">
                        <Sparkles className="h-16 w-16 text-white animate-spin" />
                    </div>
                    <h2 className="mb-4 text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                        AI Agents at Work
                    </h2>
                    <p className="mb-6 text-lg text-slate-600 max-w-md mx-auto">
                        Our AI is analyzing your fields and generating
                        predictions...
                    </p>
                    <div className="flex items-center justify-center gap-3 text-green-600">
                        <Sparkles className="h-6 w-6 animate-bounce" />
                        <span className="text-lg font-medium">
                            Processing your field data
                        </span>
                        <Sparkles className="h-6 w-6 animate-bounce" />
                    </div>
                    <div className="mt-8 flex justify-center">
                        <div className="flex space-x-2">
                            <div className="h-2 w-2 bg-green-500 rounded-full animate-bounce"></div>
                            <div className="h-2 w-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="h-2 w-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );

    // Show loading if no prediction data and still loading/polling
    if (loading || (isPolling && !prediction)) {
        return <LoadingSkeleton />;
    }

    // Show error state if no prediction data
    if (!prediction) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <Card className="border-destructive/20 bg-destructive/5">
                    <CardContent className="p-8 text-center">
                        <h2 className="mb-4 text-xl font-bold text-destructive">
                            No Predictions Available
                        </h2>
                        <p className="mb-6 text-muted-foreground">
                            No field predictions found for this submission.
                        </p>
                        <Button
                            onClick={handleBackToMapping}
                            className="bg-primary hover:bg-primary/90"
                        >
                            <MapPin className="mr-2 h-4 w-4" />
                            Back to Field Mapping
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-white/20 bg-white/80 backdrop-blur-xl shadow-lg">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="flex items-center gap-2 text-2xl font-bold text-balance bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                                <Sprout className="h-6 w-6 text-green-600 animate-pulse" />
                                AgriSense Crop Intelligence
                            </h1>
                            <div className="mt-2 flex items-center gap-4 text-sm text-slate-600">
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="h-4 w-4 text-green-600" />
                                    {prediction?.region} — {prediction?.zone}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="h-4 w-4 text-blue-600" />
                                    {prediction?.processing_completed_at
                                        ? new Date(
                                              prediction.processing_completed_at,
                                          ).toLocaleString()
                                        : new Date().toLocaleString()}
                                </span>
                            </div>
                        </div>
                        <Badge
                            variant="secondary"
                            className="self-start md:self-center bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                            <Sparkles className="mr-1 h-3 w-3" />
                            AI Model v
                            {prediction?.ai_metadata?.model_version || '1.0.0'}
                        </Badge>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                {/* Overview Cards */}
                <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="group border-0 bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                        <CardHeader className="pb-3">
                            <CardDescription className="flex items-center gap-2 text-green-100">
                                <TrendingUp className="h-4 w-4" />
                                Predicted Yield
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-white">
                                {prediction?.predicted_yield}{' '}
                                {prediction?.yield_unit}
                            </div>
                            <div className="mt-3">
                                <div className="mb-1 flex items-center justify-between text-xs text-green-100">
                                    <span>Confidence</span>
                                    <span className="font-medium">
                                        {prediction?.yield_confidence}%
                                    </span>
                                </div>
                                <Progress
                                    value={prediction?.yield_confidence}
                                    className="h-2 bg-green-200"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="group border-0 bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                        <CardHeader className="pb-3">
                            <CardDescription className="flex items-center gap-2 text-blue-100">
                                <Clock className="h-4 w-4" />
                                Days to Harvest
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-white">
                                {prediction?.days_to_harvest}
                            </div>
                            <p className="mt-2 text-xs text-blue-100">
                                {prediction?.growth_stage}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="group border-0 bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                        <CardHeader className="pb-3">
                            <CardDescription className="flex items-center gap-2 text-purple-100">
                                <CheckCircle2 className="h-4 w-4" />
                                Prediction Accuracy
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <div className="text-3xl font-bold text-white">
                                    {prediction?.prediction_accuracy || '95'}%
                                </div>
                                <Badge
                                    variant="outline"
                                    className="border-purple-200 text-purple-100 bg-purple-500/20"
                                >
                                    Excellent
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="group border-0 bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                        <CardHeader className="pb-3">
                            <CardDescription className="flex items-center gap-2 text-orange-100">
                                <DollarSign className="h-4 w-4" />
                                Market Price
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-white">
                                ${prediction?.market_price_prediction}
                            </div>
                            <div className="mt-2 flex items-center gap-1 text-xs text-orange-100">
                                <TrendingUp className="h-3 w-3" />
                                <span>Stable outlook</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Weather & Soil Panel */}
                <div className="mb-8 grid gap-6 lg:grid-cols-2">
                    {/* Weather Widget */}
                    <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-cyan-50 hover:shadow-2xl transition-all duration-300">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-blue-700">
                                <CloudRain className="h-5 w-5 text-blue-600" />
                                Weather Conditions
                            </CardTitle>
                            <CardDescription className="text-blue-600">
                                {prediction?.weather_impact_summary}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="group flex flex-col items-center rounded-xl bg-gradient-to-br from-orange-100 to-red-100 p-4 hover:shadow-lg transition-all duration-300 hover:scale-105">
                                    <Thermometer className="mb-2 h-8 w-8 text-orange-600 group-hover:animate-pulse" />
                                    <div className="text-2xl font-bold text-orange-700">
                                        +
                                        {prediction?.temperature_impact || '15'}
                                        %
                                    </div>
                                    <div className="text-xs text-orange-600 font-medium">
                                        Temperature
                                    </div>
                                </div>
                                <div className="group flex flex-col items-center rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 p-4 hover:shadow-lg transition-all duration-300 hover:scale-105">
                                    <Droplets className="mb-2 h-8 w-8 text-blue-600 group-hover:animate-pulse" />
                                    <div className="text-2xl font-bold text-blue-700">
                                        +{prediction?.rainfall_impact || '15'}%
                                    </div>
                                    <div className="text-xs text-blue-600 font-medium">
                                        Rainfall
                                    </div>
                                </div>
                                <div className="group flex flex-col items-center rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 p-4 hover:shadow-lg transition-all duration-300 hover:scale-105">
                                    <Wind className="mb-2 h-8 w-8 text-green-600 group-hover:animate-pulse" />
                                    <div className="text-2xl font-bold text-green-700">
                                        {prediction?.humidity_impact || '-3'}%
                                    </div>
                                    <div className="text-xs text-green-600 font-medium">
                                        Humidity
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Soil Panel */}
                    <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-2xl transition-all duration-300">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-green-700">
                                <Leaf className="h-5 w-5 text-green-600" />
                                Soil Health
                            </CardTitle>
                            <CardDescription className="text-green-600">
                                {prediction?.soil_conditions}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="group rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 p-3 hover:shadow-md transition-all duration-300">
                                    <div className="mb-1 text-xs text-blue-600 font-medium">
                                        pH Level
                                    </div>
                                    <div className="text-xl font-bold text-blue-700">
                                        {prediction?.soil_ph || '6.8'}
                                    </div>
                                </div>
                                <div className="group rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 p-3 hover:shadow-md transition-all duration-300">
                                    <div className="mb-1 text-xs text-green-600 font-medium">
                                        Organic Matter
                                    </div>
                                    <div className="text-xl font-bold text-green-700">
                                        {prediction?.organic_matter_percent ||
                                            '3.2'}
                                        %
                                    </div>
                                </div>
                            </div>
                            <Separator className="bg-green-200" />
                            <div className="space-y-4">
                                <div className="group rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 p-3 hover:shadow-md transition-all duration-300">
                                    <div className="mb-2 flex justify-between text-xs">
                                        <span className="text-purple-600 font-medium">
                                            Nitrogen (N)
                                        </span>
                                        <span className="font-bold text-purple-700">
                                            {prediction?.nitrogen_level ||
                                                '120'}{' '}
                                            ppm
                                        </span>
                                    </div>
                                    <Progress value={80} className="h-2 bg-purple-100" />
                                </div>
                                <div className="group rounded-lg bg-gradient-to-r from-orange-50 to-red-50 p-3 hover:shadow-md transition-all duration-300">
                                    <div className="mb-2 flex justify-between text-xs">
                                        <span className="text-orange-600 font-medium">
                                            Phosphorus (P)
                                        </span>
                                        <span className="font-bold text-orange-700">
                                            {prediction?.phosphorus_level ||
                                                '25'}{' '}
                                            ppm
                                        </span>
                                    </div>
                                    <Progress value={84} className="h-2 bg-orange-100" />
                                </div>
                                <div className="group rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 p-3 hover:shadow-md transition-all duration-300">
                                    <div className="mb-2 flex justify-between text-xs">
                                        <span className="text-green-600 font-medium">
                                            Potassium (K)
                                        </span>
                                        <span className="font-bold text-green-700">
                                            {prediction?.potassium_level ||
                                                '180'}{' '}
                                            ppm
                                        </span>
                                    </div>
                                    <Progress value={94} className="h-2 bg-green-100" />
                                </div>
                            </div>
                            <div className="pt-2">
                                <Badge variant="outline" className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200 hover:shadow-md transition-all duration-300">
                                    {prediction?.soil_type ||
                                        'Well-drained loam'}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* AI Insights Tabs */}
                <Card className="mb-8 border-0 shadow-xl bg-gradient-to-br from-white to-slate-50 hover:shadow-2xl transition-all duration-300">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-slate-700">
                            <Sparkles className="h-5 w-5 text-purple-600 animate-pulse" />
                            AI Insights & Recommendations
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 bg-gradient-to-r from-slate-100 to-slate-200 p-1 rounded-xl">
                                <TabsTrigger value="weather" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-lg transition-all duration-300">
                                    Weather Impact
                                </TabsTrigger>
                                <TabsTrigger value="fertilizer" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white rounded-lg transition-all duration-300">
                                    Fertilizer Plan
                                </TabsTrigger>
                                <TabsTrigger value="irrigation" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white rounded-lg transition-all duration-300">
                                    Irrigation
                                </TabsTrigger>
                                <TabsTrigger value="risks" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-lg transition-all duration-300">
                                    Risks
                                </TabsTrigger>
                                <TabsTrigger value="market" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-yellow-500 data-[state=active]:text-white rounded-lg transition-all duration-300">
                                    Market Outlook
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent
                                value="weather"
                                className="mt-6 space-y-4"
                            >
                                <div className="flex items-start gap-3 rounded-xl border-0 bg-gradient-to-r from-blue-100 to-cyan-100 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-blue-600 animate-pulse" />
                                    <div>
                                        <h4 className="mb-2 font-bold text-blue-800">
                                            Favorable Conditions
                                        </h4>
                                        <p className="text-sm text-blue-700">
                                            {prediction?.weather_impact_summary}
                                        </p>
                                    </div>
                                </div>
                                <div className="h-64">
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <BarChart data={weatherImpact}>
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                stroke="hsl(var(--border))"
                                            />
                                            <XAxis
                                                dataKey="factor"
                                                stroke="hsl(var(--muted-foreground))"
                                            />
                                            <YAxis stroke="hsl(var(--muted-foreground))" />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor:
                                                        'hsl(var(--card))',
                                                    border: '1px solid hsl(var(--border))',
                                                    borderRadius:
                                                        'var(--radius)',
                                                }}
                                            />
                                            <Bar
                                                dataKey="impact"
                                                fill="hsl(var(--primary))"
                                                radius={[8, 8, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </TabsContent>

                            <TabsContent
                                value="fertilizer"
                                className="mt-6 space-y-4"
                            >
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="rounded-lg border bg-card p-4">
                                        <div className="mb-1 text-xs text-muted-foreground">
                                            Type
                                        </div>
                                        <div className="font-semibold">
                                            {
                                                prediction
                                                    ?.fertilizer_recommendations
                                                    ?.type
                                            }
                                        </div>
                                    </div>
                                    <div className="rounded-lg border bg-card p-4">
                                        <div className="mb-1 text-xs text-muted-foreground">
                                            Dosage
                                        </div>
                                        <div className="font-semibold">
                                            {
                                                prediction
                                                    ?.fertilizer_recommendations
                                                    ?.dosage_kg_ha
                                            }{' '}
                                            kg/ha
                                        </div>
                                    </div>
                                </div>
                                <div className="rounded-lg border bg-card p-4">
                                    <div className="mb-2 text-xs text-muted-foreground">
                                        Application Method
                                    </div>
                                    <p className="text-sm">
                                        {
                                            prediction
                                                ?.fertilizer_recommendations
                                                ?.application_method
                                        }
                                    </p>
                                </div>
                                <div className="rounded-lg border bg-card p-4">
                                    <div className="mb-2 text-xs text-muted-foreground">
                                        Timing
                                    </div>
                                    <p className="text-sm">
                                        {
                                            prediction
                                                ?.fertilizer_recommendations
                                                ?.timing
                                        }
                                    </p>
                                </div>
                            </TabsContent>

                            <TabsContent
                                value="irrigation"
                                className="mt-6 space-y-4"
                            >
                                <div className="flex items-start gap-3 rounded-lg border border-chart-3/20 bg-chart-3/5 p-4">
                                    <Droplets className="mt-0.5 h-5 w-5 text-chart-3" />
                                    <div>
                                        <h4 className="mb-1 font-semibold">
                                            {prediction
                                                ?.irrigation_recommendations
                                                ?.needed
                                                ? 'Irrigation Required'
                                                : 'No Irrigation Needed'}
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                            {
                                                prediction
                                                    ?.irrigation_recommendations
                                                    ?.timing
                                            }
                                        </p>
                                    </div>
                                </div>
                                <div className="rounded-lg border bg-card p-4">
                                    <div className="mb-2 text-xs text-muted-foreground">
                                        Recommendation
                                    </div>
                                    <p className="text-sm">
                                        {
                                            prediction
                                                ?.irrigation_recommendations
                                                ?.method
                                        }
                                    </p>
                                </div>
                            </TabsContent>

                            <TabsContent
                                value="risks"
                                className="mt-6 space-y-4"
                            >
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="rounded-lg border bg-card p-4">
                                        <div className="mb-3 flex items-center gap-2">
                                            <AlertTriangle className="h-4 w-4 text-destructive" />
                                            <h4 className="text-sm font-semibold">
                                                Disease Risks
                                            </h4>
                                        </div>
                                        <div className="space-y-2">
                                            {prediction?.disease_risks?.map(
                                                (risk: any, i: number) => (
                                                    <Badge
                                                        key={i}
                                                        variant="destructive"
                                                        className="mr-2"
                                                    >
                                                        {risk}
                                                    </Badge>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                    <div className="rounded-lg border bg-card p-4">
                                        <div className="mb-3 flex items-center gap-2">
                                            <Bug className="h-4 w-4 text-chart-4" />
                                            <h4 className="text-sm font-semibold">
                                                Pest Risks
                                            </h4>
                                        </div>
                                        <div className="space-y-2">
                                            {prediction?.pest_risks?.map(
                                                (risk: any, i: number) => (
                                                    <Badge
                                                        key={i}
                                                        variant="outline"
                                                        className="mr-2 border-chart-4 text-chart-4"
                                                    >
                                                        {risk}
                                                    </Badge>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                    <div className="rounded-lg border bg-card p-4">
                                        <div className="mb-3 flex items-center gap-2">
                                            <CloudRain className="h-4 w-4 text-chart-3" />
                                            <h4 className="text-sm font-semibold">
                                                Weather Risks
                                            </h4>
                                        </div>
                                        <div className="space-y-2">
                                              {prediction?.weather_risks?.map(
                                                (risk: any, i: number) => (
                                                    <Badge
                                                        key={i}
                                                        variant="outline"
                                                        className="mr-2 border-chart-3 text-chart-3"
                                                    >
                                                        {risk}
                                                    </Badge>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="rounded-lg border bg-card p-4">
                                    <div className="mb-2 text-xs text-muted-foreground">
                                        Overall Risk Score
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Progress
                                            value={Number.parseFloat(
                                                prediction?.overall_risk_score ||
                                                    '0',
                                            )}
                                            className="h-2"
                                        />
                                        <span className="font-semibold">
                                            {prediction?.overall_risk_score}%
                                        </span>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent
                                value="market"
                                className="mt-6 space-y-4"
                            >
                                <div className="flex items-start gap-3 rounded-lg border border-secondary/20 bg-secondary/5 p-4">
                                    <TrendingUp className="mt-0.5 h-5 w-5 text-secondary" />
                                    <div>
                                        <h4 className="mb-1 font-semibold">
                                            Market Outlook
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                            {prediction?.market_outlook ??
                                                'No market outlook available'}
                                        </p>
                                    </div>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    {prediction?.market_trends?.map(
                                        (trend: any, i: number) => (
                                            <div
                                                key={i}
                                                className="rounded-lg border bg-card p-4"
                                            >
                                                <CheckCircle2 className="mb-2 h-4 w-4 text-primary" />
                                                <div className="text-sm font-medium">
                                                    {trend}
                                                </div>
                                            </div>
                                        ),
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>

                {/* Charts Section */}
                <div className="mb-8 grid gap-6 lg:grid-cols-2">
                    {/* Nutrient Levels Chart */}
                    <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-2xl transition-all duration-300">
                        <CardHeader>
                            <CardTitle className="text-purple-700">Nutrient Levels (NPK)</CardTitle>
                            <CardDescription className="text-purple-600">
                                Current vs. Optimal levels
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={nutrientData}>
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="#e2e8f0"
                                        />
                                        <XAxis
                                            dataKey="name"
                                            stroke="#64748b"
                                        />
                                        <YAxis stroke="#64748b" />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#ffffff',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '12px',
                                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                            }}
                                        />
                                        <Legend />
                                        <Bar
                                            dataKey="value"
                                            fill="#8b5cf6"
                                            name="Current"
                                            radius={[8, 8, 0, 0]}
                                        />
                                        <Bar
                                            dataKey="optimal"
                                            fill="#ec4899"
                                            name="Optimal"
                                            radius={[8, 8, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Risk Distribution */}
                    <Card className="border-0 shadow-xl bg-gradient-to-br from-red-50 to-orange-50 hover:shadow-2xl transition-all duration-300">
                        <CardHeader>
                            <CardTitle className="text-red-700">Risk Distribution</CardTitle>
                            <CardDescription className="text-red-600">
                                Overall risk assessment breakdown
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={riskDistribution}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) =>
                                                `${name}: ${(percent * 100).toFixed(0)}%`
                                            }
                                            outerRadius={100}
                                            fill="#ef4444"
                                            dataKey="value"
                                        >
                                            {riskDistribution.map(
                                                (entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={entry.color}
                                                    />
                                                ),
                                            )}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#ffffff',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '12px',
                                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Yield Trend */}
                    <Card className="lg:col-span-2 border-0 shadow-xl bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-2xl transition-all duration-300">
                        <CardHeader>
                            <CardTitle className="text-green-700">Yield Trend Analysis</CardTitle>
                            <CardDescription className="text-green-600">
                                Predicted vs. average yield over past 5 seasons
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={yieldTrend}>
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="#e2e8f0"
                                        />
                                        <XAxis
                                            dataKey="season"
                                            stroke="#64748b"
                                        />
                                        <YAxis stroke="#64748b" />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#ffffff',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '12px',
                                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                            }}
                                        />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="predicted"
                                            stroke="#10b981"
                                            strokeWidth={4}
                                            name="Predicted Yield"
                                            dot={{ r: 6, fill: '#10b981' }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="average"
                                            stroke="#f59e0b"
                                            strokeWidth={4}
                                            name="Average Yield"
                                            dot={{ r: 6, fill: '#f59e0b' }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Footer / Metadata */}
                <Card className="border-0 shadow-xl bg-gradient-to-r from-slate-100 to-slate-200 hover:shadow-2xl transition-all duration-300">
                    <CardContent className="pt-6">
                        <div className="flex flex-col gap-4 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-purple-600 animate-pulse" />
                                <span className="font-medium">
                                    Generated by AgriSense AI v
                                    {prediction?.ai_metadata?.model_version ||
                                        '1.0.0'}
                                </span>
                            </div>
                            <div className="flex flex-col gap-2 md:flex-row md:gap-4">
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3 text-blue-600" />
                                    Processing started:{' '}
                                    {prediction?.processing_started_at
                                        ? new Date(
                                              prediction.processing_started_at,
                                          ).toLocaleTimeString()
                                        : 'N/A'}
                                </span>
                                <span className="hidden md:inline text-slate-400">•</span>
                                <span className="flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                                    Completed:{' '}
                                    {prediction?.processing_completed_at
                                        ? new Date(
                                              prediction.processing_completed_at,
                                          ).toLocaleTimeString()
                                        : 'N/A'}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </main>
            
            {/* AI Chatbot */}
            {/* <AIChatbot predictionData={prediction} /> */}
        </div>
    );
}
