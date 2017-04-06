/// <reference path="transport.ts" />
/// <reference path="ui.ts" />


namespace InspSched 
{

  interface IPermit 
  {
    PermitNo: string;
    // MPermitNo: string;
    ProjAddrCombined: string;
    ProjCity: string;
    //RelatedPermits: string;
    PermitType: string;
    PermitTypeDisplay: string;
    CanSchedule: string;
    FailType: string;

  }

  export class Permit implements IPermit 
  {
    public PermitNo: string;
    public ProjAddrCombined: string;
    public ProjCity: string;
    public PermitType: string;
    public PermitTypeDisplay: string;
    public CanSchedule: string;
    public FailType: string;

    constructor() 
    {

    }

  }

}