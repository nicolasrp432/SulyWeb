import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Users, TrendingUp, Clock, Shield, Star, Phone, Mail, Building, ChevronDown } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const AutomationLanding = () => {
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

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es requerido';
    if (!formData.empresa.trim()) newErrors.empresa = 'El nombre de la empresa es requerido';
    if (!formData.cargo.trim()) newErrors.cargo = 'El cargo es requerido';
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El formato del email no es válido';
    }
    if (!formData.telefono.trim()) newErrors.telefono = 'El teléfono es requerido';
    if (!formData.tamanoEmpresa) newErrors.tamanoEmpresa = 'Seleccione el tamaño de su empresa';
    if (!formData.procesosAutomatizar.trim()) newErrors.procesosAutomatizar = 'Describa los procesos que desea automatizar';
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSubmitSuccess(true);
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
      console.error('Error al enviar formulario:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const testimonials = [
    {
      name: "Carlos Mendoza",
      position: "CEO, TechSolutions",
      company: "TechSolutions S.A.S",
      content: "Gracias a la automatización implementada, reducimos nuestros tiempos de procesamiento en un 70% y aumentamos la productividad significativamente.",
      rating: 5
    },
    {
      name: "María González",
      position: "Directora de Operaciones",
      company: "Innovar Corp",
      content: "La consultoría nos ayudó a identificar procesos clave que no sabíamos que podían automatizarse. El ROI fue evidente en los primeros 3 meses.",
      rating: 5
    },
    {
      name: "Roberto Silva",
      position: "Gerente General",
      company: "Eficiencia Plus",
      content: "Profesionales excepcionales. Nos guiaron paso a paso en la transformación digital de nuestra empresa con resultados extraordinarios.",
      rating: 5
    }
  ];

  const benefits = [
    {
      icon: <TrendingUp className="w-8 h-8 text-blue-600" />,
      title: "Aumento de Productividad",
      description: "Incremente la eficiencia de su equipo hasta en un 80% automatizando tareas repetitivas"
    },
    {
      icon: <Clock className="w-8 h-8 text-green-600" />,
      title: "Ahorro de Tiempo",
      description: "Libere horas valiosas de su equipo para enfocarse en actividades estratégicas de alto valor"
    },
    {
      icon: <Shield className="w-8 h-8 text-purple-600" />,
      title: "Reducción de Errores",
      description: "Minimice errores humanos y garantice consistencia en todos sus procesos empresariales"
    },
    {
      icon: <Users className="w-8 h-8 text-orange-600" />,
      title: "Mejor Experiencia del Cliente",
      description: "Ofrezca respuestas más rápidas y servicios más eficientes a sus clientes"
    }
  ];

  const processSteps = [
    {
      step: "01",
      title: "Diagnóstico Gratuito",
      description: "Analizamos sus procesos actuales y identificamos oportunidades de automatización"
    },
    {
      step: "02",
      title: "Estrategia Personalizada",
      description: "Diseñamos una hoja de ruta específica para su empresa y objetivos"
    },
    {
      step: "03",
      title: "Implementación",
      description: "Ejecutamos la automatización con mínima interrupción de sus operaciones"
    },
    {
      step: "04",
      title: "Capacitación y Soporte",
      description: "Entrenamos a su equipo y brindamos soporte continuo para garantizar el éxito"
    }
  ];

  return (
    <>
      <Helmet>
        <title>Automatización de Procesos Empresariales | Consultoría Especializada</title>
        <meta name="description" content="Transforme su empresa con automatización de procesos. Consultoría especializada para empresarios que buscan eficiencia, productividad y crecimiento. Diagnóstico gratuito." />
        <meta name="keywords" content="automatización procesos, consultoría empresarial, eficiencia, productividad, transformación digital" />
      </Helmet>

      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center lg:text-left"
              >
                <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
                  Transforme Su Empresa con
                  <span className="text-yellow-400 block">Automatización Inteligente</span>
                </h1>
                <p className="text-xl lg:text-2xl mb-8 text-blue-100 leading-relaxed">
                  Aumente su productividad hasta un 80%, reduzca costos operativos y libere a su equipo para actividades estratégicas de alto valor.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <motion.a
                    href="#contacto"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-yellow-400 text-blue-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-yellow-300 transition-colors inline-flex items-center justify-center gap-2"
                  >
                    Solicitar Diagnóstico Gratuito
                    <ArrowRight className="w-5 h-5" />
                  </motion.a>
                  <motion.a
                    href="#beneficios"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-900 transition-colors inline-flex items-center justify-center gap-2"
                  >
                    Ver Beneficios
                    <ChevronDown className="w-5 h-5" />
                  </motion.a>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative"
              >
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                  <h3 className="text-2xl font-bold mb-6 text-center">¿Su empresa sufre de:</h3>
                  <ul className="space-y-4">
                    {[
                      "Procesos manuales lentos y repetitivos",
                      "Errores humanos costosos",
                      "Falta de tiempo para actividades estratégicas",
                      "Dificultad para escalar operaciones",
                      "Baja productividad del equipo"
                    ].map((item, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                        className="flex items-center gap-3"
                      >
                        <CheckCircle className="w-6 h-6 text-yellow-400 flex-shrink-0" />
                        <span className="text-lg">{item}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="beneficios" className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Beneficios Comprobados de la Automatización
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Empresas que han implementado automatización han visto resultados extraordinarios en tiempo récord
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow"
                >
                  <div className="mb-6">{benefit.icon}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{benefit.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Nuestro Proceso Probado
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Un enfoque estructurado que garantiza resultados exitosos en cada implementación
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {processSteps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="relative"
                >
                  <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-xl p-8 h-full">
                    <div className="text-4xl font-bold text-yellow-400 mb-4">{step.step}</div>
                    <h3 className="text-xl font-bold mb-4">{step.title}</h3>
                    <p className="text-blue-100 leading-relaxed">{step.description}</p>
                  </div>
                  {index < processSteps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                      <ArrowRight className="w-8 h-8 text-blue-600" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Lo Que Dicen Nuestros Clientes
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Empresarios exitosos que han transformado sus negocios con nuestra consultoría
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-xl p-8 shadow-lg"
                >
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-6 leading-relaxed italic">
                    "{testimonial.content}"
                  </p>
                  <div>
                    <div className="font-bold text-gray-900">{testimonial.name}</div>
                    <div className="text-gray-600">{testimonial.position}</div>
                    <div className="text-blue-600 font-semibold">{testimonial.company}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form Section */}
        <section id="contacto" className="py-20 bg-gradient-to-br from-blue-900 to-indigo-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-start">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                  Solicite Su Diagnóstico Gratuito
                </h2>
                <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                  Descubra el potencial de automatización en su empresa. Nuestros expertos analizarán sus procesos y le mostrarán oportunidades específicas de mejora.
                </p>
                
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="bg-yellow-400 p-3 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-blue-900" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Análisis Personalizado</h3>
                      <p className="text-blue-100">Evaluación específica de sus procesos actuales</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="bg-yellow-400 p-3 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-blue-900" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">ROI Proyectado</h3>
                      <p className="text-blue-100">Cálculo del retorno de inversión esperado</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="bg-yellow-400 p-3 rounded-lg">
                      <Clock className="w-6 h-6 text-blue-900" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Hoja de Ruta</h3>
                      <p className="text-blue-100">Plan detallado de implementación</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl p-8 shadow-2xl"
              >
                {submitSuccess ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-6" />
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      ¡Solicitud Enviada Exitosamente!
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Nos pondremos en contacto con usted en las próximas 24 horas para programar su diagnóstico gratuito.
                    </p>
                    <button
                      onClick={() => setSubmitSuccess(false)}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Enviar Otra Solicitud
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        Comience Su Transformación Hoy
                      </h3>
                      <p className="text-gray-600">
                        Complete el formulario y reciba su diagnóstico gratuito
                      </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Nombre Completo *
                        </label>
                        <input
                          type="text"
                          name="nombre"
                          value={formData.nombre}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                            errors.nombre ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Su nombre completo"
                        />
                        {errors.nombre && (
                          <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Empresa *
                        </label>
                        <input
                          type="text"
                          name="empresa"
                          value={formData.empresa}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                            errors.empresa ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Nombre de su empresa"
                        />
                        {errors.empresa && (
                          <p className="text-red-500 text-sm mt-1">{errors.empresa}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Cargo *
                        </label>
                        <input
                          type="text"
                          name="cargo"
                          value={formData.cargo}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                            errors.cargo ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Su cargo en la empresa"
                        />
                        {errors.cargo && (
                          <p className="text-red-500 text-sm mt-1">{errors.cargo}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Tamaño de Empresa *
                        </label>
                        <select
                          name="tamanoEmpresa"
                          value={formData.tamanoEmpresa}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                            errors.tamanoEmpresa ? 'border-red-500' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Seleccione el tamaño</option>
                          <option value="1-10">1-10 empleados</option>
                          <option value="11-50">11-50 empleados</option>
                          <option value="51-200">51-200 empleados</option>
                          <option value="201-500">201-500 empleados</option>
                          <option value="500+">Más de 500 empleados</option>
                        </select>
                        {errors.tamanoEmpresa && (
                          <p className="text-red-500 text-sm mt-1">{errors.tamanoEmpresa}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Email Corporativo *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                            errors.email ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="su.email@empresa.com"
                        />
                        {errors.email && (
                          <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Teléfono *
                        </label>
                        <input
                          type="tel"
                          name="telefono"
                          value={formData.telefono}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                            errors.telefono ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="+57 300 123 4567"
                        />
                        {errors.telefono && (
                          <p className="text-red-500 text-sm mt-1">{errors.telefono}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Procesos a Automatizar *
                      </label>
                      <textarea
                        name="procesosAutomatizar"
                        value={formData.procesosAutomatizar}
                        onChange={handleInputChange}
                        rows={4}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                          errors.procesosAutomatizar ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Describa los procesos que le gustaría automatizar (ej: facturación, inventarios, atención al cliente, reportes, etc.)"
                      />
                      {errors.procesosAutomatizar && (
                        <p className="text-red-500 text-sm mt-1">{errors.procesosAutomatizar}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Mensaje Adicional (Opcional)
                      </label>
                      <textarea
                        name="mensaje"
                        value={formData.mensaje}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        placeholder="Cuéntenos más sobre sus desafíos específicos o expectativas"
                      />
                    </div>

                    <motion.button
                      type="submit"
                      disabled={isSubmitting}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-8 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Enviando...
                        </>
                      ) : (
                        <>
                          Solicitar Diagnóstico Gratuito
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </motion.button>

                    <p className="text-sm text-gray-500 text-center">
                      Al enviar este formulario, acepta que nos pongamos en contacto con usted para brindarle información sobre nuestros servicios de consultoría.
                    </p>
                  </form>
                )}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="py-16 bg-yellow-400">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-blue-900 mb-6">
                ¿Listo para Transformar Su Empresa?
              </h2>
              <p className="text-xl text-blue-800 mb-8">
                No espere más. Cada día sin automatización es productividad perdida.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.a
                  href="#contacto"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-blue-900 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-800 transition-colors inline-flex items-center justify-center gap-2"
                >
                  Comenzar Ahora
                  <ArrowRight className="w-5 h-5" />
                </motion.a>
                <motion.a
                  href="tel:+573001234567"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="border-2 border-blue-900 text-blue-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-900 hover:text-white transition-colors inline-flex items-center justify-center gap-2"
                >
                  <Phone className="w-5 h-5" />
                  Llamar Ahora
                </motion.a>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
};

export default AutomationLanding;