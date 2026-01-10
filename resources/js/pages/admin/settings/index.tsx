import { Head, router, useForm } from '@inertiajs/react';
import { Save } from 'lucide-react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
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
    type: string;
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
    const { data, setData, post, processing } = useForm({
        settings: Object.fromEntries(
            Object.values(settings).flat().map(s => [s.key, s.value])
        ),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/settings/update');
    };

    const renderField = (setting: Setting) => {
        const value = data.settings[setting.key] || '';
        
        switch (setting.type) {
            case 'boolean':
                return (
                    <div className="flex items-center justify-between">
                        <Label htmlFor={setting.key}>{setting.description}</Label>
                        <Switch
                            id={setting.key}
                            checked={value === '1'}
                            onCheckedChange={(checked) => 
                                setData('settings', { ...data.settings, [setting.key]: checked ? '1' : '0' })
                            }
                        />
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
                        <Input
                            id={setting.key}
                            type="password"
                            value={value}
                            onChange={(e) => setData('settings', { ...data.settings, [setting.key]: e.target.value })}
                        />
                    </div>
                );
            default:
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
        <SidebarProvider>
            <Head title="Settings" />
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col gap-4 p-4">
                    <div>
                        <h1 className="text-3xl font-bold">Settings</h1>
                        <p className="text-muted-foreground">Manage application settings</p>
                    </div>

                    <form onSubmit={handleSubmit}>
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
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="payment">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Payment Settings</CardTitle>
                                        <CardDescription>Configure payment gateways (Stripe, PayPal, Razorpay)</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {settings.payment?.map(setting => (
                                            <div key={setting.id}>{renderField(setting)}</div>
                                        ))}
                                    </CardContent>
                                </Card>
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
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>

                        <div className="mt-4">
                            <Button type="submit" disabled={processing} className="cursor-pointer">
                                <Save className="mr-2 h-4 w-4" />
                                {processing ? 'Saving...' : 'Save Settings'}
                            </Button>
                        </div>
                    </form>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}