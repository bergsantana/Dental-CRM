import { IsString, IsUUID } from 'class-validator';

export class FindPatientByIdInput {
  @IsString()
  @IsUUID()
  id: string;

  constructor(id: string) {
    this.id = id;
  }
}
