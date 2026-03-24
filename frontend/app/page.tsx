"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { RocketIcon } from "lucide-react"
import { useEffect, useState } from "react"
import axios from "axios"
import { boolean } from "zod"

export default function Home() {
  const [signIn, setSigIn] = useState<boolean>(false);
  const check = async () => {
    try {
      const res = await axios.get('/api/auth/me');
      if (res.data && Object.keys(res.data.user || {}).length > 0) {
        console.log("Condition met!");
        setSigIn(true);
      } 
      // console.log(res)
      // console.log(signIn)
    } catch (error) {
      console.log("errroooooooorrrr")
    }
  }
  useEffect(() => {
    check()
  }, [])
  return (
    <>
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4">
        <div className="text-2xl font-bold flex gap-3 items-center">
          <Link href="/" className="flex items-center gap-2">
            <RocketIcon className="w-7 h-7" />
            Next Deployer
          </Link>
        </div>
        {signIn &&
          <div className="flex gap-3 justify-center">
            <Link href="/dashboard">
              <Button size="lg">Dashboard</Button>
            </Link>
          </div>
        }
        {!signIn && <div className="flex gap-3 justify-center">
          <Link href="/register">
            <Button size="lg">Get Started</Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">Sign in</Button>
          </Link>
        </div>}
      </nav>

      <Separator />

      {/* Hero */}
      <section className="py-24 text-center max-w-3xl mx-auto px-6">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Deploy React Apps in Seconds
        </h1>
        <p className="text-muted-foreground text-lg mb-6">
          Just paste a GitHub or GitLab URL and we handle the rest.
          Build, upload and serve your React app instantly.
        </p>
        <p className="text-sm text-muted-foreground mb-10">
          Next.js · AWS ECS · S3 · CloudWatch · Drizzle · Neon · Docker
        </p>
        {signIn &&
          <div className="flex gap-3 justify-center">
            <Link href="/dashboard">
              <Button size="lg">Dashboard</Button>
            </Link>
          </div>
        }
        {!signIn && <div className="flex gap-3 justify-center">
          <Link href="/register">
            <Button size="lg">Get Started</Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">Sign in</Button>
          </Link>
        </div>}
      </section>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-muted-foreground">
        Built by Lakshay Kamboj ·{" "}
        <a
          href="https://github.com/Lakshay309"
          className="underline underline-offset-4"
        >
          GitHub
        </a>
      </footer>
    </>
  )
}