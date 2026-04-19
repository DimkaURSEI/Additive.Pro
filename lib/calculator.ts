import { Machine, Part } from './types';

// We map the new architecture back to old interfaces or refactor completely.
// Let's refactor.

export interface CalculatorTariffs {
  monthlyRent: number;
  electricityCost: number;
  laborHourlyRate: number;
}

export interface CalculatorOutput {
  materialCost: number;
  depreciationCost: number;
  rentCost: number;
  powerCost: number;
  laborCost: number;
  postProcessingCost: number;
  paintingCost: number;
  riskCost: number;
  complexityCost: number;
  totalCost: number;
}

export function calculatePartCost(part: Part, machine: Machine, tariffs: CalculatorTariffs): CalculatorOutput {
  const printTime = part.timeHours + part.timeMinutes / 60;
  
  // Material
  let materialCost = 0;
  if (part.printType === 'fdm') {
    materialCost = (part.materialCost * (part.weightGrams || 0)) / 1000;
  } else {
    materialCost = (part.materialCost * (part.volumeMl || 0)) / 1000;
  }

  // Equipment depreciation
  const depreciationCost = machine && machine.lifespanHours > 0 
    ? (machine.price / machine.lifespanHours) * printTime 
    : 0;

  // Rent cost
  const hoursPerMonth = 30 * 24;
  const hourlyRent = (tariffs?.monthlyRent || 0) / hoursPerMonth;
  const rentCost = hourlyRent * printTime;

  // Power cost
  const pWatt = machine ? machine.powerWatt : 0;
  const powerCost = (pWatt * printTime * (tariffs?.electricityCost || 0)) / 1000;

  // Labor cost
  const laborCost = (tariffs?.laborHourlyRate || 0) * (printTime * 0.1 + part.postProcessingHours); // Assuming 10% of print time is active operator setup

  // Post-processing cost material
  const postProcessingCost = part.postProcessingHours * (tariffs?.laborHourlyRate || 0) * 0.1; // consumables

  // Painting cost
  let paintingCost = 0;
  if (part.paintingEnabled) {
    const paintingPowerCost = (part.compressorPower * part.paintingTime * (tariffs?.electricityCost || 0)) / 1000;
    const paintingLaborCost = part.paintingTime * (tariffs?.laborHourlyRate || 0);
    paintingCost = paintingPowerCost + paintingLaborCost + part.paintChemistry;
  }

  // Risk cost
  const subtotal = materialCost + depreciationCost + rentCost + powerCost + laborCost + postProcessingCost + paintingCost;
  const riskCost = subtotal * (part.failureRate / 100);

  // Complexity cost (multiplier on labor)
  const complexityCost = laborCost * ((part.complexity || 1) - 1);

  // Total cost
  let totalCost = (subtotal + riskCost + complexityCost) * (part.quantity || 1);
  if(isNaN(totalCost)) totalCost = 0;

  return {
    materialCost: materialCost * part.quantity,
    depreciationCost: depreciationCost * part.quantity,
    rentCost: rentCost * part.quantity,
    powerCost: powerCost * part.quantity,
    laborCost: laborCost * part.quantity,
    postProcessingCost: postProcessingCost * part.quantity,
    paintingCost: paintingCost * part.quantity,
    riskCost: riskCost * part.quantity,
    complexityCost: complexityCost * part.quantity,
    totalCost
  };
}
