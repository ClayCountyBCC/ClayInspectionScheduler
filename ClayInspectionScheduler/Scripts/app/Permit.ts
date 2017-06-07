/// <reference path="transport.ts" />
/// <reference path="ui.ts" />


namespace InspSched 
{

  interface IPermit 
  {
    PermitNo: string;
    ProjAddrCombined: string;
    ProjCity: string;
    CanSchedule: string;
    FailType: string;
    ScheduleDates: string[];
    IsExternalUser: boolean;


  }

  export class Permit implements IPermit 
  {
    public PermitNo: string;
    public IsExternalUser: boolean = true;
    public ProjAddrCombined: string;
    public ProjCity: string;
    public CanSchedule: string;
    public FailType: string;
    public ScheduleDates: string[];

    constructor( IsExternalUser: boolean) 
    {

    }

  }
}