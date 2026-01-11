import { Head, useForm, router } from '@inertiajs/react';
import { Save, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { GlobalToast } from '@/components/global-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

interface Setting {
    id: number;
    key: string;
    value: string;
    type: 'text' | 'textarea' | 'password' | 'boolean' | 'integer' | 'select' | 'json' | 'float';
    description: string;
}

interface Props {
    settings: {
        general?: Setting[];
        payment?: Setting[];
        email?: Setting[];
    };
}

export default function AdminSettingsIndex({ settings }: Props) {
    const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
    const [savingGateway, setSavingGateway] = useState<string | null>(null);
    
    const { data, setData, post } = useForm({
        settings: Object.fromEntries(
            Object.values(settings).flat().map(s => [s.key, s.value])
        ),
    });

    const togglePasswordVisibility = (key: string) => {
        setShowPasswords(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // Auto-save function for individual settings
    const autoSaveSetting = (key: string, value: string) => {
        console.log('Auto-saving:', key, value); // Debug log
        
        // Use router.post instead of form post for auto-save
        router.post('/admin/settings/update', {
            settings: {
                [key]: value
            }
        }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                console.log('Auto-save successful for:', key);
            },
            onError: (errors) => {
                console.error('Auto-save failed:', errors);
            }
        });
    };

    // Save specific gateway settings
    const saveGatewaySettings = (gateway: 'stripe' | 'paypal' | 'razorpay') => {
        setSavingGateway(gateway);
        
        const gatewayKeys = Object.keys(data.settings).filter(key => key.includes(gateway));
        const gatewaySettings = gatewayKeys.reduce((acc, key) => {
            acc[key] = data.settings[key];
            return acc;
        }, {} as Record<string, string>);

        router.post('/admin/settings/update', {
            settings: gatewaySettings
        }, {
            preserveScroll: true,
            preserveState: true,
            onFinish: () => setSavingGateway(null),
        });
    };

    // Save general settings
    const saveGeneralSettings = () => {
        setSavingGateway('general');
        
        const generalKeys = settings.general?.map(s => s.key) || [];
        const generalSettings = generalKeys.reduce((acc, key) => {
            acc[key] = data.settings[key];
            return acc;
        }, {} as Record<string, string>);

        router.post('/admin/settings/update', {
            settings: generalSettings
        }, {
            preserveScroll: true,
            preserveState: true,
            onFinish: () => setSavingGateway(null),
        });
    };

    // Save email settings
    const saveEmailSettings = () => {
        setSavingGateway('email');
        
        const emailKeys = settings.email?.map(s => s.key) || [];
        const emailSettings = emailKeys.reduce((acc, key) => {
            acc[key] = data.settings[key];
            return acc;
        }, {} as Record<string, string>);

        router.post('/admin/settings/update', {
            settings: emailSettings
        }, {
            preserveScroll: true,
            preserveState: true,
            onFinish: () => setSavingGateway(null),
        });
    };

    const renderField = (setting: Setting, showModeBadge?: boolean) => {
        const value = data.settings[setting.key] || '';
        
        // Check if field should have eye icon (keys, IDs, secrets, passwords)
        const isSensitiveField = setting.type === 'password' || 
            setting.key.includes('key') || 
            setting.key.includes('secret') || 
            setting.key.includes('client_id');
        
        switch (setting.type) {
            case 'boolean':
                return (
                    <div className="flex items-center justify-between">
                        <Label htmlFor={setting.key}>{setting.description}</Label>
                        <div className="flex items-center gap-2">
                            {showModeBadge && (
                                <Badge variant={value === '1' ? 'default' : 'secondary'}>
                                    {value === '1' ? 'Live Mode' : 'Test Mode'}
                                </Badge>
                            )}
                            <Switch
                                id={setting.key}
                                checked={value === '1'}
                                onCheckedChange={(checked) => 
                                    setData('settings', { ...data.settings, [setting.key]: checked ? '1' : '0' })
                                }
                            />
                        </div>
                    </div>
                );
            case 'textarea':
                return (
                    <div className="space-y-2">
                        <Label htmlFor={setting.key}>{setting.description}</Label>
                        <Textarea
                            id={setting.key}
                            value={value}
                            onChange={(e) => setData('settings', { ...data.settings, [setting.key]: e.target.value })}
                        />
                    </div>
                );
            case 'password':
                return (
                    <div className="space-y-2">
                        <Label htmlFor={setting.key}>{setting.description}</Label>
                        <div className="relative">
                            <Input
                                id={setting.key}
                                type={showPasswords[setting.key] ? 'text' : 'password'}
                                value={value}
                                onChange={(e) => setData('settings', { ...data.settings, [setting.key]: e.target.value })}
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => togglePasswordVisibility(setting.key)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                {showPasswords[setting.key] ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                    </div>
                );
            default:
                // For text fields that are sensitive (keys, IDs, secrets)
                if (isSensitiveField) {
                    return (
                        <div className="space-y-2">
                            <Label htmlFor={setting.key}>{setting.description}</Label>
                            <div className="relative">
                                <Input
                                    id={setting.key}
                                    type={showPasswords[setting.key] ? 'text' : 'password'}
                                    value={value}
                                    onChange={(e) => setData('settings', { ...data.settings, [setting.key]: e.target.value })}
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility(setting.key)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPasswords[setting.key] ? (
                                        <EyeOff className="h-4 w-4 cursor-pointer" />
                                    ) : (
                                        <Eye className="h-4 w-4 cursor-pointer" />
                                    )}
                                </button>
                            </div>
                        </div>
                    );
                }
                
                return (
                    <div className="space-y-2">
                        <Label htmlFor={setting.key}>{setting.description}</Label>
                        <Input
                            id={setting.key}
                            type={setting.type === 'integer' ? 'number' : 'text'}
                            value={value}
                            onChange={(e) => setData('settings', { ...data.settings, [setting.key]: e.target.value })}
                        />
                    </div>
                );
        }
    };

    return (
        <SidebarProvider
         style={
                {
                    '--sidebar-width': 'calc(var(--spacing) * 72)',
                    '--header-height': 'calc(var(--spacing) * 12)',
                } as React.CSSProperties
            }
        >
            <Head title="Settings" />
            <GlobalToast />
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col gap-4 p-4">
                    <div>
                        <h1 className="text-3xl font-bold">Settings</h1>
                        <p className="text-muted-foreground">Manage application settings</p>
                    </div>

                    <div>
                        <Tabs defaultValue="general" className="w-full">
                            <TabsList>
                                <TabsTrigger value="general">General</TabsTrigger>
                                <TabsTrigger value="payment">Payment</TabsTrigger>
                                <TabsTrigger value="email">Email</TabsTrigger>
                            </TabsList>

                            <TabsContent value="general">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>General Settings</CardTitle>
                                        <CardDescription>Configure general application settings</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {settings.general?.map(setting => (
                                            <div key={setting.id}>{renderField(setting)}</div>
                                        ))}

                                        {/* Save Button */}
                                        <div className="pt-4">
                                            <Button
                                                type="button"
                                                onClick={saveGeneralSettings}
                                                disabled={savingGateway === 'general'}
                                                className="cursor-pointer"
                                            >
                                                <Save className="mr-2 h-4 w-4" />
                                                {savingGateway === 'general' ? 'Saving...' : 'Save General Settings'}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="payment">
                                <div className="space-y-4">
                                    {/* Stripe Settings */}
                                    <Card>
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <CardTitle>Stripe Payment Gateway</CardTitle>
                                                    <CardDescription>Configure Stripe payment gateway for credit/debit card payments</CardDescription>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant={data.settings['stripe_enabled'] === '1' ? 'default' : 'destructive'}>
                                                        {data.settings['stripe_enabled'] === '1' ? 'Enabled' : 'Disabled'}
                                                    </Badge>
                                                    <Switch
                                                        checked={data.settings['stripe_enabled'] === '1'}
                                                        onCheckedChange={(checked) => {
                                                            const newValue = checked ? '1' : '0';
                                                            setData('settings', { ...data.settings, 'stripe_enabled': newValue });
                                                            autoSaveSetting('stripe_enabled', newValue);
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {/* Disabled Overlay */}
                                            {data.settings['stripe_enabled'] !== '1' && (
                                                <div className="bg-muted/50 p-4 rounded-lg text-center text-muted-foreground">
                                                    Enable Stripe payment gateway to configure settings
                                                </div>
                                            )}
                                            
                                            {/* Live Mode Switch */}
                                            <div className="flex items-center justify-between">
                                                <Label className={data.settings['stripe_enabled'] !== '1' ? 'opacity-50' : ''}>Enable Live Mode</Label>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant={data.settings['stripe_live_mode'] === '1' ? 'default' : 'secondary'}>
                                                        {data.settings['stripe_live_mode'] === '1' ? 'Live Mode' : 'Test Mode'}
                                                    </Badge>
                                                    <Switch
                                                        checked={data.settings['stripe_live_mode'] === '1'}
                                                        disabled={data.settings['stripe_enabled'] !== '1'}
                                                        onCheckedChange={(checked) => {
                                                            const newValue = checked ? '1' : '0';
                                                            setData('settings', { ...data.settings, 'stripe_live_mode': newValue });
                                                            autoSaveSetting('stripe_live_mode', newValue);
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            
                                            {settings.payment?.filter(s => s.key.includes('stripe') && s.key !== 'stripe_live_mode' && s.key !== 'stripe_enabled').map(setting => (
                                                <div key={setting.id} className={data.settings['stripe_enabled'] !== '1' ? 'opacity-50 pointer-events-none' : ''}>
                                                    {renderField(setting)}
                                                </div>
                                            ))}

                                            {/* Save Button */}
                                            <div className="pt-4">
                                                <Button
                                                    type="button"
                                                    onClick={() => saveGatewaySettings('stripe')}
                                                    disabled={savingGateway === 'stripe' || data.settings['stripe_enabled'] !== '1'}
                                                    className="cursor-pointer"
                                                >
                                                    <Save className="h-4 w-4" />
                                                    {savingGateway === 'stripe' ? 'Saving...' : 'Save'}
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* PayPal Settings */}
                                    <Card>
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <CardTitle>PayPal Payment Gateway</CardTitle>
                                                    <CardDescription>Configure PayPal payment gateway</CardDescription>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant={data.settings['paypal_enabled'] === '1' ? 'default' : 'destructive'}>
                                                        {data.settings['paypal_enabled'] === '1' ? 'Enabled' : 'Disabled'}
                                                    </Badge>
                                                    <Switch
                                                        checked={data.settings['paypal_enabled'] === '1'}
                                                        onCheckedChange={(checked) => {
                                                            const newValue = checked ? '1' : '0';
                                                            setData('settings', { ...data.settings, 'paypal_enabled': newValue });
                                                            autoSaveSetting('paypal_enabled', newValue);
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {/* Disabled Overlay */}
                                            {data.settings['paypal_enabled'] !== '1' && (
                                                <div className="bg-muted/50 p-4 rounded-lg text-center text-muted-foreground">
                                                    Enable PayPal payment gateway to configure settings
                                                </div>
                                            )}
                                            
                                            {/* Live Mode Switch */}
                                            <div className="flex items-center justify-between">
                                                <Label className={data.settings['paypal_enabled'] !== '1' ? 'opacity-50' : ''}>Enable Live Mode</Label>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant={data.settings['paypal_live_mode'] === '1' ? 'default' : 'secondary'}>
                                                        {data.settings['paypal_live_mode'] === '1' ? 'Live Mode' : 'Test Mode'}
                                                    </Badge>
                                                    <Switch
                                                        checked={data.settings['paypal_live_mode'] === '1'}
                                                        disabled={data.settings['paypal_enabled'] !== '1'}
                                                        onCheckedChange={(checked) => {
                                                            const newValue = checked ? '1' : '0';
                                                            setData('settings', { ...data.settings, 'paypal_live_mode': newValue });
                                                            autoSaveSetting('paypal_live_mode', newValue);
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            
                                            {settings.payment?.filter(s => s.key.includes('paypal') && s.key !== 'paypal_live_mode' && s.key !== 'paypal_mode' && s.key !== 'paypal_enabled').map(setting => (
                                                <div key={setting.id} className={data.settings['paypal_enabled'] !== '1' ? 'opacity-50 pointer-events-none' : ''}>
                                                    {renderField(setting)}
                                                </div>
                                            ))}

                                            {/* Save Button */}
                                            <div className="pt-4">
                                                <Button
                                                    type="button"
                                                    onClick={() => saveGatewaySettings('paypal')}
                                                    disabled={savingGateway === 'paypal' || data.settings['paypal_enabled'] !== '1'}
                                                    className="cursor-pointer"
                                                >
                                                    <Save className="h-4 w-4" />
                                                    {savingGateway === 'paypal' ? 'Saving...' : 'Save'}
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Razorpay Settings */}
                                    <Card>
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <CardTitle>Razorpay Payment Gateway</CardTitle>
                                                    <CardDescription>Configure Razorpay payment gateway for UPI, cards, netbanking, wallets</CardDescription>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant={data.settings['razorpay_enabled'] === '1' ? 'default' : 'destructive'}>
                                                        {data.settings['razorpay_enabled'] === '1' ? 'Enabled' : 'Disabled'}
                                                    </Badge>
                                                    <Switch
                                                        checked={data.settings['razorpay_enabled'] === '1'}
                                                        onCheckedChange={(checked) => {
                                                            const newValue = checked ? '1' : '0';
                                                            setData('settings', { ...data.settings, 'razorpay_enabled': newValue });
                                                            autoSaveSetting('razorpay_enabled', newValue);
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {/* Disabled Overlay */}
                                            {data.settings['razorpay_enabled'] !== '1' && (
                                                <div className="bg-muted/50 p-4 rounded-lg text-center text-muted-foreground">
                                                    Enable Razorpay payment gateway to configure settings
                                                </div>
                                            )}
                                            
                                            {/* Live Mode Switch */}
                                            <div className="flex items-center justify-between">
                                                <Label className={data.settings['razorpay_enabled'] !== '1' ? 'opacity-50' : ''}>Enable Live Mode</Label>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant={data.settings['razorpay_live_mode'] === '1' ? 'default' : 'secondary'}>
                                                        {data.settings['razorpay_live_mode'] === '1' ? 'Live Mode' : 'Test Mode'}
                                                    </Badge>
                                                    <Switch
                                                        checked={data.settings['razorpay_live_mode'] === '1'}
                                                        disabled={data.settings['razorpay_enabled'] !== '1'}
                                                        onCheckedChange={(checked) => {
                                                            const newValue = checked ? '1' : '0';
                                                            setData('settings', { ...data.settings, 'razorpay_live_mode': newValue });
                                                            autoSaveSetting('razorpay_live_mode', newValue);
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            
                                            {settings.payment?.filter(s => s.key.includes('razorpay') && s.key !== 'razorpay_live_mode' && s.key !== 'razorpay_enabled').map(setting => (
                                                <div key={setting.id} className={data.settings['razorpay_enabled'] !== '1' ? 'opacity-50 pointer-events-none' : ''}>
                                                    {renderField(setting)}
                                                </div>
                                            ))}

                                            {/* Save Button */}
                                            <div className="pt-4">
                                                <Button
                                                    type="button"
                                                    onClick={() => saveGatewaySettings('razorpay')}
                                                    disabled={savingGateway === 'razorpay' || data.settings['razorpay_enabled'] !== '1'}
                                                    className="cursor-pointer"
                                                >
                                                    <Save className="h-4 w-4" />
                                                    {savingGateway === 'razorpay' ? 'Saving...' : 'Save'}
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>

                            <TabsContent value="email">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Email Settings</CardTitle>
                                        <CardDescription>Configure SMTP and email settings</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {settings.email?.map(setting => (
                                            <div key={setting.id}>{renderField(setting)}</div>
                                        ))}

                                        {/* Save Button */}
                                        <div className="pt-4">
                                            <Button
                                                type="button"
                                                onClick={saveEmailSettings}
                                                disabled={savingGateway === 'email'}
                                                className="cursor-pointer"
                                            >
                                                <Save className="mr-2 h-4 w-4" />
                                                {savingGateway === 'email' ? 'Saving...' : 'Save Email Settings'}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}