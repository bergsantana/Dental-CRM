import {
  PatientCollectionOutput,
  PatientOutput,
} from '../../application/use-cases/common/output';

export class PatientPresenter {
  type = 'patient';
  data: PatientOutput;

  constructor(output: PatientOutput) {
    this.data = output;
  }
}

export class PatientCollectionPresenter {
  type = 'patient';
  count: number;
  data: PatientOutput[];

  constructor(output: PatientCollectionOutput) {
    this.count = output.count;
    this.data = output.data;
  }
}
