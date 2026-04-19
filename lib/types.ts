export interface Machine {
    id: string;
    name: string;
    type: 'fdm' | 'sla' | 'other';
    powerWatt: number;
    price: number;
    lifespanHours: number;
    createdAt?: any;
    updatedAt?: any;
}

export interface Order {
    id: string;
    title: string;
    description: string;
    notes?: string;
    createdAt?: any;
    updatedAt?: any;
}

export interface Part {
    id: string;
    orderId: string;
    name: string;
    machineId: string;
    quantity: number;
    scheduledQuantity: number;
    
    // Tech params
    printType: 'fdm' | 'sla' | 'other';
    weightGrams?: number;
    volumeMl?: number;
    timeHours: number;
    timeMinutes: number;
    materialCost: number; // raw material parameter (per kg / L)
    failureRate: number;
    complexity: number;
    
    // Post-processing
    postProcessingHours: number;
    paintingEnabled: boolean;
    paintingTime: number;
    paintArea: number;
    paintChemistry: number;
    compressorPower: number;
    
    createdAt?: any;
    updatedAt?: any;
}
