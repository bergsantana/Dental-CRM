import { randomUUID } from 'crypto';

export type ClinicProps = {
  id?: string;
  name: string;
  cnpj?: string;
  ownerId: string; // ID do usuário que gerencia
};

export class Clinic {
  id: string;
  name: string;
  cnpj?: string;
  ownerId: string;

  constructor(props: ClinicProps) {
    this.id = props.id ?? randomUUID();
    this.name = props.name;
    this.cnpj = props.cnpj;
    this.ownerId = props.ownerId;
  }
}
