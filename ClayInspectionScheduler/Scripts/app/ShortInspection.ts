namespace InspSched
{
  interface IShortInspection
  {
    PermitNumber: string;
    InspectionId: number;
    InspectionDesc: string;
    Comments: string;
    ResultADC: string;
  }

  export class ShortInspection implements IShortInspection
  {
      public PermitNumber: string;
      public InspectionId: number;
      public InspectionDesc: string;
      public Comments: string;
      public ResultADC: string;

    constructor(i: Inspection)
    {
      this.InspectionDesc = i.InspectionCode + '-' + i.InsDesc;
      this.PermitNumber = i.PermitNo;
      this.InspectionId = i.InspReqID;
      this.Comments = i.Comment;
      this.ResultADC = i.ResultADC;
    }
  }
}