export interface CalculatorInput {
  printType: 'fdm' | 'sla';
  quantity: number;
  printerCount: number;
  filamentCost: number;
  partWeight: number;
  partVolume: number;
  printHours: number;
  printMinutes: number;
  electricityCost: number;
  printerWattage: number;
  laborHourlyRate: number;
  postProcessingHours: number;
  paintingEnabled: boolean;
  paintingTime: number;
  compressorPower: number;
  paintChemistry: number;
  paintArea: number;
  failureRate: number;
  complexity: number;
  equipmentCost?: number;
  equipmentLifespan?: number;
  monthlyRent?: number;
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

export function calculateCost(input: CalculatorInput): CalculatorOutput {
  const {
    printType,
    quantity,
    printerCount,
    filamentCost,
    partWeight,
    partVolume,
    printHours,
    printMinutes,
    electricityCost,
    printerWattage,
    laborHourlyRate,
    postProcessingHours,
    paintingEnabled,
    paintingTime,
    compressorPower,
    paintChemistry,
    paintArea,
    failureRate,
    complexity,
    equipmentCost = 0,
    equipmentLifespan = 0,
    monthlyRent = 0
  } = input;

  const printTime = printHours + printMinutes / 60;
  const effectivePrintTime = printTime * printerCount;

  // Material cost
  let materialCost = 0;
  if (printType === 'fdm') {
    materialCost = (filamentCost * partWeight) / 1000;
  } else {
    materialCost = (filamentCost * partVolume) / 1000;
  }

  // Equipment depreciation
  const depreciationCost = equipmentLifespan > 0 
    ? (equipmentCost / equipmentLifespan) * effectivePrintTime 
    : 0;

  // Rent cost
  const hoursPerMonth = 30 * 24;
  const hourlyRent = monthlyRent / hoursPerMonth;
  const rentCost = hourlyRent * effectivePrintTime;

  // Power cost
  const powerCost = (printerWattage * printerCount * effectivePrintTime * electricityCost) / 1000;

  // Labor cost
  const laborCost = laborHourlyRate * (printTime + postProcessingHours);

  // Post-processing cost (simplified)
  const postProcessingCost = postProcessingHours * laborHourlyRate * 0.5;

  // Painting cost
  let paintingCost = 0;
  if (paintingEnabled) {
    const paintingPowerCost = (compressorPower * paintingTime * electricityCost) / 1000;
    const paintingLaborCost = paintingTime * laborHourlyRate;
    paintingCost = paintingPowerCost + paintingLaborCost + paintChemistry;
  }

  // Risk cost
  const subtotal = materialCost + depreciationCost + rentCost + powerCost + laborCost + postProcessingCost + paintingCost;
  const riskCost = subtotal * (failureRate / 100);

  // Complexity cost
  const complexityCost = laborCost * (complexity - 1);

  // Total cost
  const totalCost = (subtotal + riskCost + complexityCost) * quantity;

  return {
    materialCost,
    depreciationCost,
    rentCost,
    powerCost,
    laborCost,
    postProcessingCost,
    paintingCost,
    riskCost,
    complexityCost,
    totalCost
  };
}
