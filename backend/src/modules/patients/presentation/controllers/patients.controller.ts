import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  CreatePatientDto,
  CreatePatientInput,
} from '../../application/use-cases/create-patient/create-patient.input';
import { CreatePatientUseCase } from '../../application/use-cases/create-patient/create-patient.usecase';
import { FindPatientByIdInput } from '../../application/use-cases/find-patient-by-id/find-patient-by-id.input';
import { FindPatientByIdUseCase } from '../../application/use-cases/find-patient-by-id/find-patient-by-id.usecase';
import { ListPatientsInput } from '../../application/use-cases/list-patients/list-patients.input';
import { ListPatientsUseCase } from '../../application/use-cases/list-patients/list-patients.usecase';
import {
  PatientCollectionPresenter,
  PatientPresenter,
} from '../presenters/patient.presenter';

@Controller('patients')
@ApiTags('Pacientes')
export class PatientsController {
  constructor(
    private readonly _listPatientsUseCase: ListPatientsUseCase,
    private readonly _createPatientUseCase: CreatePatientUseCase,
    private readonly _findPatientByIdUseCase: FindPatientByIdUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async list(): Promise<PatientCollectionPresenter> {
    const input: ListPatientsInput = {};
    const output = await this._listPatientsUseCase.execute(input);
    return new PatientCollectionPresenter(output);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findById(@Param('id') id: string): Promise<PatientPresenter> {
    const input: FindPatientByIdInput = {
      id,
    };
    const output = await this._findPatientByIdUseCase.execute(input);
    return new PatientPresenter(output);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreatePatientDto): Promise<PatientPresenter> {
    const input: CreatePatientInput = {
      name: body.name,
      birthDate: body.birthDate,
      primaryDentist: body.primaryDentist,
    };
    const output = await this._createPatientUseCase.execute(input);
    return new PatientPresenter(output);
  }
}
