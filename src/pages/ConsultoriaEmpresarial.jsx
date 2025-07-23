import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Users, 
  Zap, 
  Target, 
  Award,
  Phone,
  Mail,
  Building,
  User,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/components/ui/use-toast";

const ConsultoriaEmpresarial = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    nombre: '',
    empresa: '',
    cargo: '',
    email: '',
    telefono: '',
    tamanoEmpresa: '',
    procesosAutomatizar: '',
    mensaje: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Simular envío del formulario
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "¡Solicitud enviada con éxito!",
        description: "Nos pondremos en contacto contigo en las próximas 24 horas para agendar tu consultoría gratuita.",
        variant: "default"
      });
      
      // Limpiar formulario
      setFormData({
        nombre: '',
        empresa: '',
        cargo: '',
        email: '',
        telefono: '',
        tamanoEmpresa: '',
        procesosAutomatizar: '',
        mensaje: ''
      });
    } catch (error) {
      toast({
        title: "Error al enviar",
        description: "Hubo un problema al enviar tu solicitud. Por favor, inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, toast]);

  const beneficios = [
    {
      icon: <TrendingUp className="w-8 h-8 text-blue-600" />,
      titulo: "Incremento de Productividad",
      descripcion: "Hasta 40% de mejora en eficiencia operacional mediante automatización inteligente de procesos repetitivos."
    },
    {
      icon: <Clock className="w-8 h-8 text-green-600" />,
      titulo: "Reducción de Tiempos",
      descripcion: "Elimina tareas manuales que consumen horas valiosas, liberando tiempo para actividades estratégicas."
    },
    {
      icon: <Target className="w-8 h-8 text-purple-600" />,
      titulo: "Precisión y Calidad",
      descripcion: "Minimiza errores humanos y garantiza consistencia en la ejecución de procesos críticos."
    },
    {
      icon: <Zap className="w-8 h-8 text-yellow-600" />,
      titulo: "ROI Inmediato",
      descripcion: "Retorno de inversión visible desde el primer mes de implementación de las soluciones."
    }
  ];

  const testimonios = [
    {
      nombre: "Carlos Mendoza",
      cargo: "Director General",
      empresa: "TechSolutions S.A.",
      testimonio: "La automatización de nuestros procesos de facturación nos ahorró 15 horas semanales y redujo errores en un 95%. El ROI fue inmediato.",
      resultado: "95% reducción de errores"
    },
    {
      nombre: "Ana García",
      cargo: "Gerente de Operaciones",
      empresa: "Manufacturas del Norte",
      testimonio: "Implementamos automatización en nuestro control de inventario. Ahora tenemos visibilidad en tiempo real y hemos optimizado nuestro stock.",
      resultado: "30% optimización de inventario"
    },
    {
      nombre: "Roberto Silva",
      cargo: "CEO",
      empresa: "Servicios Integrales Pro",
      testimonio: "La consultoría nos ayudó a identificar 8 procesos clave para automatizar. Los resultados superaron nuestras expectativas.",
      resultado: "40% mejora en productividad"
    }
  ];

  const procesosComunes = [
    "Gestión de facturas y pagos",
    "Control de inventarios",
    "Seguimiento de clientes (CRM)",
    "Reportes financieros",
    "Gestión de recursos humanos",
    "Procesos de ventas",
    "Control de calidad",
    "Logística y distribución"
  ];

  return (
    <>
      <Helmet>
        <title>Consultoría en Automatización de Procesos Empresariales | Transformación Digital</title>
        <meta name="description" content="Especialistas en automatización de procesos empresariales. Incrementa tu productividad hasta 40% y reduce costos operativos. Consultoría gratuita para empresarios." />
        <meta name="keywords" content="automatización procesos, consultoría empresarial, transformación digital, productividad empresarial, optimización procesos" />
        <meta property="og:title" content="Automatización de Procesos Empresariales - Consultoría Especializada" />
        <meta property="og:description" content="Transforma tu empresa con automatización inteligente. Consultoría gratuita para empresarios que buscan optimizar sus operaciones." />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Hero Section */}
        <section className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="space-y-8"
              >
                <div className="space-y-4">
                  <span className="inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                    🚀 Consultoría Especializada
                  </span>
                  <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                    Automatiza tus procesos y
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                      {" "}multiplica tu productividad
                    </span>
                  </h1>
                  <p className="text-xl text-gray-600 leading-relaxed">
                    Ayudamos a empresarios como tú a transformar operaciones manuales en procesos automatizados que generan resultados medibles desde el primer mes.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                    onClick={() => document.getElementById('formulario-contacto').scrollIntoView({ behavior: 'smooth' })}
                  >
                    Solicitar Consultoría Gratuita
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-full"
                    onClick={() => document.getElementById('beneficios').scrollIntoView({ behavior: 'smooth' })}
                  >
                    Ver Beneficios
                  </Button>
                </div>

                <div className="flex items-center space-x-8 pt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">40%</div>
                    <div className="text-sm text-gray-600">Incremento promedio en productividad</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">95%</div>
                    <div className="text-sm text-gray-600">Reducción de errores operativos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">30 días</div>
                    <div className="text-sm text-gray-600">Para ver resultados tangibles</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative"
              >
                <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
                  <div className="space-y-6">
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Diagnóstico Gratuito</h3>
                      <p className="text-gray-600">Identifica oportunidades de automatización en tu empresa</p>
                    </div>
                    
                    <div className="space-y-4">
                      {[
                        "✅ Análisis de procesos actuales",
                        "✅ Identificación de oportunidades",
                        "✅ Estimación de ROI potencial",
                        "✅ Hoja de ruta personalizada"
                      ].map((item, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <span className="text-green-600 font-semibold">{item}</span>
                        </div>
                      ))}
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <Clock className="w-6 h-6 text-blue-600" />
                        <div>
                          <div className="font-semibold text-gray-900">Consultoría de 60 minutos</div>
                          <div className="text-sm text-gray-600">Completamente gratuita y sin compromiso</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Beneficios Section */}
        <section id="beneficios" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Transforma tu empresa con automatización inteligente
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Descubre cómo la automatización de procesos puede revolucionar tu operación y generar resultados medibles desde el primer mes.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {beneficios.map((beneficio, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="mb-4">{beneficio.icon}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{beneficio.titulo}</h3>
                  <p className="text-gray-600">{beneficio.descripcion}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Procesos Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <h2 className="text-4xl font-bold text-gray-900 mb-6">
                  Procesos que podemos automatizar en tu empresa
                </h2>
                <p className="text-xl text-gray-600 mb-8">
                  Identificamos y optimizamos los procesos que más tiempo y recursos consumen en tu operación diaria.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {procesosComunes.map((proceso, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="flex items-center space-x-3 bg-white rounded-lg p-3 shadow-sm"
                    >
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-800 font-medium">{proceso}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="bg-white rounded-2xl shadow-xl p-8"
              >
                <div className="text-center mb-6">
                  <Award className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900">Metodología Probada</h3>
                  <p className="text-gray-600">Nuestro proceso de 4 fases garantiza resultados</p>
                </div>
                
                <div className="space-y-4">
                  {[
                    { fase: "1. Diagnóstico", descripcion: "Análisis completo de procesos actuales" },
                    { fase: "2. Diseño", descripcion: "Creación de soluciones personalizadas" },
                    { fase: "3. Implementación", descripcion: "Puesta en marcha con acompañamiento" },
                    { fase: "4. Optimización", descripcion: "Mejora continua y monitoreo" }
                  ].map((item, index) => (
                    <div key={index} className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{item.fase}</div>
                        <div className="text-sm text-gray-600">{item.descripcion}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Testimonios Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Casos de éxito que hablan por sí solos
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Empresarios que ya transformaron sus operaciones y obtuvieron resultados extraordinarios.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonios.map((testimonio, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                  className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 shadow-lg border border-gray-100"
                >
                  <div className="mb-4">
                    <div className="text-2xl font-bold text-blue-600 mb-2">{testimonio.resultado}</div>
                    <p className="text-gray-700 italic mb-4">"{testimonio.testimonio}"</p>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4">
                    <div className="font-semibold text-gray-900">{testimonio.nombre}</div>
                    <div className="text-sm text-gray-600">{testimonio.cargo}</div>
                    <div className="text-sm text-blue-600 font-medium">{testimonio.empresa}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Formulario de Contacto */}
        <section id="formulario-contacto" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-900 to-blue-900">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl font-bold text-white mb-4">
                Solicita tu consultoría gratuita ahora
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Completa el formulario y recibe un diagnóstico personalizado de automatización para tu empresa en las próximas 24 horas.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl p-8"
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="w-4 h-4 inline mr-2" />
                      Nombre completo *
                    </label>
                    <input
                      type="text"
                      id="nombre"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Tu nombre completo"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="empresa" className="block text-sm font-medium text-gray-700 mb-2">
                      <Building className="w-4 h-4 inline mr-2" />
                      Empresa *
                    </label>
                    <input
                      type="text"
                      id="empresa"
                      name="empresa"
                      value={formData.empresa}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Nombre de tu empresa"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="cargo" className="block text-sm font-medium text-gray-700 mb-2">
                      Cargo/Posición *
                    </label>
                    <input
                      type="text"
                      id="cargo"
                      name="cargo"
                      value={formData.cargo}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="CEO, Gerente, Director..."
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="tamanoEmpresa" className="block text-sm font-medium text-gray-700 mb-2">
                      <Users className="w-4 h-4 inline mr-2" />
                      Tamaño de empresa *
                    </label>
                    <select
                      id="tamanoEmpresa"
                      name="tamanoEmpresa"
                      value={formData.tamanoEmpresa}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    >
                      <option value="">Selecciona el tamaño</option>
                      <option value="1-10">1-10 empleados</option>
                      <option value="11-50">11-50 empleados</option>
                      <option value="51-200">51-200 empleados</option>
                      <option value="200+">Más de 200 empleados</option>
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="w-4 h-4 inline mr-2" />
                      Email corporativo *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="tu.email@empresa.com"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="w-4 h-4 inline mr-2" />
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      id="telefono"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="+34 600 000 000"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="procesosAutomatizar" className="block text-sm font-medium text-gray-700 mb-2">
                    <Target className="w-4 h-4 inline mr-2" />
                    ¿Qué procesos te gustaría automatizar? *
                  </label>
                  <input
                    type="text"
                    id="procesosAutomatizar"
                    name="procesosAutomatizar"
                    value={formData.procesosAutomatizar}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Ej: Facturación, inventarios, reportes, CRM..."
                  />
                </div>

                <div>
                  <label htmlFor="mensaje" className="block text-sm font-medium text-gray-700 mb-2">
                    <MessageSquare className="w-4 h-4 inline mr-2" />
                    Cuéntanos más sobre tu empresa (opcional)
                  </label>
                  <textarea
                    id="mensaje"
                    name="mensaje"
                    value={formData.mensaje}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Describe brevemente los principales desafíos operativos de tu empresa..."
                  />
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <strong>Garantía de confidencialidad:</strong> Toda la información compartida será tratada con absoluta confidencialidad y utilizada únicamente para preparar tu consultoría personalizada.
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 rounded-lg text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Enviando solicitud...
                    </>
                  ) : (
                    <>
                      Solicitar Consultoría Gratuita
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </>
                  )}
                </Button>
              </form>
            </motion.div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                ¿Listo para transformar tu empresa?
              </h2>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                No esperes más. Cada día que pasa sin automatización es productividad y dinero que pierdes. Actúa ahora.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <div className="flex items-center space-x-2 text-white">
                  <CheckCircle className="w-5 h-5" />
                  <span>Consultoría 100% gratuita</span>
                </div>
                <div className="flex items-center space-x-2 text-white">
                  <CheckCircle className="w-5 h-5" />
                  <span>Sin compromiso</span>
                </div>
                <div className="flex items-center space-x-2 text-white">
                  <CheckCircle className="w-5 h-5" />
                  <span>Resultados garantizados</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
};

export default ConsultoriaEmpresarial;