// types/CustomerMeasurement.types.ts

export interface MeasurementField {
  id: string;
  field_name: string;
  value:string;
  field_type: 'text' | 'number' | 'email' | 'date' | 'select';
  options?: string[];
  required?: boolean;
}


export interface Customer {
  id: string;
  customer_name: string;
}

export interface Product {
  id: string;
  category_name: string;
}

export interface IndividualMeasurement {
  id: string;
  customer_id: string;
  customer_name: string;
  product_id: string;
  product_name: string;
  measurements: Record<string, any>;
}

export interface CorporateMeasurement {
  id: string;
  corporate_customer_id: string;
  customer_name: string;
  product_id: string;
  product_name: string;
  no_of_employees: number;
  batch_name: string;
  employees: Employee[];
}

export interface Employee {
  employee_code: string;
  employee_name: string;
  measurements: Record<string, any>;
}

export interface CustomerMeasurementProps {
  view?: boolean;
  edit?: boolean;
  delete?: boolean;
  add?: boolean;
}

export type FormMode = 'add' | 'edit' | 'view';
export type FilterType = 'individual' | 'corporate';