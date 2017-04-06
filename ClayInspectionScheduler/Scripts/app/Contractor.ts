/// <reference path="transport.ts" />
/// <reference path="ui.ts" />

namespace InspSched
{
  interface IContractor
  {

    ContractorID: string;
    SuspendGraceDt: Date;
  }

  export class Contractor implements IContractor
  {

    public ContractorID: string;
    public SuspendGraceDt: Date;

    constructor() {

    }
  }
}