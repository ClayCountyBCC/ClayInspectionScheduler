/// <reference path="transport.ts" />
/// <reference path="ui.ts" />


namespace InspSched 
{
  export enum access_type 
  {
    public_access = 1, // They get treated like public users.
    basic_access = 2,
    inspector_access = 3,
    contract_access = 4
  }


  interface IPermit 
  {
    access: access_type;
    PermitNo: string;
    PermitTypeString: string;
    ProjAddrCombined: string;
    ProjCity: string;
    Confidential: number;
    ErrorText: string;
    ContractorId: string;
    ContractorWarning: string;
    NoFinalInspections: boolean;
    ScheduleDates: string[];
    Permit_URL: string;
    Dates: DateCache;

  }

  export class Permit implements IPermit 
  {
    public access: access_type;
    public PermitNo: string;
    public PermitTypeString: string;
    public ProjAddrCombined: string;
    public ProjCity: string;
    public Confidential: number;
    public ErrorText: string;
    public ContractorId: string;
    public ContractorWarning: string;
    public NoFinalInspections: boolean;
    public ScheduleDates: string[];
    public Permit_URL: string;
    public Dates: DateCache;

    constructor( IsExternalUser: boolean) 
    {

    }

  }
}