'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuth } from '@/hooks/use-auth'
import { FirestoreService } from '@/lib/firestore'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Search, Calendar, Eye, Pencil, Trash2, FileText, Loader2 } from 'lucide-react'

interface Report {
  id: string
  title: string
  description: string
  category: string
  date: string
  status: string
  createdAt?: { toDate?: () => Date }
}

export default function MisReportesPage() {
  const { user, hydrated } = useAuth()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [filteredReports, setFilteredReports] = useState<Report[]>([])

  useEffect(() => {
    if (hydrated && user) {
      loadReports()
    }
  }, [hydrated, user])

  useEffect(() => {
    filterReports()
  }, [reports, searchQuery, dateFrom, dateTo])

  const loadReports = async () => {
    try {
      const allRecords = await FirestoreService.getAll('records')
      const userReports = allRecords.filter((r: any) => r.userId === user?.uid)
      setReports(userReports as Report[])
    } catch (error) {
      console.error('Error loading reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterReports = () => {
    let filtered = [...reports]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(r => 
        r.title?.toLowerCase().includes(query) || 
        r.description?.toLowerCase().includes(query)
      )
    }

    if (dateFrom) {
      filtered = filtered.filter(r => r.date >= dateFrom)
    }

    if (dateTo) {
      filtered = filtered.filter(r => r.date <= dateTo)
    }

    setFilteredReports(filtered)
  }

  const formatDate = (date?: { toDate?: () => Date }) => {
    if (!date?.toDate) return 'N/A'
    try {
      return date.toDate().toLocaleDateString('es-ES')
    } catch {
      return 'N/A'
    }
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'pozo': 'Pozo',
      'base': 'Base',
      'oficina': 'Oficina',
      'movilizacion': 'Movilización',
    }
    return labels[category] || category
  }

  const getStatusBadge = (status: string) => {
    if (status === 'published') {
      return <Badge className="bg-green-500">Publicado</Badge>
    }
    return <Badge variant="secondary">Borrador</Badge>
  }

  if (!hydrated) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <ScrollArea className="flex-1" style={{ height: 'calc(100vh - 64px)' }}>
          <main className="p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-foreground">Mis Reportes</h1>
              <p className="text-muted-foreground">Visualiza y gestiona tus reportes</p>
            </div>

            <Card className="border-border bg-card">
              <CardHeader className="pb-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por palabras clave..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <Input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="w-40"
                      />
                      <span className="text-muted-foreground">-</span>
                      <Input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="w-40"
                      />
                    </div>
                    {(searchQuery || dateFrom || dateTo) && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setSearchQuery('')
                          setDateFrom('')
                          setDateTo('')
                        }}
                      >
                        Limpiar
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredReports.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-foreground">No hay reportes</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {searchQuery || dateFrom || dateTo 
                        ? 'No se encontraron reportes con los filtros aplicados'
                        : 'Aún no has creado ningún reporte'}
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Título</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Ubicación</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReports.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell className="font-medium">{report.title || 'Sin título'}</TableCell>
                          <TableCell>{report.date || formatDate(report.createdAt)}</TableCell>
                          <TableCell>{getStatusBadge(report.status)}</TableCell>
                          <TableCell>{getCategoryLabel(report.category)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </main>
        </ScrollArea>
      </div>
    </div>
  )
}