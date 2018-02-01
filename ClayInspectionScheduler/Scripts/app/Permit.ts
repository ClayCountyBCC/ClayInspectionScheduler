/// <reference path="transport.ts" />
/// <reference path="ui.ts" />


namespace InspSched 
{

  enum access_type 
  {
    no_access = 0, // denied access
    public_access = 1, // They get treated like public users.
    basic_access = 2,
    inspector_access = 3
  };

  interface IPermit 
  {
    access: access_type;
    PermitNo: string;
    ProjAddrCombined: string;
    ProjCity: string;
    Confidential: number;
    ErrorText: string;
    NoFinalInspections: boolean;
    ScheduleDates: string[];
    Supervisor_URL: string;
    Permit_URL: string;
    Dates: DateCache;

  }

  export class Permit implements IPermit 
  {

    public access: access_type;
    public PermitNo: string;
    public ProjAddrCombined: string;
    public ProjCity: string;
    public Confidential: number;
    public ErrorText: string;
    public NoFinalInspections: boolean;
    public ScheduleDates: string[];
    public Supervisor_URL: string;
    public Permit_URL: string;
    public Dates: DateCache;

    constructor( IsExternalUser: boolean) 
    {

    }

  }
}