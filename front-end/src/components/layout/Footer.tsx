// app/src/components/layout/Footer.tsx

import React from 'react';
import { Shield } from 'lucide-react';

export const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();

    const links = {
        product: [
            { name: 'Features', href: '#' },
            { name: 'Security', href: '#' },
            { name: 'Analytics', href: '#' },
            { name: 'Documentation', href: '#' },
        ],
        resources: [
            { name: 'Guide', href: '#' },
            { name: 'API Reference', href: '#' },
            { name: 'Best Practices', href: '#' },
            { name: 'Examples', href: '#' },
        ],
        company: [
            { name: 'About', href: '#' },
            { name: 'Blog', href: '#' },
            { name: 'Careers', href: '#' },
            { name: 'Contact', href: '#' },
        ],
        social: [
            { name: 'Github', href: '#', icon: Github },
            { name: 'Twitter', href: '#', icon: Twitter },
            { name: 'Discord', href: '#', icon: Discord },
        ],
    };

    return (
        <footer className="bg-white border-t border-gray-200">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="col-span-1">
                        <div className="flex items-center">
                            <Shield className="h-8 w-8 text-blue-600" />
                            <span className="ml-2 text-xl font-bold">SOON Guard</span>
                        </div>
                        <p className="mt-4 text-sm text-gray-500">
                            Securing the future of blockchain development with advanced 
                            analysis and monitoring tools.
                        </p>
                        {/* Social links */}
                        <div className="mt-6 flex space-x-6">
                            {links.social.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <a
                                        key={item.name}
                                        href={item.href}
                                        className="text-gray-400 hover:text-gray-500"
                                    >
                                        <span className="sr-only">{item.name}</span>
                                        <Icon className="h-6 w-6" />
                                    </a>
                                );
                            })}
                        </div>
                    </div>

                    {/* Links */}
                    <div className="col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-8">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                                Product
                            </h3>
                            <ul className="mt-4 space-y-4">
                                {links.product.map((item) => (
                                    <li key={item.name}>
                                        <a
                                            href={item.href}
                                            className="text-base text-gray-500 hover:text-gray-900"
                                        >
                                            {item.name}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                                Resources
                            </h3>
                            <ul className="mt-4 space-y-4">
                                {links.resources.map((item) => (
                                    <li key={item.name}>
                                        <a
                                            href={item.href}
                                            className="text-base text-gray-500 hover:text-gray-900"
                                        >
                                            {item.name}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                                Company
                            </h3>
                            <ul className="mt-4 space-y-4">
                                {links.company.map((item) => (
                                    <li key={item.name}>
                                        <a
                                            href={item.href}
                                            className="text-base text-gray-500 hover:text-gray-900"
                                        >
                                            {item.name}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Bottom section */}
                <div className="mt-12 border-t border-gray-200 pt-8">
                    <p className="text-base text-gray-400 text-center">
                        © {currentYear} SOON Guard. All rights reserved. Built on Solana.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;