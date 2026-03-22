'use client'

import { useRouter } from 'next/navigation'
import axios from 'axios'
import { LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

type NavbarProps = {
    username: string
}

export default function Navbar({ username }: NavbarProps) {
    const router = useRouter()

    async function handleLogout() {
        await axios.post('/api/auth/logout')
        router.push('/login')
        router.refresh()
    }

    return (
        <header className="border-b">
            <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                {/* logo */}
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg">
                        Next Deployer
                    </span>
                </div>

                {/* user menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="flex items-center gap-2">
                            <Avatar className="w-8 h-8">
                                <AvatarFallback className="text-xs">
                                    {username.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">
                                {username}
                            </span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem className="gap-2 cursor-pointer">
                            <User className="w-4 h-4" />
                            Profile
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                            onClick={handleLogout}
                        >
                            <LogOut className="w-4 h-4" />
                            Logout
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}