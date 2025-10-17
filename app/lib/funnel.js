import Cookies from 'js-cookie';
import { trackEvent } from './tracking'; // WICHTIG: Import hinzugefügt!

export class FunnelTracker {
  constructor() {
    this.steps = [
      'landing',
      'interest', 
      'email_capture',
      'conversion'
    ];
    this.currentStep = this.getCurrentStep();
  }

  getCurrentStep() {
    return Cookies.get('funnel_step') || 'landing';
  }

  advanceStep(step, data = {}) {
    const stepIndex = this.steps.indexOf(step);
    const currentIndex = this.steps.indexOf(this.currentStep);
    
    if (stepIndex > currentIndex) {
      this.currentStep = step;
      Cookies.set('funnel_step', step, { expires: 30 });
      
      // Track funnel progression
      trackEvent('funnel_step', {
        step: step,
        step_number: stepIndex + 1,
        ...data
      });
      
      console.log(`[Funnel] Advanced to step: ${step}`, data);
    }
  }

  trackInterest(product) {
    this.advanceStep('interest', { product });
  }

  trackEmailCapture(email) {
    this.advanceStep('email_capture', { email });
  }

  trackConversion(value, currency = 'EUR') {
    this.advanceStep('conversion', { value, currency });
  }
}