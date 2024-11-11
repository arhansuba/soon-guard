// app/src/app/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { RiskScanner } from '@/components/security/RiskScanner';
import { ContractMetrics } from '@/components/analytics/ContractMetrics';
import { NetworkHealth } from '@/components/analytics/NetworkHealth';
import { GasTracker } from '@/components/monitoring/GasTracker';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Shield, 
    Search, 
    Zap,
    Users,
    BookOpen,
    Code,
    ArrowRight,
    ChevronDown,
    ExternalLink,
    PieChart
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

// Animation variants
const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
};

export default function HomePage() {
    const [activeTab, setActiveTab] = useState('overview');
    const [isVisible, setIsVisible] = useState(false);
    const [selectedContract, setSelectedContract] = useState<string | null>(null);

    // Intersection Observer for animations
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        setIsVisible(true);
                    }
                });
            },
            { threshold: 0.1 }
        );

        const elements = document.querySelectorAll('.animate-on-scroll');
        elements.forEach(el => observer.observe(el));

        return () => observer.disconnect();
    }, []);

    // Example recent contracts data
    const recentContracts = [
        { id: '1', name: 'Swap Contract', risk: 'Low', activity: 'High' },
        { id: '2', name: 'Lending Pool', risk: 'Medium', activity: 'Medium' },
        { id: '3', name: 'Staking Protocol', risk: 'Low', activity: 'High' },
    ];

    return (
        <div className="space-y-8">
            {/* Enhanced Hero Section with Animation */}
            <motion.section 
                className="py-12 -mt-8 bg-gradient-to-b from-blue-50 to-white relative overflow-hidden"
                initial="initial"
                animate="animate"
                variants={fadeIn}
            >
                {/* Animated background elements */}
                <div className="absolute inset-0 z-0">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute rounded-full bg-blue-200 opacity-20"
                            style={{
                                width: Math.random() * 300 + 100,
                                height: Math.random() * 300 + 100,
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                            }}
                            animate={{
                                scale: [1, 1.2, 1],
                                rotate: [0, 180, 360],
                            }}
                            transition={{
                                duration: 20,
                                repeat: Infinity,
                                delay: i * 2,
                            }}
                        />
                    ))}
                </div>

                {/* Hero content */}
                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* ... Previous hero content ... */}
                </div>
            </motion.section>

            {/* Interactive Dashboard Tabs */}
            <section className="py-8">
                <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="w-full justify-start mb-6">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="security">Security</TabsTrigger>
                        <TabsTrigger value="performance">Performance</TabsTrigger>
                        <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <NetworkHealth />
                            <ContractMetrics />
                        </div>
                    </TabsContent>

                    <TabsContent value="security">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <RiskScanner />
                            <div className="space-y-6">
                                <Card>
                                    <CardContent className="p-6">
                                        <h3 className="text-lg font-semibold mb-4">Recent Scans</h3>
                                        {recentContracts.map((contract) => (
                                            <div
                                                key={contract.id}
                                                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                                                onClick={() => setSelectedContract(contract.id)}
                                            >
                                                <div>
                                                    <p className="font-medium">{contract.name}</p>
                                                    <p className="text-sm text-gray-500">
                                                        Risk: {contract.risk}
                                                    </p>
                                                </div>
                                                <ArrowRight className="h-5 w-5 text-gray-400" />
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="performance">
                        <GasTracker />
                    </TabsContent>

                    <TabsContent value="analytics">
                        {/* Add your analytics content */}
                    </TabsContent>
                </Tabs>
            </section>

            {/* Interactive Documentation Section */}
            <section className="py-8">
                <Card>
                    <CardContent className="p-6">
                        <h2 className="text-2xl font-bold mb-6">Quick Start Guide</h2>
                        <Accordion type="single" collapsible>
                            <AccordionItem value="installation">
                                <AccordionTrigger>Installation</AccordionTrigger>
                                <AccordionContent>
                                    <pre className="bg-gray-50 p-4 rounded-lg">
                                        <code>npm install @soon/guard</code>
                                    </pre>
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="configuration">
                                <AccordionTrigger>Configuration</AccordionTrigger>
                                <AccordionContent>
                                    Configuration steps and examples...
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="usage">
                                <AccordionTrigger>Usage</AccordionTrigger>
                                <AccordionContent>
                                    Basic usage examples and patterns...
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </CardContent>
                </Card>
            </section>

            {/* Live Activity Feed */}
            <motion.section 
                className="py-8 animate-on-scroll"
                initial={{ opacity: 0 }}
                animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Card>
                    <CardContent className="p-6">
                        <h2 className="text-2xl font-bold mb-6">Live Network Activity</h2>
                        <div className="space-y-4">
                            {/* Add live activity items */}
                        </div>
                    </CardContent>
                </Card>
            </motion.section>

            {/* Resources Section */}
            <section className="py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    {
                        title: 'Documentation',
                        icon: BookOpen,
                        description: 'Comprehensive guides and API references',
                    },
                    {
                        title: 'Examples',
                        icon: Code,
                        description: 'Ready-to-use code examples and templates',
                    },
                    {
                        title: 'Community',
                        icon: Users,
                        description: 'Join our developer community',
                    },
                ].map((resource, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.2 }}
                    >
                        <Card className="h-full">
                            <CardContent className="p-6">
                                <resource.icon className="h-8 w-8 mb-4 text-blue-600" />
                                <h3 className="text-lg font-semibold mb-2">{resource.title}</h3>
                                <p className="text-gray-500 mb-4">{resource.description}</p>
                                <Button variant="outline" className="w-full">
                                    Learn More
                                    <ExternalLink className="ml-2 h-4 w-4" />
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </section>

            {/* ... Previous sections ... */}
        </div>
    );
}