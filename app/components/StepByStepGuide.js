import { motion } from 'framer-motion';
import { Users, Mail, Package, CheckCircle } from 'lucide-react';
import { useState } from 'react';

export default function StepByStepGuide() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      id: 1,
      title: "Tritt der Community bei",
      description: "Melde dich kostenlos mit deiner E-Mail an und werde Teil unserer süßen Community von über 50.000 Mitgliedern.",
      icon: Users,
      color: "from-yellow-600 to-yellow-500",
      details: [
        "Kostenlose Anmeldung in 30 Sekunden",
        "Sofortiger Zugang zur Community",
        "Exklusive Angebote und Neuigkeiten"
      ],
      trackingEvent: 'guide_step_1_viewed'
    },
    {
      id: 2,
      title: "Unser Team kontaktiert dich",
      description: "Wenn du unter den ersten 100 bist, wird dich unser Team per E-Mail kontaktieren und alle Details bestätigen.",
      icon: Mail,
      color: "from-yellow-600 to-yellow-500",
      details: [
        "Automatische E-Mail-Bestätigung",
        "Persönliche Betreuung durch unser Team",
        "Bestätigung deiner Lieferadresse"
      ],
      trackingEvent: 'guide_step_2_viewed'
    },
    {
      id: 3,
      title: "Dubai-Schokolade wird versendet",
      description: "Wir schicken dir deine exklusive Dubai-Schokolade direkt an deine Wunschadresse - komplett kostenlos!",
      icon: Package,
      color: "from-yellow-600 to-yellow-500",
      details: [
        "Kostenloser Versand deutschlandweit",
        "Hochwertige Verpackung",
        "Tracking-Nummer für die Sendung"
      ],
      trackingEvent: 'guide_step_3_viewed'
    }
  ];

  const handleStepClick = (index) => {
    setActiveStep(index);
    funnel.trackInterest(`step_${index + 1}_guide`);
    trackEvent(steps[index].trackingEvent, {
      step_number: index + 1,
      step_title: steps[index].title
    });
  };

  const handleCTAClick = () => {
    trackEvent('guide_cta_click', {
      source: 'step_by_step_guide',
      action: 'scroll_to_signup'
    });
    // Scroll zur Newsletter-Anmeldung
    document.getElementById('hero-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-black mb-4 text-gray-800">
            Wie funktioniert das Ganze?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            In nur 3 einfachen Schritten zu deiner kostenlosen Dubai-Schokolade
          </p>
        </motion.div>

        {/* Progress Bar */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="flex items-center justify-between relative">
            {/* Progress Line */}
            <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 rounded-full -translate-y-1/2 z-0">
              <motion.div
                className="h-full bg-gradient-to-r from-yellow-600 to-yellow-500 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            </div>

            {/* Step Indicators */}
            {steps.map((step, index) => (
              <motion.button
                key={step.id}
                onClick={() => handleStepClick(index)}
                className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${
                  index <= activeStep
                    ? 'bg-gradient-to-r from-yellow-600 to-yellow-500 text-white shadow-lg'
                    : 'bg-white text-gray-400 border-2 border-gray-200'
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {index < activeStep ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  step.id
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Step Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            const isActive = index === activeStep;
            const isCompleted = index < activeStep;

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className={`relative cursor-pointer transition-all duration-300 ${
                  isActive ? 'transform scale-105' : ''
                }`}
                onClick={() => handleStepClick(index)}
              >
                <div
                  className={`bg-white rounded-2xl p-8 shadow-lg border-2 transition-all duration-300 ${
                    isActive
                      ? 'border-yellow-500 shadow-xl'
                      : isCompleted
                      ? 'border-green-500'
                      : 'border-gray-200 hover:border-yellow-300'
                  }`}
                >
                  {/* Icon */}
                  <div className="mb-6 flex justify-center">
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-r ${step.color} shadow-lg`}
                    >
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-800 mb-3">
                      Schritt {step.id}: {step.title}
                    </h3>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      {step.description}
                    </p>

                    {/* Details List */}
                    <div className="space-y-3">
                      {step.details.map((detail, detailIndex) => (
                        <motion.div
                          key={detailIndex}
                          initial={{ opacity: 0, x: -20 }}
                          animate={isActive ? { opacity: 1, x: 0 } : { opacity: 0.7, x: 0 }}
                          transition={{ delay: detailIndex * 0.1 }}
                          className="flex items-center gap-3 text-sm text-gray-600"
                        >
                          <div className="w-2 h-2 bg-gradient-to-r from-yellow-600 to-yellow-500 rounded-full flex-shrink-0" />
                          {detail}
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Active Indicator */}
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-600 to-yellow-500 rounded-full flex items-center justify-center"
                    >
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </motion.div>
                  )}

                  {/* Completed Indicator */}
                  {isCompleted && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                    >
                      <CheckCircle className="w-4 h-4 text-white" />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}