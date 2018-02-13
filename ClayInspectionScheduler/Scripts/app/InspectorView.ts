/// <reference path="shortinspection.ts" />
namespace InspSched
{
  interface IInspectorView
  {
    PermitNumber: string;
    Address: string;
    GeoZone: string;
    FloodZone: string;
    Inspector: string; // assignedInspector
    Inspections: Array<ShortInspection>;
    IsPrivateProvider: boolean;
  }

  export class InspectorView implements IInspectorView
  {
    public PermitNumber: string = "";
    public Address: string = "";
    public GeoZone: string = "";
    public FloodZone: string = "";
    public Inspector: string = "";
    public IsPrivateProvider: boolean = false;
    public Inspections: Array<ShortInspection> = [];

    constructor(inspection: Inspection = null)
    {
      if (inspection !== null)
      {
        this.PermitNumber = inspection.PermitNo;
        this.Address = inspection.StreetAddress;
        this.FloodZone = inspection.FloodZone;
        this.GeoZone = inspection.GeoZone;
        this.Inspector = inspection.InspectorName;
        this.IsPrivateProvider = inspection.PrivateProviderInspectionRequestId > 0;
      }

    }
  }


}