/// <reference path="transport.ts" />
/// <reference path="ui.ts" />


namespace InspSched 
{

  interface IPermit 
  {
    PermitNo: string;
    IsExternalUser: boolean;
    ProjAddrCombined: string;
    ProjCity: string;
    CanSchedule: string;
    FailType: string;
    ScheduleDates: string[];
  }

  export class Permit implements IPermit 
  {
    public PermitNo: string;
    public IsExternalUser: boolean;
    public ProjAddrCombined: string;
    public ProjCity: string;
    public CanSchedule: string;
    public FailType: string;
    public ScheduleDates: string[];

    constructor() 
    {

    }

  }

}