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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Calendar, Eye, Pencil, Trash2, FileText, Loader2, Download } from 'lucide-react'

interface Report {
  id: string
  title: string
  category: string
  eventType: string
  description: string
  actionTaken: string
  date: string
  status: string
  userId: string
  userEmail: string
  createdAt?: { toDate?: () => Date }
}

const CATEGORIES = [
  { value: 'all', label: 'Todas las ubicaciones' },
  { value: 'pozo', label: 'Pozo' },
  { value: 'base', label: 'Base' },
  { value: 'oficina', label: 'Oficina' },
  { value: 'movilizacion', label: 'Movilización' },
]

export default function AnaliticasPage() {
  const { isAdmin, hydrated } = useAuth()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [searchUser, setSearchUser] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [category, setCategory] = useState('all')
  const [filteredReports, setFilteredReports] = useState<Report[]>([])

  useEffect(() => {
    if (hydrated && isAdmin) {
      loadAllReports()
    }
  }, [hydrated, isAdmin])

  useEffect(() => {
    filterReports()
  }, [reports, searchUser, dateFrom, dateTo, category])

  const loadAllReports = async () => {
    try {
      const allRecords = await FirestoreService.getAll('records')
      setReports(allRecords as Report[])
    } catch (error) {
      console.error('Error loading reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterReports = () => {
    let filtered = [...reports]

    if (searchUser) {
      const query = searchUser.toLowerCase()
      filtered = filtered.filter(r => 
        r.userEmail?.toLowerCase().includes(query)
      )
    }

    if (dateFrom) {
      filtered = filtered.filter(r => r.date >= dateFrom)
    }

    if (dateTo) {
      filtered = filtered.filter(r => r.date <= dateTo)
    }

    if (category !== 'all') {
      filtered = filtered.filter(r => r.category === category)
    }

    setFilteredReports(filtered)
  }

  const exportToCSV = () => {
    if (filteredReports.length === 0) return

    const headers = [
      'Título',
      'Ubicación',
      'Tipo de Evento',
      'Descripción',
      'Acción Tomada',
      'Fecha',
      'Estado',
      'Usuario Creador',
      'Fecha de Creación',
    ]

    const csvData = filteredReports.map(r => {
      const createdAt = r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString('es-ES') : 'N/A'
      return [
        r.title || '',
        r.category || '',
        r.eventType || '',
        r.description || '',
        r.actionTaken || '',
        r.date || '',
        r.status === 'published' ? 'Publicado' : 'Borrador',
        r.userEmail || '',
        createdAt,
      ]
    })

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    const dateStr = new Date().toISOString().split('T')[0]
    link.setAttribute('href', url)
    link.setAttribute('download', `reportes_${dateStr}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatDate = (date?: { toDate?: () => Date }) => {
    if (!date?.toDate) return 'N/A'
    try {
      return date.toDate().toLocaleDateString('es-ES')
    } catch {
      return 'N/A'
    }
  }

  const getCategoryLabel = (cat: string) => {
    const labels: Record<string, string> = {
      'pozo': 'Pozo',
      'base': 'Base',
      'oficina': 'Oficina',
      'movilizacion': 'Movilización',
    }
    return labels[cat] || cat
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

  if (!isAdmin) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Acceso Denegado</h1>
            <p className="text-muted-foreground">No tienes permisos para acceder a esta página.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <ScrollArea className="flex-1" style={{ height: 'calc(100vh - 64px)' }}>
          <main className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Analíticas</h1>
                <p className="text-muted-foreground">Visualiza y gestiona todos los reportes del sistema</p>
              </div>
              <Button 
                onClick={exportToCSV} 
                disabled={filteredReports.length === 0}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Exportar CSV
              </Button>
            </div>

            <Card className="border-border bg-card">
              <CardHeader className="pb-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por usuario (email)..."
                      value={searchUser}
                      onChange={(e) => setSearchUser(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <Input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="w-36"
                      />
                      <span className="text-muted-foreground">-</span>
                      <Input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="w-36"
                      />
                    </div>

                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="w-44">
                        <SelectValue placeholder="Ubicación" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {(searchUser || dateFrom || dateTo || category !== 'all') && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setSearchUser('')
                          setDateFrom('')
                          setDateTo('')
                          setCategory('all')
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
                      {searchUser || dateFrom || dateTo || category !== 'all'
                        ? 'No se encontraron reportes con los filtros aplicados'
                        : 'Aún no hay reportes en el sistema'}
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
                        <TableHead>Usuario</TableHead>
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
                          <TableCell className="text-muted-foreground">{report.userEmail}</TableCell>
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
                <div className="mt-4 text-sm text-muted-foreground">
                  Mostrando {filteredReports.length} de {reports.length} reportes
                </div>
              </CardContent>
            </Card>
          </main>
        </ScrollArea>
      </div>
    </div>
  )
}