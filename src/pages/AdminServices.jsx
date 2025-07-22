import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { addMissingServices, missingServices } from '@/scripts/addMissingServices';
import { Loader2, CheckCircle, AlertCircle, Plus, Trash2, Edit3 } from 'lucide-react';

const AdminServices = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  // Paquetes especiales para añadir a la base de datos
  const packageServices = [
    {
      name: 'Paquete Básico',
      duration: '60 min',
      price: '35,00€',
      category: 'paquetes'
    },
    {
      name: 'Paquete Premium',
      duration: '180 min',
      price: '70,00€',
      category: 'paquetes'
    },
    {
      name: 'Paquete Deluxe',
      duration: '165 min',
      price: '95,00€',
      category: 'paquetes'
    }
  ];
  
  const [editableServices, setEditableServices] = useState([...missingServices, ...packageServices]);
  const [showEditor, setShowEditor] = useState(false);
  
  // Nuevo servicio para añadir
  const [newService, setNewService] = useState({
    name: '',
    duration: '',
    price: '',
    category: 'nails'
  });

  // Funciones para manejar servicios
  const handleServiceChange = (index, field, value) => {
    const updated = [...editableServices];
    updated[index][field] = value;
    setEditableServices(updated);
  };
  
  const handleAddNewService = () => {
    if (newService.name && newService.duration && newService.price) {
      setEditableServices([...editableServices, { ...newService }]);
      setNewService({ name: '', duration: '', price: '', category: 'nails' });
      toast({
        title: "Servicio añadido",
        description: "El servicio se ha añadido a la lista",
        duration: 3000
      });
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor completa todos los campos",
        duration: 3000
      });
    }
  };
  
  const handleRemoveService = (index) => {
    const updated = editableServices.filter((_, i) => i !== index);
    setEditableServices(updated);
    toast({
      title: "Servicio eliminado",
      description: "El servicio se ha eliminado de la lista",
      duration: 3000
    });
  };

  const handleAddServices = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      // Usar los servicios editables en lugar de los originales
      const response = await addMissingServices(editableServices);
      setResult(response);
      
      toast({
        variant: response.success ? "default" : "destructive",
        title: response.success ? "¡Servicios añadidos!" : "Error al añadir servicios",
        description: response.message,
        duration: 5000
      });
    } catch (error) {
      console.error('Error al ejecutar addMissingServices:', error);
      setResult({ success: false, message: error.message || 'Error desconocido' });
      
      toast({
        variant: "destructive",
        title: "Error inesperado",
        description: error.message || 'Ha ocurrido un error inesperado',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Administración de Servicios | Suly Pretty Nails</title>
      </Helmet>
      
      <section className="container mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-8 text-center">Administración de Servicios</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Gestión de Servicios</h2>
            <Button 
              onClick={() => setShowEditor(!showEditor)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Edit3 className="h-4 w-4" />
              {showEditor ? 'Ocultar Editor' : 'Mostrar Editor'}
            </Button>
          </div>
          
          {showEditor && (
            <div className="mb-8 p-4 border rounded-lg bg-gray-50">
              <h3 className="text-lg font-medium mb-4">Editor de Servicios</h3>
              
              {/* Formulario para añadir nuevo servicio */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 bg-white rounded border">
                <div>
                  <Label htmlFor="new-name">Nombre del Servicio</Label>
                  <Input
                    id="new-name"
                    value={newService.name}
                    onChange={(e) => setNewService({...newService, name: e.target.value})}
                    placeholder="Ej: Manicura completa"
                  />
                </div>
                <div>
                  <Label htmlFor="new-duration">Duración</Label>
                  <Input
                    id="new-duration"
                    value={newService.duration}
                    onChange={(e) => setNewService({...newService, duration: e.target.value})}
                    placeholder="Ej: 45 min"
                  />
                </div>
                <div>
                  <Label htmlFor="new-price">Precio</Label>
                  <Input
                    id="new-price"
                    value={newService.price}
                    onChange={(e) => setNewService({...newService, price: e.target.value})}
                    placeholder="Ej: 18,00€"
                  />
                </div>
                <div>
                  <Label htmlFor="new-category">Categoría</Label>
                  <Select value={newService.category} onValueChange={(value) => setNewService({...newService, category: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="nails">Uñas</SelectItem>
                        <SelectItem value="beauty">Belleza</SelectItem>
                        <SelectItem value="paquetes">Paquetes</SelectItem>
                      </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-4">
                  <Button onClick={handleAddNewService} className="w-full flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Añadir Servicio
                  </Button>
                </div>
              </div>
              
              {/* Lista de servicios editables */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {editableServices.map((service, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-3 bg-white rounded border items-end">
                    <div>
                      <Label>Nombre</Label>
                      <Input
                        value={service.name}
                        onChange={(e) => handleServiceChange(index, 'name', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Duración</Label>
                      <Input
                        value={service.duration}
                        onChange={(e) => handleServiceChange(index, 'duration', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Precio</Label>
                      <Input
                        value={service.price}
                        onChange={(e) => handleServiceChange(index, 'price', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Categoría</Label>
                      <Select value={service.category} onValueChange={(value) => handleServiceChange(index, 'category', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nails">Uñas</SelectItem>
                          <SelectItem value="beauty">Belleza</SelectItem>
                          <SelectItem value="paquetes">Paquetes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Button 
                        onClick={() => handleRemoveService(index)}
                        variant="destructive"
                        size="sm"
                        className="w-full"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <p className="mb-4 text-gray-600">
            Esta herramienta añadirá {editableServices.length} servicios a la base de datos:
          </p>
          
          <div className="bg-gray-50 p-4 rounded-md mb-6 max-h-60 overflow-y-auto">
            <ul className="list-disc pl-5 space-y-2">
              {editableServices.map((service, index) => (
                <li key={index} className="text-sm">
                  <span className="font-medium">{service.name}</span> - {service.duration} - {service.price} - Categoría: {service.category}
                </li>
              ))}
            </ul>
          </div>
          
          <Button 
            onClick={handleAddServices} 
            disabled={loading}
            className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Añadiendo servicios...</span>
              </>
            ) : (
              <>
                <span>Añadir Servicios Faltantes</span>
              </>
            )}
          </Button>
          
          {result && (
            <div className={`mt-6 p-4 rounded-md ${result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              <div className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                <p className="font-medium">{result.message}</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default AdminServices;