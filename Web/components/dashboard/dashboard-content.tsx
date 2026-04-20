'use client'

import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { CreateForm } from "@/components/dashboard/create-form"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText } from "lucide-react"

export function DashboardContent() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <ScrollArea
          className="flex-1"
          style={{ height: 'calc(100vh - 64px)' }}
        >
          <main className="p-6">
            <CreateForm />
          </main>
        </ScrollArea>
      </div>
    </div>
  )
}