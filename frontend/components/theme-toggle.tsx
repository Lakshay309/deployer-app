'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon, Laptop } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
    const { setTheme, theme } = useTheme()

    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null   // ⭐⭐⭐ VERY IMPORTANT

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                    {theme === 'dark'
                        ? <Moon className="h-5 w-5" />
                        : <Sun className="h-5 w-5" />}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme('light')}>
                    <Sun className="mr-2 h-4 w-4" />
                    Light
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => setTheme('dark')}>
                    <Moon className="mr-2 h-4 w-4" />
                    Dark
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => setTheme('system')}>
                    <Laptop className="mr-2 h-4 w-4" />
                    System
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}