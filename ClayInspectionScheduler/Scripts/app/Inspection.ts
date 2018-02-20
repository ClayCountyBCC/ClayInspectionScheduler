/// <reference path="transport.ts" />
/// <reference path="ui.ts" />


namespace InspSched
{
  interface IInspection
  {
    PermitNo: string;
    IsCommercial: boolean;
    InspReqID: number;
    InspectionCode: string;
    InsDesc: string;
    InspDateTime: Date;
    DisplayInspDateTime: string;
    ResultADC: string;
    ResultDescription: string;
    Remarks: string;
    Comment: string;
    SchedDateTime: Date;
    DisplaySchedDateTime: string;
    Initials: string;
    Phone: string;
    InspectorName: string;
    PrivateProviderInspectionRequestId: number;
    GeoZone: string;
    FloodZone: string;
    Day: string;
    StreetAddress: string;
    InspectorColor: string;
    Errors: string[];
  }

  export class Inspection implements IInspection
  {
    public PermitNo: string;
    public IsCommercial: boolean;
    public InspReqID: number;
    public InspectionCode: string;
    public InsDesc: string;
    public InspDateTime: Date;
    public DisplayInspDateTime: string;
    public ResultADC: string;
    public ResultDescription: string;
    public Remarks: string;
    public Comment: string;
    public SchedDateTime: Date;
    public DisplaySchedDateTime: string;
    public Initials: string;
    public Phone: string;
    public InspectorName: string;
    public PrivateProviderInspectionRequestId: number;
    public GeoZone: string;
    public FloodZone: string;
    public Day: string;
    public StreetAddress: string;
    public InspectorColor: string;
    public Errors: string[];

    constructor()
    {

    }
  }
}