/// <reference path="transport.ts" />
/// <reference path="ui.ts" />


namespace InspSched
{
  interface IInspection
  {
    PermitNo: string;
    InspReqID: string;
    InspectionCode: string;
    InsDesc: string;
    InspDateTime: Date;
    DisplayInspDateTime: string;
    ResultADC: string;
    ResultDescription: string;
    Remarks: string;
    SchedDateTime: Date;
    DisplaySchedDateTime: string;
    Initials: string;
    Phone: string;
    InspectorName: string;
    myBool: boolean;
    Delete: boolean;


  }

  export class Inspection implements IInspection
  {
    public PermitNo: string;
    public InspReqID: string;
    public InspectionCode: string;
    public InsDesc: string;
    public InspDateTime: Date;
    public DisplayInspDateTime: string;
    public ResultADC: string;
    public ResultDescription: string;
    public Remarks: string;
    public SchedDateTime: Date;
    public DisplaySchedDateTime: string;
    public Initials: string;
    public Phone: string;
    public InspectorName: string;
    public myBool: boolean;
    public Delete: boolean;



    constructor()
    {

    }
  }
}