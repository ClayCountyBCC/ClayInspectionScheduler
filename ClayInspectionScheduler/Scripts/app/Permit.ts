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
  }

  export class Permit implements IPermit 
  {
    public PermitNo: string;
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