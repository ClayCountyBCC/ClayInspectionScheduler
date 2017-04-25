/// <reference path="app.ts" />
/// <reference path="transport.ts" />
/// <reference path="ui.ts" />

namespace InspSched
{
  interface INewInspection
  {
   PermitNo: string;
   InspectionCd: string;
   SchecDateTime: Date;


  }

  export class NewInspection implements INewInspection
  {
    public PermitNo: string;
    public InspectionCd: string;
    public SchecDateTime: Date;

    constructor( PermitNo, InspectionCd, SchecDateTime)
    {
      this.PermitNo = PermitNo;
      this.InspectionCd = InspectionCd;
      this.SchecDateTime = SchecDateTime;
    }

  }

}