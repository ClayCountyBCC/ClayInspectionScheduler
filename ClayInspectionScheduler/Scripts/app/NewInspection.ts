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
   Comment: string;


  }

  export class NewInspection implements INewInspection
  {
    public PermitNo: string;
    public InspectionCd: string;
    public SchecDateTime: Date;
    public Comment: string;

    constructor( PermitNo, InspectionCd, SchecDateTime, Comment)
    {
      this.PermitNo = PermitNo;
      this.InspectionCd = InspectionCd;
      this.SchecDateTime = SchecDateTime;
      this.Comment = Comment;
    }

  }

}