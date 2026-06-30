'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { usePackages, useDeletePackage, useUpdatePackage } from '@/hooks/usePackages'
import { useServices } from '@/hooks/useServices'
import { Package } from '@/services/packages.service'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Plus, Pencil, Trash2, Star, Eye, EyeOff, Loader2 } from 'lucide-react'
import { PackageSheet } from './PackageSheet'

const currencyFormatter = new Intl.NumberFormat('es-CR', {
  style: 'currency',
  currency: 'CRC',
  maximumFractionDigits: 0,
})

export default function PackagesManager() {
  const { data: packages = [], isLoading } = usePackages()
  const { data: services = [] } = useServices()
  const deletePackage = useDeletePackage()
  const updatePackage = useUpdatePackage()

  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editingPackage, setEditingPackage] = useState<Package | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [packageToDelete, setPackageToDelete] = useState<{ id: string; name: string } | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const serviceNameById = new Map(services.map(s => [s.id, s.title]))

  const handleCreate = () => {
    setEditingPackage(null)
    setIsSheetOpen(true)
  }

  const handleEdit = (pkg: Package) => {
    setEditingPackage(pkg)
    setIsSheetOpen(true)
  }

  const handleDelete = (id: string, name: string) => {
    setPackageToDelete({ id, name })
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!packageToDelete) return

    try {
      await deletePackage.mutateAsync(packageToDelete.id)
      toast.success('Paquete eliminado', {
        description: `"${packageToDelete.name}" se eliminó correctamente`,
      })
    } catch (error) {
      console.error('Error al eliminar paquete:', error)
      toast.error('Error al eliminar', {
        description: 'No se pudo eliminar el paquete. Intenta nuevamente.',
      })
    } finally {
      setDeleteDialogOpen(false)
      setPackageToDelete(null)
    }
  }

  const handleToggleActive = async (pkg: Package) => {
    setTogglingId(pkg.id)
    try {
      await updatePackage.mutateAsync({ id: pkg.id, payload: { is_active: !pkg.is_active } })
      toast.success(pkg.is_active ? 'Paquete ocultado' : 'Paquete visible')
    } catch (error) {
      toast.error('Error al cambiar visibilidad')
    } finally {
      setTogglingId(null)
    }
  }

  const handleToggleFeatured = async (pkg: Package) => {
    try {
      await updatePackage.mutateAsync({ id: pkg.id, payload: { is_featured: !pkg.is_featured } })
      toast.success(pkg.is_featured ? 'Paquete ya no es destacado' : 'Paquete destacado')
    } catch (error) {
      toast.error('Error al actualizar destacado')
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="h-full overflow-hidden">
      <div className="h-full overflow-y-auto bg-[#0d0d0d]">
        <div className="p-6">
          <div className="max-w-[1400px] mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 bg-[#1a1a1a] p-4 md:p-6 rounded-lg shadow-sm border border-white/10">
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">Paquetes</h1>
                <p className="text-sm text-white/60">Administra los paquetes de servicios y precios</p>
              </div>
              <Button onClick={handleCreate} className="gap-2">
                <Plus className="w-4 h-4" />
                Agregar Paquete
              </Button>
            </div>

            <div className="bg-[#1a1a1a] rounded-lg shadow-sm border border-white/10 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Servicio</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Destacado</TableHead>
                    <TableHead>Activo</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packages.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-white/50">
                        No hay paquetes. Agrega uno para comenzar.
                      </TableCell>
                    </TableRow>
                  ) : (
                    packages.map(pkg => (
                      <TableRow key={pkg.id}>
                        <TableCell className="font-medium text-white">{pkg.name}</TableCell>
                        <TableCell className="text-white/60">
                          {pkg.service_id ? serviceNameById.get(pkg.service_id) || 'Servicio eliminado' : (
                            <Badge variant="outline">Universal</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-white/80">{currencyFormatter.format(pkg.price)}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleFeatured(pkg)}
                            className="gap-1.5 px-2"
                          >
                            {pkg.is_featured ? (
                              <Badge className="gap-1 bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/20">
                                <Star className="w-3 h-3 fill-amber-300" />
                                Destacado
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-white/40">Normal</Badge>
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleActive(pkg)}
                            disabled={togglingId === pkg.id}
                            className="gap-1.5 px-2"
                          >
                            {togglingId === pkg.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : pkg.is_active ? (
                              <Eye className="w-3.5 h-3.5 text-green-400" />
                            ) : (
                              <EyeOff className="w-3.5 h-3.5 text-white/40" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEdit(pkg)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-400 hover:text-red-300"
                              onClick={() => handleDelete(pkg.id, pkg.name)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>

      <PackageSheet pkg={editingPackage} isOpen={isSheetOpen} onOpenChange={setIsSheetOpen} />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar paquete?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar "{packageToDelete?.name}". Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
