import { useForm } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { join } from '@/routes/member';

interface JoinTeamDialogProps {
    trigger?: React.ReactNode;
    onSuccess?: () => void;
}

export function JoinTeamDialog({ trigger, onSuccess }: JoinTeamDialogProps) {
    const [isOpen, setIsOpen] = useState(false);

    const {
        data,
        setData,
        post,
        processing,
        errors,
        reset,
    } = useForm({
        team_code: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        post(join.url(), {
            onSuccess: () => {
                reset();
                setIsOpen(false);
                onSuccess?.();
            },
        });
    };

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) {
            reset();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="cursor-pointer">
                        <Plus className="h-4 w-4 mr-2" />
                        Join Team
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Join New Team</DialogTitle>
                        <DialogDescription>
                            Enter the team code provided by your team owner to join.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="team_code">Team Code</Label>
                            <Input
                                id="team_code"
                                value={data.team_code}
                                onChange={(e) =>
                                    setData('team_code', e.target.value.toUpperCase())
                                }
                                placeholder="Enter team code (e.g., HDJFU764)"
                                maxLength={8}
                                className="uppercase"
                                required
                            />
                            {errors.team_code && (
                                <p className="text-sm text-red-500">
                                    {errors.team_code}
                                </p>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="cursor-pointer"
                        >
                            {processing && <Spinner className="mr-2" />}
                            Join Team
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}