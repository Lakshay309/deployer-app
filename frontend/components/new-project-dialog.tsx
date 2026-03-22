'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Loader2, Plus } from 'lucide-react'
import axios from 'axios'
import { newProjectSchema, type NewProjectInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'

export default function NewProjectDialog() {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<NewProjectInput>({
        resolver: zodResolver(newProjectSchema),
    })

    async function onSubmit(data: NewProjectInput) {
        setIsLoading(true)
        setError(null)

        try {
            await axios.post('/api/projects', data)
            reset()
            setOpen(false)
            router.refresh()  // refresh dashboard to show new project

        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.error ?? 'Something went wrong.')
            } else {
                setError('Something went wrong. Please try again.')
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val)
            if (!val) {
                reset()
                setError(null)
            }
        }}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    New Project
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>New Project</DialogTitle>
                    <DialogDescription>
                        Deploy a React app from a GitHub or GitLab repository
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                    {error && (
                        <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    {/* project name */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Project name</Label>
                        <Input
                            id="name"
                            placeholder="my-awesome-app"
                            disabled={isLoading}
                            {...register('name')}
                        />
                        <p className="text-xs text-muted-foreground">
                            Lowercase letters, numbers and hyphens only. Cannot be changed later.
                        </p>
                        {errors.name && (
                            <p className="text-destructive text-sm">
                                {errors.name.message}
                            </p>
                        )}
                    </div>

                    {/* repo url */}
                    <div className="space-y-2">
                        <Label htmlFor="repoUrl">Repository URL</Label>
                        <Input
                            id="repoUrl"
                            placeholder="https://github.com/username/repo"
                            disabled={isLoading}
                            {...register('repoUrl')}
                        />
                        <p className="text-xs text-muted-foreground">
                            Only public React repositories are supported
                        </p>
                        {errors.repoUrl && (
                            <p className="text-destructive text-sm">
                                {errors.repoUrl.message}
                            </p>
                        )}
                    </div>

                    <div className="flex gap-2 justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading
                                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Deploying...</>
                                : 'Deploy'
                            }
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}