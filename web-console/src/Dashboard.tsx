import React, { useState, useEffect } from 'react';
import { Cpu, HardDrive, MemoryStick, Server, LogOut } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useAuth } from './context/AuthContext';

interface MetricData {
    timestamp: string;
    hostname: string;
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
}

export default function Dashboard() {
    const { user, logout } = useAuth();
    const [latestMetric, setLatestMetric] = useState<MetricData | null>(null);
    const [status, setStatus] = useState<string>('Connecting...');
    const [isOnline, setIsOnline] = useState<boolean>(false);

    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const res = await fetch('http://localhost:7000/status');
                const data = await res.json();
                setStatus(`Queue Size: ${data.queue_size}`);
                setIsOnline(true);

                // Use /peek instead of /pop so the SQLite ingestor still gets the records!
                const peekRes = await fetch('http://localhost:7000/peek');
                const peekData = await peekRes.json();
                if (peekData.data) {
                    setLatestMetric(peekData.data);
                }
            } catch (err) {
                setStatus('Disconnected');
                setIsOnline(false);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Server className="text-cyan-400" /> OTDO Server Metrics Dashboard
                        </h1>
                        <p className="text-sm text-slate-400">Welcome back, <span className="text-cyan-400 font-medium">{user?.name}</span></p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Badge variant={isOnline ? "default" : "destructive"} className="flex items-center gap-1.5 px-3 py-1">
                            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></span>
                            {isOnline ? 'Connected' : 'Offline'}
                        </Badge>
                        <Badge variant="outline" className="text-slate-300 border-slate-800">
                            {status}
                        </Badge>
                        <Button variant="outline" size="sm" onClick={logout} className="border-slate-800 text-slate-300 hover:bg-slate-900">
                            <LogOut className="w-4 h-4 mr-1" /> Logout
                        </Button>
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* CPU Card */}
                    <Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-xl">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-400">CPU Usage</CardTitle>
                            <Cpu className="text-cyan-400 h-5 w-5" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-3xl font-bold">
                                {latestMetric?.cpu_usage ?? '0.0'}%
                            </div>
                            <Progress value={latestMetric?.cpu_usage ?? 0} className="bg-slate-800 [&>div]:bg-cyan-500 h-2" />
                        </CardContent>
                    </Card>

                    {/* Memory Card */}
                    <Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-xl">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-400">Memory Usage</CardTitle>
                            <MemoryStick className="text-purple-400 h-5 w-5" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-3xl font-bold">
                                {latestMetric?.memory_usage ?? '0.0'}%
                            </div>
                            <Progress value={latestMetric?.memory_usage ?? 0} className="bg-slate-800 [&>div]:bg-purple-500 h-2" />
                        </CardContent>
                    </Card>

                    {/* Disk Card */}
                    <Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-xl">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-400">Disk Usage</CardTitle>
                            <HardDrive className="text-emerald-400 h-5 w-5" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-3xl font-bold">
                                {latestMetric?.disk_usage ?? '0.0'}%
                            </div>
                            <Progress value={latestMetric?.disk_usage ?? 0} className="bg-slate-800 [&>div]:bg-emerald-500 h-2" />
                        </CardContent>
                    </Card>

                </div>

            </div>
        </div>
    );
}