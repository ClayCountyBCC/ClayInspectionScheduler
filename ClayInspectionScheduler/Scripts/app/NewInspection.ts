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
   Comments: string;


  }

  export class NewInspection implements INewInspection
  {
    public PermitNo: string;
    public InspectionCd: string;
    public SchecDateTime: Date;
    public Comments: string;

    constructor( PermitNo, InspectionCd, SchecDateTime, Comments)
    {
      this.PermitNo = PermitNo;
      this.InspectionCd = InspectionCd;
      this.SchecDateTime = SchecDateTime;
      this.Comments = Comments;
    }

  }

}